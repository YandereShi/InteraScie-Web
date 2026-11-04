import RadarChartJS from "./RadarChartJS";
import SchoolYearSelect from "../SchoolYearSelect";

function DashboardRadar({ levels, sections, schoolYear, onSchoolYearChange, loading, error, onOpen }) {
  const scored = levels.filter((level) => level.accuracy !== null).length;

  return (
    <section className="dashboardradar dashboardtile" aria-labelledby="dashboardradartitle">
      <div className="dashboardtilehead">
        <h2 id="dashboardradartitle" className="dashboardradartitle">Radar Graph</h2>
        <SchoolYearSelect sections={sections} value={schoolYear} label="Radar school year" disabled={loading} onChange={onSchoolYearChange} />
      </div>

      <button className="dashboardradaropen" type="button" onClick={onOpen} aria-label="Open radar graph details" aria-haspopup="dialog">

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
    </section>
  );
}

export default DashboardRadar;
