# U3's stills (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7: "the water inside her, the lights failing,
# smoke and steam, each driven by its number in the record"): her scene at given minutes after the touch, built in headless
# Blender from the recorded night and the timelines made from it, each thing in it from its number in the record.
#
#   blender -b --factory-startup --python-exit-code 1 --python tools/blender/u3_scene.py -- --ship <titanic_ship.json>
#       --night <titanic_night_1912.json> --lights <u3_lights.json> --smoke <u3_smoke.json> --out <dir>
#       [--t 30,90,150] [--glb <titanic_ship.glb>] [--render]
#     -> <dir>/u3_scene.glb        what U3 adds, in the ship frame, one object a thing, for each time (read back by
#                                  tools/blender_u3_tests.js): "water <n> <zone> <port|starboard> <lower|upper> t<min>",
#                                  "lights t<min>", "light <id> t<min>", "steam <i> t<min>", "smoke <i> t<min>"
#        <dir>/u3_scene.glb.json   what each time holds: its step, her pose, the plant, each space's water
#   prints U3_READY when done; any error exits 1. With --glb (the ship tools/blender/build_ship.py built) it also poses her
#   with them; --render then draws two views a time, u3_<view>_t<min>.png, 1440 x 810, on the GPU: only in a turn the
#   group's coordinator gives (the browser's turn file: CLAUDE.md), never beside the browser suites.
#   --out defaults to the folder u3 in TITANIC_BLENDER_OUT, else in "blenderOut" of tools/local_paths.json (this
#   machine's own, untracked).
#
# From the record, each by the rule its maker states:
# - the water: in each space the record has wet at the step, every one of the model's own columns in it
#   (subdivision.spaces) filled from its floor to where the record's level (channels.water.level, a world Z) stands over
#   the column's centre at the record's pose (frames.pose), or to its top. The level is the next sample's: the core solves
#   its levels as a step begins, from the water and pose before it, so the level that holds this sample's water at this
#   sample's pose is the next one's (the record's water.about; at the last sample, its own). That is the core's own cut
#   (core.js nodePass; tools/u3_water_tests.js shows it gives back the record's volumes), so the stair of flat tops is the
#   model's own resolution, drawn as it is;
# - her lights (u3_lights.json, version 2): each port and window burns at the plant's level until its section's fuses
#   blow (its "out" step; G1, the record's readers.circuits), the sea outside it or not; her navigation lights at the
#   plant's level;
# - the steam (u3_smoke.json): at the escape pipes' mouths while the step lies in one of its jets (blow > 0.02, the
#   viewer's rule); the smoke at the working funnels' tops while the plant raises steam (gen > 0.02).
# Their look is [appearance]: the colours, the lights' size and glow, the plumes' shape (each rising along the world's
# vertical from its source), the hull drawn as a ghost in the section view, the cameras, the sky and the sea.
import bpy
import json
import math
import os
import sys
from mathutils import Matrix, Vector


def default_out():
    # this machine's own folder is not in the repository: TITANIC_BLENDER_OUT, else "blenderOut" in tools/local_paths.json
    d = os.environ.get('TITANIC_BLENDER_OUT')
    if d:
        return d
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'local_paths.json'), 'r', encoding='utf-8') as fh:
            return json.load(fh).get('blenderOut')
    except (OSError, ValueError, AttributeError):
        return None


def parse_args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    o = {'ship': None, 'night': None, 'lights': None, 'smoke': None, 'glb': None, 'out': None, 't': '30,90,150', 'render': False}
    i = 0
    while i < len(a):
        if a[i] == '--render':
            o['render'] = True
            i += 1
        elif a[i] in ('--ship', '--night', '--lights', '--smoke', '--glb', '--out', '--t') and i + 1 < len(a):
            o[a[i][2:]] = a[i + 1]
            i += 2
        else:
            raise SystemExit('unknown argument: ' + a[i])
    for need in ('ship', 'night', 'lights', 'smoke'):
        if not o[need]:
            raise SystemExit('--ship, --night, --lights and --smoke are needed')
    if o['render'] and not o['glb']:
        raise SystemExit('--render needs --glb <titanic_ship.glb>')
    if not o['out'] and default_out():
        o['out'] = os.path.join(default_out(), 'u3')
    if not o['out']:
        raise SystemExit('--out <dir> is needed: or set TITANIC_BLENDER_OUT, or put "blenderOut" in tools/local_paths.json')
    return o


