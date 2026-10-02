"""Convert Framework's official Laptop 13 mainboard mechanical outline to GLB.

The published DXF contains two complete mechanical views plus dimensions and
annotation geometry. Instead of polygonizing the whole drawing sheet, this
converter traces the large closed LINE/ARC cycle in the left mechanical view.
That cycle is the real board/fan service outline used by Framework's drawing.
"""

from __future__ import annotations

import json
from collections import defaultdict, deque
from pathlib import Path

import ezdxf
import numpy as np
import trimesh
from ezdxf.path import make_path
from shapely.geometry import Polygon

SOURCE = Path("asset-work/framework-laptop-13-mainboard.dxf")
OUT = Path("public/models/framework-laptop-13-mainboard.glb")
META = Path("public/models/framework-laptop-13-mainboard.meta.json")

PCB_THICKNESS_MM = 1.2
MAX_GLB_BYTES = 5 * 1024 * 1024
ENDPOINT_TOLERANCE_MM = 0.15
LEFT_VIEW = (45.0, 155.0, 290.0, 275.0)


def endpoint_key(point: tuple[float, float]) -> tuple[int, int]:
    return (
        round(point[0] / ENDPOINT_TOLERANCE_MM),
        round(point[1] / ENDPOINT_TOLERANCE_MM),
    )


def primitive_points(entity) -> list[tuple[float, float]] | None:
    kind = entity.dxftype()

    if kind == "LINE":
        start = entity.dxf.start
        end = entity.dxf.end
        return [(float(start.x), float(start.y)), (float(end.x), float(end.y))]

    if kind == "ARC":
        try:
            path = make_path(entity)
            points = [
                (float(point.x), float(point.y))
                for point in path.flattening(distance=0.12)
            ]
            return points if len(points) >= 2 else None
        except Exception:
            return None

    return None


def in_left_view(points: list[tuple[float, float]]) -> bool:
    min_x, min_y, max_x, max_y = LEFT_VIEW
    return any(
        min_x <= x <= max_x and min_y <= y <= max_y
        for x, y in points
    )


