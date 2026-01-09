import Highcharts from "highcharts";

// Track if modules have been initialized
let modulesInitialized = false;

/**
 * Initialize Highcharts modules dynamically
 * This function can be called from components that need the modules
 */
export async function ensureHighchartsModules() {
  if (modulesInitialized || typeof window === "undefined") {
    return;
  }

  try {
    // Check if modules are already on the global Highcharts object
    if (
      (Highcharts as any).mapChart &&
      (Highcharts as any).Chart.prototype.getCSV
    ) {
      modulesInitialized = true;
      return;
    }

    // Import modules dynamically
    const mapModule = await import("highcharts/modules/map.js");
    const exportingModule = await import("highcharts/modules/exporting.js");
    const exportDataModule = await import("highcharts/modules/export-data.js");

    // Get the actual function from the module (handle both ES and CommonJS exports)
    const mapFn = (mapModule as any).default || mapModule;
    const exportingFn = (exportingModule as any).default || exportingModule;
    const exportDataFn = (exportDataModule as any).default || exportDataModule;

    // Register modules
    if (typeof mapFn === "function") {
      mapFn(Highcharts);
    }
    if (typeof exportingFn === "function") {
      exportingFn(Highcharts);
    }
    if (typeof exportDataFn === "function") {
      exportDataFn(Highcharts);
    }

    modulesInitialized = true;
    console.log("✓ Highcharts modules initialized");
  } catch (error) {
    console.error("Failed to initialize Highcharts modules:", error);
    // Don't throw - let the component handle missing modules
  }
}

export default Highcharts;