def load(path, fmt):
    with open(path, 'r', encoding='utf-8') as fh:
        d = json.load(fh)
    if d.get('format') != fmt:
        raise SystemExit('%s is not a %s file' % (path, fmt))
    return d


OPT = parse_args()
SHIP, NIGHT = load(OPT['ship'], 'titanic-ship'), load(OPT['night'], 'titanic-night')
LIGHTS, SMOKE = load(OPT['lights'], 'titanic-u3-lights'), load(OPT['smoke'], 'titanic-u3-smoke')
FP = NIGHT['end']['fingerprint']
for name, d in (('u3_lights.json', LIGHTS), ('u3_smoke.json', SMOKE)):
    if d['from']['fingerprint'] != FP:
        raise SystemExit('%s was made from another night (%s, the record is %s): make it again' % (name, d['from']['fingerprint'], FP))
if LIGHTS.get('version', 1) < 2:
    raise SystemExit('u3_lights.json is version %s: make it again with tools/u3_lights.js (version 2, the lights by circuit)' % LIGHTS.get('version', 1))
if 'spaces' not in SHIP['subdivision']:
    raise SystemExit('this export has no subdivision.spaces: make it again with tools/export_ship.js at or after d11a950')
K, CH, CLK = NIGHT['constants'], NIGHT['channels'], NIGHT['clock']
SP, NODES, ZONES = SHIP['subdivision']['spaces'], SHIP['subdivision']['nodes']['list'], SHIP['subdivision']['zones']
DY, G0, DT, K0, N = SP['dy'], K['g0'], K['dt'], CLK['k0'], CLK['n']
T_TOUCH = NIGHT['end']['summary']['tTouch']
TIMES = [float(s) for s in OPT['t'].split(',') if s.strip()]


def step_of(t_min):
    # the step at t minutes after the touch (tools/blender_u3_tests.js finds it the same way)
    k = int(math.floor((T_TOUCH + 60.0 * t_min) / DT + 0.5))
    if not (K0 <= k <= K0 + N - 1):
        raise SystemExit('T+%g min is step %d, not in the record (k %d to %d)' % (t_min, k, K0, K0 + N - 1))
    return k


def at(span, i):
    # a value of a recorded span (record_night.js: {from, every, v}) at the record's index i, or None
    if not span:
        return None
    d = i - span['from']
    if d < 0 or d % span['every']:
        return None
    j = d // span['every']
    return span['v'][j] if j < len(span['v']) else None


def tag(t_min):
    return 't%g' % t_min


def label(n):
    nd = NODES[n]
    return '%d %s %s %s' % (n, ZONES[nd['zone']]['short'], 'port' if nd['side'] == 0 else 'starboard', 'lower' if nd['layer'] == 0 else 'upper')


# ---- the scene's pieces, [appearance]
def material(name, color, alpha=1.0, emission=0.0, roughness=0.5):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (color[0], color[1], color[2], alpha)
    try:
        m.use_nodes = True
        b = m.node_tree.nodes.get('Principled BSDF')
        b.inputs['Base Color'].default_value = (color[0], color[1], color[2], 1.0)
        b.inputs['Alpha'].default_value = alpha
        b.inputs['Roughness'].default_value = roughness
        if emission > 0:
            ec = b.inputs.get('Emission Color') or b.inputs.get('Emission')
            ec.default_value = (color[0], color[1], color[2], 1.0)
            b.inputs['Emission Strength'].default_value = emission
    except Exception:
        pass
    if alpha < 1.0:
        for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            try:
                setattr(m, attr, val)
                break
            except Exception:
                continue
    return m


