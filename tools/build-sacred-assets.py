"""Build editable, game-scale sacred scenery with Blender 5.3.

Run: blender --background --factory-startup --python tools/build-sacred-assets.py
Coordinates in helpers are Three.js X/Y-up/Z; export converts Blender axes once.
"""
import json
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
SOURCE = ROOT / 'tools' / 'blender'
assert OUT.is_dir() and SOURCE.is_dir()
bpy.context.preferences.filepaths.save_version = 0

COLORS = {
    'stone': ('#b5aa93', .94, 0), 'stone-dark': ('#817a6a', .96, 0),
    'plaster': ('#e4d5b7', .97, 0), 'wood': ('#773a28', .82, 0),
    'wood-dark': ('#422a22', .86, 0), 'tile': ('#713f32', .91, 0),
    'tile-edge': ('#ad7852', .84, 0), 'gold': ('#bd9756', .55, .32),
    'bronze': ('#9a7145', .76, .15), 'robe': ('#bc884b', .83, 0),
    'robe-light': ('#d9b578', .88, 0), 'ivory': ('#e4d9c3', .86, 0),
    'skin': ('#d9b993', .88, 0), 'hair': ('#302f29', .92, 0),
    'jade': ('#578a76', .7, 0), 'bark': ('#5b4836', 1, 0),
    'leaf': ('#426d3d', 1, 0), 'leaf-light': ('#66864b', 1, 0),
    'pine': ('#365946', 1, 0), 'pine-light': ('#5a7452', 1, 0),
}
materials = {}
for key, (color, rough, metal) in COLORS.items():
    srgb = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4 for v in srgb]
    mat = bpy.data.materials.new(key)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*linear, 1)
    node.inputs['Roughness'].default_value = rough
    node.inputs['Metallic'].default_value = metal
    mat.diffuse_color = (*linear, 1)
    materials[key] = mat


