import "../css/SectionPopup.css";
import { useState } from "react";

function SectionPopup({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Please enter a section name.");
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

        <form onSubmit={submit}>
          <input
            className="createinput"
            type="text"
            placeholder="Section Name"
            value={name}
            maxLength={100}
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
