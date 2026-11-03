import { supabase } from "./supabase";

export const announcementCharacterLimit = 500;

export function GetAnnouncementsQueryKey(staffID) {
  return ["Announcements", staffID];
}

export async function GetAnnouncements(staffID) {
  const { data, error } = await supabase.from("Announcement")
    .select("sectionID, message")
    .eq("staffID", staffID);

  if (error) throw new Error("Unable to load announcements. Please try again.", { cause: error });
  return data ?? [];
}

export async function SaveAnnouncement(staffID, sectionIDs, message) {
  const text = message.trim();
  if (!staffID || !sectionIDs.length || sectionIDs.some((sectionID) => !sectionID)) {
    throw new Error("Select a section.");
  }
  if (!text || text.length > announcementCharacterLimit) {
    throw new Error(`Enter an announcement of 1 to ${announcementCharacterLimit} characters.`);
  }

  const { data, error } = await supabase.from("Announcement")
    .upsert(sectionIDs.map((sectionID) => ({ staffID, sectionID, message: text })), { onConflict: "sectionID" })
    .select("sectionID, message");

  if (error || data?.length !== sectionIDs.length) {
    throw new Error("Unable to save the announcement. Please try again.", { cause: error });
  }
  return data;
}
