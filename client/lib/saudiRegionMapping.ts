// Mapping of region names to Highcharts map region keys
export const regionToHcKey: Record<string, string> = {
  "Riyadh": "sa-ri",
  "Makkah": "sa-mk",
  "Madinah": "sa-md",
  "Medina": "sa-md",
  "Eastern": "sa-sh",
  "Eastern Province": "sa-sh",
  "Ash Sharqiyah": "sa-sh",
  "Asir": "sa-as",
  "Tabuk": "sa-tb",
  "Ha'il": "sa-ha",
  "Hail": "sa-ha",
  "Northern Border": "sa-nb",
  "Jazan": "sa-jz",
  "Jizan": "sa-jz",
  "Najran": "sa-nj",
  "Al Jawf": "sa-jf",
  "Qassim": "sa-qs",
  "Al Qassim": "sa-qs",
};

// Inverse mapping for display purposes
export const hcKeyToRegionName: Record<string, string> = {
  "sa-ri": "Riyadh",
  "sa-mk": "Makkah",
  "sa-md": "Madinah",
  "sa-sh": "Eastern Province",
  "sa-as": "Asir",
  "sa-tb": "Tabuk",
  "sa-ha": "Ha'il",
  "sa-nb": "Northern Border",
  "sa-jz": "Jazan",
  "sa-nj": "Najran",
  "sa-jf": "Al Jawf",
  "sa-qs": "Qassim",
};

// Map region names to hc-key format for Highcharts
export function normalizeRegionName(region: string): string {
  return regionToHcKey[region] || "sa-ri"; // Default to Riyadh if not found
}