def add_object(scene, name, verts, faces, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate(clean_customdata=False)
    me.update()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


BOX = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)]      # each wound outward
OCTA = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]   # each wound outward


def octahedron(p, r, b):
    x, y, z = p
    return [(x + r, y, z), (x - r, y, z), (x, y + r, z), (x, y - r, z), (x, y, z + r), (x, y, z - r)], [tuple(b + k for k in f) for f in OCTA]


def plume(p, axis, r0, r1, h, segs=12):
    # a closed cone frustum from p along axis (unit), radius r0 at p to r1 at h, with a centre vertex on each cap
    ax = Vector(axis).normalized()
    u = ax.cross(Vector((1.0, 0.0, 0.0)) if abs(ax.x) < 0.9 else Vector((0.0, 1.0, 0.0))).normalized()
    v = ax.cross(u)
    P, top = Vector(p), Vector(p) + ax * h
    verts = []
    for c, r in ((P, r0), (top, r1)):
        for s in range(segs):
            a = 2.0 * math.pi * s / segs
            q = c + (u * math.cos(a) + v * math.sin(a)) * r
            verts.append((q.x, q.y, q.z))
    verts += [(P.x, P.y, P.z), (top.x, top.y, top.z)]
    cb, ct, faces = 2 * segs, 2 * segs + 1, []
    for s in range(segs):
        s1 = (s + 1) % segs
        faces.append((s, s1, segs + s1, segs + s))       # the side, outward
        faces.append((cb, s1, s))                         # the base, facing back along the axis
        faces.append((ct, segs + s, segs + s1))           # the top, facing on along it
    return verts, faces


def pose_of(i):
    zO, pitch, roll = CH['zO'][i], CH['pitch'][i], CH['roll'][i]
    cp, sp, cr, sr = math.cos(pitch), math.sin(pitch), math.cos(roll), math.sin(roll)
    R = [[cp, sp * sr, sp * cr], [0.0, cr, -sr], [-sp, cp * sr, cp * cr]]
    t = [K['XO'] - sum(R[0][c] * G0[c] for c in range(3)), K['YO'] - sum(R[1][c] * G0[c] for c in range(3)), zO - sum(R[2][c] * G0[c] for c in range(3))]
    return zO, pitch, roll, R, t


