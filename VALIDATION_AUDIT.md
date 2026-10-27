# Validation fixes

## 1. Enforce question validation in Supabase

Status: Complete. React uses the 40-character choice limit. The installed Supabase trigger, all four 40-character choice checks, and the valid duplicate-question unique index were verified. React validation and partial-batch error handling checks passed.

Require a question and four different choices, enforce 150 characters for questions and 40 for choices, reject duplicate questions within an assessment, and enforce a maximum of 15 questions during simultaneous writes. Match capitalization, whitespace, and Unicode normalization rules used by React. Preserve partial acceptance of valid batch rows.

## 2. Keep open assessments valid

Status: Complete. The installed deletion trigger was verified to close matching assessment access automatically in the deletion transaction. React confirms the change and refreshes access caches. Opening still requires exactly 15 questions.

Confirm deletion with a warning that this assessment will close in all the teacher's sections. The replacement trigger locks the parent assessment and closes matching teacher/level assessment access in the same transaction as deletion or moving a question out. React refreshes cached assessment and lesson access across sections after successful deletion. Adding replacement questions does not reopen access. Existing foreign keys protect recorded student answers; failed deletion also rolls back closing access.

## 3. Prevent direct student and section writes from bypassing management validation

Status: Complete. Student and Section INSERT, UPDATE, DELETE, and TRUNCATE privileges are revoked for anon and authenticated, and no write policies remain on either table. No React changes were needed.

Both tables previously granted direct writes to anon and authenticated. The applied SQL revokes client INSERT, UPDATE, DELETE, and TRUNCATE permissions and removes five client write policies. Existing SELECT permissions and policies remain. studentmanagement and teachermanagement use server credentials, so their authorized writes remain available. There were no separate column grants to revoke. The authenticated finish_first_login function only clears the caller's own first-login flag and remains available.

## 4. Validate section names in Supabase

Status: Deferred by the user.

React rejects symbol-only section names, but studentmanagement does not. Direct database inserts can also bypass the reserved No Section rule.

## 5. Use exact username and email lookups

Status: Complete. studentmanagement version 13 and teacherlogin version 8 use exact equality for the affected lookups. No React or teachermanagement changes were needed.

Replace the two username ILIKE checks in studentmanagement and the email ILIKE lookup in teacherlogin with equality checks. Both functions already trim and lowercase their inputs; existing Student usernames and SchoolStaff emails were verified to be lowercase without surrounding spaces. Read-only database cases passed for literal underscores, percent signs, asterisks, distinct usernames, and normalized input. Existing edit checks continue excluding the current student's ID. This prevents wildcard matches without adding database objects or changing account data.

## 6. Prevent duplicate names, sections, and assessments during simultaneous requests

Status: Complete. All four unique indexes are installed, unique, valid, and match the intended definitions. studentmanagement version 14 and teachermanagement version 16 are deployed and active; their source and JWT settings were verified. React handles simultaneous assessment creation. Lint, production build, and mocked regression checks passed for assessment conflict recovery, management duplicate messages, partial student batches, and existing Auth cleanup and rollback. No real accounts were created or edited for testing.

Preserve current duplicate scopes: all Student full names, teacher-only SchoolStaff full names, all non-shared Section names, and Assessment staff/level pairs. Reuse the existing question_validation_key normalizer for case, whitespace, and NFC normalization. Fresh duplicate checks found no conflicting groups. Both manual and batch question creation reuse the winning assessment after a matching unique violation. Management changes must report the correct duplicate error while preserving Auth cleanup, Auth rollback, and partial student-batch results. No Supabase files are added to the React project.

## 7. Handle short generated student passwords consistently

Status: Complete. React password hint uses the padding rule. studentmanagement version 15 is deployed and active; its source and JWT settings were verified. Lint, production build, and mocked checks passed for helper/hint consistency, manual creation, batch creation, reset, reset permissions, and rollback. No real student accounts or passwords were changed for testing.

Keep the normalized firstname_lastname format and append trailing zeros only until the generated password reaches six characters. Li Wu becomes li_wu0, A B becomes a_b000, and longer passwords remain unchanged. Apply the same padding in the popup hint and the shared studentmanagement MakePassword function used by manual creation, batch creation, and reset. Existing account passwords change only when explicitly reset.

## 8. Define grading behavior after question edits

Status: Complete. The installed regrade function, updated answer validator, and enabled Question trigger were verified. A read-only production check found no mismatched totals between StudentAssessment and saved answer correctness. React refreshes score and accuracy caches and listens for answer changes. Lint, production build, cache checks, and isolated PostgreSQL tests passed for regrading, repeated saves, reversal, historical responses, validation, permissions, and rollback. No production answers or scores were changed for testing.

When a correct answer changes, recompute saved StudentAnswer correctness for that question and let the existing score-sync trigger recalculate affected StudentAssessment totals in the same transaction. Preserve each original selectedAnswer and totalQuestions. Repeated saves do not add extra points. Allow unchanged historical selections to be regraded after choice edits, but validate inserted or changed selections against current choices. Lock the question during answer validation to serialize submissions with key edits and lock affected attempts in order before regrading. Current data has no incorrect correctness flags or removed-choice responses. No Supabase files are added to the React project.

## 9. Review existing choices over the new limit

Status: Resolved by the revised 40-character choice limit.

Question IDs 13, 14, 15, 25, and 95 exceeded the previous 30-character limit. Existing choices fit the revised 40-character limit, so no content changes are needed.

## 10. Handle joined middle initials during student import

Status: Complete. The React parser ignores joined dotted middle initials while preserving full first names and compound surnames. Lint, production build, 21 name fixtures, and duplicate/malformed-name/username/row-number checks passed. No Excel template or Supabase changes were needed.

Recognize joined dotted initials such as A.B. and A.B in addition to separate A. B. tokens. Ignore these middle initials while preserving full first names and compound surnames. Keep undotted multi-letter names intact and continue validating malformed names in the editable preview. No Excel template or Supabase changes are needed.

## 11. Confirm the assessment completion prerequisite

Status: Complete. assessment-questions version 9 and submit-assessment version 8 are deployed and active; their source and JWT settings match the tested changes. Mocked checks passed for levels 1–12, missing/ongoing/wrong-student/wrong-level progress, completion lookup failures, teacher unlock, authentication, completed flow, existing results, and duplicate submission handling. No live student attempts or results were changed for testing.

Remove the level 1–11 completion bypass from assessment-questions and submit-assessment. Require Finished progress for the authenticated student and the assessment's corresponding level before opening or submitting. Preserve the teacher unlock, section ownership, authentication, validation, and existing-result checks. No React or database schema changes are needed, and existing results remain stored. No Supabase files are added to the React project.
