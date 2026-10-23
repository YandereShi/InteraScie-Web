import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { InvalidateProgressQueries } from "../lib/progressCache";
import { InvalidateAssessmentScoresQueries } from "../lib/assessmentCache";

const studentQueryNames = new Set([
  "Students",
  "SectionStudents",
  "NoSectionStudents",
  "TeacherDashboard",
  "SuperAdminDashboard",
  "SectionProgress",
  "AssessmentScores",
]);

const sectionQueryNames = new Set([
  "Students",
  "Sections",
  "SectionStudents",
  "NoSectionStudents",
  "Teachers",
  "TeacherDashboard",
  "SuperAdminDashboard",
  "ProgressOptions",
  "SectionProgress",
  "AssessmentOptions",
  "AssessmentScores",
]);

const schoolStaffQueryNames = new Set([
  "TeacherProfile",
  "Teachers",
  "Sections",
  "TeacherDashboard",
  "SuperAdminDashboard",
  "ProgressOptions",
  "AssessmentOptions",
]);

function InvalidateQueries(queryClient, queryNames) {
  return queryClient.invalidateQueries({
    predicate: (query) => queryNames.has(query.queryKey[0]),
  });
}

function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtimesync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Student",
        },
        async () => {
          await InvalidateQueries(queryClient, studentQueryNames);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Section",
        },
        async () => {
          await InvalidateQueries(queryClient, sectionQueryNames);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SchoolStaff",
        },
        async () => {
          await InvalidateQueries(queryClient, schoolStaffQueryNames);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Progress",
        },
        (payload) => InvalidateProgressQueries(queryClient, payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAssessment",
        },
        (payload) => InvalidateAssessmentScoresQueries(queryClient, payload)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void InvalidateProgressQueries(queryClient, {});
          void InvalidateAssessmentScoresQueries(queryClient, {});
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

export default RealtimeSync;
