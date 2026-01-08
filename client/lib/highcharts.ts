import Highcharts from "highcharts";

// Register modules synchronously with error handling
function registerModules() {
  try {
    // Map module
    try {
      const mapModule = require("highcharts/modules/map");
      const mapFn = mapModule.default || mapModule;
      if (typeof mapFn === "function") {
        mapFn(Highcharts);
        console.log("✓ Map module registered");
      }
    } catch (e) {
      console.warn("Map module loading skipped:", e);
    }

    // Exporting module
    try {
      const exportingModule = require("highcharts/modules/exporting");
      const exportingFn = exportingModule.default || exportingModule;
      if (typeof exportingFn === "function") {
        exportingFn(Highcharts);
        console.log("✓ Exporting module registered");
      }
    } catch (e) {
      console.warn("Exporting module loading skipped:", e);
    }

    // Export Data module
    try {
      const exportDataModule = require("highcharts/modules/export-data");
      const exportDataFn = exportDataModule.default || exportDataModule;
      if (typeof exportDataFn === "function") {
        exportDataFn(Highcharts);
        console.log("✓ Export Data module registered");
      }
    } catch (e) {
      console.warn("Export Data module loading skipped:", e);
    }
  } catch (error) {
    console.error("Error registering Highcharts modules:", error);
  }
}

// Register modules on module load
registerModules();

export default Highcharts;
