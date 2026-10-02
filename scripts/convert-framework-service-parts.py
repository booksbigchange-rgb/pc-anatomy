"""Convert selected official Framework Laptop 13 service parts to local GLBs.

These assets are used for the Laptop Anatomy exterior/hinge teardown. They are
build-time conversions only; student browsers load the resulting local files.
"""

from __future__ import annotations

import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

ASSET_DIR = Path("asset-work/framework-service")
OUT_DIR = Path("public/models/framework-service")

SOURCES = {
    "display-assembly": {
        "file": "FW_display_w_cable_bracket.stp",
        "source_path": "Display/FW_display_w_cable_bracket.stp",
        "blob": "6174b7a3e88daf9dddb974f1d3252fbeb96d6355",
        "max_faces": 90000,
        "max_bytes": 8 * 1024 * 1024,
    },
    "hinge-left": {
        "file": "13_5_hinge_l_assy.stp",
        "source_path": "Hinges/13_5_hinge_l_assy.stp",
        "blob": "984efde7791b6720b1837870124b5eca80e71963",
        "max_faces": 28000,
        "max_bytes": 3 * 1024 * 1024,
    },
    "hinge-right": {
        "file": "13_5_hinge_R_assy.stp",
        "source_path": "Hinges/13_5_hinge_R_assy.stp",
        "blob": "d0926fc99d37bc331a242fee307f4637148352ba",
        "max_faces": 28000,
        "max_bytes": 3 * 1024 * 1024,
    },
    "webcam": {
        "file": "FW_13_camera_module.stp",
        "source_path": "Webcam/FW_13_camera_module.stp",
        "blob": "090cc04e50e3d4fd437ff31392f76c7202cf932c",
        "max_faces": 26000,
        "max_bytes": 3 * 1024 * 1024,
    },
}

SOURCE_COMMIT = "9680262347b80efe2314673bf1f26eb955165fca"


def load_mesh(path: Path) -> trimesh.Trimesh:
    loaded = trimesh.load(path, force="scene", process=True)
    if isinstance(loaded, trimesh.Scene):
        meshes = [
            geometry
            for geometry in loaded.geometry.values()
            if isinstance(geometry, trimesh.Trimesh)
        ]
        if not meshes:
            raise RuntimeError(f"No mesh geometry in {path}")
        mesh = trimesh.util.concatenate(meshes)
    else:
        mesh = loaded
    mesh.process(validate=True)
    mesh.remove_unreferenced_vertices()
    return mesh


def convert(key: str, info: dict[str, object]) -> dict[str, object]:
    source = ASSET_DIR / str(info["file"])
    stl = ASSET_DIR / f"{key}.stl"
    out = OUT_DIR / f"{key}.glb"
    meta = OUT_DIR / f"{key}.meta.json"

    model = cq.importers.importStep(str(source))
    cq.exporters.export(
        model,
        str(stl),
        tolerance=0.16,
        angularTolerance=0.3,
    )

    mesh = load_mesh(stl)
    mesh.apply_scale(0.001)  # millimetres -> metres

    source_faces = int(len(mesh.faces))
    max_faces = int(info["max_faces"])
    if source_faces > max_faces:
        mesh = mesh.simplify_quadric_decimation(face_count=max_faces)
        mesh.process(validate=True)
        mesh.remove_unreferenced_vertices()

    bounds = mesh.bounds.copy()
    center = bounds.mean(axis=0)
    mesh.apply_translation([-center[0], -bounds[0][1], -center[2]])

    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        face_colors=np.tile(
            np.array([170, 180, 186, 255], dtype=np.uint8),
            (len(mesh.faces), 1),
        ),
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out.write_bytes(mesh.export(file_type="glb"))
    size = out.stat().st_size
    if size > int(info["max_bytes"]):
        raise RuntimeError(f"{key} GLB too large: {size} bytes")

    extents = [float(v) for v in mesh.extents]
    largest = max(extents)
    if key == "display-assembly":
        if not 0.20 <= largest <= 0.40:
            raise RuntimeError(f"Unexpected display size: {extents}")
    elif not 0.01 <= largest <= 0.12:
        raise RuntimeError(f"Unexpected service-part size for {key}: {extents}")

    metadata = {
        "source": "FrameworkComputer/Framework-Laptop-13",
        "source_commit": SOURCE_COMMIT,
        "source_path": info["source_path"],
        "source_blob": info["blob"],
        "license": "CC-BY-4.0",
        "modified": True,
        "conversion": "STEP -> STL (CadQuery) -> optimized neutral-material GLB (trimesh)",
        "source_faces": source_faces,
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_m": [round(v, 6) for v in extents],
        "glb_bytes": size,
        "release_status": "candidate-for-laptop-anatomy-teardown",
    }
    meta.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


def main() -> None:
    results = {}
    for key, info in SOURCES.items():
        results[key] = convert(key, info)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
