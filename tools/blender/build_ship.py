# U1, its CPU half (docs/BRAINSTORM_titanic_in_unreal_v1_2026-11-20.md, section 7; v1.1 beside it): the hull and the
# topsides built in Blender from tools/export_ship.js's titanic_ship.json. Geometry only: no render, no GPU.
#
#   blender -b --factory-startup --python-exit-code 1 --python tools/blender/build_ship.py -- --ship <titanic_ship.json> --out <dir>
#     -> <dir>/titanic_ship.glb      the meshes (glTF binary, +Y up: the web viewer's three.js axes, (x, z, -y) of the ship frame)
#        <dir>/titanic_ship.glb.json what each object is and how big (the same bytes every run, as the GLB)
#        <dir>/titanic_ship.blend    the scene, to open in Blender (not compared)
#   prints GEN_OK titanic_ship when done; any error exits 1 (--python-exit-code 1)
#   --out defaults to TITANIC_BLENDER_OUT, else "blenderOut" in tools/local_paths.json (this machine's own, untracked)
#
# Python because Blender's API is Python alone; the checks are in Node (tools/blender_tests.js), against the export and
# against the web viewer's own geometry. Nothing here is placed by hand: every number is the export's (the model's tables
# and site/topsides.js's), and what this file adds of its own is marked [appearance] (segment counts, plate thickness).
# Rule from the viewer (site/app.js hullRing, T1): the shell's rows run level, one set of heights from the keel (here the
# export's z grid, the same at every station), each ring clipped at its own bottom and top.
# Left out for now [appearance or small]: rails, rigging, windows, the cranes and the anchor crane, hatches, capstans, the
# breakwater, the compass, the docking bridge's telegraphs, the davits' arms, the funnels' whistles. tools/blender_tests.js
# shows where their absence shows against the web viewer's profile. Blender's files stay outside the repository (--out);
# only this script and its checks are in it.
import bpy
import json
import math
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
if SHIP.get('format') != 'titanic-ship':
    raise SystemExit('not a titanic-ship export: ' + OPT['ship'])
H, T = SHIP['hull'], SHIP['topsides']
N, P, ST, DR = T['N'], H['particulars'], H['stations'], H['drawn']
ZS = ST['z']
DZ = ZS[1] - ZS[0]


# ------------------------------------------------------------------ the export's laws
def deck_z(name, x):
    """C.deckZ: the deck's height amidships plus her sheer (hull.decks.law)"""
    d = H['decks']
    if x >= 0:
        s = x / P['xFP']
        return d['z'][name] + d['sheerF'] * s * s
    s = x / P['xAP']
    return d['z'][name] + d['sheerA'] * s * s


def interp(xs, ys, x):
    """linear in a sampled table, held at its ends"""
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    lo, hi = 0, len(xs) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if xs[mid] <= x:
            lo = mid
        else:
            hi = mid
    t = (x - xs[lo]) / (xs[hi] - xs[lo])
    return ys[lo] + (ys[hi] - ys[lo]) * t


# the stations of the drawn shell (hull.drawn, the shell the web viewer draws and the drawn ship stands on), at every
# station since G24. It stands on the model's own hull with her ends, so forward of x0 it is hull.stations' own (the
# flooding's); an export made before G24 samples the drawn table aft of x0 alone, and there the model's own stations
# stand, as they then were
ROWS = []
for i, x in enumerate(DR['x']):
    ROWS.append({'x': x, 'hb': DR['halfBreadth'][i], 'bottom': DR['bottom'][i], 'top': DR['top'][i]})
if not any(x >= DR['x0'] for x in DR['x']):
    for i, x in enumerate(ST['x']):
        if x >= DR['x0']:
            ROWS.append({'x': x, 'hb': ST['halfBreadth'][i], 'bottom': ST['bottom'][i], 'top': ST['top'][i]})
ROWS.sort(key=lambda r: r['x'])
XS_ALL = [r['x'] for r in ROWS]


