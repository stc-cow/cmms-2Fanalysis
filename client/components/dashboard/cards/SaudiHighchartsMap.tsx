import { useMemo } from "react";
import Highcharts from "@/lib/highcharts";
import HighchartsReact from "highcharts-react-official";
import saudiGeo from "@highcharts/map-collection/countries/sa/sa-all.geo.json";
import { regionToHcKey } from "@/lib/saudiRegionMapping";

interface SaudiHighchartsMapProps {
  regionMetrics: Record<string, number>;
  maxMetric: number;
  title?: string;
  totalMovements?: number;
}

export function SaudiHighchartsMap({
  regionMetrics,
  maxMetric,
  title = "Movements by Region",
  totalMovements = 0,
}: SaudiHighchartsMapProps) {
  // Transform region metrics to Highcharts data format: [["sa-ri", 320], ["sa-mk", 180], ...]
  const chartData = useMemo(() => {
    return Object.entries(regionMetrics)
      .map(([regionName, value]) => {
        const hcKey = regionToHcKey[regionName];
        if (!hcKey) {
          console.warn(`No mapping found for region: ${regionName}`);
          return null;
        }
        return [hcKey, value] as [string, number];
      })
      .filter((item) => item !== null) as [string, number][];
  }, [regionMetrics]);

  const options: Highcharts.Options = {
    chart: {
      map: saudiGeo,
      backgroundColor: "transparent",
      borderWidth: 0,
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
    },
    title: {
      text: null,
    },
    subtitle: {
      text: null,
    },
    mapNavigation: {
      enabled: false,
    },
    colorAxis: {
      min: 0,
      max: maxMetric > 0 ? maxMetric : 1,
      type: "linear",
      minColor: "#efe6f6",
      maxColor: "#6a1b9a",
      stops: [
        [0, "#efe6f6"],
        [0.25, "#d8b4fe"],
        [0.5, "#b39ddb"],
        [0.75, "#9c27b0"],
        [1, "#6a1b9a"],
      ],
      labels: {
        format: "{value}",
      },
    },
    legend: {
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      enabled: true,
      margin: 10,
      symbolWidth: 12,
    },
    plotOptions: {
      map: {
        dataLabels: {
          enabled: true,
          format: "{point.properties.name}",
          style: {
            fontSize: "11px",
            fontWeight: "600",
            color: "#1f2937",
            textOutline: "1px 1px white",
            textShadow: "none",
          },
        },
        states: {
          hover: {
            brightness: 0.1,
            borderColor: "#ffffff",
            borderWidth: 2,
            shadow: true,
          },
        },
        borderColor: "#e5e7eb",
        borderWidth: 1,
        nullColor: "#f3f4f6",
        animation: {
          duration: 300,
        },
      },
    },
    series: [
      {
        type: "map",
        name: "Movements",
        data: chartData,
        joinBy: ["hc-key", 0],
        tooltip: {
          headerFormat: "",
          pointFormat:
            "<b>{point.properties.name}</b><br/>Movements: <strong>{point.value:,.0f}</strong>",
        },
        states: {
          hover: {
            brightness: 0.1,
          },
        },
      } as any,
    ],
    exporting: {
      buttons: {
        contextButton: {
          menuItems: [
            "downloadPNG",
            "downloadJPEG",
            "downloadPDF",
            "downloadSVG",
            "separator",
            "viewFullscreen",
          ],
          symbolFill: "#6a1b9a",
        },
      },
      csv: {
        dateFormat: "%Y-%m-%d",
      },
    },
    credits: {
      enabled: false,
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>≡</span> {title}
      </h3>

      {/* Map Container */}
      <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-slate-700">
        <HighchartsReact
          highcharts={Highcharts}
          constructorType="mapChart"
          options={options}
          containerProps={{
            style: { width: "100%", height: "100%" },
          }}
          immutable={false}
        />
      </div>

      {/* KPI Display */}
      {totalMovements > 0 && (
        <div className="text-center py-3 mt-4 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Total Movements:{" "}
            <span className="text-purple-600 dark:text-purple-400">
              {totalMovements}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
