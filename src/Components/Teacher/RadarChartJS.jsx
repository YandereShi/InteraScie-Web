import { useEffect, useRef, useState } from "react";
import { Chart, Filler, LineElement, PointElement, RadarController, RadialLinearScale, Tooltip } from "chart.js";

Chart.register(RadarController, RadialLinearScale, LineElement, PointElement, Filler, Tooltip);

function FillColor(hex, opacity) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function RadarChartJS({ levels, series, compact = false }) {
  const canvasRef = useRef(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!canvasRef.current || levels.length === 0) return undefined;

    const chartSeries = series ?? [{
      id: "all",
      name: "All sections",
      color: "#00BF63",
      values: levels.map((level) => level.accuracy),
    }];
    const chart = new Chart(canvasRef.current, {
      type: "radar",
      data: {
        labels: levels.map((level, index) =>
          `${level.branchName?.[0] ?? "L"}${String(level.levelName ?? "").trim().match(/\d+$/)?.[0] ?? index + 1}`
        ),
        datasets: chartSeries.map((item) => ({
          label: item.name,
          data: item.values.map((value) => value ?? 0),
          borderColor: item.color,
          backgroundColor: FillColor(item.color, compact ? 0.3 : 0.25),
          pointBackgroundColor: item.color,
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 2,
          pointRadius: compact ? 3 : 5,
          pointHoverRadius: compact ? 4 : 7,
          pointHitRadius: compact ? 5 : 14,
          borderWidth: compact ? 3 : 2.5,
          fill: true,
          spanGaps: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "nearest", intersect: true },
        onClick: (_, elements) => {
          if (compact || elements.length === 0) return;
          const { datasetIndex, index } = elements[0];
          const level = levels[index];
          const item = chartSeries[datasetIndex];
          const value = item.values[index];
          setSelected(`${item.name} · ${level.branchName} ${level.levelName}: ${value === null || value === undefined ? "0% (no score yet)" : `${value}% correct`}`);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !compact,
            callbacks: {
              title: (items) => {
                const level = levels[items[0]?.dataIndex];
                return level ? `${level.branchName} ${level.levelName}` : "";
              },
              label: (item) => {
                const value = chartSeries[item.datasetIndex].values[item.dataIndex];
                return value === null || value === undefined
                  ? `${item.dataset.label}: 0% (no score yet)`
                  : `${item.dataset.label}: ${value}% correct`;
              },
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            angleLines: { color: "#E4ECE6" },
            grid: { color: "#D6E4DB" },
            pointLabels: {
              color: "#355445",
              padding: compact ? 3 : 8,
              font: { family: "Arial, sans-serif", size: compact ? 10 : 12, weight: "bold" },
            },
            ticks: {
              display: !compact,
              stepSize: 25,
              color: "#526A5C",
              backdropColor: "#F8FBF9",
              font: { size: 10 },
              callback: (value) => value === 0 ? "0" : `${value}%`,
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [compact, levels, series]);

  return (
    <>
      <span className={compact ? "dashboardradarchart" : "radarpopupchart"}>
        <canvas ref={canvasRef} role="img" aria-label="Assessment accuracy radar graph for all levels" />
      </span>
      {!compact && selected && <span className="radarpopupselection" aria-live="polite">{selected}</span>}
    </>
  );
}

export default RadarChartJS;
