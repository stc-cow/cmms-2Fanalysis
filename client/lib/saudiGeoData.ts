// Saudi Arabia regions GeoJSON data with movement statistics
export const saudiRegions = [
  {
    id: "sa-western",
    name: "Western Region",
    properties: {
      regions: ["Makkah", "Medina", "Tabuk"],
      capital: "Makkah",
    },
  },
  {
    id: "sa-central",
    name: "Central Region",
    properties: {
      regions: ["Riyadh", "Al Qassim"],
      capital: "Riyadh",
    },
  },
  {
    id: "sa-eastern",
    name: "Eastern Province",
    properties: {
      regions: ["Eastern Province", "Ash Sharqiyah"],
      capital: "Dammam",
    },
  },
  {
    id: "sa-southern",
    name: "Southern Region",
    properties: {
      regions: ["Asir", "Jizan", "Najran"],
      capital: "Abha",
    },
  },
  {
    id: "sa-northern",
    name: "Northern Region",
    properties: {
      regions: ["Ha'il", "Al Jaof"],
      capital: "Ha'il",
    },
  },
];

// Simplified Saudi Arabia region centers (latitude, longitude)
export const regionCenters: Record<string, { lat: number; lon: number; value?: number }> = {
  "Makkah": { lat: 21.4267, lon: 39.8173 },
  "Medina": { lat: 24.4672, lon: 39.6028 },
  "Tabuk": { lat: 28.3826, lon: 36.5627 },
  "Riyadh": { lat: 24.7136, lon: 46.6753 },
  "Al Qassim": { lat: 26.3167, lon: 44.0167 },
  "Eastern Province": { lat: 26.1552, lon: 50.1566 },
  "Ash Sharqiyah": { lat: 26.1552, lon: 50.1566 },
  "Ha'il": { lat: 27.1887, lon: 41.7283 },
  "Al Jaof": { lat: 29.7833, lon: 40.4 },
  "Asir": { lat: 19.0, lon: 42.5 },
  "Jizan": { lat: 16.8892, lon: 42.5553 },
  "Najran": { lat: 17.4960, lon: 44.1220 },
};

// Region boundary coordinates for polygon drawing (simplified)
export const saudiMapTopology = {
  type: "Topology",
  objects: {
    regions: {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Polygon",
          name: "Makkah",
          arcs: [[1]],
        },
        {
          type: "Polygon",
          name: "Medina",
          arcs: [[2]],
        },
        {
          type: "Polygon",
          name: "Tabuk",
          arcs: [[3]],
        },
        {
          type: "Polygon",
          name: "Riyadh",
          arcs: [[4]],
        },
        {
          type: "Polygon",
          name: "Al Qassim",
          arcs: [[5]],
        },
        {
          type: "Polygon",
          name: "Eastern Province",
          arcs: [[6]],
        },
        {
          type: "Polygon",
          name: "Ha'il",
          arcs: [[7]],
        },
        {
          type: "Polygon",
          name: "Al Jaof",
          arcs: [[8]],
        },
        {
          type: "Polygon",
          name: "Asir",
          arcs: [[9]],
        },
        {
          type: "Polygon",
          name: "Jizan",
          arcs: [[10]],
        },
        {
          type: "Polygon",
          name: "Najran",
          arcs: [[11]],
        },
        {
          type: "Polygon",
          name: "Ash Sharqiyah",
          arcs: [[12]],
        },
      ],
    },
  },
  transform: {
    scale: [1, 1],
    translate: [0, 0],
  },
  arcs: [
    [[0, 0]],
    [[39.8, 21.4], [40, 21.5], [40, 22], [39.5, 22], [39.8, 21.4]],
    [[39.6, 24.4], [39.8, 24.5], [40, 24.8], [39.5, 24.8], [39.6, 24.4]],
    [[36.5, 28.4], [37, 28.5], [37.5, 29], [36.5, 29], [36.5, 28.4]],
    [[46, 24], [47, 24.5], [47, 25.5], [46, 25], [46, 24]],
    [[43.5, 25.5], [45, 26], [45.5, 27], [43.5, 27], [43.5, 25.5]],
    [[49.5, 26], [50.5, 26.5], [51, 27.5], [50, 27], [49.5, 26]],
    [[40.5, 27], [42, 27.5], [42.5, 28.5], [40.5, 28], [40.5, 27]],
    [[39.5, 29.5], [41, 30], [41.5, 31], [39.5, 31], [39.5, 29.5]],
    [[41.5, 18.5], [43, 19], [43.5, 20.5], [41.5, 20], [41.5, 18.5]],
    [[41.5, 16], [43, 16.5], [43.5, 17.5], [42, 17], [41.5, 16]],
    [[43.5, 17], [44.5, 17.5], [45, 18.5], [43.5, 18], [43.5, 17]],
    [[49.5, 26], [51, 26.5], [51.5, 27.5], [50, 27], [49.5, 26]],
  ],
};

// Convert region data to Highcharts format
export function getRegionData(
  regionMetrics: Record<string, number>,
  maxValue: number
): Array<{ name: string; value: number }> {
  const regions = Object.keys(regionCenters);
  return regions.map((region) => ({
    name: region,
    value: regionMetrics[region] || 0,
  }));
}

// Map region names to their properties
export const regionProperties: Record<string, { color: string; intensity: string }> = {
  "Makkah": { color: "#805ad5", intensity: "rgba(128, 90, 213, 0.6)" },
  "Medina": { color: "#9333ea", intensity: "rgba(147, 51, 234, 0.6)" },
  "Tabuk": { color: "#d8b4fe", intensity: "rgba(216, 180, 254, 0.6)" },
  "Riyadh": { color: "#7e22ce", intensity: "rgba(126, 34, 206, 0.6)" },
  "Al Qassim": { color: "#a855f7", intensity: "rgba(168, 85, 247, 0.6)" },
  "Eastern Province": { color: "#6b21a8", intensity: "rgba(107, 33, 168, 0.6)" },
  "Ash Sharqiyah": { color: "#ddd6fe", intensity: "rgba(221, 214, 254, 0.6)" },
  "Ha'il": { color: "#c084fc", intensity: "rgba(192, 132, 252, 0.6)" },
  "Al Jaof": { color: "#e9d5ff", intensity: "rgba(233, 213, 255, 0.6)" },
  "Asir": { color: "#9f7aea", intensity: "rgba(159, 122, 234, 0.6)" },
  "Jizan": { color: "#d6bcfa", intensity: "rgba(214, 188, 250, 0.6)" },
  "Najran": { color: "#e9d5ff", intensity: "rgba(233, 213, 255, 0.6)" },
};

// Get color based on intensity (0-1 scale)
export function getIntensityColor(intensity: number): string {
  // Map intensity to color from light purple to dark purple
  const colors = [
    "#f3e8ff", // 0.0
    "#e9d5ff", // 0.1
    "#ddd6fe", // 0.2
    "#d6bcfa", // 0.3
    "#c084fc", // 0.4
    "#a855f7", // 0.5
    "#9333ea", // 0.6
    "#805ad5", // 0.7
    "#7e22ce", // 0.8
    "#6b21a8", // 0.9
    "#581c87", // 1.0
  ];

  const index = Math.min(10, Math.floor(intensity * 10));
  return colors[index];
}
