import "../css/GraphPopup.css";
import {useEffect} from "react";
import ScoreGraph from "./ScoreGraph";

function GraphPopup({
  title,
  data,
  sections,
  section,
  onPick,
  onClose,
}) {
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  return (
    <div className="graphoverlay" onClick={onClose}>
      <div
        className="graphpopup"
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
            onClick={onClose}
            aria-label="Close graph"
          >
            &times;
          </button>
        </div>

        <label className="graphfilter">
          <span>Section</span>

          <select
            value={section}
            onChange={(event) => onPick(event.target.value)}
          >
            <option value="all">All Sections</option>

            {sections.map((item) => (
              <option value={item.sectionID} key={item.sectionID}>
                {item.sectionName}
              </option>
            ))}
          </select>
        </label>

        <ScoreGraph
          title={title}
          data={data}
          height={200}
          showTip
        />
      </div>
    </div>
  );
}

export default GraphPopup;
