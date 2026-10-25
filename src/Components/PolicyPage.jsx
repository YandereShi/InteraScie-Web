import { useEffect } from "react";
import "../css/PolicyPage.css";

const policies = {
  privacy: {
    title: "Privacy Policy",
    introduction:
      "InteraScie is an educational science game used by Probex School. This Privacy Policy explains how student information is collected, used, and protected when using the game.",
    sections: [
      {
        title: "Information Collected",
        text: "InteraScie processes student names, usernames, assigned sections, lesson progress, assessment answers, and scores. Profile photos may also be processed when provided by authorized school personnel.",
      },
      {
        title: "Purpose of Collecting Information",
        text: "Information is used to provide account access, save lesson progress, conduct assessments, and help teachers monitor student learning.",
      },
      {
        title: "Access and Disclosure",
        text: "Authorized teachers and school administrators may access student records according to their responsibilities. Service providers supporting authentication, hosting, and storage process information needed to operate the system. Other disclosures must be authorized or permitted by applicable law.",
      },
      {
        title: "Information Stored on Devices",
        text: "The game stores login information, a cached student name, settings, and assessment drafts on the device. Students should sign out when using a shared device. Uninstalling the game does not automatically delete records stored online.",
      },
      {
        title: "Data Protection",
        text: "InteraScie uses authentication and access restrictions to protect student information. Users must keep their passwords private and report suspected unauthorized access to the school administrator. No system can guarantee complete security.",
      },
      {
        title: "Data Retention",
        text: "Student information is retained according to its educational purpose, applicable school policies, and legal requirements. Contact the Probex School administrator for the retention period that applies to your records.",
      },
      {
        title: "Privacy Rights",
        text: "Subject to applicable law, students or their authorized representatives may request access to their personal information, correction of inaccurate records, or deletion or blocking where permitted. Requests should be directed to the school administrator. These rights are described in the Philippine Data Privacy Act of 2012.",
      },
      {
        title: "Students and Guardians",
        text: "Students should use InteraScie under school guidance. Parents or guardians may contact the school about their child’s information. Acknowledging this policy does not replace any required school or parent/guardian authorization.",
      },
      {
        title: "Contact and Updates",
        text: "For privacy questions or requests, contact the Probex School administrator. This policy may be updated to reflect changes in the system or school procedures. Material changes will be communicated through the school or system.",
      },
    ],
  },
  terms: {
    title: "Terms of Use / EULA",
    introduction:
      "These Terms of Use and End User License Agreement describe the rules for using InteraScie for educational activities at Probex School.",
    sections: [
      {
        title: "Authorized Use",
        text: "InteraScie is intended for school-authorized science learning and assessments. Students may access lessons and assessments according to the permissions provided by their teachers and school administrators.",
      },
      {
        title: "Account Responsibilities",
        text: "Students must use their own assigned accounts, protect their passwords, and sign out on shared devices. Users must not share accounts or impersonate another student.",
      },
      {
        title: "Permission to Use the Game",
        text: "Authorized users may install and use the official game for school-related learning. This permission does not transfer ownership of the game or its materials. Game content and third-party materials remain the property of their respective owners.",
      },
      {
        title: "Prohibited Activities",
        text: "Users must not cheat, manipulate scores or saved progress, access another person’s account, bypass access restrictions, distribute assessment answers without permission, or interfere with the system.",
      },
      {
        title: "Learning and Assessments",
        text: "Students must follow teacher instructions and complete assessments honestly. Suspected errors in questions, scores, or saved progress should be reported to the teacher for review. Game simulations should not be treated as instructions to perform real experiments without appropriate supervision.",
      },
      {
        title: "Updates and Availability",
        text: "Some features require an internet connection. Maintenance, updates, device limitations, or connection problems may interrupt access or saving. Users should obtain updates through official school-provided links and report technical problems.",
      },
      {
        title: "Privacy",
        text: "Personal information is handled as explained in the Privacy Policy. Users must respect other people’s privacy and must not copy or disclose another student’s records without authorization.",
      },
      {
        title: "Account Restrictions",
        text: "The school administrator may restrict or suspend access when an account is misused, compromised, or no longer authorized. Questions about access decisions should be directed to the school administrator.",
      },
      {
        title: "Agreement, Changes, and Questions",
        text: "By checking the agreement box, users indicate agreement to these terms and acknowledge that they have read the Privacy Policy. Students who need help understanding either document should ask a teacher, parent, or guardian before proceeding. Material changes will be communicated through the school or system. For questions, contact the Probex School administrator.",
      },
    ],
  },
};

function PolicyPage({ policy }) {
  const content = policies[policy];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${content.title} | InteraScie`;
    window.scrollTo(0, 0);

    return () => { document.title = previousTitle; };
  }, [content.title]);

  return (
    <main className="plainpolicypage">
      <article aria-labelledby="policytitle">
        <h1 id="policytitle">{content.title}</h1>
        <p>{content.introduction}</p>
        {content.sections.map((section, index) => (
          <section key={section.title}>
            <h2>{index + 1}. {section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

export default PolicyPage;
