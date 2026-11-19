"""Build the three hall statues. Blender: --background --factory-startup --python-exit-code 1 --python tools/build-hall-statues-chibi.py

Optional arguments after --: one or more asset slugs, and --draft for faster previews.
Blender Z is up and -Y is front (glTF Y up and +Z front). The footprint sits at Z=0.
"""
import math
import sys
from array import array
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'public' / 'models'
SOURCES = ROOT / 'tools' / 'blender'
SHOTS = ROOT / 'shots'
TAU = math.tau


def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def linear(h):
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb(h))


def material(name, color, rough=.43, metal=0, transmission=0, sss=0, emission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    for key, value in {'Base Color': (*linear(color), 1), 'Roughness': rough, 'Metallic': metal,
                       'Transmission Weight': transmission, 'Subsurface Weight': sss,
                       'Subsurface Radius': (.6, .85, .55), 'Subsurface Scale': .11,
                       'Specular IOR Level': .50 if transmission else .34,
                       'Coat Weight': .16 if transmission else .07, 'Coat Roughness': .28,
                       'Emission Color': (*linear(color), 1), 'Emission Strength': emission}.items():
        p.inputs[key].default_value = value
    m.diffuse_color = (*linear(color), 1)
    m.roughness, m.metallic = rough, metal
    return m


def cat(a, b, c, d, t):
    return .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t*t
                 + (-a + 3 * b - 3 * c + d) * t*t*t)


def sample(points, steps=5):
    for i in range(len(points) - 1):
        controls = [points[max(i-1, 0)], points[i], points[i+1], points[min(i+2, len(points)-1)]]
        for j in range(steps):
            yield tuple(cat(*v, j / steps) for v in zip(*controls))
    yield points[-1]


class Part:
    def __init__(self, name, collection):
        self.name, self.collection = name, collection
        self.verts, self.faces, self.looks, self.slots, self.smooth, self.uvs = [], [], [], [], [], []

    def add(self, points, faces, mat, smooth=True, uvs=None):
        first = len(self.verts)
        self.verts.extend(points)
        if mat not in self.slots:
            self.slots.append(mat)
        index = self.slots.index(mat)
        for k, face in enumerate(faces):
            self.faces.append(tuple(first + v for v in face))
            self.looks.append(index)
            self.smooth.append(smooth)
            self.uvs.append(uvs[k] if uvs is not None else None)

    def finish(self, asset=False, pivot=None):
        mesh = bpy.data.meshes.new(self.name)
        if pivot is not None:
            self.verts = [tuple(v[i]-pivot[i] for i in range(3)) for v in self.verts]
        mesh.from_pydata(self.verts, [], self.faces)
        for mat in self.slots:
            mesh.materials.append(mat)
        for p, look, smooth in zip(mesh.polygons, self.looks, self.smooth):
            p.material_index, p.use_smooth = look, smooth
        if any(f is not None for f in self.uvs):
            uv = mesh.uv_layers.new(name='Painted face UV')
            for poly, face_uvs in zip(mesh.polygons, self.uvs):
                if face_uvs is not None:
                    for loop, coord in zip(poly.loop_indices, face_uvs):
                        uv.data[loop].uv = coord
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        self.collection.objects.link(obj)
        if pivot is not None:
            obj.location = pivot
        if asset:
            obj.asset_mark()
        return obj


def rings(part, rows, mat, smooth=True, cap=True, uv=False):
    n = len(rows[0])
    faces, uvs = [], []
    for j in range(len(rows)-1):
        for i in range(n):
            q = (i+1) % n
            faces.append((j*n+i, j*n+q, (j+1)*n+q, (j+1)*n+i))
            if uv:
                a, b, c, d = i/n, (i+1)/n, j/(len(rows)-1), (j+1)/(len(rows)-1)
                uvs.append(((a,c),(b,c),(b,d),(a,d)))
    if cap:
        faces.extend((tuple(range(n-1,-1,-1)), tuple(range((len(rows)-1)*n, len(rows)*n))))
        if uv:
            uvs.extend((None, None))
    part.add([p for row in rows for p in row], faces, mat, smooth, uvs if uv else None)


def orb(part, mat, center, size, n=28, m=16, paint=False):
    x, y, z = center
    rx, ry, rz = size
    rows = []
    for j in range(m+1):
        phi = math.pi * (j/m - .5) * .9995
        row = []
        for i in range(n):
            a = TAU * (i/n-.5)
            # A soft superellipse keeps full cheeks without adding nose or eye-socket geometry.
            c = math.cos(phi)**(.81 if paint else 1)
            row.append((x+rx*c*math.sin(a), y-ry*c*math.cos(a), z+rz*math.sin(phi)))
        rows.append(row)
    rings(part, rows, mat, uv=paint)


def lathe(part, mat, center, profile, n=56, shape=None, smooth=True, phase=0):
    x, y, z = center
    rows = []
    for j, (height, rx, ry) in enumerate(profile):
        row = []
        for i in range(n):
            a = phase + TAU * i/n
            sx, sy, dz = shape(a, j) if shape else (1, 1, 0)
            row.append((x+rx*sx*math.sin(a), y-ry*sy*math.cos(a), z+height+dz))
        rows.append(row)
    rings(part, rows, mat, smooth=smooth)


def tube(part, mat, points, sides=10, steps=5, side=(0, 1, 0), folds=None):
    # Profile: x, y, z, radius in the local normal plane, optional second radius.
    p = list(sample([(*v, v[-1]) if len(v) == 4 else v for v in points], steps))
    centers = [Vector(v[:3]) for v in p]
    rows = []
    for i, (co, v) in enumerate(zip(centers, p)):
        t = (centers[min(i+1,len(p)-1)] - centers[max(i-1,0)]).normalized()
        n = Vector(side)
        n = (n - t*t.dot(n)).normalized() if abs(t.dot(n)) < .995 else t.orthogonal().normalized()
        b = t.cross(n)
        row = []
        for k in range(sides):
            a = k*TAU/sides
            f = folds(i/(len(p)-1), a) if folds else 1
            row.append(co + f*(max(.0007,v[3])*math.cos(a)*n + max(.0007,v[4])*math.sin(a)*b))
        rows.append(row)
    rings(part, rows, mat)


def closed_line(part, mat, points, radius, sides=8):
    p = [Vector(v) for v in points]
    rows = []
    for i, co in enumerate(p):
        t = (p[(i+1)%len(p)] - p[(i-1)%len(p)]).normalized()
        n = Vector((0,0,1)) if abs(t.z)<.95 else Vector((0,1,0))
        n = (n - t*t.dot(n)).normalized()
        b = t.cross(n)
        rows.append([co + radius*(math.cos(k*TAU/sides)*n + math.sin(k*TAU/sides)*b)
                     for k in range(sides)])
    rings(part, [*rows, rows[0]], mat, cap=False)


def ellipse(part, mat, c, rx, rz, width):
    closed_line(part, mat, [(c[0]+rx*math.cos(i*TAU/64), c[1], c[2]+rz*math.sin(i*TAU/64))
                            for i in range(64)], width)


def panel(part, mat, contour, y, depth, bevel=.06):
    # Counterclockwise outline in the XZ plane; rounded shoulders on a solid extrusion.
    if sum(x*w-u*z for (x,z),(u,w) in zip(contour, contour[1:]+contour[:1])) < 0:
        contour = contour[::-1]
    cx, cz = [sum(v)/len(contour) for v in zip(*contour)]
    bands = [(y,.96), (y+bevel*.45,.993), (y+bevel,1), (y+depth-bevel,1), (y+depth,.96)]
    rows = [[(cx+(x-cx)*f, h, cz+(z-cz)*f) for x,z in contour] for h,f in bands]
    # The ring normals for an XZ outline point toward -Y, opposite the extrusion direction.
    rings(part, [r[::-1] for r in rows], mat)


