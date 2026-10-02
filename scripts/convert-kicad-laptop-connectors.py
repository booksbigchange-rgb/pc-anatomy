"""Convert a pinned subset of official KiCad STEP connectors into web GLBs.

These are build-time assets only. The student app loads the converted local GLBs
and never contacts KiCad/GitHub at runtime.
"""

from __future__ import annotations

import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

ASSET_DIR = Path("asset-work/kicad")
OUT_DIR = Path("public/models/kicad")

SOURCES = {
    "battery-10pin": {
        "file": "JST_GH_SM10B-GHS-TB_1x10-1MP_P1.25mm_Horizontal.step",
        "source_path": "Connector_JST.3dshapes/JST_GH_SM10B-GHS-TB_1x10-1MP_P1.25mm_Horizontal.step",
        "blob": "382d3b3b4523a93714242cd4cbf765ef186d2f81",
    },
    "fan-speaker-4pin": {
        "file": "JST_GH_SM04B-GHS-TB_1x04-1MP_P1.25mm_Horizontal.step",
        "source_path": "Connector_JST.3dshapes/JST_GH_SM04B-GHS-TB_1x04-1MP_P1.25mm_Horizontal.step",
        "blob": "237bf78bee3acfd66d5dc1ea495a8f4477a1b183",
    },
    "display-41pin": {
        "file": "Molex_502250-4191_2Rows-41Pins-1MP_P0.60mm_Horizontal.step",
        "source_path": "Connector_FFC-FPC.3dshapes/Molex_502250-4191_2Rows-41Pins-1MP_P0.60mm_Horizontal.step",
        "blob": "49a61bf51a0499e92081241127bbb281e128abd0",
    },
    "input-51pin": {
        "file": "Molex_502250-5191_2Rows-51Pins-1MP_P0.60mm_Horizontal.step",
        "source_path": "Connector_FFC-FPC.3dshapes/Molex_502250-5191_2Rows-51Pins-1MP_P0.60mm_Horizontal.step",
        "blob": "3cd4f59afaf2fff0665af6be7c693b3eaef81a7d",
    },
    "audio-15pin": {
        "file": "TE_1-84952-5_1x15-1MP_P1.0mm_Horizontal.step",
        "source_path": "Connector_FFC-FPC.3dshapes/TE_1-84952-5_1x15-1MP_P1.0mm_Horizontal.step",
        "blob": "a1a46c65c6afbfe70dc74b4f945b4d4ee117cd",
    },
}

SOURCE_COMMIT = "b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a"
MAX_FACES = 24_000
MAX_BYTES = 2 * 1024 * 1024


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


def convert(key: str, info: dict[str, str]) -> dict[str, object]:
    source = ASSET_DIR / info["file"]
    stl = ASSET_DIR / f"{key}.stl"
    out = OUT_DIR / f"{key}.glb"
    meta = OUT_DIR / f"{key}.meta.json"

    model = cq.importers.importStep(str(source))
    cq.exporters.export(
        model,
        str(stl),
        tolerance=0.08,
        angularTolerance=0.22,
    )

    mesh = load_mesh(stl)

    # STEP is authored in millimetres. Convert to metres for glTF.
    mesh.apply_scale(0.001)

    # KiCad STEP models use Z as height. Laptop Lab uses Y as height.
    transform = trimesh.transformations.rotation_matrix(
        np.radians(-90.0),
        [1.0, 0.0, 0.0],
    )
    mesh.apply_transform(transform)

    source_faces = int(len(mesh.faces))
    if source_faces > MAX_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=MAX_FACES)
        mesh.process(validate=True)
        mesh.remove_unreferenced_vertices()

    bounds = mesh.bounds.copy()
    center = bounds.mean(axis=0)
    mesh.apply_translation([-center[0], -bounds[0][1], -center[2]])

    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        face_colors=np.tile(
            np.array([204, 207, 201, 255], dtype=np.uint8),
            (len(mesh.faces), 1),
        ),
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out.write_bytes(mesh.export(file_type="glb"))
    size = out.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError(f"{key} GLB exceeds 2 MB: {size}")

    largest = float(max(mesh.extents))
    if not 0.002 <= largest <= 0.08:
        raise RuntimeError(f"{key} has unexpected size: {mesh.extents}")

    metadata = {
        "source": "KiCad/kicad-packages3D",
        "source_commit": SOURCE_COMMIT,
        "source_path": info["source_path"],
        "source_blob": info["blob"],
        "license": "CC-BY-SA-4.0-with-KiCad-library-exception",
        "modified": True,
        "conversion": "STEP -> STL (CadQuery) -> optimized neutral-material GLB (trimesh)",
        "source_faces": source_faces,
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_m": [round(float(value), 6) for value in mesh.extents],
        "glb_bytes": size,
        "release_status": "approved-for-laptop-board-detail",
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
