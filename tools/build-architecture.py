"""Run with Blender --background --factory-startup --python tools/build-architecture.py.

Coordinates below use the game's X/Y-up/Z convention, in metres. Export applies
the Blender/glTF axis conversion once; assets are placed at scale 1 in the game.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools' / 'blender'
MODELS = ROOT / 'public' / 'models'
assert MODELS.is_dir() and SOURCE.parent.is_dir()
SOURCE.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1
bpy.context.preferences.filepaths.save_version = 0

PALETTE = {
    'stone': ('#cfc4ae', 0.94, 0),
    'plaster': ('#e5d9bd', 0.95, 0),
    'timber': ('#883e2a', 0.8, 0),
    'darkwood': ('#4b3022', 0.86, 0),
    'tile': ('#784335', 0.9, 0),
    'gold': ('#be974b', 0.48, 0.35),
}
materials = {}
for name, (hex_color, roughness, metalness) in PALETTE.items():
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb]
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.use_backface_culling = True
    node = material.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*linear, 1)
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Metallic'].default_value = metalness
    material.diffuse_color = (*linear, 1)
    materials[name] = material


class Building:
    def __init__(self, name):
        self.name = name
        self.parts = {}
        self.collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(self.collection)

    def mesh(self, material, vertices, faces):
        points, polygons = self.parts.setdefault(material, ([], []))
        offset = len(points)
        points.extend((x, -z, y) for x, y, z in vertices)
        polygons.extend(tuple(offset + i for i in face) for face in faces)

    def box(self, mat, x, y, z, w, h, d):
        self.mesh(mat, [(x + sx * w / 2, y + sy * h / 2, z + sz * d / 2)
                        for sx, sy, sz in [(-1,-1,-1), (1,-1,-1), (1,1,-1), (-1,1,-1),
                                          (-1,-1,1), (1,-1,1), (1,1,1), (-1,1,1)]],
                  [(0,3,2,1), (4,5,6,7), (0,1,5,4), (3,7,6,2), (0,4,7,3), (1,2,6,5)])

    def tube(self, mat, a, b, radius, segments=8, top_radius=None):
        a, b = Vector(a), Vector(b)
        axis = (b - a).normalized()
        tangent = axis.cross(Vector((0, 1, 0)))
        if tangent.length < 0.01:
            tangent = axis.cross(Vector((1, 0, 0)))
        tangent.normalize()
        bitangent = axis.cross(tangent).normalized()
        points = []
        for center, r in [(a, radius), (b, top_radius if top_radius is not None else radius)]:
            for i in range(segments):
                angle = i * math.tau / segments
                p = center + r * (math.cos(angle) * tangent + math.sin(angle) * bitangent)
                points.append(tuple(p))
        faces = [tuple(range(segments - 1, -1, -1)), tuple(range(segments, segments * 2))]
        for i in range(segments):
            j = (i + 1) % segments
            faces.append((i, j, j + segments, i + segments))
        self.mesh(mat, points, faces)

    def roof(self, w, d, base, height, lift, center_z=0):
        # Closed hip roof: six rings, raised corners, tiled seams and curved hips.
        divisions = max(6, round(w / 0.65))
        ts = [0, 0.1, 0.27, 0.5, 0.75, 1]

        def point(t, side, u, offset=0):
            hx = w / 2 * (1 - t) + w * 0.20 * t
            hz = d / 2 * (1 - t) + 0.06 * t
            coords = [(-hx + 2 * hx * u, -hz), (hx, -hz + 2 * hz * u),
                      (hx - 2 * hx * u, hz), (-hx, hz - 2 * hz * u)]
            x, z = coords[side]
            corner = abs(2 * u - 1) ** 5
            y = base + height * t ** 0.72 + lift * (1 - t) ** 4 * corner + offset
            return x, y, z + center_z

        verts, faces = [], []
        for offset in [0, -0.10]:
            for t in ts:
                verts.extend(point(t, side, i / divisions, offset)
                             for side in range(4) for i in range(divisions))
        ring = divisions * 4
        layer = len(ts) * ring
        for k in range(len(ts) - 1):
            for i in range(ring):
                j = (i + 1) % ring
                a, b = k * ring + i, k * ring + j
                faces.append((a, b, b + ring, a + ring))
                faces.append((a + layer, a + ring + layer, b + ring + layer, b + layer))
        for k in [0, len(ts) - 1]:
            for i in range(ring):
                a, b = k * ring + i, k * ring + (i + 1) % ring
                faces.append((a, a + layer, b + layer, b))
        self.mesh('tile', verts, faces)
        for side in range(4):
            for i in range(1, divisions):
                for ta, tb in zip(ts, ts[1:]):
                    self.tube('tile', point(ta, side, i / divisions, 0.025),
                              point(tb, side, i / divisions, 0.025), 0.035, 3)
            for ta, tb in zip(ts, ts[1:]):
                self.tube('gold', point(ta, side, 0, 0.05), point(tb, side, 0, 0.05), 0.065, 6)
            for i in range(divisions):
                self.tube('darkwood', point(0, side, i / divisions, -0.06),
                          point(0, side, (i + 1) / divisions, -0.06), 0.065, 6)
        self.tube('gold', (-w * .21, base + height + .1, center_z),
                  (w * .21, base + height + .1, center_z), .09, 8)

    def wall_with_window(self, x, z, length, base, height, side=False):
        # Window openings are real gaps, not dark rectangles painted over walls.
        def panel(cx, cy, cz, w, h, d):
            self.box('plaster', cx, cy, cz, d if side else w, h, w if side else d)
        window = length * .44
        for s in [-1, 1]:
            shift = s * (length + window) / 4
            panel(x if side else x + shift, base + height / 2, z + shift if side else z,
                  (length - window) / 2, height, .20)
        for cy, h in [(base + .45, .9), (base + height - .3, .6)]:
            panel(x, cy, z, window, h, .20)
        for s in [-1, 1]:
            shift = s * window / 2
            self.box('darkwood', x if side else x + shift, base + 1.7,
                     z + shift if side else z, .12, 1.6, .12)
        for i in range(1, 6):
            shift = window * (i / 6 - .5)
            self.box('darkwood', x if side else x + shift, base + 1.7,
                     z + shift if side else z, .045, 1.6, .045)
        for cy in [base + .9, base + 2.5]:
            self.box('darkwood', x, cy, z, .14 if side else window + .16, .12,
                     window + .16 if side else .14)

    def finish(self, expected):
        objects = []
        for key, (vertices, faces) in self.parts.items():
            mesh = bpy.data.meshes.new(f'{self.name}-{key}')
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            obj = bpy.data.objects.new(mesh.name, mesh)
            self.collection.objects.link(obj)
            mesh.materials.append(materials[key])
            objects.append(obj)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        # Recalculate connected surface normals before glTF triangulates the mesh.
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
        mins = [min(p[i] for p in points) for i in range(3)]
        maxs = [max(p[i] for p in points) for i in range(3)]
        size = [maxs[0] - mins[0], maxs[2] - mins[2], maxs[1] - mins[1]]
        triangles = 0
        for obj in objects:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
        assert triangles < expected['triangles'], (self.name, triangles)
        assert len(objects) <= 6
        assert all(abs(a - b) < .25 for a, b in zip(size, expected['size'])), size
        path = MODELS / f'{self.name}.glb'
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
                                  export_yup=True, export_texcoords=False, export_normals=True,
                                  export_animations=False, export_cameras=False, export_lights=False)
        assert path.stat().st_size < 1500000
        return {'name': self.name, 'sizeMetersXYZ': size, 'triangles': triangles,
                'materials': list(self.parts), 'meshes': len(objects), 'bytes': path.stat().st_size,
                'textures': 0, 'scale': 1, 'front': '+Z', 'floorHeight': expected['floor']}


hall = Building('dien-duoc-su-blender')
floor = .45
hall.box('stone', 0, floor / 2, 0, 12, floor, 9)
# Four bays follow the existing collider column positions exactly.
for x in [-5, -1.8, 1.8, 5]:
    for z in [-3.9, 3.9]:
        hall.box('stone', x, floor + .13, z, .62, .26, .62)
        hall.tube('timber', (x, floor + .26, z), (x, floor + 3.96, z), .31, 12, .26)
        hall.box('gold', x, floor + 4.07, z, 1.05, .22, 1.05)
        for side in [-1, 1]:
            hall.tube('darkwood', (x, floor + 3.25, z), (x + side * .65, floor + 3.95, z), .10, 6)
for z in [-3.9, 3.9]:
    hall.box('timber', 0, 4.63, z, 11.4, .42, .7)
for x in [-5, 5]:
    hall.box('timber', x, 4.63, 0, .7, .42, 8.4)
hall.box('plaster', 0, 2.81, -3.9, 10.6, 4.2, .24)
for x in [-5, 5]:
    hall.wall_with_window(x, 0, 7.6, .71, 4.2, side=True)
hall.roof(15, 11.4, 4.93, 2.6, .62)
hall.box('timber', 0, 7.62, 0, 6.4, 1.15, 4.6)
for z in [-2.31, 2.31]:
    for x in [-2.4, -1.2, 0, 1.2, 2.4]:
        hall.box('darkwood', x, 7.78, z, .65, .36, .07)
hall.roof(7.6, 5.8, 7.53, 1.6, .5)
hall.tube('gold', (0, 9.1, 0), (0, 10.05, 0), .16, 8, .025)

hut = Building('tinh-that-blender')
hut.box('stone', 0, .08, 0, 3.2, .16, 2.5)
for x in [-1.3, 1.3]:
    for z in [-1.05, 1.05]:
        hut.box('stone', x, .25, z, .5, .18, .5)
        hut.tube('timber', (x, .34, z), (x, 2.44, z), .19, 10, .16)
for z in [-1.05, 1.05]:
    hut.box('timber', 0, 2.44, z, 3.1, .22, .24)
for x in [-1.3, 1.3]:
    hut.box('timber', x, 2.44, 0, .24, .22, 2.6)
hut.box('plaster', 0, 1.39, -1.05, 2.44, 2.1, .2)
for x in [-1.3, 1.3]:
    # Small huts use high timber bars in otherwise open side windows.
    hut.box('plaster', x, .70, 0, .2, .72, 1.94)
    hut.box('plaster', x, 2.22, 0, .2, .44, 1.94)
    for z in [-.8, -.4, 0, .4, .8]:
        hut.box('darkwood', x, 1.58, z, .065, .8, .055)
hut.roof(4.2, 3.6, 2.54, 1.1, .33)
hut.tube('gold', (0, 3.65, 0), (0, 3.95, 0), .09, 8, .015)

report = [hall.finish({'triangles': 18000, 'size': [15.12, 10.05, 11.52], 'floor': .45}),
          hut.finish({'triangles': 6000, 'size': [4.32, 3.95, 3.72], 'floor': .16})]
# Separate editable source collections for inspection; exported assets stay at the origin.
for obj in hut.collection.objects:
    obj.location.x = 20
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'campus-architecture.blend'))
(SOURCE / 'architecture-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('ARCHITECTURE_AUDIT', json.dumps(report))