def hb_of(row, z):
    """a station's half-breadth at height z: the table, linear between its heights"""
    hb = row['hb']
    if z <= ZS[0]:
        return hb[0]
    if z >= ZS[-1]:
        return hb[-1]
    j = min(int(z / DZ), len(ZS) - 2)
    t = (z - ZS[j]) / DZ
    return hb[j] + (hb[j + 1] - hb[j]) * t


def hb_at(x, z):
    """the drawn shell's half-breadth at (x, z): between stations, linear in x"""
    if x <= XS_ALL[0]:
        return hb_of(ROWS[0], z)
    if x >= XS_ALL[-1]:
        return hb_of(ROWS[-1], z)
    lo, hi = 0, len(ROWS) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if XS_ALL[mid] <= x:
            lo = mid
        else:
            hi = mid
    t = (x - XS_ALL[lo]) / (XS_ALL[hi] - XS_ALL[lo])
    return hb_of(ROWS[lo], z) * (1 - t) + hb_of(ROWS[hi], z) * t


DE_X, DE_Y = T['derived']['boatDeckEdge']['x'], T['derived']['boatDeckEdge']['y']
AH_X, AH_Y = T['derived']['aHouse']['x'], T['derived']['aHouse']['y']


def deck_edge(x):
    return interp(DE_X, DE_Y, x)


# ------------------------------------------------------------------ the scene
bpy.ops.wm.read_factory_settings(use_empty=True)
SCENE = bpy.context.scene


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


MATS = {}


def material(name):
    if name in MATS:
        return MATS[name]
    hexcol = T['colors'].get(name, '#808080')
    r, g, b = (lin(int(hexcol[k:k + 2], 16) / 255) for k in (1, 3, 5))
    m = bpy.data.materials.new(name)
    m.diffuse_color = (r, g, b, 1.0)
    try:
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        if bsdf is not None:
            bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.6
    except Exception:
        pass
    MATS[name] = m
    return m


OBJECTS = []


def add_mesh(name, verts, faces, mat_name, face_mats=None):
    """mat_name: one material, or a list of them with face_mats giving each face's index into it"""
    mats = mat_name if isinstance(mat_name, list) else [mat_name]
    clean, idx = [], []
    for k, f in enumerate(faces):                     # a face keeps its distinct corners, in order; fewer than 3: none
        u = []
        for v in f:
            if not u or (v != u[-1] and v != u[0]):
                u.append(v)
        if len(u) >= 3:
            clean.append(tuple(u))
            idx.append(face_mats[k] if face_mats else 0)
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], clean)
    for m in mats:
        me.materials.append(material(m))
    if len(mats) > 1:
        for p, k in zip(me.polygons, idx):
            p.material_index = k
    me.validate(clean_customdata=False)
    me.update()
    ob = bpy.data.objects.new(name, me)
    SCENE.collection.objects.link(ob)
    OBJECTS.append({'name': name, 'material': '+'.join(mats), 'vertices': len(me.vertices), 'faces': len(me.polygons)})
    return ob


def box(name, x0, x1, y0, y1, z0a, z1a, z0b=None, z1b=None, mat='white'):
    """a box from x0 to x1, y0 to y1, its floor and roof z0a, z1a at x0 and z0b, z1b at x1 (they follow the deck's sheer)"""
    z0b = z0a if z0b is None else z0b
    z1b = z1a if z1b is None else z1b
    v = [(x0, y0, z0a), (x1, y0, z0b), (x1, y1, z0b), (x0, y1, z0a), (x0, y0, z1a), (x1, y0, z1b), (x1, y1, z1b), (x0, y1, z1a)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)]
    return add_mesh(name, v, f, mat)


def deck_box(name, x0, x1, y0, y1, deck, h, base=0.0, mat='white'):
    return box(name, x0, x1, y0, y1, deck_z(deck, x0) + base, deck_z(deck, x0) + base + h, deck_z(deck, x1) + base, deck_z(deck, x1) + base + h, mat)


