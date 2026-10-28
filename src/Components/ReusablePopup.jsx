import "../css/ReusablePopup.css";
import { useLayoutEffect, useRef } from "react";

function ReusablePopup({ text, danger, items = [], onCancel, onOK, returnFocus }) {
  const dialog = useRef(null);
  const initialFocus = useRef(null);

  useLayoutEffect(() => {
    const element = dialog.current;
    const previous = returnFocus ?? document.activeElement;

    function KeepFocus(event) {
      if (!element.contains(event.target)) initialFocus.current?.focus();
    }

    document.addEventListener("focusin", KeepFocus);
    initialFocus.current?.focus();

    return () => {
      document.removeEventListener("focusin", KeepFocus);
      // Let pending buttons re-enable before returning keyboard focus.
      requestAnimationFrame(() => {
        if (document.querySelector(".reusablepopup")) return;
        const target = previous?.isConnected && previous !== document.body &&
          !previous.matches(":disabled") && !previous.closest("[inert]")
          ? previous
          : document.querySelector("main");
        target?.focus({ preventScroll: true });
      });
    };
  }, [danger, text, returnFocus]);

  function HandleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }

    if (event.key !== "Tab") return;
    const controls = dialog.current.querySelectorAll('button:not(:disabled), [tabindex="0"]');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="reusablepopupoverlay"
      onMouseDown={onCancel}
    >
      <section
        ref={dialog}
        className="reusablepopup"
        role="dialog"
        aria-modal="true"
        aria-label={danger ? "Confirm action" : "Confirmation"}
        aria-describedby="reusablepopuptext"
        onKeyDown={HandleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p id="reusablepopuptext">
          {text}
        </p>

        {items.length > 0 && (
          <ul className="reusablepopupitems" tabIndex={0}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}

        <div className="reusablepopupactions">
          <button
            ref={danger ? initialFocus : null}
            type="button"
            className="reusablepopupcancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            ref={danger ? null : initialFocus}
            type="button"
            className={danger ? "reusablepopupdanger" : "reusablepopupok"}
            onClick={onOK}
          >
            OK
          </button>
        </div>
      </section>
    </div>
  );
}

export default ReusablePopup;
