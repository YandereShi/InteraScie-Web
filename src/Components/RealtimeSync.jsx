import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { InvalidateProgressQueries } from "../lib/progressCache";
import { InvalidateAssessmentScoresQueries } from "../lib/assessmentCache";
import { InvalidateSectionQueries, InvalidateStudentQueries } from "../lib/studentCache";

const schoolStaffQueryNames = new Set([
  "TeacherProfile",
  "SuperAdminProfile",
  "Teachers",
  "Sections",
  "TeacherDashboard",
  "SuperAdminDashboard",
  "ProgressOptions",
  "AssessmentOptions",
]);

const accuracyQueryNames = new Set([
  "QuestionAccuracy",
  "BranchAccuracy",
  "StudentAnswers",
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
          await InvalidateStudentQueries(queryClient);
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
          await InvalidateSectionQueries(queryClient);
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
        (payload) => Promise.all([
          InvalidateProgressQueries(queryClient, payload),
          queryClient.invalidateQueries({ queryKey: ["SuperAdminDashboard"] }),
        ])
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAssessment",
        },
        (payload) => Promise.all([
          InvalidateAssessmentScoresQueries(queryClient, payload),
          queryClient.invalidateQueries({ queryKey: ["StudentAnswers"] }),
        ])
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "StudentAnswer",
        },
        () => InvalidateQueries(queryClient, accuracyQueryNames)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void InvalidateSectionQueries(queryClient);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

export default RealtimeSync;