def tube(name, A, B, r0, r1, n, mat, cap=True):
    """a tube from A to B (radii r0, r1), n sides [appearance], capped at B"""
    d = [B[k] - A[k] for k in range(3)]
    L = math.sqrt(sum(c * c for c in d))
    w = [c / L for c in d]
    ref = (0.0, 0.0, 1.0) if abs(w[2]) < 0.9 else (1.0, 0.0, 0.0)
    u = (w[1] * ref[2] - w[2] * ref[1], w[2] * ref[0] - w[0] * ref[2], w[0] * ref[1] - w[1] * ref[0])
    lu = math.sqrt(sum(c * c for c in u))
    u = tuple(c / lu for c in u)
    v = (w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0])
    verts, faces = [], []
    for C, r in ((A, r0), (B, r1)):
        for i in range(n):
            a = 2 * math.pi * i / n
            verts.append(tuple(C[k] + r * (math.cos(a) * u[k] + math.sin(a) * v[k]) for k in range(3)))
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    if cap:
        verts.append(tuple(B))
        c = len(verts) - 1
        for i in range(n):
            faces.append((n + i, n + (i + 1) % n, c))
    return add_mesh(name, verts, faces, mat)


# ------------------------------------------------------------------ the shell: hull, and the tiers' sides flush with it
X_B0 = P['wellAft'][1] + N['bDeck']['notch']        # B deck's superstructure: from the after well's notch ...
X_WF = P['wellFwd'][0]                               # ... to the forward well (the model's hull's own wells)
SCREEN = N['screen']
BD = N['boatDeck']


def shell_top(x, top):
    """the top of her side at x: the Boat deck where the promenade's screen stands, A deck over B deck's superstructure,
    her hull's own top elsewhere (B deck, or C deck in the wells)"""
    if SCREEN['x0'] <= x <= BD['xFront']:
        return deck_z('Boat', x)
    if X_B0 <= x <= X_WF:
        return deck_z('A', x)
    return top


# stations either side of where her side's top steps (the tiers' ends), from the stations round them
EXTRA = []
for xe in (X_B0, SCREEN['x0'], BD['xFront']):
    for d in (-0.04, 0.04):
        x = round(xe + d, 6)
        lo = max(k for k in range(len(ROWS)) if ROWS[k]['x'] <= x)
        a, b = ROWS[lo], ROWS[lo + 1]
        t = (x - a['x']) / (b['x'] - a['x'])
        EXTRA.append({'x': x, 'hb': [a['hb'][j] * (1 - t) + b['hb'][j] * t for j in range(len(ZS))],
                      'bottom': a['bottom'] if a['bottom'] is not None and b['bottom'] is not None and abs(a['bottom'] - b['bottom']) < 1e-9 else min(v for v in (a['bottom'], b['bottom']) if v is not None),
                      'top': a['top'] * (1 - t) + b['top'] * t})
SHELL = sorted([r for r in ROWS + EXTRA if r['bottom'] is not None], key=lambda r: r['x'])


