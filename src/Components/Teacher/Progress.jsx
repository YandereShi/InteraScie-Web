import "../../css/Progress.css";
import {useEffect,useMemo,useState,} from "react";
import {useMutation,useQuery,useQueryClient,} from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import { FaCheck } from "react-icons/fa";
import { TbProgress } from "react-icons/tb";
import { supabase } from "../../lib/supabase";
import {GetLessonAccess,GetProgressOptions,GetSectionProgress,UpdateLessonAccess,} from "../../lib/progressQueries";
import TeacherPage from "./TeacherPage";

const maxRows = 10;
const maxLessons = 3;
const maxTasks = 3;
const emptyList = [];

function Progress() {
  const { teacher } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
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

  const branches = useMemo(() => {
    return [
      ...new Set(
        levels
          .map((item) => item.branchName)
          .filter(Boolean)
      ),
    ].sort((first, second) => {
      if (first === "Chemistry") {
        return -1;
      }

      if (second === "Chemistry") {
        return 1;
      }

      return first.localeCompare(second);
    });
  }, [levels]);

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

  const lessons = useMemo(() => {
    return levels
      .filter(
        (item) =>
          item.branchName === branch
      )
      .slice(0, maxLessons);
  }, [branch, levels]);

  const lessonIDs = useMemo(() => {
    return lessons.map(
      (lesson) => lesson.levelID
    );
  }, [lessons]);

  const sectionID = Number(section) || 0;

  const lessonAccessQuery = useQuery({
    queryKey: [
      "LessonAccess",
      sectionID,
    ],
    queryFn: () =>
      GetLessonAccess(sectionID),
    enabled: sectionID > 0,
    staleTime: 5 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: [
      "SectionProgress",
      sectionID,
      branch,
    ],
    queryFn: () =>
      GetSectionProgress(
        sectionID,
        lessonIDs
      ),
    enabled:
      sectionID > 0 &&
      lessonIDs.length > 0,
    staleTime: 30 * 1000,
  });

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

  useEffect(() => {
    if (
      sectionID <= 0 ||
      !branch
    ) {
      return;
    }

    const queryKey = [
      "SectionProgress",
      sectionID,
      branch,
    ];

    const channel = supabase
      .channel(
        `progresschanges${sectionID}${branch}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Progress",
        },
        (payload) => {
          const progressData =
            queryClient.getQueryData(
              queryKey
            );

          const changedStudentID =
            payload.new?.studentID ??
            payload.old?.studentID;

          const isCurrentStudent =
            progressData?.students?.some(
              (student) =>
                student.studentID ===
                changedStudentID
            );

          if (
            !changedStudentID ||
            isCurrentStudent
          ) {
            queryClient.invalidateQueries({
              queryKey,
              exact: true,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    branch,
    queryClient,
    sectionID,
  ]);

  function PickSection(event) {
    setSelectedSection(event.target.value);
    setPage(1);
  }

  function PickBranch(event) {
    setSelectedBranch(event.target.value);
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
          <table className="progresstable">
            <colgroup>
              <col className="progressname" />

              {Array.from(
                {
                  length:
                    maxLessons * maxTasks,
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
                  { length: maxLessons },
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

                          <span className="progressslider"></span>
                        </label>
                      </div>
                    </th>
                  )
                )}
              </tr>

              <tr className="progresstasks">
                <th>Student Name</th>

                {branch === "Chemistry" && (
                  <>
                    <th>
                      <p>Scientific Skills</p>
                    </th>
                    <th>
                      <p>Scientific Method</p>
                    </th>
                    <th>
                      <p>Scientific Model</p>
                    </th>

                    <th>
                      <p>State of Matter</p>
                    </th>
                    <th>
                      <p>Particles Motion</p>
                    </th>
                    <th>
                      <p>Phase Change</p>
                    </th>

                    <th>
                      <p>Solution</p>
                    </th>
                    <th>
                      <p>Concentration</p>
                    </th>
                    <th>
                      <p>Solubility</p>
                    </th>
                  </>
                )}

                {branch === "Biology" && (
                  <>
                    <th>
                      <p>Microscope</p>
                    </th>
                    <th>
                      <p>Cellular</p>
                    </th>
                    <th>
                      <p>Cell Structure</p>
                    </th>

                    <th>
                      <p>Mitosis</p>
                    </th>
                    <th>
                      <p>Meiosis</p>
                    </th>
                    <th>
                      <p>Asexual and Sexual</p>
                    </th>

                    <th>
                      <p>
                        Biological Organization
                      </p>
                    </th>
                    <th>
                      <p>Energy Flow</p>
                    </th>
                    <th>
                      <p>Review</p>
                    </th>
                  </>
                )}

                {branch === "Physics" && (
                  <>
                    <th>
                      <p>Task 1</p>
                    </th>
                    <th>
                      <p>Task 2</p>
                    </th>
                    <th>
                      <p>Task 3</p>
                    </th>

                    <th>
                      <p>Task 1</p>
                    </th>
                    <th>
                      <p>Task 2</p>
                    </th>
                    <th>
                      <p>Task 3</p>
                    </th>

                    <th>
                      <p>Task 1</p>
                    </th>
                    <th>
                      <p>Task 2</p>
                    </th>
                    <th>
                      <p>Task 3</p>
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="10"
                    className="progressnote"
                  >
                    Loading progress...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan="10"
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
                      colSpan="10"
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
                      {student.lastName},{" "}
                      {student.firstName}
                    </td>

                    {Array.from(
                      { length: maxLessons },
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
                            maxLessons *
                            maxTasks,
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
