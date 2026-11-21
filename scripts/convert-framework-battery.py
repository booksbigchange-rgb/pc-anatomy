"""Convert the official Framework Laptop 13 battery STEP model into a web GLB.

Asset-build tool only. Nothing here ships as a runtime dependency.
"""

from __future__ import annotations

import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

SOURCE = Path("asset-work/framework-laptop-13-battery.step")
STL = Path("asset-work/framework-laptop-13-battery.stl")
OUT = Path("public/models/framework-laptop-13-battery.glb")
META = Path("public/models/framework-laptop-13-battery.meta.json")

TARGET_FACES = 45_000
MAX_GLB_BYTES = 8 * 1024 * 1024


def load_mesh(path: Path) -> trimesh.Trimesh:
    loaded = trimesh.load(path, force="scene", process=True)
    if isinstance(loaded, trimesh.Scene):
        meshes = [
            geometry
            for geometry in loaded.geometry.values()
            if isinstance(geometry, trimesh.Trimesh)
        ]
        if not meshes:
            raise RuntimeError("Battery conversion produced no mesh")
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
        tolerance=0.18,
        angularTolerance=0.3,
    )

    mesh = load_mesh(STL)
    mesh.apply_scale(0.001)  # mm -> m

    source_faces = int(len(mesh.faces))
    if source_faces > TARGET_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=TARGET_FACES)
        mesh.process(validate=True)
        mesh.remove_unreferenced_vertices()

    # Neutral dark battery pack; no product artwork or branding is carried over.
    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        face_colors=np.tile(
            np.array([47, 55, 60, 255], dtype=np.uint8),
            (len(mesh.faces), 1),
        ),
    )

    bounds = mesh.bounds.copy()
    center = bounds.mean(axis=0)
    mesh.apply_translation([-center[0], -bounds[0][1], -center[2]])

    largest = float(max(mesh.extents))
    if not 0.15 <= largest <= 0.30:
        raise RuntimeError(f"Unexpected battery largest dimension: {largest:.3f} m")

    OUT.write_bytes(mesh.export(file_type="glb"))
    size = OUT.stat().st_size
    if size > MAX_GLB_BYTES:
        raise RuntimeError(
            f"Battery GLB is {size / 1024 / 1024:.1f} MB; limit is 8 MB"
        )

    metadata = {
        "source": "FrameworkComputer/Framework-Laptop-13",
        "source_file": "Battery/FWKNAQ9_G01_20210911.stp",
        "source_blob": "16ce561192960c9aa0e8f0fdcd957482cd187042",
        "license": "CC-BY-4.0",
        "modified": True,
        "conversion": "STEP -> STL (CadQuery) -> optimized neutral-material GLB (trimesh)",
        "source_faces": source_faces,
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_m": [round(float(v), 6) for v in mesh.extents],
        "glb_bytes": size,
        "release_status": "approved-for-realistic-internals-v1",
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
