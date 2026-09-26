function DashboardRadar({ levels, loading, error }) {
  const center = 150;
  const radius = 90;
  const angle = (index) => -Math.PI / 2 + (Math.PI * 2 * index) / levels.length;
  const point = (index, percentage) => {
    const distance = radius * percentage / 100;
    return [
      center + Math.cos(angle(index)) * distance,
      center + Math.sin(angle(index)) * distance,
    ];
  };
  const scored = levels.filter((level) => level.accuracy !== null).length;

  return (
    <section className="dashboardradar dashboardtile" aria-labelledby="dashboardradartitle">
      <div className="dashboardtilehead">
        <h2 id="dashboardradartitle">Radar Graph</h2>
        <span>All levels</span>
      </div>

      {loading ? (
        <p className="dashboardtilemessage">Loading levels...</p>
      ) : error ? (
        <p className="dashboardtilemessage">Unable to load level accuracy.</p>
      ) : levels.length === 0 ? (
        <p className="dashboardtilemessage">No levels yet.</p>
      ) : (
        <>
          <svg className="dashboardradarchart" viewBox="0 0 300 300" role="img" aria-label={`Accuracy recorded for ${scored} of ${levels.length} levels`}>
            {[25, 50, 75, 100].map((value) => (
              <polygon
                key={value}
                points={levels.map((_, index) => point(index, value).join(",")).join(" ")}
                fill="none"
                stroke="#D6E4DB"
                strokeWidth="1.5"
              />
            ))}

            {levels.map((level, index) => {
              const [x, y] = point(index, 100);
              const [labelX, labelY] = point(index, 133);
              const label = `${level.branchName?.[0] ?? "L"}${String(level.levelName ?? "").trim().match(/\d+$/)?.[0] ?? index + 1}`;

              return (
                <g key={level.levelID}>
                  <line x1={center} y1={center} x2={x} y2={y} stroke="#E4ECE6" strokeWidth="1.5" />
                  <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="dashboardradarlabel">{label}</text>
                </g>
              );
            })}

            {levels.map((level, index) => {
              const next = levels[(index + 1) % levels.length];

              if (level.accuracy === null || next.accuracy === null) {
                return null;
              }

              const [x1, y1] = point(index, level.accuracy);
              const [x2, y2] = point((index + 1) % levels.length, next.accuracy);

              return <line key={`score-${level.levelID}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00BF63" strokeWidth="3" />;
            })}

            {levels.map((level, index) => {
              if (level.accuracy === null) {
                return null;
              }

              const [x, y] = point(index, level.accuracy);

              return (
                <circle key={`point-${level.levelID}`} cx={x} cy={y} r="5" fill="#00BF63" stroke="#FFFFFF" strokeWidth="2">
                  <title>{`${level.branchName} ${String(level.levelName).trim()}: ${level.accuracy}% correct`}</title>
                </circle>
              );
            })}
          </svg>
          <p className="dashboardradarnote">{scored} of {levels.length} levels have scores</p>
        </>
      )}
    </section>
  );
}

export default DashboardRadar;