def build_shell():
    verts, faces, rings = [], [], []
    for r in SHELL:
        x, bot = r['x'], r['bottom']
        top = shell_top(x, r['top'])
        j0 = next(j for j in range(len(ZS)) if ZS[j] >= bot - 1e-9)
        pts = [(bot, r['hb'][j0])]                    # her bottom: the breadth at the first height at or over it
        own = []
        for j, z in enumerate(ZS):
            if bot < z < top:
                own.append(j)
                pts.append((z, r['hb'][j]))
        pts.append((top, hb_of(r, top)))
        # the grid's rows: below her bottom they fall on it, over her top on it (T1: one set of heights, clipped)
        rowmap = []
        k_of = {j: 1 + i for i, j in enumerate(own)}
        for j, z in enumerate(ZS):
            rowmap.append(0 if z <= bot else (len(pts) - 1 if z >= top else k_of[j]))
        base = len(verts)
        for (z, y) in pts:
            verts.append((x, y, z))                   # port
        for (z, y) in pts:
            verts.append((x, -y, z))                  # starboard
        rings.append({'base': base, 'n': len(pts), 'sb': len(pts), 'map': rowmap, 'pts': pts, 'x': x})
    # her ends closed by a ring of no breadth, as the viewer closes them: aft on the round stern's end (hull.drawn.xEnd) at
    # the heights of her last ring; forward along her stem's rake (hull.stations.stem: x at each height)
    def closing(rg, xf):
        base = len(verts)
        for (z, y) in rg['pts']:
            verts.append((xf(z), 0.0, z))
        return {'base': base, 'n': len(rg['pts']), 'sb': 0, 'map': rg['map'], 'pts': rg['pts'], 'x': None}
    rings.insert(0, closing(rings[0], lambda z: DR['xEnd']))
    rings.append(closing(rings[-1], lambda z: interp(ZS, ST['stem'], z)))
    # her colours [read: Read's colour guide, as site/topsides.js has them]: her side black up to the yellow sheer line's
    # foot, B deck less her white top strake (topsides.derived.sheerLine), white above it; her decks wood
    fm = []
    def side(f):
        n = len(f)
        x = sum(verts[v][0] for v in f) / n
        z = sum(verts[v][2] for v in f) / n
        return 1 if z > deck_z('B', x) - N['strake'] else 0
    for a, b in zip(rings[:-1], rings[1:]):
        for j in range(len(ZS) - 1):
            pa0, pa1, pb0, pb1 = a['base'] + a['map'][j], a['base'] + a['map'][j + 1], b['base'] + b['map'][j], b['base'] + b['map'][j + 1]
            faces.append((pa0, pa1, pb1, pb0))                                         # port, outward +y
            fm.append(side(faces[-1]))
            sa0, sa1, sb0, sb1 = pa0 + a['sb'], pa1 + a['sb'], pb0 + b['sb'], pb1 + b['sb']
            faces.append((sa0, sb0, sb1, sa1))                                         # starboard, outward -y
            fm.append(side(faces[-1]))
        # her bottom and her top across
        faces.append((a['base'], b['base'], b['base'] + b['sb'], a['base'] + a['sb']))
        fm.append(0)
        ta, tb = a['base'] + a['n'] - 1, b['base'] + b['n'] - 1
        faces.append((ta, ta + a['sb'], tb + b['sb'], tb))
        fm.append(2)
    return add_mesh('hull', verts, faces, ['black', 'white', 'deck'], fm)


# ------------------------------------------------------------------ the decks over her side: the Boat deck abaft the screen
def build_decks():
    # the Boat deck over the open promenade abaft the screen: a plate of its own thickness, to her Boat deck's edge
    xs = [x for x in DE_X if BD['x0'] <= x <= SCREEN['x0']]
    xs = sorted(set([BD['x0']] + xs + [SCREEN['x0']]))
    verts, faces, t = [], [], BD['t']
    for x in xs:
        y, z = deck_edge(x), deck_z('Boat', x)
        verts += [(x, y, z), (x, -y, z), (x, y, z - t), (x, -y, z - t)]
    for i in range(len(xs) - 1):
        a, b = 4 * i, 4 * (i + 1)
        faces.append((a, a + 1, b + 1, b))            # its top
        faces.append((a + 2, b + 2, b + 3, a + 3))    # its underside
        faces.append((a, b, b + 2, a + 2))            # its edges
        faces.append((a + 1, a + 3, b + 3, b + 1))
    faces.append((0, 2, 3, 1))
    n = len(verts) - 4
    faces.append((n, n + 1, n + 3, n + 2))
    add_mesh('Boat deck aft', verts, faces, 'deck')
    # A deck's house under it (TS.aHouseHw: 0 where there is none)
    xs = [x for x in AH_X if x <= SCREEN['x0']]
    i = 0
    while i < len(xs):
        if interp(AH_X, AH_Y, xs[i]) <= 0:
            i += 1
            continue
        j = i
        while j + 1 < len(xs) and interp(AH_X, AH_Y, xs[j + 1]) > 0:
            j += 1
        for k in range(i, j):
            x0, x1 = xs[k], xs[k + 1]
            hw = min(interp(AH_X, AH_Y, x0), interp(AH_X, AH_Y, x1))
            box('A deck house %.0f' % x0, x0, x1, -hw, hw, deck_z('A', x0), deck_z('Boat', x0) - BD['t'], deck_z('A', x1), deck_z('Boat', x1) - BD['t'], 'white')
        i = j + 1
    # B deck's after end between the after well and the notches of No. 4 hatches
    hw = N['bDeck']['notchHw']
    box('B deck after end', P['wellAft'][1], X_B0, -hw, hw, deck_z('B', P['wellAft'][1]), deck_z('A', P['wellAft'][1]), deck_z('B', X_B0), deck_z('A', X_B0), 'white')


