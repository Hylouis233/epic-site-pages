import unittest

from tools.build_land_base import convert


TOPOLOGY = {
    "type": "Topology",
    "transform": {
        "scale": [0.1, 0.1],
        "translate": [100.0, 0.0],
    },
    "arcs": [
        [[0, 0], [10, 0], [0, 10], [-10, 0], [0, -10]],
    ],
    "objects": {
        "land": {
            "type": "GeometryCollection",
            "geometries": [
                {"type": "Polygon", "arcs": [[0]]},
            ],
        }
    },
}


class BuildLandBaseTests(unittest.TestCase):
    def test_decodes_quantized_polygon(self):
        collection = convert(TOPOLOGY)
        self.assertEqual(collection["type"], "FeatureCollection")
        self.assertEqual(len(collection["features"]), 1)
        geometry = collection["features"][0]["geometry"]
        self.assertEqual(geometry["type"], "Polygon")
        ring = geometry["coordinates"][0]
        self.assertEqual(ring[0], [100.0, 0.0])
        self.assertEqual(ring[1], [101.0, 0.0])
        self.assertEqual(ring[2], [101.0, 1.0])
        self.assertEqual(ring[-1], ring[0])

    def test_rejects_unquantized_input(self):
        with self.assertRaises(ValueError):
            convert({"type": "Topology", "objects": {}})


if __name__ == "__main__":
    unittest.main()
