"""Build the self-hosted land-outline basemap for the EPIC map.

Reads a Natural Earth land TopoJSON (world-atlas land-110m) and converts it to
a plain GeoJSON FeatureCollection with rounded coordinates. The output is
intentionally a land silhouette: no country borders and no place-name labels.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "tmp" / "land-110m.json"
DEFAULT_OUTPUT = ROOT / "data" / "v1" / "land-110m.geojson"


def decode_arc(arc, transform):
    scale_x, scale_y = transform["scale"]
    translate_x, translate_y = transform["translate"]
    points = []
    previous_x = 0.0
    previous_y = 0.0
    for delta_x, delta_y in arc:
        previous_x += delta_x
        previous_y += delta_y
        lon = round(translate_x + scale_x * previous_x, 2)
        lat = round(translate_y + scale_y * previous_y, 2)
        if points and points[-1][0] == lon and points[-1][1] == lat:
            continue
        points.append([lon, lat])
    return points


def ring_from_arcs(arc_indices, arcs, transform):
    ring = []
    for index in arc_indices:
        if index >= 0:
            decoded = decode_arc(arcs[index], transform)
        else:
            decoded = list(reversed(decode_arc(arcs[~index], transform)))
        if ring and decoded and ring[-1] == decoded[0]:
            decoded = decoded[1:]
        ring.extend(decoded)
    return ring


def polygon_coordinates(arc_groups, arcs, transform):
    polygons = []
    for group in arc_groups:
        ring = ring_from_arcs(group, arcs, transform)
        if ring:
            polygons.append(ring)
    return polygons


def convert(topology):
    transform = topology.get("transform")
    if not transform:
        raise ValueError("missing quantized transform; expected world-atlas output")
    arcs = topology["arcs"]
    features = []
    objects = topology.get("objects", {})
    for name, obj in objects.items():
        geometries = obj.get("geometries", [obj]) if obj.get("type") == "GeometryCollection" else [obj]
        for geometry in geometries:
            kind = geometry["type"]
            coordinates = []
            if kind == "MultiPolygon":
                for polygon_groups in geometry["arcs"]:
                    polygon = polygon_coordinates(polygon_groups, arcs, transform)
                    if polygon:
                        coordinates.append(polygon)
            elif kind == "Polygon":
                coordinates = polygon_coordinates(geometry["arcs"], arcs, transform)
            if not coordinates:
                continue
            feature_type = "Polygon" if kind == "Polygon" else "MultiPolygon"
            features.append({
                "type": "Feature",
                "properties": {"layer": name},
                "geometry": {"type": feature_type, "coordinates": coordinates},
            })
    return {"type": "FeatureCollection", "features": features}


def main():
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    topology = json.loads(input_path.read_text(encoding="utf-8"))
    collection = convert(topology)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(collection, ensure_ascii=False, separators=(",", ":"))
    output_path.write_text(payload, encoding="utf-8")
    ring_count = sum(len(f["geometry"]["coordinates"]) for f in collection["features"])
    print("wrote {}: {} features, {} rings, {} bytes".format(
        output_path.relative_to(ROOT), len(collection["features"]), ring_count, len(payload)
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
