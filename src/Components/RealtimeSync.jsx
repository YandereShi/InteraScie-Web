import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { InvalidateProgressQueries } from "../lib/progressCache";
import { InvalidateAssessmentScoresQueries } from "../lib/assessmentCache";
import { studentQueryNames, sectionQueryNames } from "../lib/studentCache";

const schoolStaffQueryNames = new Set([
  "TeacherProfile",
  "SuperAdminProfile",
  "Teachers",
  "Sections",
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

function InvalidateQueries(queryClient, queryNames) {
  return queryClient.invalidateQueries({
    predicate: (query) => queryNames.has(query.queryKey[0]),
  });
}

function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pendingQueries = new Set();
    let refreshTimer;
    let refreshing = false;
    let disposed = false;

    function ScheduleRefresh(queryNames) {
      for (const name of queryNames) pendingQueries.add(name);
      if (disposed || refreshing || refreshTimer) return;
      refreshTimer = setTimeout(FlushRefresh, 250);
    }

    async function FlushRefresh() {
      refreshTimer = undefined;
      if (disposed) return;
      const queryNames = new Set(pendingQueries);
      pendingQueries.clear();
      refreshing = true;
      const filters = { predicate: (query) => queryNames.has(query.queryKey[0]) };
      try {
        await queryClient.cancelQueries(filters);
        if (!disposed) await queryClient.invalidateQueries(filters);
      } finally {
        refreshing = false;
        if (!disposed && pendingQueries.size > 0) ScheduleRefresh([]);
      }
    }

    const channel = supabase
      .channel("realtimesync")
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
          ScheduleRefresh(sectionQueryNames);
        }
      });

    return () => {
      disposed = true;
      clearTimeout(refreshTimer);
      pendingQueries.clear();
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

export default RealtimeSync;