def paint_face(base, blush, ink, mouth, medicine=False, mother=False, jade=False):
    name = 'Face | painted eyelids and smile'
    mat = material(name, base, .30 if jade else .43, transmission=.065 if jade else 0,
                   sss=.19 if jade else .09, emission=.035 if jade else 0)
    n = 512
    pixels = bytearray(bytes(round(c*255) for c in rgb(base)) * (n*n))
    if jade:
        # Bake faint cloudy jade variation into the same image as the facial lines.
        for j in range(n):
            for i in range(n):
                u,v = i/n,j/n
                d = round(2.8*math.sin(TAU*(5*u+2*v)+math.sin(TAU*3*v)) +
                          1.8*math.cos(TAU*(9*u-5*v)) + 1.2*math.sin(TAU*(13*u+4*v)))
                p = (j*n+i)*3
                for c in range(3):
                    pixels[p+c] += d

    def uv(x, z):
        ph = math.asin(z)
        return ((.5+math.asin(x/math.cos(ph)**.81)/TAU)*(n-1), (.5-ph/math.pi)*(n-1))

    def blend(i, j, color, f):
        p = (j*n+i)*3
        for channel, v in enumerate(color):
            pixels[p+channel] = round(pixels[p+channel]*(1-f) + v*f)

    def color(h):
        return tuple(c*255 for c in rgb(h))

    def spot(x, z, rx, ry, coat, strength):
        cx, cy = uv(x,z)
        for j in range(int(cy-3*ry), int(cy+3*ry)+1):
            for i in range(int(cx-3*rx), int(cx+3*rx)+1):
                a = math.exp(-.5*(((i-cx)/rx)**2+((j-cy)/ry)**2))*strength
                blend(i,j,coat,a)

    def stroke(points, coat, width):
        p = [(uv(x,z), w) for x,z,w in sample(points, 8)]
        for j in range(math.floor(min(v[0][1] for v in p)-4), math.ceil(max(v[0][1] for v in p)+4)):
            for i in range(math.floor(min(v[0][0] for v in p)-4), math.ceil(max(v[0][0] for v in p)+4)):
                alpha = 0
                for ((x,y),r), ((u,v),s) in zip(p,p[1:]):
                    dx, dy = u-x, v-y
                    t = min(1,max(0,((i-x)*dx+(j-y)*dy)/(dx*dx+dy*dy)))
                    distance = math.hypot(i-x-t*dx,j-y-t*dy)
                    alpha = max(alpha,min(1,max(0,width*(r+(s-r)*t)+.65-distance)))
                if alpha:
                    blend(i,j,coat,alpha)

    if medicine:
        for s in [-1,1]:
            spot(s*.65,-.44,10,10,color(blush),.46)
            spot(s*.44,-.11,8,5,color(blush),.18)
            stroke([(s*x,z,r) for x,z,r in [(.22,.11,.60),(.32,.143,.98),(.47,.14,1),
                                            (.59,.10,.75),(.66,.056,.12)]],color(ink),2.08)
            stroke([(s*x,z,r) for x,z,r in [(.23,-.23,.43),(.32,-.257,.87),(.42,-.265,1),
                                            (.54,-.240,1),(.62,-.195,.70),(.67,-.20,.18)]],color(ink),2.05)
        spot(0,-.55,5,3.6,color('e5a076'),.48)
        spot(0,-.51,4.2,2.7,color('ffd8ac'),.48)
        spot(0,-.75,5.8,3.2,color(mouth),.36)
        stroke([(-.20,-.665,.37),(-.115,-.705,.72),(0,-.722,.88),(.115,-.705,.72),(.20,-.665,.37)],
               color(mouth),1.64)
    elif jade:
        for s in [-1,1]:
            spot(s*.53,-.35,11,9,color(blush),.44)
            stroke([(s*x,z,r) for x,z,r in [(.23,.105,.46),(.33,.133,.79),(.46,.126,.86),
                                             (.57,.086,.60),(.65,.037,.12)]],color('829d6f'),1.75)
            stroke([(s*x,z,r) for x,z,r in [(.224,-.264,.35),(.325,-.302,.84),(.427,-.314,1),
                                             (.549,-.282,.88),(.633,-.233,.39)]],color(ink),2.24)
        spot(0,-.43,5.4,4.1,color('adc292'),.46)
        spot(.013,-.409,3.4,2.0,color('e5ebc7'),.53)
        stroke([(-.153,-.571,.36),(-.087,-.604,.82),(0,-.616,.92),(.087,-.604,.82),(.153,-.571,.36)],
               color(mouth),1.64)
    elif mother:
        for s in [-1,1]:
            spot(s*.59,-.36,8.7,8,color(blush),.68)
            spot(s*.48,-.31,5,3.4,color('ffc1a9'),.23)
            stroke([(s*x,z,r) for x,z,r in [(.215,-.156,.47),(.29,-.112,.91),(.402,-.098,1),
                                             (.502,-.121,.91),(.572,-.177,.39)]],color(ink),2.35)
        spot(0,-.36,4,3,color('d98d72'),.30)
        stroke([(-.173,-.465,.44),(-.104,-.506,.84),(0,-.528,1),(.104,-.506,.84),(.173,-.465,.44)],
               color(mouth),2.0)
    else:
        for sign in [-1,1]:
            spot(sign*.53,-.29,8,7,color(blush),.50)
            stroke([(sign*x,z,r) for x,z,r in [(.15,-.105,.55),(.227,-.026,.88),(.335,.007,1),
                                                (.45,-.022,.93),(.535,-.104,.45)]],color(ink),2.25)
        stroke([(-.146,-.37,.45),(-.081,-.416,.85),(0,-.433,1),(.081,-.416,.85),(.146,-.37,.45)],
               color(mouth),1.85)

    im = bpy.data.images.new(name, width=n, height=n, alpha=False)
    rgba = array('f')
    for j in range(n-1,-1,-1):
        for i in range(j*n*3,(j+1)*n*3,3):
            rgba.extend((pixels[i]/255,pixels[i+1]/255,pixels[i+2]/255,1.0))
    im.pixels.foreach_set(rgba)
    im.file_format = 'PNG'
    im.filepath_raw = '//face-painted.png'
    im.pack()
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.label, tex.image = 'Painted closed eyes, cheeks and mouth', im
    tex.location = (-330,300)
    mat.node_tree.links.new(tex.outputs['Color'], mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    return mat


def make_head(group, z, y, skin, painted, hair, gold, mother=False):
    face = Part('Face | painted porcelain' if not skin.name.startswith('Jade') else 'Face | pale jade', group)
    orb(face, painted, (0,y,z), (.494,.379,.399) if mother else (.475,.374,.429), 64, 40, paint=True)
    face.finish()
    anatomy = Part('Neck and short rounded ears', group)
    orb(anatomy, skin, (0,y+.02,z-.397), (.215,.194,.161))
    for s in [-1,1]:
        if mother:
            tube(anatomy,skin,[(s*.455,y+.015,z-.060,.027,.033),(s*.486,y+.014,z-.133,.062,.061),
                               (s*.471,y-.004,z-.267,.047,.052),(s*.420,y-.019,z-.370,.033,.038),
                               (s*.397,y-.020,z-.412,.009,.015)],16,5)
            orb(anatomy,gold,(s*.437,y-.054,z-.336),(.029,.020,.030),20,12)
            orb(anatomy,gold,(s*.423,y-.046,z-.375),(.017,.016,.022),16,10)
        else:
            tube(anatomy,skin,[(s*.422,y+.005,z-.018,.030,.034),(s*.464,y+.006,z-.105,.069,.065),
                               (s*.462,y-.003,z-.254,.054,.064),(s*.412,y-.022,z-.389,.042,.052),
                               (s*.396,y-.019,z-.435,.006,.011)],16,5,side=(0,1,0))
    anatomy.finish()
    cap = Part('Black swept hair and visible bun' if mother else 'Sculpted hair cap and ushnisha', group)
    rows = []
    for j in range(25):
        row = []
        for i in range(72):
            a = TAU*i/72
            front = (1+math.cos(a))/2
            if mother:
                low = -.75+1.37*front**3 + .12*math.sin(2*a)*front**2
            else:
                low = -.10+.63*front**2
            phi = low+(math.pi/2-.001-low)*(j/24)
            groove = .006 * math.cos((11 if mother else 23)*a + 2*phi)*math.sin(math.pi*j/24)
            c = math.cos(phi)**.81
            row.append((((.503 if mother else .482)+groove)*c*math.sin(a),
                        y-((.389 if mother else .382)+groove)*c*math.cos(a),
                        z+(.408 if mother else .436)*math.sin(phi)))
        rows.append(row)
    rings(cap, rows, hair, cap=False)
    if mother:
        orb(cap, hair, (.155,y+.186,z+.403),(.232,.212,.206),40,24)
        for i in range(3):
            u = i*.023
            tube(cap,hair,[(.034+u,y+.118,z+.568,.007),(.158+u,y+.060,z+.563,.012),
                           (.248+u,y+.046,z+.508,.011),(.303+u,y+.080,z+.444,.005)],10)
    else:
        orb(cap,hair,(0,y+.033,z+.414),(.171,.153,.126),36,22)
        orb(cap,gold,(0,y+.024,z+.497),(.119,.111,.107),36,22)
    cap.finish()


def trim_profile(part, mat, c, z, rx, ry, thickness):
    closed_line(part,mat,[(c[0]+rx*math.sin(TAU*i/64),c[1]-ry*math.cos(TAU*i/64),z)
                          for i in range(64)],thickness)


def bowl(group, center, medicine, m):
    part = Part('Lapis bowl, healing nectar and myrobalan' if medicine else 'Jade alms bowl',group)
    x,y,z = center
    r = 1 if medicine else .88
    profile = [(0,.093),(.021,.127),(.043,.163),(.079,.198),(.129,.224),(.167,.232),
               (.176,.222),(.17,.207),(.131,.193),(.103,.179),(.068,.137),(.059,.092),(.058,.006)]
    lathe(part,m['bowl'],center,[(h*r,w*r,w*r) for h,w in profile],56)
    trim_profile(part,m['gold'],(x,y),z+.168*r,.226*r,.226*r,.008)
    trim_profile(part,m['gold_dark'],(x,y),z+.031*r,.137*r,.137*r,.006)
    if medicine:
        lathe(part,m['nectar'],center,[(.145,.194,.194),(.161,.201,.201),(.168,.195,.195),
                                      (.168,.108,.108),(.168,.005,.005)],56)
        trim_profile(part,m['nectar_light'],(x-.028,y-.014),z+.170,.063,.056,.0025)
        tube(part,m['stem'],[(x-.183,y-.114,z+.173,.007),(x-.059,y-.045,z+.184,.010),
                             (x+.076,y+.063,z+.207,.010),(x+.190,y+.12,z+.228,.004)],10)
        for ox,oy,oz,dx,dy in [(-.077,-.052,.183,-.126,.049),(-.024,-.024,.199,-.014,-.121),
                                (.037,.015,.205,.023,.127),(.087,.055,.217,.117,-.056),
                                (.139,.099,.224,.079,.078)]:
            a = (x+ox,y+oy,z+oz)
            tube(part,m['leaf'],[(*a,.004,.004),(a[0]+dx*.44,a[1]+dy*.44,a[2]+.007,.029,.008),
                                 (a[0]+dx*.76,a[1]+dy*.76,a[2]+.017,.023,.008),
                                 (a[0]+dx,a[1]+dy,a[2]+.013,.001,.001)],12,4,(-dy,dx,0))
            tube(part,m['leaf_light'],[(a[0],a[1],a[2]+.006,.0028),
                                       (a[0]+dx*.48,a[1]+dy*.48,a[2]+.017,.003),
                                       (a[0]+dx*.88,a[1]+dy*.88,a[2]+.019,.001)],6,4)
    part.finish(pivot=center)


def medicine_buddha(group, m):
    pedestal = Part('Gilded octagonal base and lotus carving', group)
    lathe(pedestal,m['gold'],(0,0,0),[(0,.837,.595),(.015,.852,.61),(.042,.852,.61),
        (.058,.834,.594),(.066,.825,.586),(.174,.825,.586),(.192,.84,.604),
        (.218,.84,.604),(.238,.797,.576),(.248,.785,.566)],8,smooth=False,phase=math.pi/8)
    for i in range(8):
        a = TAU*i/8
        pl = lambda u,z,offset=0: (.831*math.cos(math.pi/8)*math.sin(a)+u*math.cos(a)+offset*math.sin(a),
                                   -.591*math.cos(math.pi/8)*math.cos(a)+u*math.sin(a)-offset*math.cos(a),z)
        half = .955 * math.sin(math.pi/8) * math.hypot(.825*math.cos(a),.586*math.sin(a))
        outline = [pl(u,z,.009) for u,z in [(-half,.069),(half,.069),(half,.173),(-half,.173)]]
        closed_line(pedestal,m['gold_dark'],outline,.004,8)
        for s in [-1,1]:
            tube(pedestal,m['gold_light'],[(*pl(s*u,z,.011),r) for u,z,r in
                [(0,.097,.004),(.037,.102,.006),(.052,.126,.01),(.035,.132,.008),(.016,.145,.003)]],8)
            tube(pedestal,m['gold_light'],[(*pl(s*u,z,.012),r) for u,z,r in
                [(.093,.107,.003),(.122,.096,.006),(.146,.102,.005),(.163,.096,.002)]],8)
        tube(pedestal,m['gold_light'],[(*pl(u,z,.015),r) for u,z,r in
                [(0,.102,.008),(0,.121,.017),(0,.145,.013),(0,.165,.002)]],10)
    lathe(pedestal,m['gold'],(0,0,.228),[(0,.69,.49),(.062,.72,.51),(.113,.691,.49),
        (.218,.716,.52),(.336,.752,.552),(.373,.771,.561),(.395,.749,.545),(.42,.69,.50)],80)
    trim_profile(pedestal,m['gold_light'],(0,0),.61,.757,.55,.013)
    for count,phase,z,profile in [
            (13,.5,.238,[(.44,.087,.017,.015),(.53,.051,.113,.031),(.65,.030,.136,.040),(.73,.036,.087,.033),(.758,.058,.004,.006)]),
            (13,0,.337,[(.49,0,.022,.028),(.63,.032,.117,.065),(.723,.106,.138,.076),(.768,.213,.106,.049),(.767,.284,.009,.008)])]:
        for i in range(count):
            a = TAU*(i+phase)/count
            co = lambda d,h: (d*math.sin(a),-.734*d*math.cos(a),z+h)
            side = (math.cos(a),math.sin(a),0)
            tube(pedestal,m['petals'][i%3],[(*co(d,h),w,t) for d,h,w,t in profile],20,6,side,
                 lambda u,v: 1+.022*math.sin(math.pi*u)*math.cos(12*v))
    pedestal.finish(asset=True)

    head = Part('Rounded cheeks and painted expression', group)
    hx,hy,hz = .414,-.044,2.115
    orb(head,m['paint'],(0,hy,hz),(hx,.344,.402),72,48,paint=True)
    orb(head,m['skin'],(0,.0,1.731),(.181,.19,.143))
    for s in [-1,1]:
        tube(head,m['skin'],[(s*.353,.014,2.10,.016,.02),(s*.413,-.032,2.107,.075,.069),
            (s*.421,-.035,2.038,.077,.060),(s*.393,-.033,1.953,.048,.058),
            (s*.382,-.036,1.907,.049,.054),(s*.38,-.036,1.878,.013,.017)],24,8)
    head.finish()
    hair = Part('Swept midnight hair and soft topknot', group)
    hair_rows = []
    for j in range(31):
        row = []
        u = j/30
        for i in range(96):
            a = TAU*i/96
            front = max(0,min(1,(math.cos(a)-.18)/.58))
            low = -.55 + 1.16*front*front*(3-2*front) - .10*math.exp(-(math.sin(a)/.34)**2)*front
            phi = low+(math.pi/2-.0008-low)*u
            cr = math.cos(phi)**.81
            ripple = (.006*math.cos(15*a+2.3*math.sin(phi)) + .003*math.cos(9*a-5*u))*math.sin(math.pi*u)**1.25
            row.append(((hx+.014+ripple)*cr*math.sin(a),hy-(.360+ripple)*cr*math.cos(a),hz+(.420+ripple)*math.sin(phi)))
        hair_rows.append(row)
    rings(hair,hair_rows,m['hair'],cap=False)
    lathe(hair,m['hair'],(0,.018,2.448),list(sample([(0,.116,.091),(.025,.158,.113),
          (.067,.166,.128),(.118,.149,.117),(.161,.109,.091),(.186,.044,.039),(.191,.001,.001)],5)),64,
          lambda a,j: (1+.029*math.cos(a*9),1+.029*math.cos(a*9),0))
    hair.finish()

    halo = Part('Open gold halo with engraved rim', group)
    center, radius = (0,.29,2.327), .646
    ellipse(halo,m['gold'],center,radius,radius,.014)
    ellipse(halo,m['gold_light'],(0,.281,center[2]),radius-.009,radius-.009,.006)
    ellipse(halo,m['gold_dark'],(0,.284,center[2]),radius-.023,radius-.023,.005)
    for i in range(160):
        a = TAU*i/160
        p = ((radius-.016)*math.cos(a),.277,center[2]+(radius-.016)*math.sin(a))
        orb(halo,m['gold_light'],p,(.0032,.002,.0032),8,6)
    halo.finish(asset=True,pivot=center)

    robe = Part('Lapis silk | closed lotus drape, deep sleeves and embroidered binding',group)
    # Shape the knees and folds into the cloth surface, not as separate strips pasted on top.
    lap = list(sample([(.612,.59,.412),(.642,.667,.468),(.687,.711,.50),(.788,.751,.532),
        (.887,.733,.548),(.971,.665,.532),(1.047,.526,.45),(1.105,.368,.35),(1.128,.265,.27)],6))
    drape = lambda a: math.cos(3*a-.12)+.48*math.cos(9*a+.56)
    def panel_depth(a,z):
        theta = (a+math.pi)%TAU-math.pi
        middle = .041*math.sin(9*z)
        width = .45-.10*math.exp(-((z-.91)/.17)**2)
        q = (theta-middle)/width
        vertical = math.exp(-((z-.84)/.24)**4)
        center = math.exp(-q**6)*(.105+.032*math.cos(29*(z-.71)+.75*q*q))
        seam = -.038*math.exp(-((abs(q)-.99)/.16)**2)
        return (center+seam)*vertical
    def lap_folds(a,j):
        z = lap[j][0]
        view = max(0,math.cos(a))**2
        c = math.cos(2*a)
        hem = math.exp(-((z-.638)/.065)**2) * drape(a)
        rib = .73*math.cos(26*(z-.76)+4*c)+.27*math.cos(50*(z-.7)+6*c)
        rx = 1+.024*hem+.047*view*math.sin(a)**2*rib
        knee = .13 * math.exp(-((abs(math.sin(a))-.59)/.23)**2-((z-.852)/.153)**2)
        ry = 1+knee+.063*view*(1-c)+.082*view*(.55+c*.36)*rib+.042*hem+panel_depth(a,z)
        return rx,ry,.024*hem
    lathe(robe,m['robe'],(0,0,0),lap,100,lap_folds)
    binding = []
    for i in range(100):
        a = TAU*i/100
        j = min(range(len(lap)),key=lambda q: abs(lap[q][0]-.647))
        z,rx,ry = lap[j]
        fx,fy,dz = lap_folds(a,j)
        binding.append((1.008*rx*fx*math.sin(a),-1.012*ry*fy*math.cos(a),z+dz+.001))
    closed_line(robe,m['gold'],binding,.008)
    for i in range(-7,8):
        trace = []
        for q in range(15):
            a = i*.145+.096*q/14
            j = min(range(len(lap)),key=lambda r: abs(lap[r][0]-(.675+.014*math.sin(TAU*q/14))))
            z,rx,ry = lap[j]; fx,fy,dz = lap_folds(a,j)
            trace.append((rx*fx*math.sin(a),-ry*fy*math.cos(a)-.004,z+dz,.0018))
        tube(robe,m['gold_light'],trace,6,1)
    torso = list(sample([(1.00,.23,.248),(1.095,.34,.277),(1.252,.389,.281),(1.41,.386,.261),
        (1.551,.359,.233),(1.652,.29,.196),(1.706,.194,.168),(1.714,.147,.147)],6))
    lathe(robe,m['robe'],(0,.041,0),torso,88,
          lambda a,j: (1,1+.025*math.cos(5*a-j*.09)*math.sin(math.pi*j/(len(torso)-1)),0))
    for s in [-1,1]:
        tube(robe,m['robe'],[(s*.149,.037,1.582,.135,.096),(s*.294,.008,1.544,.155,.141),
            (s*.389,-.065,1.445,.157,.160),(s*.433,-.176,1.295,.160,.152),
            (s*.443,-.29,1.192,.144,.139),(s*.371,-.404,1.134,.117,.097),
            (s*.301,-.443,1.143,.091,.075),(s*.258,-.449,1.153,.076,.060)],32,9,
            folds=lambda u,a: 1 + .045*math.sin(u*29+2.5*math.cos(a))*math.sin(math.pi*u)**.8)
        c = Vector((s*.267,-.448,1.153)); b = Vector((s*.145,-.99,0))
        closed_line(robe,m['gold'],[c + .074*math.cos(TAU*i/40)*b + Vector((0,0,.061*math.sin(TAU*i/40)))
                                   for i in range(40)],.0055)

    paths = [[(-.174,-.105,1.715),(-.155,-.163,1.667),(-.098,-.208,1.568),(-.021,-.229,1.501)],
             [(.179,-.108,1.718),(.155,-.168,1.667),(.10,-.211,1.57),(.00,-.239,1.471),(-.124,-.249,1.397),
              (-.245,-.240,1.333),(-.344,-.202,1.286)]]
    # Small gilt vine motifs are decorative geometry, never lettering.
    for k,path in enumerate(paths):
        curve = [Vector(v) for v in sample(path,12)]
        w = .031 if k else .027
        side = lambda i: Vector((curve[max(0,i-1)].z-curve[min(i+1,len(curve)-1)].z,0,
                                  curve[min(i+1,len(curve)-1)].x-curve[max(0,i-1)].x)).normalized()
        tube(robe,m['binding'],[(*p,w,.016) for p in path],14,7,side=(.8,0,-.6))
        for s in [-1,1]:
            tube(robe,m['gold'],[(*(p+s*w*.85*side(i)+Vector((0,-.014,0))),.0055)
                 for i,p in enumerate(curve)],8,1)
        for q in range(4,len(curve)-5,6):
            p=curve[q]+Vector((0,-.019,0)); b=side(q)
            motif=[p+.027*(j/12-0.5)*(curve[q+1]-curve[q-1]).normalized()
                   +.008*math.sin(TAU*j/12)*b for j in range(13)]
            tube(robe,m['gold_light'],[(*v,.0019) for v in motif],6,1)
    robe.finish()

    hands = Part('Both hands cradle the lapis bowl',group)
    for s in [-1,1]:
        tube(hands,m['skin'],[(s*.277,-.461,1.154,.059,.052),(s*.244,-.494,1.148,.070,.051),
            (s*.194,-.531,1.132,.064,.049),(s*.132,-.559,1.115,.051,.043),
            (s*.069,-.567,1.121,.035,.028),(s*.042,-.557,1.128,.018,.014)],24,7)
        for i in range(3):
            tube(hands,m['skin'],[(s*(.161-i*.014),-.553-i*.008,1.108+i*.016,.023),
                (s*(.097-i*.010),-.583-i*.002,1.103+i*.016,.025-i*.002),
                (s*(.055-i*.012),-.588+i*.006,1.117+i*.011,.019-i*.002),
                (s*(.043-i*.008),-.579+i*.006,1.124+i*.012,.007)],12,5)
        tube(hands,m['skin'],[(s*.242,-.49,1.16,.04),(s*.211,-.542,1.187,.04),
            (s*.177,-.567,1.204,.033),(s*.151,-.559,1.203,.016)],20,7)
        orb(hands,m['nail'],(s*.171,-.59,1.207),(.013,.0047,.011),16,12)
    hands.finish()
    bowl(group,(0,-.439,1.098),True,m)
    light = Part('Warm nectar glints', group)
    for i in range(24):
        t = (i+.5)/24
        a = i*2.399963
        r = .16*(1-.65*t)
        size = .0017+.005*(1-t)*(math.sin(a)**2)
        orb(light,m['nectar_light'],(r*math.sin(a),-.439+r*.8*math.cos(a),1.28+t*.155),
            (size,size,size),8,6)
    light.finish()


def jade_buddha(group, m):
    pedestal = Part('Jade plinth | double white lotus with gilded petal rims',group)
    lathe(pedestal,m['base'],(0,0,0),[(0,.557,.385),(.007,.588,.410),(.023,.605,.424),
         (.055,.603,.424),(.074,.58,.403),(.095,.527,.365)],80)
    for h,w,d,r in [(.017,.599,.42,.006),(.066,.591,.416,.008)]:
        trim_profile(pedestal,m['gold'],(0,0),h,w,d,r)
    lathe(pedestal,m['petals'][0],(0,0,0),list(sample([
        (.058,.513,.342),(.096,.523,.358),(.162,.489,.333),(.213,.432,.294),
        (.267,.455,.320),(.364,.55,.382),(.437,.574,.405),(.483,.546,.390),(.491,.507,.370)],4)),80)

    # Each petal has a convex white face and an edge that follows its entire curved silhouette.
    for count,phase,profile in [
        (12,0,[(.360,.230,.007,.012),(.418,.207,.075,.032),(.509,.157,.125,.046),
               (.561,.109,.096,.034),(.61,.089,.004,.004)]),
        (13,0,[(.396,.231,.012,.013),(.467,.263,.092,.048),(.534,.329,.131,.063),
               (.582,.405,.088,.046),(.605,.462,.004,.004)])]:
        for i in range(count):
            a = TAU*(i+phase)/count
            point = lambda d,z,w=0: (d*math.sin(a)+w*math.cos(a),-.70*d*math.cos(a)+w*math.sin(a),z)
            tube(pedestal,m['petals'][i%len(m['petals'])],[(*point(d,z),w,t) for d,z,w,t in profile],20,6,
                 (math.cos(a),math.sin(a),0))
            outline = list(sample(profile,6))
            edge = [point(d,z,s*w) for s,rows in [(1,outline),(-1,outline[::-1])] for d,z,w,_ in rows]
            closed_line(pedestal,m['petal_green'],edge,.011)
            closed_line(pedestal,m['gold'],[(x+.010*math.sin(a),y-.010*math.cos(a),z+.002) for x,y,z in edge],.006)
    pedestal.finish(asset=True)

    halo = Part('Thin open gold halo',group)
    orbit = [[((.515+.014*math.cos(b))*math.sin(a),.332-.014*math.sin(b),
               1.970+(.515+.014*math.cos(b))*math.cos(a))
              for j in range(12) for b in [TAU*j/12]] for i in range(128) for a in [TAU*i/128]]
    rings(halo,[*orbit,orbit[0]],m['gold'],cap=False)
    halo.finish(asset=True,pivot=(0,.332,1.970))

    face = Part('Pale jade head | painted closed eyes and smile',group)
    rows = []
    for j in range(57):
        phi = math.pi*(j/56-.5)*.9995
        c = math.cos(phi)**(.63 if phi < 0 else .87)
        row = []
        cheek = 1+.032*math.exp(-((phi+.43)/.36)**2)
        for i in range(96):
            a = TAU*(i/96-.5)
            row.append((.421*c*cheek*math.sin(a),.013-.353*c*math.cos(a),1.784+.438*math.sin(phi)))
        rows.append(row)
    rings(face,rows,m['paint'],uv=True)
    face.finish()

    anatomy = Part('Jade neck and short sculpted earlobes',group)
    orb(anatomy,m['skin'],(0,-.003,1.327),(.156,.123,.120),36,22)
    for s in [-1,1]:
        ear = list(sample([(.398,-.021,1.324,.003,.004),(.411,-.027,1.342,.041,.036),
                           (.413,-.021,1.384,.053,.049),(.418,-.016,1.464,.043,.056),
                           (.459,-.023,1.582,.066,.070),(.469,-.016,1.665,.061,.058),
                           (.450,-.003,1.703,.033,.034),(.436,.009,1.719,.004,.005)],5))
        rows = []
        for j,(x,y,z,rx,ry) in enumerate(ear):
            row = []
            for i in range(40):
                a = TAU*i/40
                hollow = .043*math.exp(-((j/(len(ear)-1)-.72)/.22)**2)*max(0,math.cos(a-.23*s))**7
                row.append((s*x+rx*math.sin(a),y-ry*math.cos(a)+hollow,z))
            rows.append(row)
        rings(anatomy,rows,m['skin'])
    anatomy.finish()

    jewel = Part('Small gold ushnisha',group)
    lathe(jewel,m['gold'],(0,.034,2.207),[(0,.117,.095),(.012,.133,.108),(.024,.133,.108),(.034,.122,.100)],64)
    orb(jewel,m['gold'],(0,.034,2.258),(.093,.082,.084),40,24)
    jewel.finish()

    robe = Part('Deep emerald robe | closed lotus pose and gold-bound drape',group)
    profile = list(sample([(.478,.461,.322,-.016),(.503,.535,.376,-.018),(.556,.558,.402,-.014),
        (.650,.551,.416,-.011),(.747,.522,.399,-.009),(.829,.445,.334,-.007),(.879,.349,.270,.002),
        (.963,.331,.241,.009),(1.072,.348,.254,.009),(1.177,.356,.247,.013),
        (1.268,.293,.209,.006),(1.337,.209,.166,-.005),(1.359,.156,.133,-.011)],6))

    def fabric(a,row):
        z,rx,ry,y = row
        sn,cs = math.sin(a),math.cos(a)
        lap = math.exp(-((z-.674)/.171)**4)*max(0,cs)**.6
        knee = .69*math.exp(-((abs(sn)-.68)/.29)**2)-.29*math.exp(-(sn/.39)**2)
        fold = lap*(knee*.10+.013*math.cos(47*(z-.568-.225*sn*sn)+.6*sn))
        hem = math.exp(-((z-.502)/.035)**2)*(.004+.009*math.cos(9*a+.7)+.005*math.cos(5*a-.8))
        return (sn*rx,y-cs*ry-fold,z+hem)

    rings(robe,[[fabric(TAU*i/120,row) for i in range(120)] for row in profile],m['robe'])
    closed_line(robe,m['gold'],[fabric(TAU*i/120,profile[5]) for i in range(120)],.0065)

    def front(x,z):
        z = max(profile[0][0],min(profile[-1][0],z))
        for a,b in zip(profile,profile[1:]):
            if a[0] <= z <= b[0]:
                t = (z-a[0])/(b[0]-a[0])
                row = tuple(u+(v-u)*t for u,v in zip(a,b))
                phi = math.asin(max(-.998,min(.998,x/row[1])))
                return fabric(phi,row)[1]
        return -.15

    def binding(path, width):
        centers = list(sample(path,8))
        borders = [[],[]]
        for i,(x,z) in enumerate(centers):
            ax,az = centers[max(i-1,0)]
            bx,bz = centers[min(i+1,len(centers)-1)]
            n = Vector((bz-az,ax-bx)).normalized()*width*.5
            for s,edge in zip((-1,1),borders):
                px,pz = x+s*n.x,z+s*n.y
                edge.append((px,front(px,pz)-.007,pz))
        n = len(centers)
        robe.add(borders[0]+borders[1],[(i,i+n,i+n+1,i+1) for i in range(n-1)],m['binding'])
        for edge in borders:
            tube(robe,m['gold'],[(*p,.0046) for p in edge],8,1)

    # The jade chest inset and the two bands form the overlapping V-neck.
    chest = list(sample([(1.106,.015,.003),(1.139,.010,.052),(1.199,.004,.100),
                         (1.265,0,.130),(1.330,0,.151),(1.360,0,.140)],5))
    rows = []
    for z,x,w in chest:
        rows.append([(px,front(px,z)-.005-.007*(1-u*u),z)
                     for i in range(17) for u in [2*i/16-1] for px in [x+w*u]])
    robe.add([p for row in rows for p in row],[(i,i+1,i+18,i+17) for j in range(len(rows)-1)
             for k in range(16) for i in [17*j+k]],m['skin'])
    binding([(-.164,1.317),(-.145,1.226),(-.115,1.163),(-.054,1.105),(.008,1.077)],.041)
    binding([(.172,1.320),(.152,1.222),(.104,1.146),(.025,1.079),(-.095,1.033),(-.246,.991)],.055)
    binding([(.244,.811),(.207,.691),(.163,.602),(.087,.546),(-.003,.520),(-.097,.511)],.033)

    for s in [-1,1]:
        cuff = Vector((s*.216,-.349,.875))
        pts = [(s*.211,.008,1.283,.103,.119),(s*.332,-.007,1.216,.130,.133),
               (s*.397,-.073,1.107,.147,.139),(s*.423,-.156,.992,.142,.142),
               (s*.360,-.265,.897,.115,.103),(*cuff,.082,.076)]
        axis = (cuff-Vector(pts[-2][:3])).normalized()
        n = (Vector((0,0,1))-axis*axis.z).normalized()
        b = axis.cross(n)
        tube(robe,m['robe'],pts,40,9,(0,0,1),
             lambda t,a: 1+.034*math.sin(math.pi*t)*math.cos(5*a-2*t))
        closed_line(robe,m['gold'],[cuff+n*(.082*math.cos(a))+b*(.076*math.sin(a))
                    for i in range(56) for a in [TAU*i/56]],.0065)
    robe.finish()

    hands = Part('Dhyana | right palm over left and touching thumbs',group)
    # Blender -X is the statue's right as seen from the front. Only palms and thumbs use skin here.
    for side,h,tip in [(1,.821,-.064),(-1,.854,.075)]:
        tube(hands,m['skin'],[(side*.244,-.329,.866,.057,.051),(side*.184,-.393,h+.016,.073,.055),
            (side*.108,-.438,h,.071,.053),(side*.034,-.466,h-.005,.059,.039),
            (tip,-.474,h+.007,.035,.026),(tip-side*.021,-.463,h+.020,.013,.013)],28,8)
        tube(hands,m['skin'],[(side*.162,-.418,h+.024,.032),(side*.119,-.464,.885,.035),
            (side*.075,-.500,.911,.031),(side*.034,-.509,.923,.023),(side*.003,-.508,.924,.011)],20,7)
    hands.finish()

    bowl = Part('Small hollow jade alms bowl',group)
    lathe(bowl,m['bowl'],(0,-.386,.856),list(sample([
        (0,.078,.078),(.013,.096,.096),(.045,.132,.131),(.081,.147,.146),(.113,.136,.135),
        (.132,.121,.120),(.146,.123,.122),(.153,.114,.113),(.144,.103,.102),
        (.118,.110,.109),(.083,.119,.118),(.051,.106,.105),(.035,.065,.064),(.033,.005,.005)],4)),64)
    bowl.finish()


def phoenix(part, place, m, size=1, flip=1):
    # Rounded feather strokes in front view. The same motif reads as thread at one scale and relief at another.
    def draw(path, material=None):
        tube(part,material or m['gold'],[(*place(flip*x*size,z*size),r*size) for x,z,r in path],8,5)

    draw([(-.14,-.133,.006),(-.096,-.088,.023),(-.025,-.057,.039),(.061,-.018,.035),
          (.096,.045,.023),(.079,.132,.018),(.115,.175,.024),(.153,.177,.018),(.19,.155,.004)])
    draw([(.108,.173,.008),(.077,.216,.012),(.111,.243,.010),(.148,.241,.002)],m['gold_light'])
    for i in range(5):
        f = i*.038
        draw([(.022,-.048+i*.008,.011),(-.102,-.023+f*.66,.016),(-.228-f*.48,.019+f,.018),
              (-.298-f*.46,.086+f,.014),(-.274-f*.40,.125+f,.003)],m['gold_light'] if i%2==0 else m['gold'])
    for i in range(4):
        f = i*.042
        draw([(-.096,-.096,.010),(-.215,-.112+f*.25,.013),(-.348+f*.30,-.161-f*.44,.014),
              (-.301+f*.50,-.221-f*.52,.010),(-.202+f*.75,-.224-f*.49,.003)])
    draw([(-.061,-.080,.010),(.071,-.086,.014),(.152,-.054,.013),(.184,.006,.003)],m['gold_light'])


def throne(group,m):
    throne_mesh = Part('Phoenix throne | single reusable mesh',group)
    t = throne_mesh
    # Broad plinth makes the whole chair sit firmly, independent of the figure.
    for mat, z, h, sx, sy in [(m['gold_dark'],0,.103,.948,.605),(m['gold'],.030,.078,.967,.617),
                               (m['gold_light'],.076,.031,.955,.606),(m['gold'],.393,.125,.871,.473),
                               (m['gold_dark'],.484,.091,.824,.446)]:
        lathe(t,mat,(0,.071,z),[(0,sx*.92,sy*.92),(.022,sx,sy),(.046,sx,sy),(h,sx*.94,sy*.94)],32)
    orb(t,m['cushion'],(0,.035,.566),(.80,.445,.105),42,18)
    for s in [-1,1]:
        orb(t,m['gold_dark'],(s*.715,.42,.277),(.133,.151,.22))
        tube(t,m['gold'],[(s*.749,-.29,.099,.161,.133),(s*.750,-.273,.16,.153,.142),
                           (s*.733,-.203,.318,.113,.110),(s*.758,-.229,.465,.117,.128),(s*.808,-.265,.622,.116),
                           (s*.865,-.286,.798,.123),(s*.881,-.286,.927,.128),
                           (s*.845,-.189,.973,.119),(s*.791,.073,1.001,.116),
                           (s*.746,.352,1.053,.117),(s*.708,.454,1.086,.102)],22,7)
        # Open scroll over the rounded front of each armrest.
        tube(t,m['gold_light'],[(s*.766,-.338,.590,.008),(s*.863,-.381,.696,.020),
                                (s*.965,-.391,.850,.024),(s*.916,-.414,.949,.023),
                                (s*.848,-.414,.920,.020),(s*.857,-.417,.872,.017),
                                (s*.896,-.419,.884,.006)],12,6)
    out = [(-.763,.44),(-.871,.68),(-.900,1.32),(-.907,1.78),(-.869,2.047),
           (-.845,2.181),(-.760,2.298),(-.610,2.314),(-.468,2.388),(-.347,2.485),
           (-.186,2.532),(0,2.655),(.186,2.532),(.347,2.485),(.468,2.388),(.610,2.314),
           (.760,2.298),(.845,2.181),(.869,2.047),(.907,1.78),(.900,1.32),(.871,.68),(.763,.44)]
    loop = list(sample([out[-1],*out,out[0],out[1]],5))[5:5+len(out)*5]
    panel(t,m['gold'],loop,.424,.238,.067)
    inset = [(x*.912,1.52+(z-1.52)*.914) for x,z in loop]
    panel(t,m['gold_dark'],inset,.400,.045,.02)
    inner = [(x*.951,1.52+(z-1.52)*.958) for x,z in inset]
    panel(t,m['throne_inlay'],inner,.381,.041,.016)
    closed_line(t,m['gold_light'],[(x,.366,z) for x,z in inner],.015)
    for s in [-1,1]:
        phoenix(t,lambda x,z: (s*.620+x,.348,1.914+z+x*s*.42),m,.73,s)
        for i in range(4):
            z = 1.16+i*.132
            tube(t,m['gold_light'],[(s*.637,.354,z,.005),(s*.669,.347,z+.032,.013),
                                     (s*.734,.346,z+.064,.016),(s*.789,.349,z+.132,.004)],10)
    throne_mesh.finish(asset=True,pivot=(0,0,0))


def crown(group,m):
    part = Part('Rounded golden crown | phoenix wing finials',group)
    front = [(-.309,2.282),(-.312,2.348),(-.216,2.371),(-.137,2.367),(-.073,2.430),
             (0,2.454),(.073,2.430),(.137,2.367),(.216,2.371),(.312,2.348),(.309,2.282),
             (.209,2.292),(0,2.299),(-.209,2.292)]
    loop = list(sample([front[-1],*front,front[0],front[1]],5))[5:5+len(front)*5]
    panel(part,m['gold'],loop,-.295,.122,.036)
    tube(part,m['gold_dark'],[(-.30,-.296,2.294,.008),(-.22,-.305,2.307,.011),(0,-.311,2.317,.014),
                              (.22,-.305,2.307,.011),(.30,-.296,2.294,.008)],12,6)
    orb(part,m['gold_light'],(0,-.294,2.389),(.050,.030,.051),24,16)
    orb(part,m['crown_red'],(0,-.326,2.389),(.027,.015,.033),24,16)
    for s in [-1,1]:
        for i in range(3):
            u = i*.041
            tube(part,m['gold_light'] if i==2 else m['gold'],[(s*.233,-.296,2.315+i*.013,.014),
                 (s*(.328+u*.36),-.280,2.333+u*.47,.029),
                 (s*(.402+u*.46),-.245,2.365+u*.61,.026),
                 (s*(.429+u*.32),-.188,2.404+u*.64,.004)],14,6)
        for i in range(3):
            orb(part,m['gold_light'],(s*(.086+i*.066),-.302,2.342),(.012,.010,.012),12,8)
    part.finish()


def blossom(group,m):
    p = Part('Pink lotus | right-hand offering',group)
    tube(p,m['stem'],[(-.452,-.555,1.083,.012),(-.455,-.580,1.185,.017),
                        (-.405,-.576,1.298,.013),(-.426,-.595,1.422,.011)],12)
    for s in [-1,1]:
        tube(p,m['leaf'],[(-.423,-.578,1.255,.007),(-.423+s*.053,-.580,1.286,.014,.028),
                            (-.423+s*.09,-.58,1.327,.01,.019),(-.423+s*.110,-.577,1.35,.003)],12)
    x,y,z = -.426,-.593,1.426
    for tier,(count, radius,h,w) in enumerate([(8,.177,.115,.067),(7,.118,.158,.053),(5,.060,.181,.04)]):
        for i in range(count):
            a = TAU*(i+tier*.5)/count
            radial = Vector((math.sin(a),math.cos(a),0))
            side = (-math.cos(a),math.sin(a),0)
            tube(p,m['flower'][tier],[(*(Vector((x,y,z))+radial*radius*f+Vector((0,0,h*g))),w*k,w*b)
                 for f,g,k,b in [(0,0,.23,.22),(.32,.18,.81,.42),(.75,.47,1,.53),(1,.76,.64,.42),(.95,1,.045,.065)]],
                 12,5,side)
    orb(p,m['gold_light'],(x,y,z+.107),(.057,.055,.041),24,14)
    p.finish(pivot=(x,y,z))


def fan(group,m):
    p = Part('Small folding golden fan',group)
    x,y,z = (.862,-.393,.994)

    def pt(a,r,depth=0):
        return (x+math.sin(a)*r,y+depth+.26*math.sin(a)*r,z+math.cos(a)*r)

    angles = [-.73+1.52*i/36 for i in range(37)]
    # Double-sided fan panel with alternating folded paper facets.
    for i in range(len(angles)-1):
        a,b = angles[i:i+2]
        d,e = (-.014 if i%4<2 else -.002),(-.014 if (i+1)%4<2 else -.002)
        verts=[pt(a,.035,d),pt(a,.287,d),pt(b,.287,e),pt(b,.035,e)]
        p.add(verts+[(u,v+.012,w) for u,v,w in verts],[(3,2,1,0),(4,5,6,7),(1,2,6,5)],
              m['gold_light'] if i%4<2 else m['gold'],False)
    tube(p,m['gold_dark'],[(*pt(a,.288,-.009),.008) for a in angles[::2]],8,2)
    for a in angles[::4]:
        tube(p,m['gold_dark'],[(*pt(a,.018,-.017),.005),(*pt(a,.12,-.019),.005),
                                (*pt(a,.272,-.019),.006)],8,3)
    orb(p,m['gold_dark'],pt(0,.018,-.018),(.038,.023,.037),20,14)
    orb(p,m['crown_red'],pt(0,.016,-.039),(.016,.009,.017),16,12)
    p.finish(pivot=(x,y,z))


def goddess(group,m):
    throne(group,m)
    robe = Part('Red ao dai | layered skirt, collar and phoenix embroidery',group)

    # Shift the skirt forward below the knees; the wavy hem hangs in front of the seat.
    def drape(profile, mat, trim=None):
        outline = list(sample(profile,5))

        def vertex(a,row):
            z,y,rx,ry,f = row
            wave = math.cos(3*a+.22)*.64 + math.cos(5*a-.41)*.36
            return (math.sin(a)*rx*(1+.045*f*wave), y-math.cos(a)*ry-f*.054*wave,
                    z+f*(.047*wave+.104*(1-math.cos(a))))

        rings(robe,[[vertex(TAU*i/96,row) for i in range(96)] for row in outline],mat)
        if trim:
            closed_line(robe,trim,[vertex(TAU*i/96,outline[3]) for i in range(96)],.008)
        return outline,vertex

    drape([(.117,-.355,.485,.319,.78),(.142,-.354,.546,.349,.83),(.233,-.326,.602,.383,.78),
           (.436,-.252,.618,.421,.71),(.628,-.163,.557,.439,.52),(.737,-.125,.435,.341,.28),
           (.847,-.026,.317,.278,0)],m['robe_dark'])
    outline,vertex = drape([(.190,-.371,.486,.335,.81),(.214,-.366,.550,.374,.87),(.329,-.331,.597,.400,.83),
                            (.489,-.271,.624,.438,.72),(.633,-.191,.571,.443,.55),(.733,-.131,.473,.380,.36),
                            (.831,-.060,.351,.318,.17),(.921,-.018,.315,.300,0),
                            (1.052,-.011,.340,.298,0),(1.213,-.011,.395,.277,0),(1.324,-.011,.415,.265,0),
                            (1.402,-.011,.381,.238,0),(1.477,-.011,.280,.193,0),(1.522,-.011,.214,.169,0)],
                           m['robe'],m['gold_dark'])
    for s in [-1,1]:
        if s==-1:
            poses=[(-.320,.003,1.402,.115,.115),(-.420,-.038,1.301,.156,.153),
                   (-.503,-.148,1.157,.157,.153),(-.500,-.331,1.127,.134,.125),(-.461,-.493,1.166,.090,.087)]
            c=(-.459,-.493,1.167)
        else:
            poses=[(.321,.022,1.405,.104,.112),(.443,.008,1.331,.156,.154),(.515,-.055,1.16,.152,.143),
                   (.619,-.125,1.054,.133,.119),(.782,-.263,1.021,.097,.085)]
            c=(.788,-.265,1.021)
        tube(robe,m['robe'],poses,28,7,side=(1,0,0) if s==-1 else (0,0,1))
        cv=Vector(c)
        axis = (cv-Vector(poses[-2][:3])).normalized()
        norm = axis.cross(Vector((0,0,1))).normalized()
        up = norm.cross(axis).normalized()
        closed_line(robe,m['gold'],[cv+math.sin(TAU*i/36)*.094*norm+
                    math.cos(TAU*i/36)*.088*up for i in range(36)],.012)

    collar = []
    for j in range(9):
        t = j/8
        collar.append([(math.sin(a)*(.354-.133*t),-.022-math.cos(a)*(.246-.068*t),
                        1.424+.159*t-.078*max(0,math.cos(a))**4*(1-t))
                       for i in range(72) for a in [TAU*i/72]])
    rings(robe,collar,m['gold'],cap=False)
    for row in (collar[0],collar[-1]):
        closed_line(robe,m['gold_light'],row,.012)
    closed_line(robe,m['gold_dark'],collar[2],.007)
    orb(robe,m['gold_dark'],(.033,-.264,1.365),(.047,.021,.041),24,16)
    orb(robe,m['crown_red'],(.033,-.281,1.365),(.025,.013,.028),22,14)

    # Follow the actual skirt surface so the gold stitches do not float above the folds.
    def silk(x,z):
        def ring_front(row):
            low,high = -math.pi/2,math.pi/2
            for _ in range(13):
                a = (low+high)*.5
                if vertex(a,row)[0] < x:
                    low = a
                else:
                    high = a
            _,y,h = vertex((low+high)*.5,row)
            return h,y

        rows = [ring_front(row) for row in outline]
        for (a,u),(b,v) in zip(rows,rows[1:]):
            if a <= z <= b:
                return u+(v-u)*(z-a)/(b-a)-.006
        return rows[0 if z<rows[0][0] else -1][1]-.006

    phoenix(robe,lambda x,z: (x+.058,silk(x+.058,z+.540),z+.540),m,1.04)
    for s in [-1,1]:
        for path in [[(.392,.653,.004),(.447,.552,.009),(.446,.423,.010),(.409,.341,.006)],
                     [(.466,.546,.003),(.491,.458,.007),(.467,.385,.004)]]:
            tube(robe,m['gold_dark'],[(s*x,silk(s*x,h),h,r) for x,h,r in path],10,6)
    robe.finish()
    make_head(group,1.964,-.006,m['skin'],m['paint'],m['hair'],m['gold'],mother=True)
    crown(group,m)

    hands = Part('Hands | rounded fingers holding lotus and fan',group)
    for s, x,y,z in [(-1,-.454,-.550,1.163),(1,.827,-.331,1.016)]:
        orb(hands,m['skin'],(x,y,z),(.084,.080,.078),28,18)
        for i in range(4):
            d=i*.024
            tube(hands,m['skin'],[(x-s*(.047-.009*i),y-.017,z+.045-d,.028-i*.002),
                                  (x+s*.007,y-.070,z+.047-d,.027-i*.001),
                                  (x+s*.052,y-.072,z+.042-d,.022-i*.001),
                                  (x+s*.064,y-.049,z+.041-d,.010)],12,4)
        tube(hands,m['skin'],[(x-s*.046,y-.021,z+.034,.035),(x-s*.029,y-.058,z+.082,.029),
                              (x+s*.018,y-.074,z+.073,.022),(x+s*.043,y-.061,z+.048,.010)],14,5)
    hands.finish()
    blossom(group,m)
    fan(group,m)


def palette(kind):
    m = dict(gold=material('Satin gold | trim and relief','d6a34d',.36,.56),
             gold_light=material('Pale gold highlights','f0c779',.32,.43),
             gold_dark=material('Antique gold recesses','a56a29',.42,.52),
             halo=material('Brushed honey gold | halo field','deb56b',.47,.46),
             stem=material('Botanical stem','456835',.57),leaf=material('Botanical leaf','669748',.5),
             leaf_light=material('Botanical leaf vein','c4c278',.49))
    if kind=='jade':
        m.update(skin=material('Jade | pale polished celadon','bbd8b7',.29,transmission=.07,sss=.20,emission=.035),
                 paint=paint_face('bbd8b7','9db88a','48643f','728b57',jade=True),
                 robe=material('Jade | deep emerald robe','084938',.285,sss=.09),
                 binding=material('Jade | emerald robe facing','105640',.28,sss=.08),
                 bowl=material('Jade | polished alms bowl','85bb99',.245,transmission=.085,sss=.16),
                 base=material('Jade | green pedestal moulding','277050',.32,sss=.07),
                 petal_green=material('Jade | green petal rim','36714c',.37),
                 petals=[material('Ivory jade petals '+h,h,.32,sss=.13) for h in ['fff9ea','f4f2e6']])
    elif kind=='lapis':
        m.update(skin=material('Warm peach porcelain','f3b78b',.49,sss=.10),
                 nail=material('Subtle peach nails','f6c49c',.47),
                 paint=paint_face('f3b78b','d9786b','352027','925347',medicine=True),
                 hair=material('Satin blue-black','18202e',.43),
                 robe=material('Silk | lapis blue','16365d',.53),
                 binding=material('Silk | lapis collar facing','142c49',.5),
                 bowl=material('Lapis | glazed medicine bowl','1f416b',.32),
                 nectar=material('Honey nectar | soft golden emission','fcc247',.31,emission=1.2),
                 nectar_light=material('Honey nectar | ripple','ffdb83',.31,emission=.83),
                 petals=[material('Gilded lotus petal '+h,h,.4,.40)
                          for h in ['e9ae52','d99a45','e2a14b']])
    else:
        m.update(skin=material('Warm peach porcelain','f2bd9c',.49,sss=.12),
                 paint=paint_face('f2bd9c','e17f88','402631','963e50',mother=True),
                 hair=material('Soft black lacquer hair','16151e',.47),
                 robe=material('Silk | deep cinnabar','8c1028',.55),
                 robe_dark=material('Silk | darker underlayer','5f1030',.57),
                 cushion=material('Throne | muted oxblood upholstery','74263b',.63),
                 throne_inlay=material('Throne | warm brushed gilt','bb803c',.44,.47),
                 crown_red=material('Ruby enamel','a2314a',.31,.21),
                 flower=[material('Pink lotus '+h,h,.46,sss=.08) for h in ['d94c79','f47a9b','ffc1c6']])
    return m


def studio(target, draft, medicine=False, mother=False, jade=False):
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12 if draft else 40
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 5
    scene.cycles.transmission_bounces = 3
    scene.render.resolution_x = (460 if draft else 1000) if medicine or jade else (590 if draft else 1140)
    scene.render.resolution_y = (880 if draft else 1900) if jade else (860 if draft else 1860) if medicine else (660 if draft else 1280)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.world = bpy.data.worlds.new('Warm ivory ambient')
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*linear('fbebdf'),1)
    bg.inputs[1].default_value = .51
    lab = bpy.data.collections.new('Studio | excluded from GLB')
    scene.collection.children.link(lab)
    floor = Part('Ivory cyclorama',lab)
    if medicine or mother or jade:
        contour = [(-200 if jade else -25,-.003),(1.9,-.003)] + [(1.9+1.7*math.sin(a*math.pi/20),
                   1.7*(1-math.cos(a*math.pi/20))) for a in range(1,11)] + [(3.6,30)]
        floor.add([(x,y,z) for y,z in contour for x in [-25,25]],
                  [(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(contour)-1)],
                   material('Studio | warm ivory','ffebd0',.91,emission=.56 if mother else .68))
    else:
        floor.add([(-200,-200,-.002),(200,-200,-.002),(200,200,-.002),(-200,200,-.002)],
                   [(0,1,2,3)],material('Studio | warm ivory','f8ecd9',.88,emission=.37),False)
    floor.finish()
    camera = bpy.data.objects.new('Camera | centered front',bpy.data.cameras.new('Portrait orthographic'))
    lab.objects.link(camera)
    camera.location = (0,-8,target*(.73 if medicine else .66 if mother else .55 if jade else .795))
    camera.rotation_euler = (Vector((0,0,target*.494))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = target*(1.12 if medicine else 1.17 if mother else 1.18 if jade else 1.21)
    camera.data.clip_end = 500
    scene.camera = camera
    for name, xyz, aim, power, size, color in [
            ('Key | softbox',(-3.5,-4.8,5.5),(0,0,1.2),510,4.05,'fff0de'),
            ('Fill | bounced silk',(3.8,-3.35,3.7),(0,0,1.3),315,4.1,'e7ecff'),
            ('Rim | warm ivory',(2.3,2.6,4.6),(0,0,1.5),610,3.0,'fff0d2'),
            ('Top | petal sheen',(-2.6,1.5,3.9),(0,0,1.35),225,2.7,'faf5ff')]:
        data = bpy.data.lights.new(name,'AREA')
        lamp = bpy.data.objects.new(name,data)
        lab.objects.link(lamp)
        lamp.location = xyz
        lamp.rotation_euler = (Vector(aim)-lamp.location).to_track_quat('-Z','Y').to_euler()
        data.energy, data.shape, data.size, data.color = power,'DISK',size,rgb(color)
    if medicine:
        data = bpy.data.lights.new('Nectar | bounce on palms and collar','POINT')
        lamp = bpy.data.objects.new(data.name,data)
        lab.objects.link(lamp)
        lamp.location = (0,-.538,1.35)
        data.energy, data.shadow_soft_size, data.color = 5,.14,rgb('ffc96e')
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective = 'CAMERA'
                area.spaces.active.overlay.show_overlays = False
                area.spaces.active.shading.color_type = 'MATERIAL'
    return scene


ASSETS = {'chibi-phat-ngoc': ('Jade Buddha', 'jade',2.5),
          'chibi-mau-lieu-hanh': ('Mau Lieu Hanh','mother',2.65),
          'chibi-duoc-su-tuong-chinh': ('Medicine Buddha | principal','lapis',3.0)}


def build(slug, draft):
    label, kind, height = ASSETS[slug]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    group = bpy.data.collections.new(label)
    bpy.context.scene.collection.children.link(group)
    m = palette(kind)
    if kind=='mother':
        goddess(group,m)
    elif kind=='lapis':
        medicine_buddha(group,m)
    else:
        jade_buddha(group,m)
    scene = studio(height,draft,medicine=kind=='lapis',mother=kind=='mother',jade=kind=='jade')
    shot_name = slug+('-angle' if '--angle' in sys.argv else '')+('-draft' if draft and kind!='lapis' else '')+'.png'
    scene.render.filepath = str(SHOTS / shot_name)
    if not draft:
        modifiers = []
        for obj in group.objects:
            obj.select_set(True)
            if len(obj.data.polygons) > 1000 and not (kind!='lapis' and obj.data.uv_layers):
                # Keep the sculpt for studio renders, reduce only the in-game export.
                mod = obj.modifiers.new('Game export only', 'DECIMATE')
                mod.ratio = .36 if obj.name.startswith(('Gilded','Open gold','Phoenix throne','Jade plinth')) else .52
                modifiers.append((obj, mod))
        bpy.ops.export_scene.gltf(filepath=str(MODELS / (slug+'.glb')), export_format='GLB',
                                  use_selection=True, export_extras=True, export_yup=True, export_apply=bool(modifiers))
        for obj, mod in modifiers:
            obj.modifiers.remove(mod)
        bpy.ops.object.select_all(action='DESELECT')
        scene.render.filepath = '//../../shots/'+slug+'.png'
        bpy.ops.wm.save_as_mainfile(filepath=str(SOURCES / (slug+'.blend')),compress=True)
    if '--angle' in sys.argv:
        camera = scene.camera
        camera.location.x = 3.6
        camera.rotation_euler = (Vector((0,0,height*.494))-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath = str(SHOTS / shot_name)
    bpy.ops.render.render(write_still=True)


if __name__=='__main__':
    assert all(d.is_dir() for d in (MODELS,SOURCES,SHOTS))
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for key in [arg for arg in args if not arg.startswith('--')] or ASSETS:
        build(key,'--draft' in args)
