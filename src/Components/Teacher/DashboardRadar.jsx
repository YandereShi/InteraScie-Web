import RadarChartJS from "./RadarChartJS";

function DashboardRadar({ levels, loading, error, onOpen, expanded = false }) {
  const scored = levels.filter((level) => level.accuracy !== null).length;
  const Container = onOpen ? "button" : "div";

  return (
    <Container
      className={`dashboardradar dashboardtile${expanded ? " dashboardradarexpanded" : ""}`}
      type={onOpen ? "button" : undefined}
      onClick={onOpen}
      aria-label={onOpen ? "Open radar graph details" : undefined}
      aria-haspopup={onOpen ? "dialog" : undefined}
    >
      {!expanded && (
        <span className="dashboardtilehead">
          <span className="dashboardradartitle">Radar Graph</span>
          <span>All levels</span>
        </span>
      )}

      {loading ? (
        <span className="dashboardtilemessage">Loading levels...</span>
      ) : error ? (
        <span className="dashboardtilemessage">Unable to load level accuracy.</span>
      ) : levels.length === 0 ? (
        <span className="dashboardtilemessage">No levels yet.</span>
      ) : (
        <>
          <RadarChartJS levels={levels} compact />
          <span className="dashboardradarnote">{scored} of {levels.length} levels have scores</span>
        </>
      )}
    </Container>
  );
}

export default DashboardRadar;