def build(scene, t_min, mats, info):
    k = step_of(t_min)
    i = k - K0
    zO, pitch, roll, R, t = pose_of(i)
    R20, R21, R22, tz = R[2][0], R[2][1], R[2][2], t[2]
    up = (R20, R21, R22)                                  # the world's vertical, in the ship frame
    made, waters = [], []
    # the water: the core's cut of each wet space's columns at the record's pose, by the level that holds the record's
    # water at this step (the next sample's; at the last sample, or where the next has none, its own)
    for sp in SP['list']:
        n = sp['n']
        vol = at(CH['water']['vol'][n], i)
        h = at(CH['water']['level'][n], i + 1) if i + 1 < N else None
        if h is None:
            h = at(CH['water']['level'][n], i)
        if h is None or vol is None:
            continue
        verts, faces, cols, box = [], [], 0, 0.0
        for x, y, dx, a, e in zip(sp['x'], sp['y'], sp['dx'], sp['a'], sp['e']):
            zp = (h - (R20 * x + R21 * y + tz)) / R22
            if zp <= a:
                continue
            top = e if zp >= e else zp
            x0, x1, y0, y1 = x - dx / 2, x + dx / 2, y - DY / 2, y + DY / 2
            b = len(verts)
            verts += [(x0, y0, a), (x1, y0, a), (x1, y1, a), (x0, y1, a), (x0, y0, top), (x1, y0, top), (x1, y1, top), (x0, y1, top)]
            faces += [tuple(b + q for q in f) for f in BOX]
            cols += 1
            box += dx * DY * (top - a)
        if not cols:
            continue
        name = 'water %s %s' % (label(n), tag(t_min))
        made.append(add_object(scene, name, verts, faces, mats['water']))
        waters.append({'name': name, 'n': n, 'level': h, 'recorded': vol, 'columns': cols, 'volume': round(box, 3), 'water': round(box * NODES[n]['mu'], 3)})
    # the pockets (the record's water.pockets: W6's bunker, G7's peak tank), each holding water of its own, outside its
    # space's: drawn as the core's law places it, a prism of the pocket's own area (cap over its height) along x0 to x1,
    # centred across her at its yc, from its floor up to its fill height in her frame, z0 + (z1 - z0) min(vol, cap) / cap,
    # so that it holds min(vol, cap); the water past cap stands for the sea's head over a full pocket and is not drawn
    # [appearance: the prism's straight sides, where the bunker's outboard wall follows her shell]
    pockets = []
    PK = CH['water'].get('pockets')
    for j, q in enumerate(PK['list'] if PK else []):
        vol = at(PK['vol'][j], i)
        if vol is None:
            continue
        placed, height, length = min(vol, q['cap']), q['z1'] - q['z0'], q['x1'] - q['x0']
        width, fill = q['cap'] / height / length, q['z0'] + height * min(vol, q['cap']) / q['cap']
        x0, x1, y0, y1, z0 = q['x0'], q['x1'], q['yc'] - width / 2, q['yc'] + width / 2, q['z0']
        verts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, fill), (x1, y0, fill), (x1, y1, fill), (x0, y1, fill)]
        name = 'pocket %d %s' % (j, tag(t_min))
        made.append(add_object(scene, name, verts, BOX, mats['pocket']))
        pockets.append({'name': name, 'j': j, 'pocket': q['name'], 'recorded': vol, 'placed': round(placed, 3), 'fill': round(fill, 3)})
    # her lights: lit while the plant has light and their section's fuses hold (G1)
    level = 0.0
    for p in LIGHTS['plant']:
        if p['k'] <= k:
            level = p['lights']
    lit = [L for L in LIGHTS['lights'] if level > 0 and (L['out'] is None or k < L['out'])]
    verts, faces = [], []
    for L in lit:
        if L['kind'] == 'navigation':
            continue
        v, f = octahedron(L['p'], 0.35 if L['kind'] == 'window' else 0.25, len(verts))
        verts += v
        faces += f
    if faces:
        mats['light'].node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value = 30.0 * level
        made.append(add_object(scene, 'lights %s' % tag(t_min), verts, faces, mats['light']))
    for L in lit:
        if L['kind'] == 'navigation':
            v, f = octahedron(L['p'], 0.5, 0)
            made.append(add_object(scene, 'light %s %s' % (L['id'], tag(t_min)), v, f, mats['nav ' + L['id']]))
    # the steam and the smoke
    jets = [j for j in SMOKE['jets'] if j['from'] <= k and (j['to'] is None or k < j['to'])]
    blow = CH['plant']['blow'][i]
    if jets:
        for s, p in enumerate(SMOKE['steam']):
            v, f = plume((p['x'], 0.0, p['z']), up, 0.6, 4.0, 24.0)
            made.append(add_object(scene, 'steam %d %s' % (s, tag(t_min)), v, f, mats['steam']))
    gen = CH['plant']['gen'][i]
    if gen > 0.02:
        a = 0.04 + 0.5 * gen                              # [appearance]: thinner as the plant raises less steam
        mats['smoke'].diffuse_color = (0.35, 0.35, 0.37, a)
        mats['smoke'].node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value = a
        for s, p in enumerate(SMOKE['smoke']):
            v, f = plume((p['x'], 0.0, p['z']), up, 2.6, 9.0, 45.0)
            made.append(add_object(scene, 'smoke %d %s' % (s, tag(t_min)), v, f, mats['smoke']))
    info.append({'t': t_min, 'k': k, 'pose': {'zO': zO, 'pitch': pitch, 'roll': roll},
                 'plant': {'lights': level, 'gen': gen, 'blow': blow, 'steam': bool(jets)},
                 'lit': {'ports': sum(1 for L in lit if L['kind'] == 'port'), 'windows': sum(1 for L in lit if L['kind'] == 'window'),
                         'navigation': [L['id'] for L in lit if L['kind'] == 'navigation']},
                 'water': waters, 'pockets': pockets})
    return made, (R, t)


