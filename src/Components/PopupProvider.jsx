import { useRef, useState } from "react";
import { PopupContext } from "../lib/PopupContext";
import ReusablePopup from "./ReusablePopup";

function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const [pendingActions, SetPendingActions] = useState(0);
  const actionPending = pendingActions > 0;
  const resolver = useRef(null);

  function ShowConfirmation(text, danger = false, items = []) {
    return new Promise((resolve) => {
      if (resolver.current) {
        resolver.current(false);
      }

      resolver.current = resolve;
      setPopup({ text: String(text), danger, items, returnFocus: document.activeElement });
    });
  }

  function FinishPopup(result) {
    const resolve = resolver.current;

    resolver.current = null;
    setPopup(null);

    if (resolve) {
      resolve(result);
    }
  }

  return (
    <PopupContext.Provider value={{ ShowConfirmation, actionPending, SetPendingActions }}>
      {children}

      {popup && (
        <ReusablePopup
          text={popup.text}
          danger={popup.danger}
          items={popup.items}
          returnFocus={popup.returnFocus}
          onCancel={() => FinishPopup(false)}
          onOK={() => FinishPopup(true)}
        />
      )}
    </PopupContext.Provider>
  );
}

export default PopupProvider;
