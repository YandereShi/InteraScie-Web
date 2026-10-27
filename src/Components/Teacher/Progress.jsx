import "../../css/Progress.css";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { FaCheck, FaLock, FaLockOpen } from "react-icons/fa";
import { TbProgress } from "react-icons/tb";
import { GetProgressOptions, UpdateLessonAccess } from "../../lib/progressQueries";
import { GetLessonAccessOptions, GetSectionProgressOptions, PrefetchProgress, progressLessonCount } from "../../lib/progressCache";
import { GetPageSelection, SavePageSelection } from "../../lib/pageSelection";
import { GetStudentPhotoPath } from "../../lib/profilePhotos";
import { GetBranches } from "../../lib/branches";
import studentImage from "../../assets/pfp.png";
import ProfilePhoto from "../ProfilePhoto";
import TeacherPage from "./TeacherPage";

const maxRows = 10;
const maxLessons = progressLessonCount;
const maxTasks = 3;
const emptyList = [];
const taskHeadings = {
  Chemistry: [
    "Scientific Skills",
    "Scientific Method",
    "Scientific Model",
    "State of Matter",
    "Particles Motion",
    "Phase Change",
    "Solution",
    "Concentration",
    "Solubility",
  ],
  Biology: [
    "Microscope",
    "Cellular",
    "Cell Structure",
    "Mitosis",
    "Meiosis",
    "Asexual & Sexual",
    "Biological Organization",
    "Energy Flow",
    "Review",
  ],
  Physics: [
    "Balance Forces",
    "Unbalanced Forces",
    "Distance & Displacement",
    "Speed",
    "Velocity",
    "Distance Time Graphs",
    "Heat & Temperature",
    "Conduction",
    "Convection & Radiation",
  ],
  Earth: [
    "Faults",
    "Earthquake",
    "Tsunami",
    "Solar Energy",
    "Roles and Earth Tilt",
    "Weather Patterns",
  ],
};

