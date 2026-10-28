import { useContext, useEffect } from "react";
import { PopupContext } from "./PopupContext";

export function useActionPending(pending) {
  const { SetPendingActions } = useContext(PopupContext);

  useEffect(() => {
    if (!pending) return;
    SetPendingActions((count) => count + 1);
    return () => SetPendingActions((count) => count - 1);
  }, [pending, SetPendingActions]);
}
