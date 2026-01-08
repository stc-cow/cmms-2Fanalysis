import Highcharts from "highcharts";

// Lazy-load and initialize modules to avoid issues with module imports
let modulesInitialized = false;

export function initializeHighchartsModules() {
  if (modulesInitialized) return;

  try {
    // Dynamically import and register modules
    Promise.all([
      import("highcharts/modules/map.js"),
      import("highcharts/modules/exporting.js"),
      import("highcharts/modules/export-data.js"),
    ]).then(([mapModule, exportingModule, exportDataModule]) => {
      // Handle both default and named exports
      const mapFn = mapModule.default || mapModule;
      const exportingFn = exportingModule.default || exportingModule;
      const exportDataFn = exportDataModule.default || exportDataModule;

      if (typeof mapFn === "function") mapFn(Highcharts);
      if (typeof exportingFn === "function") exportingFn(Highcharts);
      if (typeof exportDataFn === "function") exportDataFn(Highcharts);

      modulesInitialized = true;
      console.log("✓ Highcharts modules initialized");
    });
  } catch (error) {
    console.error("Failed to initialize Highcharts modules:", error);
  }
}

// Initialize modules on import
initializeHighchartsModules();

export default Highcharts;
