import { GetSectionLabel } from "../../lib/schoolYear";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetTeacherSections } from "../../lib/teacherData";
import { announcementCharacterLimit, GetAnnouncements, GetAnnouncementsQueryKey, SaveAnnouncement } from "../../lib/announcementQueries";
import { useActionPending } from "../../lib/useActionPending";
import "../../css/AnnouncementPopup.css";

function AnnouncementPopup({ staffID, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const queryClient = useQueryClient();
  const [sectionID, setSectionID] = useState("");
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useActionPending(busy);

  const sectionsQuery = useQuery({
    queryKey: ["AnnouncementSections", staffID],
    queryFn: () => GetTeacherSections(staffID),
    staleTime: 0,
  });
  const announcementsQuery = useQuery({
    queryKey: GetAnnouncementsQueryKey(staffID),
    queryFn: () => GetAnnouncements(staffID),
    retry: false,
  });
  const sections = sectionsQuery.data ?? [];
  const allSections = sectionID === "all";
  const selectedSections = allSections ? sections : sections.filter((item) => String(item.sectionID) === sectionID);
  const announcement = announcementsQuery.data?.find((item) => String(item.sectionID) === sectionID);
  const message = drafts[sectionID] ?? announcement?.message ?? "";
  const loading = sectionsQuery.isPending || announcementsQuery.isPending;
  const loadError = sectionsQuery.error ?? announcementsQuery.error;

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  async function Save(event) {
    event.preventDefault();
    if (pending.current || loading || loadError || !selectedSections.length || !message.trim()) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await SaveAnnouncement(staffID, selectedSections.map((item) => item.sectionID), message);
      const savedSections = new Set(result.map((item) => String(item.sectionID)));
      queryClient.setQueryData(GetAnnouncementsQueryKey(staffID), (current = []) => [
        ...current.filter((item) => !savedSections.has(String(item.sectionID))), ...result,
      ]);
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(result.map((item) => [String(item.sectionID), item.message])),
        [sectionID]: message.trim(),
      }));
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "Unable to save the announcement. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="announcementpopup" aria-labelledby="announcementtitle" onCancel={(event) => {
      event.preventDefault();
      if (!pending.current) onClose();
    }}>
      <div className="announcementheader">
        <h2 id="announcementtitle">Announcement</h2>
        <button type="button" aria-label="Close announcement" disabled={busy} onClick={onClose}>&times;</button>
      </div>
      <p className="announcementintro">
        {allSections
          ? `Saving will replace the current announcement in all ${sections.length} sections with this message.`
          : "Write a reminder or update for one section or all your sections. Saving replaces the selected section's current announcement."}
      </p>
      <form onSubmit={Save}>
        <div className="announcementfield">
          <label htmlFor="announcementsection">Section</label>
          <select id="announcementsection" value={sectionID} required disabled={busy || sectionsQuery.isPending || sections.length === 0} onChange={(event) => {
            setSectionID(event.target.value);
            setError("");
            setSaved(false);
          }}>
            <option value="">Select a section</option>
            {sections.length > 0 && <option value="all">All sections</option>}
            {sections.map((item) => <option key={item.sectionID} value={String(item.sectionID)}>{GetSectionLabel(item)}</option>)}
          </select>
        </div>
        <div className="announcementfield">
          <label htmlFor="announcementmessage">Message</label>
          <textarea id="announcementmessage" rows={5} required maxLength={announcementCharacterLimit} value={message}
            disabled={busy || loading || !selectedSections.length} aria-describedby="announcementcount"
            placeholder="Type your announcement here..." onChange={(event) => {
              setDrafts((current) => ({ ...current, [sectionID]: event.target.value }));
              setError("");
              setSaved(false);
            }} />
        </div>
        <p className="announcementcount" id="announcementcount">{message.length}/{announcementCharacterLimit} characters</p>
        {loading && <p role="status">Loading announcement options...</p>}
        {!sectionsQuery.isPending && !sectionsQuery.isError && sections.length === 0 && <p role="status">No sections assigned yet.</p>}
        {(error || loadError) && <p className="announcementerror" role="alert">{error || loadError.message}</p>}
        {loadError && <button type="button" className="announcementretry" disabled={sectionsQuery.isFetching || announcementsQuery.isFetching} onClick={() => {
          void sectionsQuery.refetch();
          void announcementsQuery.refetch();
        }}>Try again</button>}
        {saved && selectedSections.length > 0 && <p className="announcementsuccess" role="status">Announcement saved for {allSections ? "all sections" : GetSectionLabel(selectedSections[0])}.</p>}
        <div className="announcementactions">
          <button type="submit" className="announcementsave" disabled={busy || loading || Boolean(loadError) || !selectedSections.length || !message.trim() || message.length > announcementCharacterLimit}>
            {busy ? "Saving..." : "Save announcement"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default AnnouncementPopup;