class Model:
    def __init__(self, name):
        self.name = name
        self.parts = {}
        self.collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(self.collection)

    def mesh(self, mat, verts, faces):
        points, polys = self.parts.setdefault(mat, ([], []))
        start = len(points)
        points.extend((x, -z, y) for x, y, z in verts)
        polys.extend(tuple(start + i for i in face) for face in faces)

    def box(self, mat, x, y, z, w, h, d):
        verts = [(x + dx*w/2, y + dy*h/2, z + dz*d/2) for dx, dy, dz in
                 [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),
                  (-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        self.mesh(mat, verts, [(0,3,2,1),(4,5,6,7),(0,1,5,4),
                                (3,7,6,2),(0,4,7,3),(1,2,6,5)])

    def ring(self, mat, x, y, z, radii, height, sides=12, phase=0, entrance=False):
        # Each section is (height offset, x radius, z radius), forming one closed lathe.
        verts = [(x+rx*math.sin(phase+i*math.tau/sides), y+height+dy,
                  z+rz*math.cos(phase+i*math.tau/sides))
                 for dy, rx, rz in radii for i in range(sides)]
        faces = [tuple(range(sides-1,-1,-1)),
                 tuple(range((len(radii)-1)*sides,len(radii)*sides))]
        for j in range(len(radii)-1):
            for i in range(sides):
                if entrance and i == sides-1 and j == 0: continue
                n = (i+1)%sides
                faces.append((j*sides+i,j*sides+n,(j+1)*sides+n,(j+1)*sides+i))
        self.mesh(mat, verts, faces)

    def orb(self, mat, x, y, z, rx, ry, rz, sides=12, rings=7):
        verts = [(x+rx*math.sin(math.pi*j/rings)*math.sin(i*math.tau/sides),
                  y+ry*math.cos(math.pi*j/rings),
                  z+rz*math.sin(math.pi*j/rings)*math.cos(i*math.tau/sides))
                 for j in range(rings+1) for i in range(sides)]
        faces = [(j*sides+i,j*sides+(i+1)%sides,
                  (j+1)*sides+(i+1)%sides,(j+1)*sides+i)
                 for j in range(rings) for i in range(sides)]
        self.mesh(mat, verts, faces)

    def branch(self, mat, a, b, r0, r1=None, sides=7):
        dx, dy, dz = (b[i]-a[i] for i in range(3))
        length = math.sqrt(dx*dx+dy*dy+dz*dz)
        if not length: return
        ux, uy, uz = dx/length, dy/length, dz/length
        tx, ty, tz = (uz, 0, -ux) if abs(uy) < .95 else (1, 0, 0)
        ll = math.sqrt(tx*tx+tz*tz)
        tx, tz = tx/ll, tz/ll
        vx, vy, vz = uy*tz, uz*tx-ux*tz, -uy*tx
        verts = []
        for pt, r in [(a,r0),(b,r1 if r1 is not None else r0)]:
            for i in range(sides):
                t = math.tau*i/sides
                verts.append(tuple(pt[k]+r*(math.cos(t)*(tx,ty,tz)[k]
                                          +math.sin(t)*(vx,vy,vz)[k]) for k in range(3)))
        faces = [tuple(range(sides-1,-1,-1)),tuple(range(sides,2*sides))]
        faces.extend((i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides))
        self.mesh(mat, verts, faces)

    def hip(self, w, d, y, rise, lift=.3, mat='tile'):
        # Continuous pitched roof with lifted eaves, not a stack of flat pyramids.
        cuts = 8
        verts = []
        for level in range(2):
            for t in [0,.13,.34,.62,1]:
                hx = w/2*(1-t)+w*.21*t
                hz = d/2*(1-t)+.08*t
                for side in range(4):
                    for i in range(cuts):
                        u = i/cuts
                        x,z = [(-hx+2*hx*u,-hz),(hx,-hz+2*hz*u),
                               (hx-2*hx*u,hz),(-hx,hz-2*hz*u)][side]
                        corner = abs(2*u-1)**6
                        verts.append((x,y+rise*t**.76+lift*(1-t)**4*corner-level*.11,z))
        n = cuts*4
        faces = []
        for base in [0,5*n]:
            for k in range(4):
                for i in range(n):
                    j = (i+1)%n
                    faces.append((base+k*n+i,base+k*n+j,base+(k+1)*n+j,base+(k+1)*n+i))
        for i in range(n):
            j = (i+1)%n
            faces.append((i,5*n+i,5*n+j,j))
        self.mesh(mat,verts,faces)
        for side in range(4):
            for i in range(1,cuts):
                u = i/cuts
                x,z = [(-w/2+w*u,-d/2),(w/2,-d/2+d*u),
                       (w/2-w*u,d/2),(-w/2,d/2-d*u)][side]
                self.branch('tile-edge',(x,y+.025,z),
                            (x*.42,y+rise+.04,z*.02),.035,.025,5)

    def export(self, budget):
        objects=[]
        for key,(vertices,faces) in self.parts.items():
            mesh=bpy.data.meshes.new(self.name+'-'+key)
            mesh.from_pydata(vertices,[],faces)
            mesh.materials.append(materials[key]); mesh.update()
            obj=bpy.data.objects.new(mesh.name,mesh)
            self.collection.objects.link(obj); objects.append(obj)
        bpy.ops.object.select_all(action='DESELECT')
        triangles=0
        for obj in objects:
            obj.select_set(True)
            obj.data.calc_loop_triangles()
            triangles+=len(obj.data.loop_triangles)
        assert 0 < triangles < budget, (self.name,triangles)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        path=OUT/(self.name+'.glb')
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
                                  export_yup=True,export_texcoords=False,export_animations=False,
                                  export_cameras=False,export_lights=False)
        assert path.stat().st_size < 1500000, path
        return {'name':self.name,'triangles':triangles,'meshes':len(objects),'bytes':path.stat().st_size}


def lotus(m, radius):
    m.ring('stone',0,0,0,[(0,radius*.95,radius*.95),(.16,radius,radius),
                         (.22,radius*.93,radius*.93)],0,20)
    for j in range(2):
        for i in range(14):
            a=math.tau*(i+(j*.5))/14
            r=radius*(.86-j*.18)
            spread=.15 if j else .19
            vertices=[(r*math.sin(a),.18+j*.07,r*math.cos(a)),
                      ((r+spread)*math.sin(a-.1),.27+j*.08,(r+spread)*math.cos(a-.1)),
                      ((r+spread)*math.sin(a+.1),.27+j*.08,(r+spread)*math.cos(a+.1)),
                      ((r+spread*.3)*math.sin(a),.53+j*.13,(r+spread*.3)*math.cos(a)),
                      ((r+spread*.3)*math.sin(a),.31+j*.08,(r+spread*.3)*math.cos(a))]
            m.mesh('stone' if j == 0 else 'bronze',vertices,
                   [(0,1,4),(0,4,2),(1,3,4),(4,3,2)])


def buddha():
    m=Model('buddha-sculpted')
    lotus(m,1.35)
    # Cross-legged silhouette; robe is an actual stepped profile with radial folds.
    m.orb('robe',0,.79,0,1.03,.39,.85,22,10)
    m.ring('robe',0,0,0,[(0,.68,.5),(.3,.79,.6),(.6,.69,.52),
                          (1.18,.56,.45),(1.62,.48,.38),(1.85,.25,.26)],.56,28)
    for i in range(13):
        a=math.tau*i/13
        m.branch('robe-light',(.72*math.sin(a),.71,.57*math.cos(a)),
                 (.41*math.sin(a+.2),1.72,.35*math.cos(a+.2)),.026,.009,5)
    for side in [-1,1]:
        m.orb('robe',side*.62,.79,.3,.52,.22,.42)
        m.branch('robe',(side*.57,2.08,.07),(side*.8,1.36,.38),.22,.16,10)
        m.branch('skin',(side*.8,1.36,.38),(side*.22,1.15,.73),.15,.11,9)
    m.orb('skin',0,1.16,.78,.41,.1,.15)
    m.branch('robe-light',(-.55,2.09,.39),(.42,.91,.74),.07,.045,8)
    m.branch('skin',(0,2.18,0),(0,2.47,0),.19,.17,12)
    m.orb('skin',0,2.82,.06,.47,.64,.42,22,12)
    for side in [-1,1]:
        m.orb('skin',side*.47,2.76,.05,.11,.27,.1)
        m.orb('hair',side*.19,2.91,.453,.055,.029,.025,8,5)
    m.orb('skin',0,2.75,.465,.075,.12,.085)
    m.branch('bronze',(-.13,2.57,.43),(.13,2.57,.43),.018,.018,8)
    m.ring('hair',0,0,0,[(0,.42,.39),(.12,.45,.42),(.3,.33,.3),(.44,.04,.04)],3.02,20)
    for j in range(3):
        for i in range(12-j*3):
            a=math.tau*(i+j*.5)/(12-j*3)
            m.orb('hair',(.41-j*.12)*math.sin(a),3.03+j*.18,
                  (.39-j*.11)*math.cos(a),.066,.07,.065,7,4)
    # Facial anatomy is kept in the same material buckets as the robe but sized
    # independently: an adult head is smaller than a game-character head.
    for vertices,_ in m.parts.values():
        for k,(x,y,z) in enumerate(vertices):
            if y>2.45:
                vertices[k]=(x*.78,2.45+(y-2.45)*.85,z*.79)
    return m.export(19000)


def guanyin():
    m=Model('guanyin-sculpted')
    lotus(m,1.04)
    m.ring('ivory',0,0,0,[(0,.7,.55),(.12,.74,.56),(.5,.64,.48),
                           (1.16,.47,.36),(1.55,.35,.33),(1.93,.34,.32)],.43,24)
    for i in range(16):
        a=math.tau*i/16
        m.branch('stone',(.7*math.sin(a),.54,.53*math.cos(a)),
                 (.32*math.sin(a+.1),2.3,.27*math.cos(a+.1)),.019,.006,5)
    for side in [-1,1]:
        m.branch('ivory',(side*.32,2.24,0),(side*.55,1.75,.27),.2,.15,10)
        m.branch('skin',(side*.55,1.75,.27),(side*.45,1.57,.55),.105,.09,9)
        m.orb('skin',side*.45,1.56,.55,.11,.12,.1)
    m.branch('gold',(-.38,2.24,.27),(.17,1.52,.48),.05,.035,8)
    m.orb('skin',0,2.52,.04,.42,.54,.38,20,11)
    for side in [-1,1]:
        m.orb('skin',side*.42,2.5,.02,.09,.22,.085)
        m.orb('hair',side*.17,2.62,.415,.042,.028,.02,8,4)
    m.orb('skin',0,2.46,.45,.064,.1,.065)
    m.branch('bronze',(-.12,2.32,.4),(.12,2.32,.4),.014,.014,7)
    m.ring('hair',0,0,0,[(0,.37,.35),(.24,.44,.41),(.41,.25,.25)],2.91,20)
    m.ring('ivory',0,0,0,[(0,.44,.41),(.16,.48,.45),(.39,.33,.32)],3.06,20)
    m.ring('gold',0,0,0,[(0,.44,.44),(.11,.48,.46),(.23,.29,.3)],3.11,20)
    for side in [-1,1]:
        m.branch('gold',(side*.38,3.23,.26),(side*.23,3.53,.16),.075,.015,6)
    m.orb('gold',0,3.42,.37,.12,.2,.07)
    m.orb('skin',0,3.48,.44,.045,.055,.04)
    # Vase in left hand, drooping willow cutting in right hand.
    m.ring('jade',.47,0,.58,[(0,.05,.05),(.08,.18,.18),(.28,.2,.2),
                              (.38,.095,.095),(.49,.1,.1)],1.57,12)
    m.branch('bark',(-.44,1.61,.56),(-.65,2.13,.63),.025,.01,6)
    for i in range(7):
        y=1.75+i*.055
        side=1 if i%2 else -1
        m.orb('leaf',-.55+side*.08,y,.64,.12,.045,.04,8,4)
    for vertices,_ in m.parts.values():
        for k,(x,y,z) in enumerate(vertices):
            if y>2.32:
                vertices[k]=(x*.81,2.32+(y-2.32)*.88,z*.81)
    return m.export(18000)


def pagoda():
    m=Model('bao-thap-blender')
    # Preserve walkable old base and door separately in Three.js; shell starts at y=.9.
    for floor in range(7):
        r=3.32-floor*.34
        y=.9+floor*2.5
        m.ring('stone',0,0,0,[(0,r,r),(1.45,r*.99,r*.99),
                              (1.56,r*1.02,r*1.02)],y,8,math.pi/8,entrance=floor==0)
        m.ring('stone-dark',0,0,0,[(0,r*1.01,r*1.01),(.12,r*1.06,r*1.06)],y+.05,8,math.pi/8)
        m.ring('tile',0,0,0,[(0,r*1.29,r*1.29),(.13,r*1.32,r*1.32),
                             (.36,r*1.08,r*1.08),(.85,r*.58,r*.58)],y+1.63,8,math.pi/8)
        m.ring('gold',0,0,0,[(0,r*1.30,r*1.30),(.07,r*1.30,r*1.30)],y+1.66,8,math.pi/8)
        for i in range(8):
            a=math.tau*(i+.5)/8
            m.branch('wood-dark',(r*.93*math.sin(a),y+.22,r*.93*math.cos(a)),
                     (r*.93*math.sin(a),y+1.42,r*.93*math.cos(a)),.09,.09,6)
            if floor:
                m.box('wood-dark',r*.3,y+.8,r*.95, r*.23,.66,.05)
    m.ring('gold',0,0,0,[(0,.55,.55),(.7,.35,.35),(1.9,.16,.16),
                          (2.6,.02,.02)],18.25,12)
    return m.export(24000)


def pavilion():
    m=Model('dinh-sen-blender')
    m.box('stone',0,.06,0,5.2,.12,5.2)
    m.box('wood',0,.145,0,4.6,.055,4.6)
    for x,z,w,d in [(0,-2.3,4.6,.14),(2.3,0,.14,4.6)]:
        m.box('wood',x,.48,z,w,.5,d)
    for x in [-1.9,1.9]:
        for z in [-1.9,1.9]:
            if (x,z)==(-1.9,1.9):continue
            m.box('stone',x,.26,z,.42,.16,.42)
            m.branch('wood',(x,.32,z),(x,2.94,z),.18,.16,10)
            m.box('gold',x,2.95,z,.55,.15,.55)
    for z in [-1.9,1.9]:
        m.box('wood',0,2.92,z,4.35,.28,.3)
    for x in [-1.9,1.9]:
        m.box('wood',x,2.92,0,.3,.28,4.35)
    for side in [-1,1]:
        for x in [-1.15,0,1.15]:
            m.branch('wood',(x,2.87,side*1.9),(x,3.42,side*.85),.09,.065,7)
    m.hip(6.4,6,3.08,1.6,.55)
    m.branch('gold',(0,4.68,0),(0,5.12,0),.11,.02,9)
    return m.export(9000)


def meditation_hall():
    m=Model('thien-duong-blender')
    # Local +Z is the entrance; the game rotates this house +90 degrees.
    # World floor must stay 11.6 X by 8.0 Z, so local dimensions are reversed.
    m.box('stone',0,.3,0,8.0,.6,11.6)
    for x in [-3.1,3.1]:
        for z in [-5.1,5.1]:
            m.box('stone',x,.72,z,.57,.24,.57)
            m.branch('wood',(x,.72,z),(x,3.73,z),.2,.18,12)
            m.box('gold',x,3.75,z,.65,.22,.65)
    m.box('plaster',0,2.1,-5.1,5.9,2.9,.2)
    for x in [-3.1,3.1]:
        for z in [-3.1,0,3.1]:
            m.box('plaster',x,1.45,z,.2,1.45,1.6)
            for offset in [-.35,0,.35]:
                m.box('wood-dark',x,2.7,z+offset,.13,1.15,.075)
    for z in [-5.1,5.1]:m.box('wood',0,3.82,z,6.8,.32,.36)
    for x in [-3.1,3.1]:m.box('wood',x,3.82,0,.36,.32,10.8)
    m.hip(8.2,12.6,4.0,1.9,.65)
    m.branch('gold',(0,5.9,0),(0,6.35,0),.11,.02,9)
    return m.export(14000)


def tree(name, pine=False):
    m=Model(name)
    m.branch('bark',(0,0,0),(.08,2.8,0),.32,.19,9)
    m.branch('bark',(.08,2.8,0),(.13,5.4,-.16),.19,.055,8)
    for i in range(12):
        a=i*2.39996
        h=1.7+(i%7)*.48
        reach=(1.6+(i%4)*.34)*(1 if not pine else .72)
        mid=(.16+math.sin(a)*reach*.55,h+.58,math.cos(a)*reach*.55)
        tip=(math.sin(a)*reach,h+1.04,math.cos(a)*reach)
        m.branch('bark',(.05,h-.3,0),mid,.12,.08,6)
        m.branch('bark',mid,tip,.08,.017,6)
        for j in range(3):
            t=.53+j*.22
            x=mid[0]+(tip[0]-mid[0])*t
            z=mid[2]+(tip[2]-mid[2])*t
            y=mid[1]+(tip[1]-mid[1])*t
            mat=('pine' if (i+j)%2 else 'pine-light') if pine else ('leaf' if (i+j)%2 else 'leaf-light')
            m.orb(mat,x,y,z,.55 if pine else .72,.75 if pine else .55,
                  .44 if pine else .62,9,5)
    return m.export(14000)


report=[buddha(),guanyin(),pagoda(),pavilion(),meditation_hall(),
        tree('oak-natural'),tree('pine-natural',True)]


def remodel_scan(source, target, target_triangles):
    bpy.ops.object.select_all(action='DESELECT')
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(OUT/(source+'.glb')))
    imported=[o for o in bpy.data.objects if o not in before]
    meshes=[o for o in imported if o.type == 'MESH']
    original=0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        original+=len(obj.data.loop_triangles)
    assert original > target_triangles, (source, original)
    for obj in meshes:
        modifier=obj.modifiers.new('Mobile sculpt retopology', 'DECIMATE')
        modifier.ratio=min(1, target_triangles / original)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    collection=bpy.data.collections.new(target+'-scan-remodel')
    bpy.context.scene.collection.children.link(collection)
    for obj in imported:
        for old in list(obj.users_collection):old.objects.unlink(obj)
        collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    count=0
    for obj in imported:
        obj.select_set(True)
        if obj.type=='MESH':
            obj.data.calc_loop_triangles()
            count+=len(obj.data.loop_triangles)
    assert count < target_triangles*1.05, (target,count)
    bpy.context.view_layer.objects.active=meshes[0]
    path=OUT/(target+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
                              export_yup=True,export_animations=False,export_cameras=False,
                              export_lights=False,export_image_format='AUTO')
    return {'name':target,'triangles':count,'source_triangles':original,
            'meshes':len(meshes),'bytes':path.stat().st_size,'source':source}


report[:2]=[remodel_scan('seated-buddha','buddha-sculpted',18000),
            remodel_scan('guanyin-ngoi','guanyin-sculpted',18000)]
# Source file preserves all separated, named collections at the game origin.
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'sacred-assets.blend'))
(SOURCE/'sacred-assets-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('SACRED_ASSETS_AUDIT',json.dumps(report))
