import "../css/Sections.css";
import TeacherPage from "./TeacherPage";
import AddPopup from "./AddPopup";
import SectionPopup from "./SectionPopup";
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
  const [addOpen, setAddOpen] = useState(false);
  const [addList, setAddList] = useState([]);
  const [addLoad, setAddLoad] = useState(false);
  const [addError, setAddError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadSections = useCallback(async () => {
    setError("");

    const { data, error: loadError } = await supabase
      .from("Section")
      .select("sectionID, sectionName, isShared")
      .order("sectionName", { ascending: true });

    if (loadError) {
      console.error(loadError.message);
      setError("Unable to load sections.");
      setLoading(false);
      return;
    }

    const list = data ?? [];
    const choices = list.filter((item) => !item.isShared);
    setSections(list);

    setSection((active) => {
      const exists = choices.some(
        (item) => String(item.sectionID) === active
      );

      if (exists) {
        return active;
      }

      return String(choices[0]?.sectionID ?? "");
    });

    if (choices.length === 0) {
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

  async function removeStudents() {
    if (selected.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const shared = sections.find((item) => item.isShared);

    if (!shared) {
      alert("The shared No Section row was not found.");
      return;
    }

    const confirmed = window.confirm(
      "Move the selected students to No Section?"
    );

    if (!confirmed) {
      return;
    }

    const { data: moved, error: moveError } =
      await supabase
        .from("Student")
        .update({ sectionID: shared.sectionID })
        .in("studentID", selected)
        .select("studentID");

    if (moveError) {
      console.error(moveError.message);
      alert("Unable to move the selected students.");
      return;
    }

    setSelected([]);
    await loadStudents();
    alert(`${moved.length} student(s) moved to No Section.`);
  }

  async function loadShared() {
    const shared = sections.find((item) => item.isShared);

    if (!shared) {
      setAddError("The shared No Section row was not found.");
      setAddLoad(false);
      return;
    }

    setAddLoad(true);
    setAddError("");

    const { data, error: loadError } = await supabase
      .from("Student")
      .select(`
        studentID,
        firstName,
        lastName,
        username,
        sectionID
      `)
      .eq("sectionID", shared.sectionID)
      .order("lastName", { ascending: true })
      .order("firstName", { ascending: true });

    if (loadError) {
      console.error(loadError.message);
      setAddError("Unable to load shared students.");
      setAddLoad(false);
      return;
    }

    setAddList(data ?? []);
    setAddLoad(false);
  }

  async function openAdd() {
    setAddList([]);
    setAddError("");
    setAddOpen(true);
    await loadShared();
  }

  function closeAdd() {
    setAddOpen(false);
    setAddList([]);
    setAddError("");
  }

  async function addStudents(ids) {
    if (!section) {
      throw new Error("No active section was selected.");
    }

    const { error: moveError } = await supabase
      .from("Student")
      .update({ sectionID: Number(section) })
      .in("studentID", ids);

    if (moveError) {
      console.error(moveError.message);
      throw new Error("Unable to add the selected students.");
    }

    await loadStudents();
    closeAdd();
  }

  function openCreate() {
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  async function createSection(name) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Your login session was not found.");
    }

    const { data: staff, error: staffError } =
      await supabase
        .from("SchoolStaff")
        .select("staffID")
        .eq("authUserID", user.id)
        .eq("role", "teacher")
        .single();

    if (staffError || !staff) {
      console.error(staffError?.message);
      throw new Error("Your teacher account was not found.");
    }

    const { data: created, error: createError } =
      await supabase
        .from("Section")
        .insert({
          sectionName: name,
          staffID: staff.staffID,
          isShared: false,
        })
        .select("sectionID")
        .single();

    if (createError) {
      console.error(createError.message);

      if (createError.code === "23505") {
        throw new Error("That section name already exists.");
      }

      throw new Error("Unable to create the section.");
    }

    await loadSections();
    setSection(String(created.sectionID));
    setSearch("");
    setSelected([]);
    setPage(1);
    closeCreate();
  }

  const choices = sections.filter((item) => !item.isShared);

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
              disabled={choices.length === 0}
            >
              {choices.length === 0 && (
                <option value="">No sections</option>
              )}

              {choices.map((item) => (
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
              disabled={selected.length === 0}
              onClick={removeStudents}
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
          <button
            type="button"
            onClick={openCreate}
          >
            Create Section
          </button>
          <button
            type="button"
            disabled={!section}
            onClick={openAdd}
          >
            Add Student
          </button>
        </div>
      </section>

      {addOpen && (
        <AddPopup
          students={addList}
          loading={addLoad}
          error={addError}
          onClose={closeAdd}
          onAdd={addStudents}
        />
      )}

      {createOpen && (
        <SectionPopup
          onClose={closeCreate}
          onCreate={createSection}
        />
      )}
    </TeacherPage>
  );
}

export default Sections;