def trace_candidate(modelspace) -> tuple[list[tuple[float, float]], dict[str, object]]:
    edges: list[dict[str, object]] = []
    adjacency: dict[tuple[int, int], list[int]] = defaultdict(list)

    for entity in modelspace:
        points = primitive_points(entity)
        if not points or not in_left_view(points):
            continue

        start_key = endpoint_key(points[0])
        end_key = endpoint_key(points[-1])
        index = len(edges)
        edges.append(
            {
                "points": points,
                "start": start_key,
                "end": end_key,
                "kind": entity.dxftype(),
            }
        )
        adjacency[start_key].append(index)
        adjacency[end_key].append(index)

    seen_nodes: set[tuple[int, int]] = set()
    components: list[dict[str, object]] = []

    for start in adjacency:
        if start in seen_nodes:
            continue

        queue = deque([start])
        seen_nodes.add(start)
        nodes: set[tuple[int, int]] = set()
        edge_ids: set[int] = set()

        while queue:
            node = queue.popleft()
            nodes.add(node)
            for edge_id in adjacency[node]:
                edge_ids.add(edge_id)
                edge = edges[edge_id]
                other = edge["end"] if edge["start"] == node else edge["start"]
                if other not in seen_nodes:
                    seen_nodes.add(other)
                    queue.append(other)

        points = [
            point
            for edge_id in edge_ids
            for point in edges[edge_id]["points"]
        ]
        if not points:
            continue

        xs = [point[0] for point in points]
        ys = [point[1] for point in points]
        width = max(xs) - min(xs)
        height = max(ys) - min(ys)

        components.append(
            {
                "nodes": nodes,
                "edge_ids": edge_ids,
                "width": width,
                "height": height,
                "min_x": min(xs),
                "max_x": max(xs),
                "min_y": min(ys),
                "max_y": max(ys),
            }
        )

    candidates = [
        component
        for component in components
        if 220.0 <= component["width"] <= 240.0
        and 100.0 <= component["height"] <= 112.0
        and len(component["edge_ids"]) >= 120
        and component["min_x"] < 100.0
    ]

    if not candidates:
        diagnostics = sorted(
            (
                {
                    "edges": len(component["edge_ids"]),
                    "width_mm": round(float(component["width"]), 3),
                    "height_mm": round(float(component["height"]), 3),
                    "min_x": round(float(component["min_x"]), 3),
                    "min_y": round(float(component["min_y"]), 3),
                }
                for component in components
            ),
            key=lambda item: item["edges"],
            reverse=True,
        )[:12]
        raise RuntimeError(
            "Could not locate Framework mainboard mechanical cycle: "
            + json.dumps(diagnostics)
        )

    component = max(candidates, key=lambda item: len(item["edge_ids"]))
    edge_ids: set[int] = component["edge_ids"]
    component_nodes: set[tuple[int, int]] = component["nodes"]

    local_adjacency: dict[tuple[int, int], list[int]] = defaultdict(list)
    for edge_id in edge_ids:
        edge = edges[edge_id]
        local_adjacency[edge["start"]].append(edge_id)
        local_adjacency[edge["end"]].append(edge_id)

    bad_nodes = [
        node for node in component_nodes if len(local_adjacency[node]) != 2
    ]
    if bad_nodes:
        raise RuntimeError(
            f"Mechanical outline is not a simple cycle; {len(bad_nodes)} "
            "nodes do not have degree 2"
        )

    start_node = min(
        component_nodes,
        key=lambda node: (
            node[0],
            node[1],
        ),
    )

    ordered: list[tuple[float, float]] = []
    current = start_node
    previous_edge: int | None = None

    for _ in range(len(edge_ids) + 1):
        choices = [
            edge_id
            for edge_id in local_adjacency[current]
            if edge_id != previous_edge
        ]
        if not choices:
            break

        edge_id = choices[0]
        edge = edges[edge_id]
        forward = edge["start"] == current
        points = list(edge["points"] if forward else reversed(edge["points"]))

        if ordered:
            points = points[1:]
        ordered.extend(points)

        current = edge["end"] if forward else edge["start"]
        previous_edge = edge_id
        if current == start_node:
            break

    if current != start_node:
        raise RuntimeError("Mechanical outline traversal did not close")

    if ordered[0] != ordered[-1]:
        ordered.append(ordered[0])

    polygon = Polygon(ordered)
    if not polygon.is_valid:
        polygon = polygon.buffer(0)

    if polygon.is_empty:
        raise RuntimeError("Traced mainboard outline produced an empty polygon")

    if polygon.geom_type == "MultiPolygon":
        polygon = max(polygon.geoms, key=lambda item: item.area)

    polygon = polygon.simplify(0.10, preserve_topology=True)

    diagnostics = {
        "edge_count": len(edge_ids),
        "trace_points": len(ordered),
        "width_mm": round(float(component["width"]), 3),
        "height_mm": round(float(component["height"]), 3),
        "drawing_bounds_mm": [
            round(float(component["min_x"]), 3),
            round(float(component["min_y"]), 3),
            round(float(component["max_x"]), 3),
            round(float(component["max_y"]), 3),
        ],
        "area_mm2": round(float(polygon.area), 2),
    }
    return list(polygon.exterior.coords), diagnostics


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    doc = ezdxf.readfile(SOURCE)
    outline_points, diagnostics = trace_candidate(doc.modelspace())
    outline = Polygon(outline_points)

    mesh = trimesh.creation.extrude_polygon(
        outline,
        height=PCB_THICKNESS_MM,
        engine="earcut",
    )

    mesh.apply_scale(0.001)

    transform = trimesh.transformations.rotation_matrix(
        np.radians(90.0),
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
        "source_file": "Mainboard/2D/fw_main_pcb_generic_2_w_fan_2.dxf",
        "source_commit": "57a01b214c70c924dcd60006c7fd4d753e94e86f",
        "source_blob": "4269a2ae1e934b397d9dd21f8d9044f199156dad",
        "license": "CC-BY-4.0",
        "modified": True,
        "conversion": (
            "DXF left mechanical-view LINE/ARC cycle -> traced silhouette -> "
            "1.2 mm extruded GLB, oriented to Laptop Lab X/Z axes"
        ),
        "diagnostics": diagnostics,
        "output_faces": int(len(mesh.faces)),
        "output_vertices": int(len(mesh.vertices)),
        "extents_mm": extents_mm,
        "glb_bytes": size,
        "release_status": "approved-for-laptop-anatomy-outline",
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
