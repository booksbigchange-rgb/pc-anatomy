"""Original, editable laptop service models for Blender 2.78.
Y is up to preserve the teaching scene's existing component mounts.
Run from the repository: D:/BLENDER/blender.exe -b --python scripts/build-service-models.py
"""
import bpy
import math
import os
import json
import struct
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models', 'service-realistic')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
MATS = {}
SPECS = {}


def mat(name, rgb, rough, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgb
    MATS[name] = m
    SPECS[name] = {'name': name, 'pbrMetallicRoughness': {
        'baseColorFactor': list(rgb) + [1], 'roughnessFactor': rough, 'metallicFactor': metal}}


mat('Solder mask', (.025, .13, .075), .68)
mat('Package resin', (.018, .021, .024), .88)
mat('Gold contact', (.65, .43, .12), .3, .78)
mat('Solder', (.47, .51, .53), .38, .72)
mat('Ceramic', (.32, .23, .13), .85)
mat('Printed ink', (.72, .76, .7), .9)
mat('Paper label', (.8, .82, .77), .96)
mat('Label ink', (.015, .02, .023), .9)
mat('Shield steel', (.38, .43, .46), .42, .68)
mat('Blower plastic', (.024, .027, .03), .72)
mat('Copper', (.54, .23, .095), .4, .78)
PARTS = []
current = []


def register(obj, name, material):
    obj.name = name
    obj.data.materials.append(MATS[material])
    current.append(obj)
    return obj


def apply(obj, modifier):
    bpy.context.scene.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def box(name, size, pos, material, bevel=.002):
    bpy.ops.mesh.primitive_cube_add(location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Formed edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        apply(obj, mod)
    return register(obj, name, material)


def cylinder(name, radius, depth, pos, material, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.rotation_euler.x = math.pi / 2
    return register(obj, name, material)


def cut(obj, cutter):
    mod = obj.modifiers.new('Real opening', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    apply(obj, mod)
    current.remove(cutter)
    bpy.data.objects.remove(cutter, do_unlink=True)


def text(body, pos, size, material='Printed ink', rotation=0):
    bpy.ops.object.text_add(location=pos)
    obj = bpy.context.object
    obj.data.body = body
    obj.data.size = size
    obj.data.extrude = 0
    obj.data.resolution_u = 2
    obj.rotation_euler = (-math.pi / 2, rotation, 0)
    bpy.ops.object.convert(target='MESH')
    return register(bpy.context.object, body, material)


def passives(x, z, count, along='x', y=.025):
    for i in range(count):
        px, pz = x + (i * .055 if along == 'x' else 0), z + (i * .055 if along == 'z' else 0)
        box('MLCC ceramic', (.026, .014, .018), (px, y, pz), 'Ceramic', .001)
        for dx in [-.016, .016]:
            box('Solder termination', (.008, .011, .019), (px + dx, y, pz), 'Solder', .001)


def pcb(name, width, depth, y=0, x=0):
    return box(name, (width, .023, depth), (x, y, 0), 'Solder mask', .006)


def m2_fingers(x, count, spacing, gap):
    for i in range(count):
        if i in gap:
            continue
        z = -(count - 1) * spacing / 2 + i * spacing
        for y in [-.0125, .0125]:
            box('Gold edge finger', (.105, .002, spacing * .62), (x, y, z), 'Gold contact', .0005)


def export(name):
    # One mesh with material primitives, indexed to keep web downloads small.
    groups = {}
    for obj in current:
        mesh = obj.to_mesh(bpy.context.scene, True, 'PREVIEW')
        mesh.transform(obj.matrix_world)
        mesh.calc_tessface()
        mesh.calc_normals()
        for face in mesh.tessfaces:
            material = obj.data.materials[face.material_index].name
            group = groups.setdefault(material, [])
            ids = list(face.vertices)
            for tri in ([ids[:3]] if len(ids) == 3 else [ids[:3], [ids[0], ids[2], ids[3]]]):
                group.append([(tuple(mesh.vertices[i].co), tuple(face.normal)) for i in tri])
        bpy.data.meshes.remove(mesh)
    binary = bytearray()
    views, accessors, primitives, materials = [], [], [], []

    def buffer(data, count, kind, component, bounds=None):
        offset = len(binary)
        binary.extend(data)
        binary.extend(b'\0' * (-len(binary) % 4))
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)})
        a = {'bufferView': len(views) - 1, 'componentType': component, 'count': count, 'type': kind}
        if bounds:
            a.update(bounds)
        accessors.append(a)
        return len(accessors) - 1

    for material, faces in groups.items():
        vertices, indices, lookup = [], [], {}
        for face in faces:
            for pos, normal in face:
                key = pos + normal
                if key not in lookup:
                    lookup[key] = len(vertices)
                    vertices.append((pos, normal))
                indices.append(lookup[key])
        positions = [v[0] for v in vertices]
        bounds = {'min': [min(p[i] for p in positions) for i in range(3)],
                  'max': [max(p[i] for p in positions) for i in range(3)]}
        pa = buffer(b''.join(struct.pack('<3f', *v[0]) for v in vertices), len(vertices), 'VEC3', 5126, bounds)
        na = buffer(b''.join(struct.pack('<3f', *v[1]) for v in vertices), len(vertices), 'VEC3', 5126)
        ia = buffer(struct.pack('<{}I'.format(len(indices)), *indices), len(indices), 'SCALAR', 5125)
        materials.append(SPECS[material])
        primitives.append({'attributes': {'POSITION': pa, 'NORMAL': na}, 'indices': ia,
                           'material': len(materials) - 1, 'mode': 4})
    doc = {'asset': {'version': '2.0', 'generator': 'BigChange Blender service models'},
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': name, 'mesh': 0}],
           'meshes': [{'primitives': primitives}], 'materials': materials, 'accessors': accessors,
           'bufferViews': views, 'buffers': [{'byteLength': len(binary)}]}
    encoded = json.dumps(doc).encode('utf8')
    encoded += b' ' * (-len(encoded) % 4)
    with open(os.path.join(OUT, name + '.glb'), 'wb') as handle:
        handle.write(struct.pack('<III', 0x46546c67, 2, 28 + len(encoded) + len(binary)))
        handle.write(struct.pack('<II', len(encoded), 0x4e4f534a) + encoded)
        handle.write(struct.pack('<II', len(binary), 0x004e4942) + binary)
    print('EXPORTED', name, len(binary), 'bytes')
    PARTS.append((name, list(current)))
    current[:] = []


# SSD: correct 80:22 outline, actual keyed edge and mounting cutout.
board = pcb('M.2 2280 PCB', 2.03, .56)
cut(board, cylinder('Mounting cutout', .046, .15, (1.015, 0, 0), 'Solder mask'))
cut(board, box('M key', (.12, .12, .033), (-1.0, 0, .135), 'Solder mask', 0))
m2_fingers(-.96, 24, .021, [17, 18])
for x in [-.60, -.16, .28]:
    box('NAND package', (.36, .036, .34), (x, .03, 0), 'Package resin', .009)
box('Controller', (.25, .029, .27), (.70, .027, 0), 'Package resin', .006)
passives(-.65, -.235, 27)
passives(-.65, .235, 27)
box('SSD identification label', (1.25, .002, .30), (-.17, .050, 0), 'Paper label', .002)
text('NVMe  /  512 GB', (-.72, .052, .075), .080, 'Label ink')
text('M.2 2280   PCIe   3.3V', (-.72, .052, .005), .042, 'Label ink')
for i in range(36):
    box('Barcode', (.006 if i % 3 else .013, .001, .052), (-.7 + i * .022, .052, -.092), 'Label ink', 0)
export('ssd')

# Two removable SODIMM modules. Board-side sockets stay in the existing scene.
for x in [-.43, .43]:
    board = pcb('SODIMM PCB', .68, 1.58, .035, x)
    cut(board, box('Memory key notch', (.07, .12, .042), (x - .33, .035, .08), 'Solder mask', 0))
    for z in [-.54, -.18, .18, .54]:
        box('DRAM package', (.40, .032, .25), (x + .07, .064, z), 'Package resin', .007)
        text('DRAM', (x - .09, .081, z + .02), .038)
    for i in range(64):
        z = -.72 + i * .023
        if abs(z - .08) < .037:
            continue
        box('SODIMM contact', (.064, .002, .013), (x - .302, .048, z), 'Gold contact', .0005)
    passives(x + .29, -.65, 24, 'z', .057)
    box('Memory label', (.36, .002, .25), (x + .065, .082, .18), 'Paper label', .002)
    text('8 GB', (x - .09, .084, .21), .065, 'Label ink')
    text('DDR4', (x - .09, .084, .15), .041, 'Label ink')
export('ram')

board = pcb('M.2 2230 PCB', .76, .56)
cut(board, cylinder('Wi-Fi mounting cutout', .043, .12, (.38, 0, 0), 'Solder mask'))
cut(board, box('E key', (.1, .12, .03), (-.38, 0, .09), 'Solder mask', 0))
m2_fingers(-.33, 22, .021, [14, 15])
box('Stamped RF shield', (.43, .039, .34), (.065, .031, .025), 'Shield steel', .012)
box('RF shield label', (.36, .002, .27), (.065, .052, .025), 'Paper label', .002)
text('Wi-Fi 6', (-.09, .054, .10), .058, 'Label ink')
text('2230  WLAN', (-.09, .054, .034), .034, 'Label ink')
text('BT  /  3.3V', (-.09, .054, -.015), .034, 'Label ink')
for x in [-.18, .18]:
    cylinder('Antenna connector shell', .030, .024, (x, .034, -.22), 'Gold contact')
    cylinder('Antenna dielectric', .019, .026, (x, .036, -.22), 'Package resin')
    cylinder('Antenna signal pin', .006, .028, (x, .037, -.22), 'Gold contact', 16)
passives(-.21, .19, 9)
export('wifi')

# Thin centrifugal blower with 48 curved blades and a formed metal inlet.
cx, cz = -.58, -.15
cylinder('Blower floor', .79, .022, (cx, .018, cz), 'Blower plastic', 64)
rim = cylinder('Formed steel inlet', .81, .016, (cx, .14, cz), 'Shield steel', 64)
cut(rim, cylinder('Air inlet opening', .60, .20, (cx, .14, cz), 'Shield steel', 64))
wall = cylinder('Scroll casing', .80, .11, (cx, .075, cz), 'Blower plastic', 64)
cut(wall, cylinder('Impeller cavity', .765, .20, (cx, .075, cz), 'Blower plastic', 64))
cylinder('Motor hub', .21, .077, (cx, .073, cz), 'Blower plastic', 48)
cylinder('Motor label', .16, .003, (cx, .114, cz), 'Paper label', 40)
text('DC 5V', (cx - .11, .117, cz + .02), .059, 'Label ink')
for i in range(48):
    angle = i * math.pi * 2 / 48
    points = []
    for k in range(5):
        r = .25 + .45 * k / 4
        a = angle + .37 * k / 4
        points.extend([(cx + math.cos(a) * r, .047, cz + math.sin(a) * r),
                       (cx + math.cos(a) * r, .117, cz + math.sin(a) * r)])
    mesh = bpy.data.meshes.new('Curved impeller vane')
    mesh.from_pydata(points, [], [(2*k, 2*k+1, 2*k+3, 2*k+2) for k in range(4)])
    mesh.update()
    obj = bpy.data.objects.new('Curved impeller vane', mesh)
    bpy.context.scene.objects.link(obj)
    register(obj, 'Curved impeller vane', 'Blower plastic')
    mod = obj.modifiers.new('Vane thickness', 'SOLIDIFY')
    mod.thickness = .006
    apply(obj, mod)
box('Exhaust duct roof', (.62,.018,.94), (-1.35,.153,cz), 'Blower plastic', .01)
for i in range(38):
    box('Exhaust fin', (.009, .13, .92), (-1.64 + i * .016, .079, cz), 'Copper', .001)
box('Cold plate', (.92, .035, .84), (1, .10, -.06), 'Copper', .018)
for z in [-.13, .02]:
    # Elliptical tube mesh exports consistently in the older Blender build.
    path = [Vector(v) for v in [(1.30,.145,z),(.65,.16,z),(.15,.17,z-.48),(-.55,.16,z-.58),(-1.40,.14,z-.20)]]
    # Subdivide with corner cutting to form smooth manufactured pipe bends.
    for refinement in range(3):
        smooth = [path[0]]
        for a, b in zip(path[:-1], path[1:]):
            smooth.extend([a * .75 + b * .25, a * .25 + b * .75])
        path = smooth + [path[-1]]
    verts, faces = [], []
    for i, point in enumerate(path):
        tangent = Vector(path[min(i+1,len(path)-1)]) - Vector(path[max(i-1,0)])
        tangent.y = 0
        tangent.normalize()
        side = Vector((-tangent.z,0,tangent.x))
        for k in range(12):
            a = k * math.pi * 2 / 12
            v = Vector(point) + side * (.057 * math.cos(a)) + Vector((0,.025 * math.sin(a),0))
            verts.append(tuple(v))
    for i in range(len(path)-1):
        for k in range(12):
            faces.append((i*12+k,i*12+(k+1)%12,(i+1)*12+(k+1)%12,(i+1)*12+k))
    faces.extend([tuple(reversed(range(12))),tuple((len(path)-1)*12+k for k in range(12))])
    mesh = bpy.data.meshes.new('Flattened heat pipe')
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj = bpy.data.objects.new('Flattened heat pipe',mesh)
    bpy.context.scene.objects.link(obj)
    register(obj,'Flattened heat pipe','Copper')
for x, z in [(-1.07,-.72),(-.11,.47),(.64,-.42),(1.37,.29)]:
    cylinder('Captive fastener', .043, .019, (x,.16,z), 'Solder', 20)
    box('Screw slot', (.044,.002,.007),(x,.171,z),'Package resin',0)
    box('Screw cross slot', (.007,.002,.044),(x,.171,z),'Package resin',0)
export('cooling')

# Keep each model in its own layer and lay out the editable overview on D:.
for index, (name, objects) in enumerate(PARTS):
    for obj in objects:
        obj.location.x += index * 3.5
        obj.layers = tuple(i == index for i in range(20))
bpy.context.scene.layers = tuple(i < 4 for i in range(20))
output = os.path.join(ROOT, 'outputs', 'blender')
os.makedirs(output, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output, 'laptop-service-components.blend'))
