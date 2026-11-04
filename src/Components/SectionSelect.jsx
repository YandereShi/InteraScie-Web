import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GetSectionLabel, MatchesSchoolYear, SortSectionsBySchoolYear } from "../lib/schoolYear";
import SchoolYearSelect from "./SchoolYearSelect";
import "../css/SectionSelect.css";

function SectionSelect({ sections, value, onChange, schoolYear, onSchoolYearChange, label = "Section", allowAll = false, disabled = false, buttonClassName = "" }) {
  const trigger = useRef(null);
  const popup = useRef(null);
  const options = useRef(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({});
  const [portalHost, setPortalHost] = useState(null);
  const choices = SortSectionsBySchoolYear(sections.filter((section) => MatchesSchoolYear(section, schoolYear)));
  const selected = sections.find((section) => String(section.sectionID) === String(value));
  const allLabel = schoolYear === "all" ? "All Sections" : `All Sections (${schoolYear === "unassigned" ? "SY not assigned" : schoolYear})`;
  const text = allowAll && value === "all" ? allLabel : selected ? GetSectionLabel(selected) : "No sections";
  const expanded = open && !disabled;

  const Reposition = useCallback(() => {
    setPortalHost(trigger.current.closest("dialog") ?? document.body);
    const bounds = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(bounds.width, 260), window.innerWidth - 16);
    const below = window.innerHeight - bounds.bottom - 12;
    const above = bounds.top - 12;
    const showBelow = below >= 240 || below >= above;
    setPosition({
      width,
      left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)),
      maxHeight: Math.min(350, Math.max(0, showBelow ? below : above)),
      ...(showBelow ? { top: bounds.bottom + 4 } : { bottom: window.innerHeight - bounds.top + 4 }),
    });
  }, []);

  function Close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function Pick(next) {
    onChange(next);
    Close();
  }

  function Navigate(event) {
    const buttons = [...options.current.querySelectorAll('[role="option"]')];
    if (!buttons.length) return;
    const index = buttons.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
    else if (event.key === "ArrowUp") next = index <= 0 ? buttons.length - 1 : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].focus();
  }

  useEffect(() => {
    if (!expanded) return;
    popup.current.querySelector("select")?.focus();

    function Outside(event) {
      if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    }

    function Escape(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }

    function Move() {
      Reposition();
    }

    document.addEventListener("pointerdown", Outside);
    document.addEventListener("focusin", Outside);
    document.addEventListener("keydown", Escape, true);
    window.addEventListener("resize", Move);
    window.addEventListener("scroll", Move, true);
    return () => {
      document.removeEventListener("pointerdown", Outside);
      document.removeEventListener("focusin", Outside);
      document.removeEventListener("keydown", Escape, true);
      window.removeEventListener("resize", Move);
      window.removeEventListener("scroll", Move, true);
    };
  }, [expanded, Reposition]);

  return (
    <div className="sectionselect">
      <button ref={trigger} type="button" role="combobox" className={`sectionselectbutton ${buttonClassName}`} aria-label={label} aria-expanded={expanded} aria-haspopup="listbox" aria-controls={`${id}-options`} disabled={disabled} title={text}
        onClick={() => { if (expanded) setOpen(false); else { Reposition(); setOpen(true); } }}
        onKeyDown={(event) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); Reposition(); setOpen(true); } }}>
        <span>{text}</span><span aria-hidden="true">▾</span>
      </button>
      {expanded && portalHost && createPortal(
        <div ref={popup} className="sectionselectpopup" style={position} onClick={(event) => event.stopPropagation()}>
          <label className="sectionselectyear">
            <span>School Year</span>
            <SchoolYearSelect sections={sections} value={schoolYear} label={`${label} school year`} onChange={onSchoolYearChange} />
          </label>
          <div ref={options} id={`${id}-options`} className="sectionselectoptions" role="listbox" aria-label={`${label} choices`} onKeyDown={Navigate}>
            {allowAll && <button type="button" role="option" aria-selected={value === "all"} onClick={() => Pick("all")}>{allLabel}</button>}
            {choices.map((section) => <button type="button" role="option" key={section.sectionID} aria-selected={String(value) === String(section.sectionID)} onClick={() => Pick(String(section.sectionID))}>{GetSectionLabel(section)}</button>)}
            {choices.length === 0 && <p>No sections in this school year.</p>}
          </div>
        </div>, portalHost
      )}
    </div>
  );
}

export default SectionSelect;
