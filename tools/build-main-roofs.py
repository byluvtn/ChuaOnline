"""Blender 5.3: generate the two editable, game-aligned hall roofs.

Run from the project root: blender --background --factory-startup --python tools/build-main-roofs.py
Game coordinates are X/Y-up/Z; the front of each hall points toward +Z.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
SOURCE = ROOT / 'tools' / 'blender'
assert OUT.is_dir() and SOURCE.is_dir()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.context.scene.unit_settings.system = 'METRIC'


def material(name, color, roughness=.8, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*[int(color[i:i+2], 16) / 255 for i in (1, 3, 5)], 1)
    m.use_nodes = True
    m.use_backface_culling = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = m.diffuse_color
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metallic
    return m


MATS = {
    'tile': material('ngoi-do-gom', '#873f30'),
    'tile-dark': material('bo-noc-gom-sam', '#59342c'),
    'soffit': material('go-tran-son', '#472a20'),
    'red': material('son-son-do', '#923122'),
    'stone': material('vua-voi', '#d2bca0'),
    'gold': material('son-thep-vang', '#c8a05a', .52, .22),
}


class Roof:
    def __init__(self, name):
        self.name = name
        self.collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(self.collection)
        self.parts = {}

    def mesh(self, mat, points, faces):
        vertices, polygons = self.parts.setdefault(mat, ([], []))
        start = len(vertices)
        vertices.extend((x, -z, y) for x, y, z in points)
        polygons.extend(tuple(start + i for i in face) for face in faces)

    def box(self, mat, x, y, z, w, h, d):
        v = [(x + a*w/2, y + b*h/2, z + c*d/2)
             for a, b, c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),
                             (-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        self.mesh(mat, v, [(0,3,2,1),(4,5,6,7),(0,1,5,4),
                           (3,7,6,2),(0,4,7,3),(1,2,6,5)])

    def tube(self, mat, points, radii, sides=6):
        if len(points) < 2:
            return
        v, f = [], []
        for i, point in enumerate(points):
            a = Vector(points[max(i-1, 0)])
            b = Vector(points[min(i+1, len(points)-1)])
            axis = (b-a).normalized()
            u = axis.cross(Vector((0, 1, 0)))
            if u.length < .01:
                u = axis.cross(Vector((0, 0, 1)))
            u.normalize()
            vv = axis.cross(u).normalized()
            for k in range(sides):
                angle = math.tau*k/sides
                p = Vector(point) + radii[i]*(math.cos(angle)*u + math.sin(angle)*vv)
                v.append(tuple(p))
        f.append(tuple(range(sides-1, -1, -1)))
        f.append(tuple((len(points)-1)*sides+k for k in range(sides)))
        for i in range(len(points)-1):
            for k in range(sides):
                j = (k+1) % sides
                f.append((i*sides+k, i*sides+j, (i+1)*sides+j, (i+1)*sides+k))
        self.mesh(mat, v, f)

    def tile_roof(self, w, d, base, height, lift, rib_spacing=.78):
        nx = max(8, math.ceil(w / rib_spacing))
        nz = max(8, math.ceil(d / rib_spacing))
        rings = 10
        # A truncated hip roof supports the next storey's clerestory, unlike a
        # pointed pyramid. Slightly concave pitch and lifted corners shape the eaves.
        def pos(t, side, u):
            hx = w*(.5*(1-t) + .13*t)
            hz = d*(.5*(1-t) + .14*t)
            coords = [(-hx+2*hx*u, -hz), (hx, -hz+2*hz*u),
                      (hx-2*hx*u, hz), (-hx, hz-2*hz*u)]
            x, z = coords[side]
            corner = (abs(2*u-1)**12) * (1-t)**4
            flare = .14*corner
            x += flare * (1 if x > 0 else -1)
            z += flare * (1 if z > 0 else -1)
            y = base + height*(.20*t + .80*t**1.75) + lift*corner
            return x, y, z

        counts = [nx, nz, nx, nz]
        perimeter = sum(counts)
        v = []
        for offset in [0, -.16]:
            for j in range(rings+1):
                t = j/rings
                for side, n in enumerate(counts):
                    for k in range(n):
                        x, y, z = pos(t, side, k/n)
                        v.append((x, y+offset, z))
        layer = (rings+1)*perimeter
        f_top, f_bottom, f_edge = [], [], []
        for j in range(rings):
            for k in range(perimeter):
                nxt = (k+1) % perimeter
                a, b = j*perimeter+k, j*perimeter+nxt
                f_top.append((a, b, b+perimeter, a+perimeter))
                f_bottom.append((a+layer, a+layer+perimeter,
                                 b+layer+perimeter, b+layer))
        for j in [0, rings]:
            for k in range(perimeter):
                nxt = (k+1) % perimeter
                a, b = j*perimeter+k, j*perimeter+nxt
                f_edge.append((a, a+layer, b+layer, b))
        self.mesh('tile', v, f_top)
        self.mesh('soffit', v, f_bottom)
        self.mesh('tile-dark', v, f_edge)

        # Each molded ceramic channel follows a meridian, not a painted stripe.
        for side, n in enumerate(counts):
            for k in range(1, n):
                if k % 2:
                    continue
                line = [(x, y+.024, z) for j in range(rings+1)
                        for x, y, z in [pos(j/rings, side, k/n)]]
                self.tube('tile-dark', line, [.041]*(rings+1), 4)
            edge = [pos(0, side, k/n) for k in range(n+1)]
            self.tube('tile-dark', [(x, y-.045, z) for x, y, z in edge], [.11]*(n+1), 6)
            # Terracotta end tiles and timber rafter tails are readable at eye level.
            for k in range(0, n, 2):
                x, y, z = pos(0, side, (k+.5)/n)
                self.tube('tile', [(x, y-.08, z), (x, y+.07, z)], [.095, .095], 6)
        for corner in range(4):
            hip = [pos(j/rings, corner, 0) for j in range(rings+1)]
            self.tube('tile-dark', [(x,y+.07,z) for x,y,z in hip], [.115]*(rings+1), 6)
            x, y, z = hip[0]
            dx = 1 if x > 0 else -1
            dz = 1 if z > 0 else -1
            # The upturned dau-dao grows from the hip, ending in a narrow finial.
            horn = [(x + dx*1.55*t, y + .10 + .25*t + 1.25*t*t,
                     z + dz*1.30*t) for t in [i/8 for i in range(9)]]
            self.tube('tile-dark', horn, [.19*(1-i/9)+.014 for i in range(9)], 7)
            self.tube('gold', horn[5:], [.045, .04, .03, .01], 5)
        # Central ridge on the flat truncated upper surface.
        ridge_x = w*.13
        self.tube('tile-dark', [(-ridge_x, base+height+.12, 0),
                                (0, base+height+.18, 0),
                                (ridge_x, base+height+.12, 0)], [.18]*3, 8)
        return base+height

    def clerestory(self, w, d, bottom, height):
        # A dark interior behind perforated timber windows; no solid opaque wall.
        self.box('red', 0, bottom+.15, 0, w, .30, d)
        self.box('red', 0, bottom+height-.13, 0, w, .26, d)
        for x in [-w/2, w/2]:
            self.box('red', x, bottom+height/2, 0, .27, height, d)
        for z in [-d/2, d/2]:
            self.box('red', 0, bottom+height/2, z, w, height, .24)
            for i in range(1, max(2, round(w/.54))):
                x = w*(i/max(2, round(w/.54))-.5)
                self.box('gold', x, bottom+height/2, z+(.13 if z > 0 else -.13),
                         .055, height-.48, .055)
        for x in [-w/2, w/2]:
            for i in range(1, max(2, round(d/.54))):
                z = d*(i/max(2, round(d/.54))-.5)
                self.box('gold', x+(.14 if x > 0 else -.14), bottom+height/2,
                         z, .055, height-.48, .055)

    def crown(self, width, y):
        # A restrained two-sided roof ornament, not a literal historical dragon.
        self.tube('gold', [(0,y,0),(0,y+.72,0)], [.11,.11], 9)
        for sign in [-1, 1]:
            path = [(sign*(.3 + 1.15*t), y+.20+.70*math.sin(math.pi*t), .04)
                    for t in [i/10 for i in range(11)]]
            self.tube('gold', path, [.10*(1-i/13) for i in range(11)], 6)
            tip = [(sign*width*.15, y+.05, 0),
                   (sign*(width*.15+.35), y+.38, 0),
                   (sign*(width*.15+.46), y+.95, 0)]
            self.tube('tile-dark', tip, [.18,.12,.015], 7)
        # Dharma-wheel silhouette with eight spokes facing the southern court.
        center = Vector((0, y+1.12, .12))
        self.tube('gold', [(math.cos(math.tau*i/32)*.43,
                            center.y+math.sin(math.tau*i/32)*.43, center.z)
                           for i in range(33)], [.056]*33, 6)
        for i in range(8):
            a = math.tau*i/8
            self.tube('gold', [(0,center.y,center.z),
                               (math.cos(a)*.39,center.y+math.sin(a)*.39,center.z)],
                      [.036,.036], 4)

    def finish(self):
        objs = []
        for mat, (vertices, faces) in self.parts.items():
            mesh = bpy.data.meshes.new(self.name+'-'+mat)
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            obj = bpy.data.objects.new(mesh.name, mesh)
            self.collection.objects.link(obj)
            mesh.materials.append(MATS[mat])
            objs.append(obj)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objs:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        tris = 0
        for obj in objs:
            obj.data.calc_loop_triangles()
            tris += len(obj.data.loop_triangles)
        path = OUT / (self.name+'.glb')
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB',
                                  use_selection=True, export_yup=True,
                                  export_texcoords=False, export_animations=False,
                                  export_cameras=False, export_lights=False)
        assert tris < 40000, (self.name, tris)
        assert path.stat().st_size < 2300000, (self.name, path.stat().st_size)
        return {'name': self.name, 'triangles': tris, 'meshes': len(objs),
                'bytes': path.stat().st_size, 'front': '+Z', 'scale': 1}


def hall(name, w, d, base, h1, lift1, upper_w, upper_d, upper_y,
         h2, lift2, high_w, high_d, high_y, h3, lift3, crown_y):
    r = Roof(name)
    r.tile_roof(w, d, base, h1, lift1)
    r.clerestory(upper_w, upper_d, base+h1-2.0, upper_y-(base+h1-2.0))
    r.tile_roof(upper_w, upper_d, upper_y, h2, lift2, .58)
    r.clerestory(high_w, high_d, upper_y+h2-2.0, high_y-(upper_y+h2-2.0))
    r.tile_roof(high_w, high_d, high_y, h3, lift3, .47)
    r.crown(high_w, crown_y)
    return r


# roofBaseY/purlins and upper tier heights mirror hall.ts and tamthe.ts.
main = hall('chinh-dien-roof', 39, 24.5, 10.15, 4.8, .6,
            11.56, 6.8, 14.79, 3.6, .5,
            5.44, 3.2, 18.17, 2.6, .45, 20.77)
three = hall('dien-tam-the-roof', 35.5, 23, 13.68, 6, .7,
             10.8, 6.48, 19.58, 4.4, .55,
             5.1, 3.06, 23.8, 3.2, .5, 27)
report = [main.finish(), three.finish()]
for i, roof in enumerate([main, three]):
    for obj in roof.collection.objects:
        obj.location.x = i*50
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'main-roofs.blend'))
(SOURCE/'main-roofs-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('MAIN_ROOFS_AUDIT', json.dumps(report))
