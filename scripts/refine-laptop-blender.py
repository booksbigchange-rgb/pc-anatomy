"""Blender 2.78+: refine pinned CAD shells, preserving their coordinates.
Run: blender --background --python scripts/refine-laptop-blender.py
No third-party Python packages or downloads are required.
"""
import bpy
import json
import math
import os
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, 'public', 'models')


def read_mesh(path):
    with open(path, 'rb') as handle:
        raw = handle.read()
    length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + length].decode('utf8'))
    binary = raw[28 + length:]
    primitive = doc['meshes'][0]['primitives'][0]

    def values(index, width, fmt):
        accessor = doc['accessors'][index]
        view = doc['bufferViews'][accessor['bufferView']]
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        size = struct.calcsize('<' + fmt * width)
        stride = view.get('byteStride', size)
        return [struct.unpack_from('<' + fmt * width, binary, offset + i * stride)
                for i in range(accessor['count'])]

    vertices = values(primitive['attributes']['POSITION'], 3, 'f')
    indices = values(primitive['indices'], 1, 'I')
    faces = [tuple(indices[i + k][0] for k in range(3)) for i in range(0, len(indices), 3)]
    return vertices, faces


def export_mesh(mesh, path):
    mesh.calc_normals_split()
    positions, normals = [], []
    # Triangulation modifier ensures every polygon has three loops.
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            loop = mesh.loops[loop_index]
            positions.append(tuple(mesh.vertices[loop.vertex_index].co))
            normals.append(tuple(loop.normal))
    chunks = [b''.join(struct.pack('<3f', *v) for v in values) for values in (positions, normals)]
    size = len(chunks[0])
    doc = {'asset': {'version': '2.0', 'generator': 'BigChange Blender CAD surface refinement'},
           'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
           'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'mode': 4}]}],
           'buffers': [{'byteLength': size * 2}],
           'bufferViews': [{'buffer': 0, 'byteOffset': i * size, 'byteLength': size} for i in range(2)],
           'accessors': [{'bufferView': i, 'componentType': 5126, 'count': len(positions), 'type': 'VEC3'} for i in range(2)]}
    doc['accessors'][0]['min'] = [min(v[i] for v in positions) for i in range(3)]
    doc['accessors'][0]['max'] = [max(v[i] for v in positions) for i in range(3)]
    encoded = json.dumps(doc).encode('utf8')
    encoded += b' ' * (-len(encoded) % 4)
    binary = b''.join(chunks)
    with open(path, 'wb') as handle:
        handle.write(struct.pack('<III', 0x46546c67, 2, 28 + len(encoded) + len(binary)))
        handle.write(struct.pack('<II', len(encoded), 0x4e4f534a) + encoded)
        handle.write(struct.pack('<II', len(binary), 0x004e4942) + binary)
    return len(positions) // 3


for part in ('input-cover', 'top-cover', 'display-bezel'):
    name = 'framework-laptop-13-' + part
    vertices, faces = read_mesh(os.path.join(MODELS, name + '.glb'))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.objects.link(obj)
    bpy.context.scene.objects.active = obj
    obj.select = True
    bevel = obj.modifiers.new('Machined edge highlights', 'BEVEL')
    bevel.width = 0.00006
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(35)
    bevel.use_clamp_overlap = True
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.use_auto_smooth = True
    obj.data.auto_smooth_angle = math.radians(30)
    for face in obj.data.polygons:
        face.use_smooth = True
    tri = obj.modifiers.new('Web triangles', 'TRIANGULATE')
    bpy.ops.object.modifier_apply(modifier=tri.name)
    count = export_mesh(obj.data, os.path.join(MODELS, name + '-refined.glb'))
    print('REFINED {}: {} triangles'.format(part, count))
    obj.select = False

output = os.path.join(ROOT, 'outputs', 'blender')
os.makedirs(output, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output, 'laptop-shells.blend'))
