import "../css/GraphPopup.css";
import { useEffect, useState } from "react";
import ScoreGraph from "./ScoreGraph";

function GraphPopup({
  title,
  data,
  sections,
  section,
  onPick: OnPick,
  onClose: OnClose,
  GetCompareData,
}) {
  const [compare, SetCompare] = useState(false);
  const [red, SetRed] = useState("");
  const [green, SetGreen] = useState("");

  const available = sections.filter((item) =>
    item.sectionID != null &&
    String(item.sectionName ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase() !== "no section"
  );

  const redid = available.some(
    (item) => String(item.sectionID) === red
  )
    ? red
    : String(available[0]?.sectionID ?? "");

  const greenid = available.some(
    (item) =>
      String(item.sectionID) === green &&
      String(item.sectionID) !== redid
  )
    ? green
    : String(
        available.find(
          (item) => String(item.sectionID) !== redid
        )?.sectionID ?? ""
      );

  const redsection = available.find(
    (item) => String(item.sectionID) === redid
  );
  const greensection = available.find(
    (item) => String(item.sectionID) === greenid
  );
  const reddata = compare && redid ? GetCompareData(redid) : [];
  const greendata = compare && greenid ? GetCompareData(greenid) : [];
  const maximum = Math.max(
    1,
    ...reddata.map((item) => item.students),
    ...greendata.map((item) => item.students)
  );

  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  return (
    <div className="graphoverlay" onClick={OnClose}>
      <div
        className={`graphpopup${compare ? " graphcompare" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} graph`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="graphhead">
          <h2>{title}</h2>

          <button
            type="button"
            className="graphclose"
            onClick={OnClose}
            aria-label="Close graph"
          >
            &times;
          </button>
        </div>

        {compare ? (
          <>
            <div className="comparefilters">
              <label className="compareredlabel">
                <span>Red</span>
                <select
                  value={redid}
                  onChange={(event) => SetRed(event.target.value)}
                >
                  {available.map((item) => (
                    <option
                      key={item.sectionID}
                      value={String(item.sectionID)}
                      disabled={String(item.sectionID) === greenid}
                    >
                      {item.sectionName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="comparegreenlabel">
                <span>Green</span>
                <select
                  value={greenid}
                  onChange={(event) => SetGreen(event.target.value)}
                >
                  {available.map((item) => (
                    <option
                      key={item.sectionID}
                      value={String(item.sectionID)}
                      disabled={String(item.sectionID) === redid}
                    >
                      {item.sectionName}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="comparebutton"
                onClick={() => SetCompare(false)}
              >
                Return
              </button>
            </div>

            {available.length < 2 ? (
              <p>At least two sections are needed to compare.</p>
            ) : (
              <>
                <p className="comparehint">
                  Scores 0–15. Bar labels show the number of students.
                </p>
                <div
                  className="comparescroll"
                  role="region"
                  aria-label="Section score comparison"
                  tabIndex={0}
                >
                  <div className="comparechart">
                    {reddata.map((item, index) => {
                      const redcount = item.students;
                      const greencount = greendata[index]?.students ?? 0;

                      return (
                        <div
                          className="comparecolumn"
                          key={item.score}
                          role="img"
                          aria-label={
                            `Score ${item.score}: ` +
                            `${redsection.sectionName}, ${redcount} students; ` +
                            `${greensection.sectionName}, ${greencount} students`
                          }
                        >
                          <div className="compareupper">
                            {redcount > 0 && (
                              <div
                                className="comparebar compareredbar"
                                style={{ height: `${redcount / maximum * 100}%` }}
                              >
                                <span>{redcount}</span>
                              </div>
                            )}
                          </div>
                          <div className="comparescore">{item.score}</div>
                          <div className="comparelower">
                            {greencount > 0 && (
                              <div
                                className="comparebar comparegreenbar"
                                style={{ height: `${greencount / maximum * 100}%` }}
                              >
                                <span>{greencount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="graphviewcontrols">
              <label className="graphfilter">
                <span>Section</span>
                <select
                  value={section}
                  onChange={(event) => OnPick(event.target.value)}
                >
                  <option value="all">All Sections</option>
                  {sections.map((item) => (
                    <option value={item.sectionID} key={item.sectionID}>
                      {item.sectionName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="comparebutton"
                onClick={() => SetCompare(true)}
                disabled={available.length < 2}
              >
                Compare
              </button>
            </div>
            {available.length < 2 && (
              <p className="comparehint">
                At least two sections are needed to compare.
              </p>
            )}
            <ScoreGraph title={title} data={data} height={200} showTip />
          </>
        )}
      </div>
    </div>
  );
}

export default GraphPopup;
