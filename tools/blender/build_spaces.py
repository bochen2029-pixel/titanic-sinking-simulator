# U3, the water inside her (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 4.3: "every watertight space is a
# named volume, so its water can be drawn at the model's level"): the model's 64 spaces built in Blender as named volumes,
# from tools/export_ship.js's subdivision.spaces. Geometry only: no render, no GPU.
#
#   blender -b --factory-startup --python-exit-code 1 --python tools/blender/build_spaces.py -- --ship <titanic_ship.json> --out <dir>
#     -> <dir>/titanic_spaces.glb       one object a space, "space <n> <zone> <port|starboard> <lower|upper>"
#        <dir>/titanic_spaces.glb.json  what each is: n, zone, side, layer, permeability, columns, its capacity
#   prints GEN_OK titanic_spaces when done; any error exits 1
#   --out defaults to TITANIC_BLENDER_OUT, else "blenderOut" in tools/local_paths.json (this machine's own, untracked)
#
# Each space is the union of the model's own columns in it (the flooding integrates exactly these): every column a closed
# box, plan dx by dy around (x, y), from a to e, wound outward, so its volume can be read off the file's triangles. The
# boxes meet face to face inside a space; a renderer that clips the space with the record's level plane (a world Z, at
# the record's pose) draws the model's water there (tools/u3_water_tests.js proves the record's volumes come back so).
# Their look is [appearance]: one translucent blue for the water's spaces. Blender's files stay outside the repository.
import bpy
import json
import os
import sys


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
    o = {'ship': None, 'out': None}
    i = 0
    while i < len(a):
        if a[i] in ('--ship', '--out') and i + 1 < len(a):
            o[a[i][2:]] = a[i + 1]
            i += 2
        else:
            raise SystemExit('unknown argument: ' + a[i])
    if not o['ship']:
        raise SystemExit('--ship <titanic_ship.json> is needed')
    o['out'] = o['out'] or default_out()
    if not o['out']:
        raise SystemExit('--out <dir> is needed: or set TITANIC_BLENDER_OUT, or put "blenderOut" in tools/local_paths.json')
    return o


OPT = parse_args()
with open(OPT['ship'], 'r', encoding='utf-8') as fh:
    SHIP = json.load(fh)
SUB = SHIP['subdivision']
if 'spaces' not in SUB:
    raise SystemExit('this export has no subdivision.spaces: make it again with tools/export_ship.js at or after d11a950')
SP, NODES, ZONES = SUB['spaces'], SUB['nodes']['list'], SUB['zones']
DY = SP['dy']

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
mat = bpy.data.materials.new('water space')
mat.diffuse_color = (0.05, 0.25, 0.45, 0.35)               # [appearance]
try:
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.25, 0.45, 1.0)
    bsdf.inputs['Alpha'].default_value = 0.35
except Exception:
    pass

FACES = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)]      # each wound outward
objects = []
for sp in SP['list']:
    n = sp['n']
    if not sp['x']:
        continue
    nd, z = NODES[n], ZONES[NODES[n]['zone']]
    name = 'space %d %s %s %s' % (n, z['short'], 'port' if nd['side'] == 0 else 'starboard', 'lower' if nd['layer'] == 0 else 'upper')
    verts, faces = [], []
    for x, y, dx, a, e in zip(sp['x'], sp['y'], sp['dx'], sp['a'], sp['e']):
        x0, x1, y0, y1 = x - dx / 2, x + dx / 2, y - DY / 2, y + DY / 2
        b = len(verts)
        verts += [(x0, y0, a), (x1, y0, a), (x1, y1, a), (x0, y1, a), (x0, y0, e), (x1, y0, e), (x1, y1, e), (x0, y1, e)]
        faces += [tuple(b + k for k in f) for f in FACES]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate(clean_customdata=False)
    me.update()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    cap = sum(dx * DY * (e - a) for dx, a, e in zip(sp['dx'], sp['a'], sp['e']))
    objects.append({'name': name, 'n': n, 'zone': nd['zone'], 'zoneName': z['name'], 'side': nd['side'], 'layer': nd['layer'], 'mu': nd['mu'],
                    'columns': len(sp['x']), 'volume': round(cap, 3), 'capacity': round(cap * nd['mu'], 3)})

os.makedirs(OPT['out'], exist_ok=True)
glb = os.path.join(OPT['out'], 'titanic_spaces.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
                          export_extras=False, export_cameras=False, export_lights=False)
info = {
    'format': 'titanic-spaces-glb', 'version': 1, 'made': 'tools/blender/build_spaces.py', 'blender': bpy.app.version_string,
    'frames': 'glTF +Y up: a point (x, y, z) of the ship frame is (x, z, -y) in the file, metres (as titanic_ship.glb)',
    'about': 'the model\'s spaces as named volumes: volume is the boxes\' (m3), capacity that times the space\'s permeability (the model\'s nodeVmax); the record\'s channels.water.level and vol are by n',
    'from': {'ship': os.path.basename(OPT['ship']), 'sources': SHIP['made']['sources']},
    'objects': objects,
}
with open(glb + '.json', 'w', encoding='utf-8', newline='\n') as fh:
    json.dump(info, fh, indent=1, ensure_ascii=False)
    fh.write('\n')
print('GEN_OK titanic_spaces %d spaces -> %s' % (len(objects), glb))
