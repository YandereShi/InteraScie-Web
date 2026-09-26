import "../../css/RadarGraphPopup.css";
import { useEffect, useRef, useState } from "react";
import RadarChartJS from "./RadarChartJS";

function SectionColor(index) {
  const hue = (index * 137.508 + 20) % 360;
  const saturation = 0.68;
  const lightness = 0.42;
  const spread = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset) => {
    const position = (offset + hue / 30) % 12;
    const value = lightness - spread * Math.max(-1, Math.min(position - 3, 9 - position, 1));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

function RadarGraphPopup({ levels, sections, loading, error, onClose }) {
  const closeButton = useRef(null);
  const [mode, setMode] = useState("all");
  const [hiddenSections, setHiddenSections] = useState(() => new Set());
  const sectionSeries = [...sections]
    .sort((first, second) => String(first.sectionName).localeCompare(String(second.sectionName)) || String(first.sectionID).localeCompare(String(second.sectionID)))
    .map((section, index) => ({
    id: String(section.sectionID),
    name: section.sectionName,
    color: SectionColor(index),
    values: levels.map((level) => level.sectionAccuracies?.[section.sectionID] ?? null),
    }));
  const series = mode === "all"
    ? [{ id: "all", name: "All sections", color: "#00BF63", values: levels.map((level) => level.accuracy) }]
    : sectionSeries.filter((item) => !hiddenSections.has(item.id));
  const hasScores = series.some((item) => item.values.some((value) => value !== null && value !== undefined));

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function HandleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", HandleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", HandleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="radaroverlay" onClick={onClose}>
      <div className="radarpopup" role="dialog" aria-modal="true" aria-labelledby="radarpopuptitle" onClick={(event) => event.stopPropagation()}>
        <div className="radarpopuphead">
          <div>
            <h2 id="radarpopuptitle">Level Accuracy Radar</h2>
            <p>Compare assessment accuracy across all levels.</p>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close radar graph">&times;</button>
        </div>

        <div className="radarpopupcontrols" aria-label="Radar graph view">
          <button type="button" className={mode === "all" ? "radarpopuptab active" : "radarpopuptab"} aria-pressed={mode === "all"} onClick={() => setMode("all")}>All</button>
          <button type="button" className={mode === "single" ? "radarpopuptab active" : "radarpopuptab"} aria-pressed={mode === "single"} onClick={() => setMode("single")}>Single</button>
        </div>

        <div className="radarpopupbody">
          {loading ? (
            <p className="radarpopupstate">Loading level accuracy...</p>
          ) : error ? (
            <p className="radarpopupstate">Unable to load level accuracy.</p>
          ) : levels.length === 0 ? (
            <p className="radarpopupstate">No levels yet.</p>
          ) : (
            <RadarChartJS key={`${mode}:${series.map((item) => item.id).join(",")}`} levels={levels} series={series} />
          )}
          {!loading && !error && levels.length > 0 && series.length === 0 && sections.length > 0 && (
            <p className="radarpopupstate">Choose a section in the legend to show its graph.</p>
          )}
          {!loading && !error && levels.length > 0 && series.length > 0 && !hasScores && (
            <p className="radarpopupstate">No assessment scores yet. These levels are plotted at 0.</p>
          )}
          {!loading && !error && levels.length > 0 && hasScores && (
            <p className="radarpopupnote">Select a dot to see its accuracy. Levels without scores are plotted at 0.</p>
          )}
          {mode === "single" && sections.length > 0 && (
            <div className="radarpoplegend" aria-label="Section graph colors">
              {sectionSeries.map((item) => (
                <button
                  type="button"
                  className={hiddenSections.has(item.id) ? "radarpoplegenditem hidden" : "radarpoplegenditem"}
                  key={item.id}
                  aria-pressed={!hiddenSections.has(item.id)}
                  aria-label={`${hiddenSections.has(item.id) ? "Show" : "Hide"} ${item.name} graph`}
                  onClick={() => setHiddenSections((current) => {
                    const next = new Set(current);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })}
                >
                  <i aria-hidden="true" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          )}
          {mode === "single" && sections.length === 0 && !loading && !error && (
            <p className="radarpopupstate">No sections assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RadarGraphPopup;