# ------------------------------------------------------------------ bulwarks: the wells' and the Boat deck's (plates, no thickness)
def strip(name, x0, x1, base, h, edge, mat):
    xs = sorted(set([x0, x1] + [x for x in XS_ALL if x0 < x < x1]))
    for sg, side in ((1, 'port'), (-1, 'starboard')):
        verts, faces = [], []
        for x in xs:
            z0 = base(x)
            verts += [(x, sg * edge(x, z0), z0), (x, sg * edge(x, z0 + h), z0 + h)]
        for i in range(len(xs) - 1):
            a, b = 2 * i, 2 * i + 2
            faces.append((a, a + 1, b + 1, b) if sg > 0 else (a, b, b + 1, a + 1))
        add_mesh(name + ' ' + side, verts, faces, mat)


def build_bulwarks():
    for nm, w in (('forward well bulwark', P['wellFwd']), ('after well bulwark', P['wellAft'])):
        strip(nm, w[0], w[1], lambda x: deck_z('C', x), N['wellBulwark'], hb_at, 'white')
    for s in N['sides']:
        if s['kind'] == 'bulwark':
            strip('Boat deck bulwark %.1f' % s['x'][0], s['x'][0], s['x'][1], lambda x: deck_z('Boat', x), N['bulwarkH'], lambda x, z: deck_edge(x), 'white')


# ------------------------------------------------------------------ on the Boat deck: houses, bridge, cabs
def build_houses():
    for hs in N['houses']:
        for k, (x0, x1, y_s, y_p) in enumerate(hs['secs']):
            mat = 'white' if hs.get('roof') == 'white' else hs.get('roof', 'white')
            deck_box(hs['id'] + ('' if k == 0 else ' %d' % k), x0, x1, y_s, y_p, 'Boat', hs['h'], 0.0, 'white')
            deck_box(hs['id'] + ' roof' + ('' if k == 0 else ' %d' % k), x0, x1, y_s, y_p, 'Boat', 0.06, hs['h'], mat)
    br = N['bridge']
    deck_box('bridge roof', br['x0'], BD['xFront'], -br['hw'], br['hw'], 'Boat', 0.15, br['h'], 'grey')
    cb = N['cabs']
    xc = 0.5 * (cb['x0'] + cb['x1'])
    out = deck_edge(xc) + cb['out']
    for sg, side in ((1, 'port'), (-1, 'starboard')):
        y0, y1 = sorted((sg * (out - cb['w']), sg * out))
        deck_box('wing cab ' + side, cb['x0'], cb['x1'], y0, y1, 'Boat', cb['h'], 0.0, 'white')
    db = N['dockBridge']
    xm = 0.5 * (db['x0'] + db['x1'])
    z0 = deck_z('B', xm)
    hw = hb_at(xm, z0) + db['over']
    box('docking bridge', db['x0'], db['x1'], -hw, hw, z0 + db['h'] - 0.2, z0 + db['h'], mat='deck')
    # on the casings' roofs: the fan housings at N.fans' places, the engine casing's skylight, the aerial's lead-in
    # [appearance: their boxes' sizes and the fans' 2.2 m off her centre line are the viewer's own, site/topsides.js build()]
    for x, h in N['fans']:
        for sg, side in ((1, 'port'), (-1, 'starboard')):
            deck_box('fan housing %.1f %s' % (x, side), x - 0.8, x + 0.8, sg * 2.2 - 0.65, sg * 2.2 + 0.65, 'Boat', 1.6, h, 'white')
    sk = N['skylight']
    zs0 = deck_z('Boat', 0.5 * (sk['x'][0] + sk['x'][1])) + 2.7
    box('engine-casing skylight', sk['x'][0], sk['x'][1], -sk['hw'], sk['hw'], zs0, zs0 + sk['h'], mat='white')
    li = N['leadIn']
    zl = deck_z('Boat', li['x']) + 2.4
    box('aerial lead-in mast', li['x'] - li['side'] / 2, li['x'] + li['side'] / 2, -li['side'] / 2, li['side'] / 2, zl, zl + li['h'], mat='white')