def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    mats = {'water': material('u3 water', (0.10, 0.45, 0.90), emission=0.35, roughness=0.2),
            'pocket': material('u3 pocket water', (0.12, 0.62, 0.86), emission=0.35, roughness=0.2),   # [appearance]: a pocket's own water, a shade apart
            'light': material('u3 light', (1.0, 0.86, 0.62), emission=30.0),
            'steam': material('u3 steam', (0.95, 0.95, 0.95), alpha=0.45, roughness=0.9),
            'smoke': material('u3 smoke', (0.35, 0.35, 0.37), alpha=0.2, roughness=0.9)}
    for L in SHIP['lights']['navigation']:
        hx = L['color'].lstrip('#')
        mats['nav ' + L['id']] = material('u3 light ' + L['id'], tuple(int(hx[c:c + 2], 16) / 255.0 for c in (0, 2, 4)), emission=6.0)
    return scene, mats


# ---- 1. what U3 adds, every time in one GLB, in the ship frame (no pose, no hull): the file the check reads
scene, mats = new_scene()
INFO = []
for tm in TIMES:
    build(scene, tm, mats, INFO)
os.makedirs(OPT['out'], exist_ok=True)
glb = os.path.join(OPT['out'], 'u3_scene.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
                          export_extras=False, export_cameras=False, export_lights=False)
with open(glb + '.json', 'w', encoding='utf-8', newline='\n') as fh:
    json.dump({'format': 'titanic-u3-scene-glb', 'version': 1, 'made': 'tools/blender/u3_scene.py', 'blender': bpy.app.version_string,
               'frames': 'glTF +Y up: a point (x, y, z) of the ship frame is (x, z, -y) in the file, metres (as titanic_ship.glb); pose each time by its pose (the record\'s frames.pose)',
               'about': 'what U3 draws at each time (t, minutes after the touch; k, the record\'s step): water, each wet space\'s columns filled to the record\'s level (volume the boxes\', water that times the permeability, recorded the record\'s vol); lit, the lights burning; plant, its light level, steam raised (gen) and whether the escape pipes blow',
               'from': {'night': NIGHT['night']['title'], 'fingerprint': FP, 'ship': SHIP['made']['sources'].get('tools/export_ship.js'), 'sources': NIGHT['made']['sources']},
               'times': INFO}, fh, indent=1, ensure_ascii=False)
    fh.write('\n')
for e in INFO:
    print('U3 T+%g min, step %d: %d wet spaces, %.1f m3 of water; lights %g (%d ports, %d windows, %s); steam %s; gen %.3f'
          % (e['t'], e['k'], len(e['water']), sum(w['water'] for w in e['water']), e['plant']['lights'], e['lit']['ports'], e['lit']['windows'],
             ', '.join(e['lit']['navigation']) or 'no navigation lights', 'blowing' if e['plant']['steam'] else 'quiet', e['plant']['gen']))
print('U3_READY %d times -> %s' % (len(INFO), glb))

