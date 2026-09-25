"""Convert Framework's official Laptop 13 mainboard DXF outline into a web GLB.

This extracts the largest plausible closed PCB outline from Framework's published
2D mechanical drawing, extrudes it to representative PCB thickness, and exports
a neutral-material GLB. It is an asset-build tool only and is not bundled into
student browsers.
"""

from __future__ import annotations

import json
from pathlib import Path

import ezdxf
import numpy as np
import trimesh
from ezdxf.path import make_path
from shapely.geometry import LineString
from shapely.ops import polygonize, unary_union

SOURCE = Path("asset-work/framework-laptop-13-mainboard.dxf")
OUT = Path("public/models/framework-laptop-13-mainboard.glb")
META = Path("public/models/framework-laptop-13-mainboard.meta.json")

PCB_THICKNESS_MM = 1.2
MAX_GLB_BYTES = 5 * 1024 * 1024


def linework_from_entity(entity):
    kind = entity.dxftype()
    if kind == "LINE":
        start = entity.dxf.start
        end = entity.dxf.end
        return [LineString([(start.x, start.y), (end.x, end.y)])]

    if kind in {
        "LWPOLYLINE",
        "POLYLINE",
        "ARC",
        "CIRCLE",
        "ELLIPSE",
        "SPLINE",
    }:
        try:
            path = make_path(entity)
            points = [(point.x, point.y) for point in path.flattening(distance=0.18)]
            if len(points) < 2:
                return []
            if kind in {"CIRCLE"} and points[0] != points[-1]:
                points.append(points[0])
            return [LineString(points)]
        except Exception:
            return []

    return []


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    doc = ezdxf.readfile(SOURCE)
    modelspace = doc.modelspace()

    lines = []
    for entity in modelspace:
        lines.extend(linework_from_entity(entity))

    if not lines:
        raise RuntimeError("DXF produced no supported linework")

    merged = unary_union(lines)
    polygons = list(polygonize(merged))
    diagnostics = []
    candidates = []

    for polygon in polygons:
        min_x, min_y, max_x, max_y = polygon.bounds
        width = max_x - min_x
        height = max_y - min_y
        area = polygon.area
        diagnostics.append(
            {
                "area_mm2": round(area, 2),
                "width_mm": round(width, 2),
                "height_mm": round(height, 2),
            }
        )

        long_side = max(width, height)
        short_side = min(width, height)
        if (
            150 <= long_side <= 320
            and 45 <= short_side <= 180
            and 5000 <= area <= 50000
        ):
            candidates.append(polygon)

    diagnostics.sort(key=lambda item: item["area_mm2"], reverse=True)

    if not candidates:
        raise RuntimeError(
            "Could not identify a plausible PCB outline. Top polygons: "
            + json.dumps(diagnostics[:12])
        )

    outline = max(candidates, key=lambda polygon: polygon.area)

    # Keep the exact outer silhouette. Internal linework in the engineering
    # drawing includes component footprints and annotations, so it is not
    # interpreted as PCB cut-outs here.
    mesh = trimesh.creation.extrude_polygon(
        outline,
        height=PCB_THICKNESS_MM,
        engine="earcut",
    )

    # DXF is in millimetres. glTF convention is metres.
    mesh.apply_scale(0.001)

    # Put PCB thickness on Y so it sits naturally in the Three.js laptop scene.
    transform = trimesh.transformations.rotation_matrix(
        np.radians(-90.0),
        [1.0, 0.0, 0.0],
    )
    mesh.apply_transform(transform)

    bounds = mesh.bounds.copy()
    center = bounds.mean(axis=0)
    mesh.apply_translation([-center[0], -bounds[0][1], -center[2]])

    mesh.visual = trimesh.visual.ColorVisuals(
        mesh=mesh,
        face_colors=np.tile(
            np.array([37, 89, 78, 255], dtype=np.uint8),
            (len(mesh.faces), 1),
        ),
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(mesh.export(file_type="glb"))
    size = OUT.stat().st_size
    if size > MAX_GLB_BYTES:
        raise RuntimeError(
            f"Mainboard GLB is {size / 1024 / 1024:.1f} MB; limit is 5 MB"
        )

    extents_mm = [round(float(value * 1000), 3) for value in mesh.extents]
    metadata = {
        "source": "FrameworkComputer/Framework-Laptop-13",
        "source_file": "Mainboard/2D/fw_main_pcb_generic_2_w_fan_1.dxf",
        "source_commit": "57a01b214c70c924dcd60006c7fd4d753e94e86f",
        "source_blob": "27a971d0988fbe5dc3479e0b5d6922cb9e138f13",
        "license": "CC-BY-4.0",
        "modified": True,
        "conversion": "DXF linework -> polygonized PCB silhouette -> 1.2 mm extruded GLB",
        "selected_area_mm2": round(float(outline.area), 2),
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_mm": extents_mm,
        "glb_bytes": size,
        "candidate_count": len(candidates),
        "top_polygon_diagnostics": diagnostics[:8],
        "release_status": "candidate-pending-visual-alignment-review",
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
