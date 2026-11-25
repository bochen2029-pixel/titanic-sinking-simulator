# U1's four stills by day (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7): broadside, bow quarter, plan and
# stern quarter, of the ship tools/blender/build_ship.py built, posed as the recorded night has her at a step (default 0:
# the watch as it began, at Wilding's drafts and the coal's list) on a calm sea.
#
#   blender -b --factory-startup --python-exit-code 1 --python tools/blender/stills.py -- --glb <dir>/titanic_ship.glb --night <titanic_night_1912.json> --out <dir> [--k 0] [--render]
#
# Without --render it only sets the scene up and saves <dir>/stills.blend: CPU only, nothing is drawn (prints STILLS_READY).
# --out defaults to TITANIC_BLENDER_OUT, else "blenderOut" in tools/local_paths.json (this machine's own, untracked).
# With --render it renders <dir>/still_<view>.png, 1440 x 810, on the GPU: only in a turn the group's coordinator gives
# (the browser's turn file: CLAUDE.md), never beside the browser suites. Everything here that is not the model's (the
# cameras, the sun, the sky, the sea's look, the sizes of the pictures) is [appearance]; the ship's place on the sea is the
# record's pose, by its frames.pose (R = Ry(pitch) Rx(roll), t = [XO, YO, zO] - R g0), in the core's world: the sea at Z = 0.
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
    o = {'glb': None, 'night': None, 'out': None, 'k': '0', 'render': False}
    i = 0
    while i < len(a):
        if a[i] == '--render':
            o['render'] = True
            i += 1
        elif a[i] in ('--glb', '--night', '--out', '--k') and i + 1 < len(a):
            o[a[i][2:]] = a[i + 1]
            i += 2
        else:
            raise SystemExit('unknown argument: ' + a[i])
    if not o['glb'] or not o['night']:
        raise SystemExit('--glb <titanic_ship.glb> and --night <titanic_night_*.json> are needed')
    o['out'] = o['out'] or default_out()
    if not o['out']:
        raise SystemExit('--out <dir> is needed: or set TITANIC_BLENDER_OUT, or put "blenderOut" in tools/local_paths.json')
    return o


OPT = parse_args()
with open(OPT['night'], 'r', encoding='utf-8') as fh:
    NIGHT = json.load(fh)
if NIGHT.get('format') != 'titanic-night':
    raise SystemExit('not a titanic-night record: ' + OPT['night'])
K, CH, CLK = NIGHT['constants'], NIGHT['channels'], NIGHT['clock']
k = int(OPT['k'])
i = k - CLK['k0']
if not (0 <= i < CLK['n']):
    raise SystemExit('step %d is not in the record (k %d to %d)' % (k, CLK['k0'], CLK['k0'] + CLK['n'] - 1))
zO, pitch, roll = CH['zO'][i], CH['pitch'][i], CH['roll'][i]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=OPT['glb'])
ship = [ob for ob in scene.objects if ob.parent is None]

# her pose: the ship frame into the core's world (the record's frames.pose)
cp, sp, cr, sr = math.cos(pitch), math.sin(pitch), math.cos(roll), math.sin(roll)
R = [[cp, sp * sr, sp * cr], [0.0, cr, -sr], [-sp, cp * sr, cp * cr]]
g = K['g0']
t = [K['XO'] - sum(R[0][c] * g[c] for c in range(3)), K['YO'] - sum(R[1][c] * g[c] for c in range(3)), zO - sum(R[2][c] * g[c] for c in range(3))]
pose = bpy.data.objects.new('pose k %d' % k, None)
scene.collection.objects.link(pose)
pose.matrix_world = Matrix(((R[0][0], R[0][1], R[0][2], t[0]), (R[1][0], R[1][1], R[1][2], t[1]), (R[2][0], R[2][1], R[2][2], t[2]), (0, 0, 0, 1)))
for ob in ship:
    ob.parent = pose

# the calm sea, the sun, the sky [appearance]
me = bpy.data.meshes.new('sea')
me.from_pydata([(-2000, -2000, 0), (2000, -2000, 0), (2000, 2000, 0), (-2000, 2000, 0)], [], [(0, 1, 2, 3)])
sea = bpy.data.objects.new('sea', me)
scene.collection.objects.link(sea)
mat = bpy.data.materials.new('sea')
mat.diffuse_color = (0.02, 0.06, 0.08, 1.0)
try:
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (0.02, 0.06, 0.08, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.08
except Exception:
    pass
me.materials.append(mat)
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(50), 0.0, math.radians(35))
scene.collection.objects.link(sun)
if scene.world is None:
    scene.world = bpy.data.worlds.new('sky')
scene.world.color = (0.45, 0.6, 0.85)
try:
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.45, 0.6, 0.85, 1.0)
except Exception:
    pass

# the four views [appearance]: from her starboard side, her bow and stern quarters, and from above
TARGET = Vector((0.0, 0.0, 15.0))
VIEWS = [('broadside', (0.0, -430.0, 12.0), 50.0, None), ('bow_quarter', (240.0, -250.0, 28.0), 35.0, None),
         ('plan', (0.0, 0.0, 700.0), None, 300.0), ('stern_quarter', (-240.0, -250.0, 28.0), 35.0, None)]
cams = []
for name, loc, lens, ortho in VIEWS:
    cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    cam.location = loc
    if name == 'plan':
        cam.rotation_euler = (0.0, 0.0, 0.0)          # looking straight down: her bow to the right, port up
    else:
        cam.rotation_euler = (TARGET - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = ortho
    else:
        cam.data.lens = lens
    cam.data.clip_end = 5000.0
    scene.collection.objects.link(cam)
    cams.append(cam)

scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1440, 810, 100
scene.render.image_settings.file_format = 'PNG'
for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'CYCLES'):
    try:
        scene.render.engine = engine
        break
    except Exception:
        continue
os.makedirs(OPT['out'], exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OPT['out'], 'stills.blend'), compress=False)
print('STILLS_READY k %d pose zO %.3f pitch %.6f roll %.6f; %d ship objects; engine %s; views %s' % (k, zO, pitch, roll, len(ship), scene.render.engine, ', '.join(c.name for c in cams)))
if OPT['render']:
    for cam in cams:
        scene.camera = cam
        scene.render.filepath = os.path.join(OPT['out'], 'still_%s.png' % cam.name)
        bpy.ops.render.render(write_still=True)
        print('STILL %s -> %s' % (cam.name, scene.render.filepath))
    print('STILLS_OK')
