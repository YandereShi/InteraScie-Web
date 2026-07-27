import "../css/Sections.css";
import TeacherPage from "./TeacherPage";
import {useCallback,useEffect,useState,} from "react";
import { supabase } from "../lib/supabase";

const maxRows = 10;

function Sections() {
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSections = useCallback(async () => {
    setError("");

    const { data, error: loadError } = await supabase
      .from("Section")
      .select("sectionID, sectionName")
      .order("sectionName", { ascending: true });

    if (loadError) {
      console.error(loadError.message);
      setError("Unable to load sections.");
      setLoading(false);
      return;
    }

    const list = data ?? [];
    setSections(list);

    setSection((active) => {
      const exists = list.some(
        (item) => String(item.sectionID) === active
      );

      if (exists) {
        return active;
      }

      return String(list[0]?.sectionID ?? "");
    });

    if (list.length === 0) {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!section) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("Student")
      .select(`
        studentID,
        firstName,
        lastName,
        username,
        sectionID
      `)
      .eq("sectionID", section)
      .order("lastName", { ascending: true })
      .order("firstName", { ascending: true });

    if (loadError) {
      console.error(loadError.message);
      setError("Unable to load students.");
      setLoading(false);
      return;
    }

    setStudents(data ?? []);
    setSelected([]);
    setPage(1);
    setLoading(false);
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSections();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStudents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  function pickSection(event) {
    setSection(event.target.value);
    setSearch("");
    setSelected([]);
    setPage(1);
  }

  function changeSearch(event) {
    setSearch(event.target.value);
    setSelected([]);
    setPage(1);
  }

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

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / maxRows)
  );

  const first = (page - 1) * maxRows;
  const shown = filtered.slice(first, first + maxRows);

  const allChecked =
    filtered.length > 0 &&
    filtered.every((student) =>
      selected.includes(student.studentID)
    );

  function selectAll(event) {
    if (event.target.checked) {
      setSelected(
        filtered.map((student) => student.studentID)
      );
      return;
    }

    setSelected([]);
  }

  return (
    <TeacherPage title="Sections">
      <section className="sectionspanel">
        <div className="sectionbox">
          <div className="sectiontools">
            <select
              className="sectionpick"
              value={section}
              onChange={pickSection}
              aria-label="Active section"
              disabled={sections.length === 0}
            >
              {sections.length === 0 && (
                <option value="">No sections</option>
              )}

              {sections.map((item) => (
                <option
                  key={item.sectionID}
                  value={item.sectionID}
                >
                  {item.sectionName}
                </option>
              ))}
            </select>

            <div className="sectionsearch">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={changeSearch}
              />
            </div>

            <button
              type="button"
              className="sectionremove"
            >
              Remove Selected
            </button>
          </div>

          <div className="sectionlist">
            {loading && (
              <p className="sectionnote">
                Loading students...
              </p>
            )}

            {error && (
              <p className="sectionnote">{error}</p>
            )}

            {!loading &&
              !error &&
              shown.length === 0 && (
                <p className="sectionnote">
                  No students found.
                </p>
              )}

            {!loading &&
              !error &&
              shown.map((student) => (
                <div
                  className="sectionrow"
                  key={student.studentID}
                >
                  <span>
                    {student.lastName}, {student.firstName}
                  </span>

                  <input
                    type="checkbox"
                    checked={selected.includes(
                      student.studentID
                    )}
                    aria-label={`Select ${student.firstName} ${student.lastName}`}
                    onChange={(event) =>
                      selectOne(
                        student.studentID,
                        event.target.checked
                      )
                    }
                  />
                </div>
              ))}
          </div>

          <div className="sectionfoot">
            <div className="sectioncheck">
              <input
                type="checkbox"
                id="section-all"
                checked={allChecked}
                disabled={filtered.length === 0}
                onChange={selectAll}
              />

              <label htmlFor="section-all">
                Select All
              </label>
            </div>

            <div className="sectionpager">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) => current - 1)
                }
              >
                &lt;
              </button>

              <span>{page} of {pages}</span>

              <button
                type="button"
                aria-label="Next page"
                disabled={page === pages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="sectionactions">
          <button type="button">Create Section</button>
          <button type="button">Add Student</button>
        </div>
      </section>
    </TeacherPage>
  );
}

export default Sections;