# ---- 2. her scene at each time, posed on the sea, two views [appearance]; only with --glb
if OPT['glb']:
    # the section: square to her starboard side, orthographic, 300 m across (she spans X -139 to 136 and Z -31 to 60 at
    # T+150); the night: from a boat off her starboard bow, aimed so that her bow and stern sit inside the frame alike
    VIEWS = [('section', (0.0, -400.0, 10.0), None, 300.0, None), ('night', (205.0, -245.0, 5.0), 35.0, None, (30.0, 0.0, 10.0))]
    for tm in TIMES:
        scene, mats = new_scene()
        info = []
        u3, (R, t) = build(scene, tm, mats, info)
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=OPT['glb'])
        hull = [ob for ob in bpy.data.objects if ob not in before]
        for ob in hull:
            if ob.name.startswith('marker '):
                ob.hide_render = True
        pose = bpy.data.objects.new('pose %s' % tag(tm), None)
        scene.collection.objects.link(pose)
        pose.matrix_world = Matrix(((R[0][0], R[0][1], R[0][2], t[0]), (R[1][0], R[1][1], R[1][2], t[1]), (R[2][0], R[2][1], R[2][2], t[2]), (0, 0, 0, 1)))
        for ob in u3 + [ob for ob in hull if ob.parent is None]:
            ob.parent = pose
        # the hull's own materials, and a ghost of it for the section [appearance]
        ghost = material('u3 ghost', (0.80, 0.86, 0.92), alpha=0.14, roughness=0.6)
        own = {(ob.name, s): slot.material for ob in hull if ob.type == 'MESH' for s, slot in enumerate(ob.material_slots)}
        # the sea: behind her as a section's backdrop, or the night's surface
        back = add_object(scene, 'sea section', [(-450, 250, -90), (450, 250, -90), (450, 250, 0), (-450, 250, 0)], [(0, 1, 2, 3)], material('u3 sea section', (0.03, 0.15, 0.24)))
        sea = add_object(scene, 'sea night', [(-3000, -3000, 0), (3000, -3000, 0), (3000, 3000, 0), (-3000, 3000, 0)], [(0, 1, 2, 3)], material('u3 sea night', (0.004, 0.008, 0.012), roughness=0.05))
        sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
        sun.data.energy = 3.5
        sun.rotation_euler = (math.radians(50), 0.0, math.radians(35))
        scene.collection.objects.link(sun)
        if scene.world is None:
            scene.world = bpy.data.worlds.new('sky')
        cams = {}
        for name, loc, lens, ortho, aim in VIEWS:
            cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
            cam.location = loc
            # the section looks along +Y (her bow to the right, Z up); the other at its aim
            cam.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler() if aim else (math.radians(90), 0.0, 0.0)
            if ortho:
                cam.data.type = 'ORTHO'
                cam.data.ortho_scale = ortho
            else:
                cam.data.lens = lens
            cam.data.clip_end = 8000.0
            scene.collection.objects.link(cam)
            cams[name] = cam
        scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1440, 810, 100
        scene.render.image_settings.file_format = 'PNG'
        for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'CYCLES'):
            try:
                scene.render.engine = engine
                break
            except Exception:
                continue

        def look(view):
            section = view == 'section'
            for ob in hull:
                if ob.type == 'MESH':
                    for s, slot in enumerate(ob.material_slots):
                        slot.material = ghost if section else own[(ob.name, s)]
            back.hide_render, sea.hide_render, sun.hide_render = not section, section, not section
            sky = (0.62, 0.72, 0.86) if section else (0.004, 0.005, 0.012)
            scene.world.color = sky
            try:
                scene.world.use_nodes = True
                bg = scene.world.node_tree.nodes.get('Background')
                bg.inputs['Color'].default_value = (sky[0], sky[1], sky[2], 1.0)
                bg.inputs['Strength'].default_value = 1.0
            except Exception:
                pass
            scene.camera = cams[view]

        look('section')
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OPT['out'], 'u3_scene_%s.blend' % tag(tm)), compress=True)
        print('U3_SCENE %s: step %d, %d hull objects, %d U3 objects; engine %s' % (tag(tm), info[0]['k'], len(hull), len(u3), scene.render.engine))
        if OPT['render']:
            for view in ('section', 'night'):
                look(view)
                scene.render.filepath = os.path.join(OPT['out'], 'u3_%s_%s.png' % (view, tag(tm)))
                bpy.ops.render.render(write_still=True)
                print('STILL %s -> %s' % (view, scene.render.filepath))
    if OPT['render']:
        print('STILLS_OK')
