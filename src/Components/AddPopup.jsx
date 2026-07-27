import "../css/AddPopup.css";
import { useState } from "react";

function AddPopup({
  students,
  loading,
  error,
  onClose,
  onAdd,
}) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const term = search.trim().toLowerCase();

  const filtered = students.filter((student) => {
    const values = [
      student.firstName,
      student.lastName,
      `${student.firstName} ${student.lastName}`,
      `${student.lastName} ${student.firstName}`,
      student.username,
    ];

    return values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(term)
    );
  });

  const allChecked =
    filtered.length > 0 &&
    filtered.every((student) =>
      selected.includes(student.studentID)
    );

  function selectOne(studentID, isChecked) {
    if (isChecked) {
      setSelected((current) =>
        current.includes(studentID)
          ? current
          : [...current, studentID]
      );
      return;
    }

    setSelected((current) =>
      current.filter((item) => item !== studentID)
    );
  }

  function selectAll(event) {
    const ids = filtered.map(
      (student) => student.studentID
    );

    if (event.target.checked) {
      setSelected((current) => [
        ...new Set([...current, ...ids]),
      ]);
      return;
    }

    setSelected((current) =>
      current.filter((item) => !ids.includes(item))
    );
  }

  async function submitAdd(event) {
    event.preventDefault();

    if (selected.length === 0) {
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      await onAdd(selected);
    } catch (saveError) {
      console.error(saveError.message);
      setSaveError(saveError.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="addoverlay"
      onMouseDown={onClose}
    >
      <div
        className="addpopup"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="addhead">
          <h2>Add Student/s</h2>

          <button
            type="button"
            className="addclose"
            aria-label="Close popup"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <form onSubmit={submitAdd}>
          <input
            className="addsearch"
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <div className="addselect">
            <input
              type="checkbox"
              id="add-all"
              checked={allChecked}
              disabled={filtered.length === 0}
              onChange={selectAll}
            />

            <label htmlFor="add-all">
              Select All
            </label>
          </div>

          <div className="addlist">
            {loading && (
              <p className="addnote">
                Loading students...
              </p>
            )}

            {error && (
              <p className="adderror">{error}</p>
            )}

            {!loading &&
              !error &&
              filtered.length === 0 && (
                <p className="addnote">
                  No students available.
                </p>
              )}

            {!loading &&
              !error &&
              filtered.map((student) => (
                <label
                  className="addrow"
                  key={student.studentID}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(
                      student.studentID
                    )}
                    onChange={(event) =>
                      selectOne(
                        student.studentID,
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    {student.lastName}, {student.firstName}
                  </span>
                </label>
              ))}
          </div>

          {saveError && (
            <p className="adderror">
              {saveError}
            </p>
          )}

          <div className="addactions">
            <button
              type="submit"
              className="addbutton"
              disabled={
                selected.length === 0 ||
                saving ||
                loading ||
                Boolean(error)
              }
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPopup;
