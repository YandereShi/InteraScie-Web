import "../../css/Sections.css";
import TeacherPage from "./TeacherPage";
import AddPopup from "./AddPopup";
import SectionPopup from "./SectionPopup";
import { useCallback, useEffect, useState } from "react";
import { limits } from "../../lib/inputLimits";
import { InvokeStudentManagement } from "../../lib/supabase";

const maxRows = 10;

function Sections({ PageComponent = TeacherPage }) {
  const [role, setRole] = useState("");
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

  const LoadSections = useCallback(async () => {
    setError("");

    try {
      const data = await InvokeStudentManagement("loadsections");
      const list = data.sections ?? [];
      const choices =
        data.role === "superadmin"
          ? list
          : list.filter((item) => !item.isShared);

      setRole(data.role ?? "");
      setSections(list);
      setSection((active) => {
        const exists = choices.some(
          (item) => String(item.sectionID) === active
        );

        return exists ? active : String(choices[0]?.sectionID ?? "");
      });

      if (choices.length === 0) {
        setStudents([]);
        setLoading(false);
      }
    } catch (loadError) {
      console.error(loadError.message);
      setError(loadError.message || "Unable to load sections.");
      setLoading(false);
    }
  }, []);

  const LoadStudents = useCallback(async () => {
    if (!section) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await InvokeStudentManagement("loadsectionstudents", {
        sectionID: Number(section),
      });
      setStudents(data.students ?? []);
      setSelected([]);
      setPage(1);
    } catch (loadError) {
      console.error(loadError.message);
      setError(loadError.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      LoadSections();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [LoadSections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      LoadStudents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [LoadStudents]);

  function PickSection(event) {
    setSection(event.target.value);
    setSearch("");
    setSelected([]);
    setPage(1);
  }

  function ChangeSearch(event) {
    setSearch(event.target.value);
    setSelected([]);
    setPage(1);
  }

  function SelectOne(studentID, isChecked) {
    if (isChecked) {
      setSelected((current) =>
        current.includes(studentID) ? current : [...current, studentID]
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
      String(value ?? "").toLowerCase().includes(term)
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / maxRows));
  const activePage = Math.min(page, pages);
  const first = (activePage - 1) * maxRows;
  const shown = filtered.slice(first, first + maxRows);
  const allChecked =
    filtered.length > 0 &&
    filtered.every((student) => selected.includes(student.studentID));
  const choices =
    role === "superadmin"
      ? sections
      : sections.filter((item) => !item.isShared);
  const activeSection = sections.find(
    (item) => String(item.sectionID) === section
  );
  const isNoSection = Boolean(activeSection?.isShared);

  function SelectAll(event) {
    if (event.target.checked) {
      setSelected(filtered.map((student) => student.studentID));
      return;
    }

    setSelected([]);
  }

  async function RemoveStudents() {
    if (selected.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const confirmed = window.confirm(
      "Move the selected students to No Section?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const data = await InvokeStudentManagement("movetonosection", {
        studentIDs: selected,
      });
      setSelected([]);
      await LoadStudents();
      alert(`${data.moved?.length ?? 0} student(s) moved to No Section.`);
    } catch (moveError) {
      console.error(moveError.message);
      alert(moveError.message);
    }
  }

  async function LoadShared() {
    setAddLoad(true);
    setAddError("");

    try {
      const data = await InvokeStudentManagement("loadnostudents");
      setAddList(data.students ?? []);
    } catch (loadError) {
      console.error(loadError.message);
      setAddError(loadError.message || "Unable to load No Section students.");
    } finally {
      setAddLoad(false);
    }
  }

  async function OpenAdd() {
    setAddList([]);
    setAddError("");
    setAddOpen(true);
    await LoadShared();
  }

  function CloseAdd() {
    setAddOpen(false);
    setAddList([]);
    setAddError("");
  }

  async function AddStudents(studentIDs) {
    if (!section) {
      throw new Error("No active section was selected.");
    }

    await InvokeStudentManagement("movetosection", {
      sectionID: Number(section),
      studentIDs,
    });
    await LoadStudents();
    CloseAdd();
  }

  function OpenCreate() {
    setCreateOpen(true);
  }

  function CloseCreate() {
    setCreateOpen(false);
  }

  async function CreateSection(name) {
    if (name.length > limits.section) {
      throw new Error(`Section name must be ${limits.section} characters or fewer.`);
    }

    const data = await InvokeStudentManagement("createsection", {
      sectionName: name,
    });

    await LoadSections();
    setSection(String(data.sectionID ?? ""));
    setSearch("");
    setSelected([]);
    setPage(1);
    CloseCreate();
  }

  return (
    <PageComponent title="Sections">
      <section className="sectionspanel">
        <div className="sectionbox">
          <div className="sectiontools">
            <select
              className="sectionpick"
              value={section}
              onChange={PickSection}
              aria-label="Active section"
              disabled={choices.length === 0}
            >
              {choices.length === 0 && <option value="">No sections</option>}

              {choices.map((item) => (
                <option key={item.sectionID} value={item.sectionID}>
                  {item.displayName ?? item.sectionName}
                </option>
              ))}
            </select>

            <div className="sectionsearch">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={ChangeSearch}
              />
            </div>

            <button
              type="button"
              className="sectionremove"
              disabled={selected.length === 0 || isNoSection}
              onClick={RemoveStudents}
            >
              Remove Selected
            </button>
          </div>

          <div className="sectionlist">
            {loading && <p className="sectionnote">Loading students...</p>}
            {error && <p className="sectionnote">{error}</p>}

            {!loading && !error && shown.length === 0 && (
              <p className="sectionnote">No students found.</p>
            )}

            {!loading &&
              !error &&
              shown.map((student) => (
                <div className="sectionrow" key={student.studentID}>
                  <span>
                    {student.lastName}, {student.firstName}
                  </span>

                  <input
                    type="checkbox"
                    checked={selected.includes(student.studentID)}
                    aria-label={`Select ${student.firstName} ${student.lastName}`}
                    onChange={(event) =>
                      SelectOne(student.studentID, event.target.checked)
                    }
                  />
                </div>
              ))}
          </div>

          <div className="sectionfoot">
            <div className="sectioncheck">
              <input
                type="checkbox"
                id="sectionall"
                checked={allChecked}
                disabled={filtered.length === 0}
                onChange={SelectAll}
              />

              <label htmlFor="sectionall">Select All</label>
            </div>

            <div className="sectionpager">
              <button
                type="button"
                aria-label="Previous page"
                disabled={activePage === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                &lt;
              </button>

              <span>
                {activePage} of {pages}
              </span>

              <button
                type="button"
                aria-label="Next page"
                disabled={activePage === pages}
                onClick={() => setPage((current) => current + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="sectionactions">
          <button type="button" onClick={OpenCreate}>
            Create Section
          </button>
          <button
            type="button"
            disabled={!section || isNoSection}
            onClick={OpenAdd}
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
          onClose={CloseAdd}
          onAdd={AddStudents}
        />
      )}

      {createOpen && (
        <SectionPopup onClose={CloseCreate} onCreate={CreateSection} />
      )}
    </PageComponent>
  );
}

export default Sections;
