# U2's sea proof, inside Unreal 5.8 (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7 and 10.4; the run sheet
# docs/runbooks/U2_unreal_on_the_rtx_machine.md). Run by Unreal's own Python commandlet, no GPU needed:
#   UnrealEditor-Cmd.exe <project>.uproject -run=pythonscript -script="<abs path>\u2_sea.py" -unattended -nosplash -nullrhi
# with three paths in the environment (tools/unreal/u2.ps1 sets them):
#   U2_GLB       titanic_ship.glb (tools/blender/build_ship.py; its markers sit at known points of the ship frame)
#   U2_EXPECTED  u2_expected.json (tools/u2_expect.js: the steps, her pose at each, the points and the markers)
#   U2_RESULT    where to write u2_result.json, which `node tools/u2_expect.js --check` reads
#   U2_WATER     1 (default) to try the Water plugin's ocean as well (proof B); 0 for the plane at Z = 0 alone (proof A)
#
# What it does:
#   1. imports the GLB (Interchange) and spawns every static mesh at the origin, unrotated;
#   2. measures the importer's axis mapping by the GLB's four markers: Unreal = M p + o for a ship point p (metres in, cm
#      out; M is 100 times an orthogonal matrix, and its determinant's sign says whether the importer mirrored her);
#   3. at each step poses her as the record has her, through that mapping: every actor gets A = M R M^-1 and b = M t + o -
#      A o, so that the point p lands at M (R p + t) + o;
#   4. reads, by Unreal's own transforms, where her waterline's points and the markers now stand, and maps them back into
#      the core's world (metres): the heights there are what --check compares with the model's;
#   5. proof B: an ocean water body at the sea's height, and the water's surface under each point from its own query
#      (WaterBodyComponent.GetWaterSurfaceInfoAtLocation, BlueprintCallable in 5.8's Water plugin).
#
# UNTESTED here: written on a laptop where Unreal does not run (Bo, 2026-11-20 14:36: Unreal from U2 on runs on his RTX
# machine). Every step fails loudly, with its reason, into the result file; the session on that machine iterates.
import json
import os
import traceback

import unreal

GLB, EXPECTED, RESULT = os.environ.get('U2_GLB'), os.environ.get('U2_EXPECTED'), os.environ.get('U2_RESULT')
WATER = os.environ.get('U2_WATER', '1') == '1'
DEST = '/Game/Titanic'
result = {'format': 'titanic-u2-result', 'version': 1, 'unreal': unreal.SystemLibrary.get_engine_version(), 'stage': 'start'}


def write():
    with open(RESULT, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(result, fh, indent=1)
        fh.write('\n')


def mat_vec(M, v):
    return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]


def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def inverse(M):
    a, b, c = M[0]
    d, e, f = M[1]
    g, h, i = M[2]
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    inv = [[(e * i - f * h), -(b * i - c * h), (b * f - c * e)], [-(d * i - f * g), (a * i - c * g), -(a * f - c * d)], [(d * h - e * g), -(a * h - b * g), (a * e - b * d)]]
    return [[v / det for v in row] for row in inv], det


def center(actor):
    origin, _extent = actor.get_actor_bounds(False)
    return [origin.x, origin.y, origin.z]


