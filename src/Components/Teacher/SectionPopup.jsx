import "../../css/SectionPopup.css";
import { useRef, useState } from "react";
import { limits } from "../../lib/inputLimits";
import { IsReservedSectionName } from "../../lib/sectionQueries";
import { useActionPending } from "../../lib/useActionPending";

function SectionPopup({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savePending = useRef(false);
  useActionPending(saving);

  function ClosePopup() {
    if (!savePending.current) onClose();
  }

  async function Submit(event) {
    event.preventDefault();
    if (savePending.current) return;

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Please enter a section name.");
      return;
    }

    if (!/[\p{L}\p{N}]/u.test(cleanName)) {
      setError("Section name must contain at least one letter or number.");
      return;
    }

    if (IsReservedSectionName(cleanName)) {
      setError("No Section is reserved and cannot be created.");
      return;
    }

    if (name.length > limits.section) {
      setError(`Section name must be ${limits.section} characters or fewer.`);
      return;
    }

    savePending.current = true;
    setSaving(true);
    setError("");

    try {
      await onCreate(cleanName);
    } catch (saveError) {
      console.error(saveError?.message);
      setError(saveError?.message || "Unable to create the section. Please try again.");
    } finally {
      savePending.current = false;
      setSaving(false);
    }
  }

  return (
    <div
      className="createoverlay"
      onMouseDown={ClosePopup}
    >
      <div
        className="createpopup"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="createhead">
          <h2>Create New Section</h2>

          <button
            type="button"
            className="createclose"
            aria-label="Close popup"
            onClick={ClosePopup}
            disabled={saving}
          >
            x
          </button>
        </div>

        <form onSubmit={Submit} aria-busy={saving}>
          <input
            className="createinput"
            type="text"
            placeholder="Section Name"
            value={name}
            maxLength={limits.section}
            disabled={saving}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />

          {error && (
            <p className="createerror" role="alert">{error}</p>
          )}

          <div className="createactions">
            <button
              type="submit"
              className="createbutton"
              disabled={saving || !name.trim()}
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SectionPopup;
