import { useEffect, useRef } from "react";

const policies = {
  terms: {
    title: "Terms and Conditions",
    introduction: "D ko alam lalagay ko",
    
  },
  privacy: {
    title: "Privacy Policy",
    introduction: "Ewan ko",
  },
};

function TeacherPolicyPopup({ policy, onClose }) {
  const dialogRef = useRef(null);
  const content = policies[policy];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="teacherpolicydialog"
      aria-labelledby="teacherpolicytitle"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="teacherpolicyheader">
        <h2 id="teacherpolicytitle">{content.title}</h2>
        <button type="button" className="teacherpolicyclose" onClick={onClose} aria-label={`Close ${content.title}`} autoFocus>&times;</button>
      </header>
      <div className="teacherpolicycontent" tabIndex={0} role="region" aria-label={content.title}>
        <p className="teacherpolicydraft">Draft — review before publication.</p>
        <p>{content.introduction}</p>
        {content.sections.map((section) => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.text}</p>
          </section>
        ))}
      </div>
      <footer className="teacherpolicyfooter">
        <button type="button" className="recoveryprimary" onClick={onClose}>Close</button>
      </footer>
    </dialog>
  );
}

export default TeacherPolicyPopup;
