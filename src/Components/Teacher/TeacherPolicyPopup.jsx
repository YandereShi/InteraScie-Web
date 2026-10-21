import { useEffect, useRef } from "react";

import { useEffect, useRef } from "react";

const policies = {
  terms: {
    title: "Terms and Conditions",
    introduction:
      "Welcome to InteraScie. These Terms and Conditions establish the rules for teachers authorized to access and use the system. By accessing or using InteraScie, teachers agree to follow these terms and applicable school policies.",
    
    sections: [
      {
        heading: "1. Authorized Use",
        body: "InteraScie is intended for authorized educational personnel to manage student information and academic records for legitimate school-related purposes. Access is subject to the permissions granted by the school or system administrator."
      },
      {
        heading: "2. Account Responsibilities",
        body: "Teachers must provide an appropriate and accurate name during account creation and are responsible for activities performed through their accounts. Teachers must protect their account credentials and must not share access with unauthorized individuals."
      },
      {
        heading: "3. Proper Handling of Student Information",
        body: "Teachers must:",
        bullets: [
          "Use student information only for authorized educational purposes.",
          "Ensure that information entered into the system is accurate and updated when necessary.",
          "Keep student names, grades, and academic records confidential.",
          "Avoid downloading, copying, sharing, or disclosing student records without proper authorization.",
          "Report suspected unauthorized access, data exposure, or security incidents to the designated school administrator."
        ]
      },
      {
        heading: "4. Prohibited Activities",
        body: "Users must not:",
        bullets: [
          "Access records beyond their authorized permissions.",
          "Modify, delete, or misuse student information without authorization.",
          "Share account access with unauthorized individuals.",
          "Attempt to bypass security controls or interfere with system operations.",
          "Use the system for unlawful activities or purposes unrelated to its intended educational function."
        ]
      },
      {
        heading: "5. Data Privacy and Confidentiality",
        body: "Users must comply with applicable school privacy policies and data protection requirements, including the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), where applicable. Student information must be handled responsibly and disclosed only when authorized or legally permitted."
      },
      {
        heading: "6. System Availability and Maintenance",
        body: "Temporary interruptions may occur due to maintenance, technical issues, or updates. Users should report technical problems to the designated administrator."
      },
      {
        heading: "7. Account Suspension or Termination",
        body: "The school or authorized system administrator may restrict, suspend, or terminate access when necessary, including when a user violates these terms, loses authorization, or no longer requires access to the system."
      },
      {
        heading: "8. Changes to These Terms",
        body: "These Terms and Conditions may be revised when necessary. Users shall be informed of material changes through an appropriate school or system communication process."
      },
      {
        heading: "9. Acknowledgment",
        body: "By checking the acknowledgment box and proceeding with account creation or system access, the teacher confirms that they have read and understood these Terms and Conditions and agrees to comply with the stated rules, subject to applicable law and school policies."
      }
    ]
  },
  
privacy: {
  title: "Privacy Notice",
  introduction:
    "InteraScie is a web-based educational system designed to support teachers in managing student information and academic records. This Privacy Notice explains how information is collected, used, stored, and protected when the system is used.",

  sections: [
    {
      title: "1. Information Collected",
      text: "InteraScie may process the following information:\n\n• Teacher Information: The name provided by the teacher when creating an account.\n\n• Student Information: Student names, grades, and academic records entered or managed by authorized teachers."
    },
    {
      title: "2. Purpose of Data Collection",
      text: "Information is processed solely for the educational and administrative purposes of InteraScie, including student record management, academic monitoring, and related school activities."
    },
    {
      title: "3. Data Access and Disclosure",
      text: "Access to student information is limited to authorized users according to their assigned roles and responsibilities. Information shall not be disclosed to unauthorized individuals or used for purposes unrelated to the system's educational objectives, except as permitted or required by applicable law."
    },
    {
      title: "4. Data Protection and Security",
      text: "InteraScie is intended to protect personal information through appropriate security measures and access restrictions. Authorized users are expected to maintain the confidentiality of the information they access. No system can guarantee absolute security."
    },
    {
      title: "5. Data Retention",
      text: "Information shall be retained only for as long as necessary for its intended educational purpose and in accordance with applicable school policies and legal requirements. When retention is no longer necessary, information shall be securely deleted or disposed of, subject to applicable requirements."
    },
    {
      title: "6. Rights of Data Subjects",
      text: "Under applicable data privacy laws, individuals may have the right to be informed about the processing of their information and to request access to or correction of inaccurate information, as well as exercise other applicable rights. Requests involving student records may be directed to the school or its designated privacy contact."
    },
    {
      title: "7. Responsibilities of Teachers",
      text: "Teachers must ensure that student information entered into InteraScie is accurate, relevant, and handled confidentially. They must not access, disclose, copy, or use student information beyond their authorized educational responsibilities."
    },
    {
      title: "8. Contact Information",
      text: "For questions, concerns, or requests regarding personal information processed through InteraScie, please contact:\n\nSchool/Institution: PROBEX School\n\nEmail: [Insert Official School Email Address]"
    },
    {
      title: "9. Policy Updates",
      text: "This Privacy Notice may be updated when necessary to reflect changes in the system, school policies, or applicable legal requirements."
    }
  ]
},


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
