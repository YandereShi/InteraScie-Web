import "../css/ReusablePopup.css";
import { useEffect } from "react";

function ReusablePopup({ text, danger, onCancel, onOK }) {
  useEffect(() => {
    function HandleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", HandleKeyDown);

    return () => window.removeEventListener("keydown", HandleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="reusablepopupoverlay"
      onMouseDown={onCancel}
    >
      <section
        className="reusablepopup"
        role="dialog"
        aria-modal="true"
        aria-describedby="reusablepopuptext"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p id="reusablepopuptext">
          {text}
        </p>

        <div className="reusablepopupactions">
          <button
            type="button"
            className="reusablepopupcancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className={danger ? "reusablepopupdanger" : "reusablepopupok"}
            onClick={onOK}
            autoFocus
          >
            OK
          </button>
        </div>
      </section>
    </div>
  );
}

export default ReusablePopup;