# ------------------------------------------------------------------ funnels, masts, the crow's nest, the domes, the boats
def build_funnels():
    F = N['funnel']
    r, a, b, n = F['rake'], F['a'], F['b'], int(F['seg'])
    sr, cr = math.sin(r), math.cos(r)
    for g in T['derived']['funnels']:
        zb = g['seatZ']
        s_top = (g['zTopFwd'] - zb - a * sr) / cr
        s_black = s_top - F['black']
        axis = lambda s: (g['x'] - s * sr, 0.0, zb + s * cr)
        def at(s, th):
            A = axis(s)
            c = math.cos(th) * a
            return (A[0] + c * cr, math.sin(th) * b, A[2] + c * sr)
        ths = [2 * math.pi * i / n for i in range(n)]
        seat = lambda th: -a * math.cos(th) * math.tan(r)
        for part, s0, s1, mat in (('', None, s_black, 'buff'), (' black', s_black, s_top, 'cap')):
            verts = [at(seat(th) if s0 is None else s0, th) for th in ths] + [at(s1, th) for th in ths]
            faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
            if part:
                verts.append(axis(s_top))
                c = len(verts) - 1
                faces += [(n + i, n + (i + 1) % n, c) for i in range(n)]
            add_mesh('funnel %d%s' % (g['id'], part), verts, faces, mat)
        # the steam escape pipes up her forward face, parallel to the axis (N.pipes: 17 in forward, 15 in aft [read]; their
        # mouths `over` m over the top's forward point, `gap` m off the skin [bets]); their upper metre black, and 0.06 m
        # between the two [appearance], as site/topsides.js has them. The forward pipe's mouth is where the steam leaves
        # (topsides.derived.steam)
        pp = N['pipes']
        rA, rF = pp['dA'] / 2, pp['dF'] / 2
        dA = a + pp['gap'] + rA
        dF = dA + rA + rF + 0.06
        s0, s1 = seat(0.0), s_top + pp['over'] / cr
        off = lambda s, dd: (axis(s)[0] + dd * cr, 0.0, axis(s)[2] + dd * sr)
        tube('funnel %d after pipe' % g['id'], off(s0, dA), off(s1 - 1.0, dA), rA, rA, 8, 'buff', cap=False)
        tube('funnel %d after pipe top' % g['id'], off(s1 - 1.0, dA), off(s1 - 0.3, dA), rA, rA, 8, 'cap')
        tube('funnel %d forward pipe' % g['id'], off(s0, dF), off(s1 - 1.0, dF), rF, rF, 8, 'buff', cap=False)
        tube('funnel %d forward pipe top' % g['id'], off(s1 - 1.0, dF), off(s1, dF), rF, rF, 8, 'cap')


