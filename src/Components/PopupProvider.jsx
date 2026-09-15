import { useRef, useState } from "react";
import { PopupContext } from "../lib/PopupContext";
import ReusablePopup from "./ReusablePopup";

function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const resolver = useRef(null);

  function ShowConfirmation(text, danger = false) {
    return new Promise((resolve) => {
      if (resolver.current) {
        resolver.current(false);
      }

      resolver.current = resolve;
      setPopup({ text: String(text), danger });
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
    <PopupContext.Provider value={{ ShowConfirmation }}>
      {children}

      {popup && (
        <ReusablePopup
          text={popup.text}
          danger={popup.danger}
          onCancel={() => FinishPopup(false)}
          onOK={() => FinishPopup(true)}
        />
      )}
    </PopupContext.Provider>
  );
}

export default PopupProvider;