try:
    for k, v in (('U2_GLB', GLB), ('U2_EXPECTED', EXPECTED), ('U2_RESULT', RESULT)):
        if not v:
            raise RuntimeError(k + ' is not set')
    with open(EXPECTED, 'r', encoding='utf-8') as fh:
        EXP = json.load(fh)

    # ---------------------------------------------------------------- 1. import, spawn at the origin
    result['stage'] = 'import'
    task = unreal.AssetImportTask()
    task.set_editor_property('filename', GLB)
    task.set_editor_property('destination_path', DEST)
    task.set_editor_property('automated', True)
    task.set_editor_property('save', True)
    task.set_editor_property('replace_existing', True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    paths = list(task.get_editor_property('imported_object_paths') or []) or list(unreal.EditorAssetLibrary.list_assets(DEST, recursive=True))
    meshes = []
    for p in paths:
        a = unreal.EditorAssetLibrary.load_asset(p)
        if isinstance(a, unreal.StaticMesh):
            meshes.append(a)
    if not meshes:
        raise RuntimeError('the import gave no static mesh (%d assets: %s)' % (len(paths), ', '.join(paths[:5])))
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = {}
    for m in meshes:
        act = eas.spawn_actor_from_object(m, unreal.Vector(0, 0, 0), unreal.Rotator(0, 0, 0))
        actors[m.get_name()] = act
    result['meshes'] = len(meshes)

    # ---------------------------------------------------------------- 2. the axis mapping, by the markers
    result['stage'] = 'mapping'
    def marker(name):
        key = next((n for n in actors if n.replace('_', ' ').lower().endswith(name)), None)
        if key is None:
            raise RuntimeError('no mesh for "%s" among %d: the importer renamed them? (%s ...)' % (name, len(actors), ', '.join(list(actors)[:8])))
        return actors[key], center(actors[key])
    mk = {m['name']: marker(m['name']) for m in EXP['markers']}
    po = {m['name']: m['p'] for m in EXP['markers']}
    cols = []
    for nm, axis in (('marker x', 0), ('marker y', 1), ('marker z', 2)):
        d = po[nm][axis] - po['marker o'][axis]
        cols.append([(mk[nm][1][i] - mk['marker o'][1][i]) / d for i in range(3)])
    M = [[cols[j][i] for j in range(3)] for i in range(3)]
    o = [mk['marker o'][1][i] - sum(M[i][j] * po['marker o'][j] for j in range(3)) for i in range(3)]
    Minv, det = inverse(M)
    norms = [sum(M[i][j] ** 2 for i in range(3)) ** 0.5 for j in range(3)]
    ortho = max(abs(sum(M[i][a] * M[i][b] for i in range(3))) / (norms[a] * norms[b]) for a, b in ((0, 1), (0, 2), (1, 2)))
    result['mapping'] = {'M': M, 'o': o, 'det': det, 'columnNorms': norms, 'orthoError': ortho,
                         'about': 'Unreal (cm) = M p + o for a point p of the ship frame (m), as the importer put her, measured by the markers'}
    if not (0.9 * 100 < min(norms) and max(norms) < 1.1 * 100) or ortho > 1e-3:
        raise RuntimeError('the markers do not give a mapping of 100 cm a metre with square axes: norms %s, ortho %.2e (the importer moved the pivots?)' % (norms, ortho))

    # ---------------------------------------------------------------- 5 (set up first). proof B: the ocean
    water = None
    if WATER:
        try:
            ocean = eas.spawn_actor_from_class(unreal.WaterBodyOcean, unreal.Vector(o[0], o[1], o[2]), unreal.Rotator(0, 0, 0))
            water = ocean.get_component_by_class(unreal.WaterBodyComponent)
            result['water'] = 'ocean at the sea\'s height (%s)' % ocean.get_name()
        except Exception as e:
            result['water'] = 'unavailable: %s' % e
    else:
        result['water'] = 'not tried (U2_WATER=0)'

    # ---------------------------------------------------------------- 3 and 4. each step: pose her, read back
    result['stage'] = 'steps'
    steps = []
    for s in EXP['steps']:
        R = [s['R'][0:3], s['R'][3:6], s['R'][6:9]]
        A = mat_mul(mat_mul(M, R), Minv)
        Mt = mat_vec(M, s['t3'])
        Ao = mat_vec(A, o)
        b = [Mt[i] + o[i] - Ao[i] for i in range(3)]
        rot = unreal.MathLibrary.make_rot_from_xz(unreal.Vector(A[0][0], A[1][0], A[2][0]), unreal.Vector(A[0][2], A[1][2], A[2][2]))
        T = unreal.Transform(unreal.Vector(*b), rot, unreal.Vector(1, 1, 1))
        for act in actors.values():
            act.set_actor_transform(T, False, True)
        hull = next((a for n, a in actors.items() if n.lower() == 'hull'), list(actors.values())[0])
        HT = hull.get_actor_transform()
        def back(u):                                   # Unreal (cm) to the core's world (m)
            return mat_vec(Minv, [u[i] - o[i] for i in range(3)])
        pts, sea = [], []
        for q in EXP['points']:
            local = [sum(M[i][j] * q['p'][j] for j in range(3)) + o[i] for i in range(3)]
            w = unreal.MathLibrary.transform_location(HT, unreal.Vector(*local))
            W = back([w.x, w.y, w.z])
            pts.append({'name': q['name'], 'Z': W[2]})
            if water is not None:
                try:
                    r = water.get_water_surface_info_at_location(w, False)
                    ok, loc = (r[0], r[1]) if isinstance(r, tuple) else (True, r)
                    if ok:
                        sea.append({'name': q['name'], 'Z': back([loc.x, loc.y, loc.z])[2]})
                except Exception as e:
                    result['water'] = 'query failed: %s' % e
                    water = None
        mks = [{'name': m['name'], 'W': back(center(mk[m['name']][0]))} for m in EXP['markers']]
        step = {'k': s['k'], 'name': s['name'], 'points': pts, 'markers': mks}
        if sea:
            step['sea'] = sea
        steps.append(step)
    result['steps'] = steps
    result['stage'] = 'done'
    write()
    print('U2_OK %d steps, mapping det %.0f, water: %s -> %s' % (len(steps), det, result.get('water'), RESULT))
except Exception as e:
    result['error'] = '%s: %s' % (type(e).__name__, e)
    result['trace'] = traceback.format_exc()
    if RESULT:
        write()
    print('U2_FAIL at %s: %s' % (result.get('stage'), result['error']))