def build_masts():
    R = N['mastR']
    for m in T['derived']['masts']:
        tube(m['id'] + 'mast', m['foot'], m['hounds'], R['deck'], R['hounds'], 12, 'mast', cap=False)
        tube(m['id'] + 'mast above the hounds', m['hounds'], m['top'], R['hounds'], R['pole'] * 0.7, 12, 'mast')
    ns = T['derived']['nest']
    tube('crow\'s nest', (ns['x'], 0.0, ns['floor']), (ns['x'], 0.0, ns['rim']), ns['r'], ns['r'], 16, 'white')
    # the foremast's derrick, stowed up and aft (N.derrick: its heel and head off the profile, lifted onto the model's B deck
    # as the viewer lifts it; 0.2 to 0.14 m [appearance])
    d = N['derrick']
    lift = deck_z('B', d['heel'][0]) - d['heel'][1] + 0.3
    tube('derrick', (d['heel'][0], 0.0, d['heel'][1] + lift), (d['head'][0], 0.0, d['head'][1] + lift), 0.2, 0.14, 8, 'mast')


def build_domes():
    n = 28
    for d in T['derived']['domes']:
        verts, faces = [], []
        for z in (d['z0'], d['zGlass']):
            for i in range(n):
                th = 2 * math.pi * i / n
                verts.append((d['x'] + d['a'] * math.cos(th), d['b'] * math.sin(th), z))
        faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        verts.append((d['x'], 0.0, d['crown']))
        faces += [(n + i, n + (i + 1) % n, 2 * n) for i in range(n)]
        add_mesh(d['id'], verts, faces, 'glass')


def build_boats():
    for bt in SHIP['boats']['stowed']:
        h = 0.3 if bt['folded'] else bt['D']
        box('boat ' + bt['id'], bt['x'] - bt['L'] / 2, bt['x'] + bt['L'] / 2, bt['y'] - bt['B'] / 2, bt['y'] + bt['B'] / 2, bt['z'], bt['z'] + h, mat='white')


# markers: tiny octahedra at known points of the ship frame, inside her hull, out of every silhouette; each one's
# centroid and the centre of its bounding box are the point. Whatever reads the GLB (Unreal's importer, U2:
# tools/unreal/u2_sea.py) finds where they land and so measures the axis mapping itself, instead of assuming it.
MARKERS = [('marker o', (0.0, 0.0, 1.0)), ('marker x', (100.0, 0.0, 1.0)), ('marker y', (0.0, 5.0, 1.0)), ('marker z', (0.0, 0.0, 11.0))]


def build_markers():
    s = 0.02
    for name, (x, y, z) in MARKERS:
        v = [(x + s, y, z), (x - s, y, z), (x, y + s, z), (x, y - s, z), (x, y, z + s), (x, y, z - s)]
        f = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]
        add_mesh(name, v, f, 'cap')


build_shell()
build_markers()
build_decks()
build_bulwarks()
build_houses()
build_funnels()
build_masts()
build_domes()
build_boats()

# ------------------------------------------------------------------ out: the GLB, what is in it, the scene
os.makedirs(OPT['out'], exist_ok=True)
glb = os.path.join(OPT['out'], 'titanic_ship.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
                          export_extras=False, export_cameras=False, export_lights=False)
info = {
    'format': 'titanic-ship-glb', 'version': 1, 'made': 'tools/blender/build_ship.py', 'blender': bpy.app.version_string,
    'frames': 'glTF +Y up: a point (x, y, z) of the ship frame (x forward, y to port, z up from the keel) is (x, z, -y) in the file, the web viewer\'s three.js axes; metres',
    'from': {'ship': os.path.basename(OPT['ship']), 'sources': SHIP['made']['sources']},
    'markers': [{'name': n, 'at': list(p)} for n, p in MARKERS],
    'objects': OBJECTS,
}
with open(glb + '.json', 'w', encoding='utf-8', newline='\n') as fh:
    json.dump(info, fh, indent=1, ensure_ascii=False)
    fh.write('\n')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OPT['out'], 'titanic_ship.blend'), compress=False)
print('GEN_OK titanic_ship %d objects -> %s' % (len(OBJECTS), glb))
