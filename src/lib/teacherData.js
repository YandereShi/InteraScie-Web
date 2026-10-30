import { queryClient } from "./queryClient";
import { supabase } from "./supabase";

export function GetLevels(staffID) {
  return queryClient.fetchQuery({
    queryKey: ["Levels", staffID],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("Level")
        .select("levelID, levelName, branchName")
        .order("levelID", { ascending: true });
      if (error) throw new Error("Unable to load lessons.", { cause: error });
      return data ?? [];
    },
  });
}

export function GetTeacherSections(staffID) {
  return queryClient.fetchQuery({
    queryKey: ["TeacherSections", staffID],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("Section")
        .select("sectionID, sectionName, isShared")
        .is("archivedAt", null)
        .eq("staffID", staffID)
        .order("sectionName", { ascending: true });
      if (error) throw new Error("Unable to load teacher sections.", { cause: error });
      return (data ?? []).filter((section) => section.isShared !== true);
    },
  });
}
