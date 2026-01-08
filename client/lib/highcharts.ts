import Highcharts from "highcharts";
import HighchartsMap from "highcharts/modules/map";
import Exporting from "highcharts/modules/exporting";
import ExportData from "highcharts/modules/export-data";

// Initialize modules once
HighchartsMap(Highcharts);
Exporting(Highcharts);
ExportData(Highcharts);

export default Highcharts;
