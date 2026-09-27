import RadarChartJS from "./RadarChartJS";

function DashboardRadar({ levels, loading, error, onOpen }) {
  const scored = levels.filter((level) => level.accuracy !== null).length;

  return (
    <button
      className="dashboardradar dashboardtile"
      type="button"
      onClick={onOpen}
      aria-label="Open radar graph details"
      aria-haspopup="dialog"
    >
      <span className="dashboardtilehead">
        <span className="dashboardradartitle">Radar Graph</span>
        <span>All levels</span>
      </span>

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
    </button>
  );
}

export default DashboardRadar;
