import { createPortal } from "react-dom";
import { useIsMutating } from "@tanstack/react-query";
import "../css/AccessInteractionGuard.css";

export default function AccessInteractionGuard() {
  const pendingCount = useIsMutating({ mutationKey: ["AccessToggle"] });

  return pendingCount > 0
    ? createPortal(
        <div className="accessinteractionguard" aria-hidden="true" />,
        document.body
      )
    : null;
}
