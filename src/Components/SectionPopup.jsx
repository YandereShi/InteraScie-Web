import "../css/SectionPopup.css";
import { useState } from "react";
import { limits } from "../lib/inputLimits";

function SectionPopup({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function Submit(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Please enter a section name.");
      return;
    }

    if (name.length > limits.section) {
      setError(`Section name must be ${limits.section} characters or fewer.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onCreate(cleanName);
    } catch (saveError) {
      console.error(saveError.message);
      setError(saveError.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="createoverlay"
      onMouseDown={onClose}
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
            onClick={onClose}
          >
            x
          </button>
        </div>

        <form onSubmit={Submit}>
          <input
            className="createinput"
            type="text"
            placeholder="Section Name"
            value={name}
            maxLength={limits.section}
            autoFocus
            onChange={(event) =>
              setName(event.target.value)
            }
          />

          {error && (
            <p className="createerror">{error}</p>
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
