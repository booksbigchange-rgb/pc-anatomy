"""Convert the official Framework Laptop 13 STEP CAD into a web GLB candidate.

This is an asset-build tool only. It is not bundled into the student app.
Source and license are pinned in MODEL_ASSET_MANIFEST.md.
"""

from __future__ import annotations

import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

SOURCE = Path("asset-work/framework-laptop-13.step")
STL = Path("asset-work/framework-laptop-13.stl")
OUT = Path("public/models/framework-laptop-13.glb")
META = Path("public/models/framework-laptop-13.meta.json")
TOP_COVER_OUT = Path("public/models/framework-laptop-13-top-cover.glb")
INPUT_COVER_OUT = Path("public/models/framework-laptop-13-input-cover.glb")
DISPLAY_BEZEL_OUT = Path("public/models/framework-laptop-13-display-bezel.glb")

MAX_FACES = 150_000
TARGET_FACES = 120_000
MAX_GLB_BYTES = 15 * 1024 * 1024


def load_triangle_mesh(path: Path) -> trimesh.Trimesh:
    loaded = trimesh.load(path, force="scene", process=True)
    if isinstance(loaded, trimesh.Scene):
        meshes = [
            geometry
            for geometry in loaded.geometry.values()
            if isinstance(geometry, trimesh.Trimesh)
        ]
        if not meshes:
            raise RuntimeError("STEP conversion produced no mesh geometry")
        mesh = trimesh.util.concatenate(meshes)
    else:
        mesh = loaded
    mesh.process(validate=True)
    mesh.remove_unreferenced_vertices()
    return mesh


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    STL.parent.mkdir(parents=True, exist_ok=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)

    model = cq.importers.importStep(str(SOURCE))
    cq.exporters.export(
        model,
        str(STL),
        tolerance=0.22,
        angularTolerance=0.35,
    )

    mesh = load_triangle_mesh(STL)

    # Framework CAD is authored in millimetres. glTF convention is metres.
    mesh.apply_scale(0.001)

    source_faces = int(len(mesh.faces))
    if source_faces > MAX_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=TARGET_FACES)
        mesh.process(validate=True)
        mesh.remove_unreferenced_vertices()

    # Keep a few mechanically meaningful exterior shells as separate local
    # assets. The source STEP is a closed assembly, but these connected shells
    # can be repositioned by the interactive app to build a realistic open
    # laptop without inventing the input-cover or display-bezel geometry.
    components = list(mesh.split(only_watertight=False))
    thin_wide = [
        component
        for component in components
        if component.extents[0] > 0.29
        and component.extents[1] < 0.005
        and component.extents[2] > 0.20
        and len(component.faces) > 3000
    ]
    if len(thin_wide) < 3:
        raise RuntimeError(
            f"Expected at least three full-width exterior shells; got {len(thin_wide)}"
        )

    top_cover = max(thin_wide, key=lambda component: len(component.faces))
    remaining = [component for component in thin_wide if component is not top_cover]
    input_cover = max(remaining, key=lambda component: component.extents[2])
    remaining = [component for component in remaining if component is not input_cover]
    display_bezel = min(
        remaining,
        key=lambda component: abs(float(component.extents[2]) - 0.216),
    )

    exterior_parts = {
        TOP_COVER_OUT: top_cover,
        INPUT_COVER_OUT: input_cover,
        DISPLAY_BEZEL_OUT: display_bezel,
    }
    exterior_metadata = {}
    for path, component in exterior_parts.items():
        part = component.copy()
        part.visual = trimesh.visual.ColorVisuals(
            mesh=part,
            face_colors=np.tile(
                np.array([166, 176, 182, 255], dtype=np.uint8),
                (len(part.faces), 1),
            ),
        )
        path.write_bytes(part.export(file_type="glb"))
        exterior_metadata[path.name] = {
            "faces": int(len(part.faces)),
            "vertices": int(len(part.vertices)),
            "extents_m": [round(float(v), 6) for v in part.extents],
            "centroid_m": [round(float(v), 6) for v in part.centroid],
            "bounds_m": [
                [round(float(v), 6) for v in part.bounds[0]],
                [round(float(v), 6) for v in part.bounds[1]],
            ],
            "glb_bytes": path.stat().st_size,
        }

    # Neutral classroom material. Product branding/textures are not carried over.
    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        face_colors=np.tile(
            np.array([166, 176, 182, 255], dtype=np.uint8),
            (len(mesh.faces), 1),
        ),
    )

    # Centre X/Z and put the lowest point on y=0. App code can scale/rotate later.
    bounds = mesh.bounds.copy()
    center = bounds.mean(axis=0)
    mesh.apply_translation([-center[0], -bounds[0][1], -center[2]])

    extents = np.sort(mesh.extents)
    smallest, middle, largest = [float(value) for value in extents]

    if not 0.24 <= largest <= 0.42:
        raise RuntimeError(f"Unexpected laptop largest dimension: {largest:.3f} m")
    if not 0.15 <= middle <= 0.34:
        raise RuntimeError(f"Unexpected laptop middle dimension: {middle:.3f} m")
    if not 0.004 <= smallest <= 0.20:
        raise RuntimeError(f"Unexpected laptop smallest dimension: {smallest:.3f} m")

    OUT.write_bytes(mesh.export(file_type="glb"))
    size = OUT.stat().st_size
    if size > MAX_GLB_BYTES:
        raise RuntimeError(
            f"GLB is {size / 1024 / 1024:.1f} MB; limit is 15 MB"
        )

    metadata = {
        "source": "FrameworkComputer/Framework-Laptop-13",
        "source_file": "Framework Laptop 13 CAD.stp",
        "source_commit": "e5bd4da7a14611935891c867dc40ae83ea8f6297",
        "source_blob": "5222d190375f14f182363d80b84c4211375bee9b",
        "license": "CC-BY-4.0",
        "modified": True,
        "conversion": "STEP -> STL (CadQuery) -> optimized neutral-material GLB (trimesh)",
        "source_faces": source_faces,
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_m": [round(float(v), 6) for v in mesh.extents],
        "glb_bytes": size,
        "release_status": "candidate-pending-visual-and-branding-review",
        "exterior_parts": exterior_metadata,
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