function Progress() {
  const { teacher } = useOutletContext();
  const authUserID = teacher.authUserID;
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState(() => GetPageSelection(authUserID, "Progress", "Section"));
  const [selectedBranch, setSelectedBranch] = useState(() => GetPageSelection(authUserID, "Progress", "Branch"));
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: [
      "ProgressOptions",
      teacher.staffID,
    ],
    queryFn: () =>
      GetProgressOptions(teacher.staffID),
    staleTime: 30 * 60 * 1000,
  });

  const sections =
    optionsQuery.data?.sections ?? emptyList;

  const levels =
    optionsQuery.data?.levels ?? emptyList;

  const branches = useMemo(() => GetBranches(levels), [levels]);

  const section = sections.some(
    (item) =>
      String(item.sectionID) ===
      selectedSection
  )
    ? selectedSection
    : String(sections[0]?.sectionID ?? "");

  const branch = branches.includes(
    selectedBranch
  )
    ? selectedBranch
    : branches[0] ?? "";

  const lessonCount = branch === "Earth" ? 2 : maxLessons;
  const taskCount = lessonCount * maxTasks;

  const lessons = useMemo(() => {
    return levels
      .filter(
        (item) =>
          item.branchName === branch
      )
      .slice(0, lessonCount);
  }, [branch, levels, lessonCount]);

  const lessonIDs = useMemo(() => {
    return lessons.map(
      (lesson) => lesson.levelID
    );
  }, [lessons]);

  const sectionID = Number(section) || 0;

  const lessonAccessQuery = useQuery({
    ...GetLessonAccessOptions(sectionID),
    enabled: sectionID > 0,
  });

  const progressQuery = useQuery({
    ...GetSectionProgressOptions(sectionID, branch, lessonIDs),
    enabled:
      sectionID > 0 &&
      lessonIDs.length > 0,
  });

  const canPrefetch = optionsQuery.isSuccess &&
    lessonAccessQuery.isSuccess && progressQuery.isSuccess;

  useEffect(() => {
    if (!canPrefetch) {
      return;
    }

    let cancelled = false;
    void PrefetchProgress(queryClient, sections, levels, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [canPrefetch, levels, queryClient, sections]);

  const lessonAccess = useMemo(() => {
    const accessMap = {};

    for (
      const item of
        lessonAccessQuery.data ?? emptyList
    ) {
      accessMap[item.levelID] =
        item.isEnabled === true;
    }

    return accessMap;
  }, [lessonAccessQuery.data]);

  const lessonMutation = useMutation({
    mutationKey: ["AccessToggle", "lesson"],
    mutationFn: ({
      sectionID: selectedSectionID,
      levelID,
      isEnabled,
    }) =>
      UpdateLessonAccess(
        selectedSectionID,
        levelID,
        isEnabled
      ),
    onMutate: async ({
      sectionID: selectedSectionID,
      levelID,
      isEnabled,
    }) => {
      const queryKey = [
        "LessonAccess",
        selectedSectionID,
      ];

      await queryClient.cancelQueries({
        queryKey,
      });

      const previous =
        queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        (current = []) => {
          let found = false;

          const updated = current.map(
            (item) => {
              if (item.levelID !== levelID) {
                return item;
              }

              found = true;

              return {
                ...item,
                isEnabled,
              };
            }
          );

          if (found) {
            return updated;
          }

          return [
            ...updated,
            {
              sectionID: selectedSectionID,
              levelID,
              isEnabled,
            },
          ];
        }
      );

      return {
        previous,
        queryKey,
      };
    },
    onError: (
      mutationError,
      variables,
      mutationContext
    ) => {
      console.error(mutationError);

      if (mutationContext) {
        queryClient.setQueryData(
          mutationContext.queryKey,
          mutationContext.previous
        );
      }
    },
    onSuccess: (
      data,
      variables
    ) => {
      const queryKey = [
        "LessonAccess",
        variables.sectionID,
      ];

      queryClient.setQueryData(
        queryKey,
        (current = []) =>
          current.map((item) =>
            item.levelID === variables.levelID
              ? {
                  ...item,
                  isEnabled:
                    data.isEnabled === true,
                }
              : item
          )
      );
    },
  });

  function PickSection(event) {
    const value = event.target.value;
    setSelectedSection(value);
    SavePageSelection(authUserID, "Progress", "Section", value);
    setPage(1);
  }

  function PickBranch(event) {
    const value = event.target.value;
    setSelectedBranch(value);
    SavePageSelection(authUserID, "Progress", "Branch", value);
    setPage(1);
  }

  function ToggleLessonAccess(levelID) {
    if (
      !sectionID ||
      !levelID ||
      lessonMutation.isPending
    ) {
      return;
    }

    lessonMutation.mutate({
      sectionID,
      levelID,
      isEnabled:
        !lessonAccess[levelID],
    });
  }

  const students =
    progressQuery.data?.students ??
    emptyList;

  const records =
    progressQuery.data?.records ??
    emptyList;

  const loading =
    optionsQuery.isPending ||
    (
      sections.length > 0 &&
      sectionID === 0
    ) ||
    (
      sectionID > 0 &&
      (
        lessonAccessQuery.isPending ||
        progressQuery.isPending
      )
    );

  const requestError =
    optionsQuery.error ||
    lessonAccessQuery.error ||
    progressQuery.error ||
    lessonMutation.error;

  const error =
    requestError instanceof Error
      ? requestError.message
      : requestError
        ? "Unable to load progress."
        : "";

  function GetIcon(
    studentID,
    levelID,
    taskIndex
  ) {
    const record = records.find(
      (item) =>
        item.studentID === studentID &&
        item.levelID === levelID
    );

    if (!record) {
      return null;
    }

    const savepoint = Number(
      record.savepoint
    );

    const finished =
      String(record.status ?? "")
        .trim()
        .toLowerCase() === "finished";

    if (
      finished ||
      taskIndex < savepoint - 1
    ) {
      return (
        <FaCheck
          className="progressicon progressdone"
          aria-label="Completed"
          title="Completed"
        />
      );
    }

    if (taskIndex === savepoint - 1) {
      return (
        <TbProgress
          className="progressicon progressactive"
          aria-label="Current progress"
          title="Current progress"
        />
      );
    }

    return null;
  }

  const pages = Math.max(
    1,
    Math.ceil(students.length / maxRows)
  );

  const first = (page - 1) * maxRows;

  const shown = students.slice(
    first,
    first + maxRows
  );

  const empty = Math.max(
    0,
    maxRows - shown.length
  );

  return (
    <TeacherPage title="Progress">
      <section className="progresspanel">
        <div className="progresssubject">
          <select
            value={branch}
            onChange={PickBranch}
            aria-label="Progress subject"
            disabled={
              branches.length === 0
            }
          >
            {branches.length === 0 && (
              <option value="">
                No subjects
              </option>
            )}

            {branches.map((item) => (
              <option
                value={item}
                key={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="progressbox">
          <table className="progresstable" style={{ "--progress-task-count": taskCount }}>
            <colgroup>
              <col className="progressname" />

              {Array.from(
                {
                  length:
                    taskCount,
                },
                (_, index) => (
                  <col key={index} />
                )
              )}
            </colgroup>

            <thead>
              <tr className="progresstop">
                <th>
                  <select
                    value={section}
                    onChange={PickSection}
                    aria-label="Progress section"
                    disabled={
                      sections.length === 0 ||
                      lessonMutation.isPending
                    }
                  >
                    {sections.length === 0 && (
                      <option value="">
                        No sections
                      </option>
                    )}

                    {sections.map((item) => (
                      <option
                        value={item.sectionID}
                        key={item.sectionID}
                      >
                        {item.sectionName}
                      </option>
                    ))}
                  </select>
                </th>

                {Array.from(
                  { length: lessonCount },
                  (_, index) => (
                    <th
                      colSpan={maxTasks}
                      key={index}
                    >
                      <div className="progresslessonhead">
                        <span>
                          Lesson {index + 1}
                        </span>

                        <label className="progressswitch">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              lessons[index] &&
                                lessonAccess[
                                  lessons[index]
                                    .levelID
                                ]
                            )}
                            disabled={
                              loading ||
                              !lessons[index] ||
                              lessonMutation.isPending
                            }
                            onChange={() =>
                              ToggleLessonAccess(
                                lessons[index]
                                  ?.levelID
                              )
                            }
                            aria-label={`Turn Lesson ${
                              index + 1
                            } ${
                              lessonAccess[
                                lessons[index]
                                  ?.levelID
                              ]
                                ? "off"
                                : "on"
                            }`}
                          />

                          <span className="progressslider" aria-hidden="true">
                            {lessonAccess[lessons[index]?.levelID] ? <FaLockOpen /> : <FaLock />}
                          </span>
                        </label>
                      </div>
                    </th>
                  )
                )}
              </tr>

              <tr className="progresstasks">
                <th>Student Name</th>

                {(taskHeadings[branch] ?? []).map((title) => (
                  <th key={title}>
                    <p
                      style={{
                        "--heading-scale": Math.max(0.75, Math.min(1, 14 / title.length)),
                      }}
                    >
                      {title}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={taskCount + 1}
                    className="progressnote"
                  >
                    Loading progress...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={taskCount + 1}
                    className="progressnote"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                shown.length === 0 && (
                  <tr>
                    <td
                      colSpan={taskCount + 1}
                      className="progressnote"
                    >
                      No students found.
                    </td>
                  </tr>
                )}

              {!loading &&
                !error &&
                shown.map((student) => (
                  <tr key={student.studentID}>
                    <td>
                      <span className="progressstudent">
                        <ProfilePhoto
                          path={GetStudentPhotoPath(student.studentID)}
                          fallback={studentImage}
                          className="progressstudentphoto"
                          alt=""
                        />
                        <span className="progressstudentname" title={`${student.lastName}, ${student.firstName}`}>
                          {student.lastName}, {student.firstName}
                        </span>
                      </span>
                    </td>

                    {Array.from(
                      { length: lessonCount },
                      (_, lessonIndex) => {
                        const lesson =
                          lessons[lessonIndex];

                        return Array.from(
                          { length: maxTasks },
                          (_, taskIndex) => (
                            <td
                              key={`${lessonIndex}${taskIndex}`}
                            >
                              {lesson &&
                                GetIcon(
                                  student.studentID,
                                  lesson.levelID,
                                  taskIndex
                                )}
                            </td>
                          )
                        );
                      }
                    )}
                  </tr>
                ))}

              {!loading &&
                !error &&
                Array.from(
                  { length: empty },
                  (_, rowIndex) => (
                    <tr
                      className="progressempty"
                      key={`empty${rowIndex}`}
                    >
                      <td>&nbsp;</td>

                      {Array.from(
                        {
                          length:
                            taskCount,
                        },
                        (_, cellIndex) => (
                          <td
                            key={cellIndex}
                          ></td>
                        )
                      )}
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>

        <div className="progresspager">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() =>
              setPage(
                (current) => current - 1
              )
            }
          >
            &lt;
          </button>

          <span>{page}</span>

          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages}
            onClick={() =>
              setPage(
                (current) => current + 1
              )
            }
          >
            &gt;
          </button>
        </div>
      </section>
    </TeacherPage>
  );
}

export default Progress;
