import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { CreateRealtimeRefresh } from "../lib/realtimeRefresh";
import { studentQueryNames, sectionQueryNames } from "../lib/studentCache";

const schoolStaffQueryNames = new Set([
  "TeacherProfile",
  "SuperAdminProfile",
  "Teachers",
  "Sections",
  "TeacherSections",
  "TeacherDashboard",
  "SuperAdminDashboard",
  "ProgressOptions",
  "AssessmentOptions",
  "ArchivedStudents",
  "AssessmentHistorySources",
]);

const accuracyQueryNames = new Set([
  "QuestionAccuracy",
  "BranchAccuracy",
  "StudentAnswers",
]);

function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { ScheduleRefresh, Dispose } = CreateRealtimeRefresh(queryClient);

    const channel = supabase
      .channel("realtimesync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Level" },
        () => ScheduleRefresh([
          "Levels", "TeacherDashboard", "TeacherRadar", "TeacherLevelProgress",
          "ProgressOptions", "AssessmentOptions", "BranchAccuracy", "QuestionAccuracy",
        ])
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Student",
        },
        () => ScheduleRefresh(studentQueryNames)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Section",
        },
        () => ScheduleRefresh(sectionQueryNames)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SchoolStaff",
        },
        () => ScheduleRefresh(schoolStaffQueryNames)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Progress",
        },
        (payload) => ScheduleRefresh([
          "SectionProgress", "SuperAdminDashboard", "TeacherLevelProgress",
        ], payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAssessment",
        },
        (payload) => ScheduleRefresh([
          "AssessmentScores", "StudentAnswers", "TeacherDashboard", "TeacherRadar",
        ], payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAnswer",
        },
        () => ScheduleRefresh(accuracyQueryNames)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ScheduleRefresh([...sectionQueryNames, "Levels"]);
        }
      });

    return () => {
      Dispose();
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

export default RealtimeSync;
