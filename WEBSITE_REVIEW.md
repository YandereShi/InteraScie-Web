# Website review — October 28, 2026

Findings from source-code inspection. This is not an exhaustive browser or live-backend audit. Fixes are being handled one at a time at the user's request.

| # | Priority | Finding | Status |
|---|---|---|---|
| 1 | High | Student Select All ignores the search filter and can select hidden students for deletion. | Fixed; lint and production build passed. |
| 2 | — | Student and teacher selections remain after changing searches, allowing users to find and select several people before one bulk deletion. | Intentional; keep this behavior per user decision. |
| 3 | High | Student deletions, teacher deletions, and section moves lack pending-request protection against overlapping submissions. | Fixed; 13 mocked regression scenarios, lint, and production build passed. |
| 4 | Medium | Question, section creation, and teacher creation popups can close while saving. | Fixed; isolated component checks, lint, and production build passed. |
| 5 | Medium | Temporary account-loading failures can cause sign-out instead of offering a retry; administrator access checks have similar recovery gaps. | Fixed; 73 isolated query/layout checks, lint, and production build passed. |
| 6 | Medium | Student edits and section moves do not explicitly refresh every affected roster, progress, and assessment cache; some views depend on realtime updates. | Fixed; cache/handler/realtime checks, lint, and production build passed. |
| 7 | Medium | Progress pagination does not clamp the active page when the roster shrinks. | Fixed; 13 isolated component checks, lint, and production build passed. |
| 8 | Medium | Confirmation dialogs do not trap keyboard focus, and destructive confirmations initially focus OK. | Fixed; 38 isolated confirmation/provider checks, lint, and production build passed. |
| 9 | Low | Opening /resetpassword without a valid token shows a disabled form without an explanatory error message. | Fixed; 9 isolated reset-page checks, lint, and production build passed. |
| 10 | — | Page code loads upfront; the main JavaScript bundle is approximately 1.23 MB before compression. | Intentional; user prefers faster page switching over reducing the first download. |
| 11 | Medium | Page navigation can unmount a page while its deletion or section move is still running. | Fixed; router checks, lint, and production build passed. |

## Supabase follow-up

The existing VALIDATION_AUDIT.md records server-side section-name validation as deferred. Verification is needed for rejecting symbol-only section names and protecting the reserved No Section name. Live Supabase protections have not been independently reverified during this review. No Supabase files or changes are needed for findings 1, 3, 4, 5, 6, 7, 8, 9, or 11.

## Finding 1: student Select All

Select All now selects all students matching the current search, across result pages. Its checked state uses those same filtered results, and it is disabled when there are no matches. Teacher and administrator student pages share this component.

Selections intentionally remain when searching for another student or teacher, as agreed with the user in finding 2.

Verification: ESLint and the production build passed. An isolated browser check with fake students was attempted, but sandbox restrictions prevented access to the local test server, so browser behavior remains unverified. No live student records were changed. The existing large-bundle build warning remains tracked as finding 10.

## Finding 3: prevent overlapping bulk requests

Student and teacher deletion buttons show Deleting... and are disabled while an action is pending. Removing students from a section shows Moving... and is also disabled. Immediate request guards prevent repeated calls even before React updates the buttons. Each guard starts before confirmation and remains active through the request, data refresh, and result message. Cancellation and failure release the guard so the user can retry.

Section deletion shares a guard with removing students from that section, so those operations cannot overlap. The active section selector and conflicting add/create buttons are disabled during these operations. Existing student and teacher selections across searches remain intact.

Verification: ESLint, the production build, and 13 mocked async regression scenarios passed. The scenarios exercised the actual handlers, covering rapid repeated calls during confirmation, network requests, refreshes and result dialogs; cancellation; network failure and retry; captured selected IDs; and conflicting section actions. These checks did not create, delete, move, or edit any live accounts or records. Browser behavior has not been verified for this change. The existing large-bundle build warning remains tracked as finding 10.

## Finding 11: keep pending actions on their page

While deleting students, teachers, questions, or sections, or removing students from a section, the website blocks route changes and browser Back/Forward navigation. The sidebar is inert to mouse and keyboard input, and logout is disabled. Question management also disables its View Scores button during deletion. Refreshing or closing the tab requests the browser's standard leave-page warning; the browser and user retain control of whether to leave.

The existing pending state is shared through the popup provider. It covers confirmation, requests, refreshes, and result dialogs, then clears on completion, cancellation, failure, or component cleanup. Navigation attempts are discarded, so finishing an action does not unexpectedly take the user to a previously clicked page. Routes now use React Router's data router to support its navigation blocker.

Verification: ESLint and the production build passed. Six isolated checks exercised the actual navigation guard with React Router across teacher/admin student pages, teacher management, teacher/admin sections, and assessments: route changes and Back/Forward stayed blocked while pending, navigation resumed afterward, and unload warning callbacks were active only while pending. The 13 existing mocked async scenarios also passed for cancellation, failure, retry, and overlapping actions. Browser UI checks were attempted with an isolated mock backend but browser launch timed out in this environment, so full browser verification remains outstanding. No live Supabase requests or data changes were made. The existing bundle-size warning remains; the current main bundle is approximately 1.23 MB before compression.

## Finding 4: keep save popups open until the request finishes

Add/Edit Question, Create Section, and Add Teacher now ignore backdrop and close-button attempts while saving. Cancel is disabled where present, and fields and answer/section selections are disabled so the visible form matches the submitted data. Immediate guards also block repeated submissions before React updates the buttons.

The parent still closes each popup after a successful save and refresh. On failure, the popup keeps the entered values, announces an error, and enables retrying or closing. Saving also uses the existing navigation guard. Shared pending state now counts active operations so an idle parent or a completed child cannot unlock another operation that is still pending.

Verification: 16 isolated component/hook scenarios passed for the actual transpiled popup components with simulated React hooks and mocked save callbacks: protected closing, rapid repeated submissions, disabled controls, preserved values on failure, validation, retry, success, cleanup, and overlapping pending registrations. ESLint and the production build passed. Full browser verification remains outstanding due to the browser-launch limitation recorded above. No live accounts or database records were changed.

## Finding 5: retry account checks after temporary failures

Teacher and administrator layouts now share a role-scoped account check. Network failures, service timeouts, rate limits, and failed staff lookups show a Try again action without signing out or clearing cached data. Checks paused because the browser is offline also show the retry message. The button displays Checking... while a retry runs. A successful retry opens the protected page without requiring credentials again.

A failed initial check does not render the protected page. If a background check fails after a profile was already verified, the existing page remains mounted under a retry banner so its forms and pending actions are preserved. Missing or invalid sessions, invalid refresh tokens, deleted users, and missing or wrong-role staff profiles still clear the current browser's session/cache and return to login. Invalid-session errors do not automatically retry. The administrator profile cache is refreshed by staff realtime changes. Email/password login behavior is unchanged.

Verification: ESLint, the production build, and 73 isolated query/layout scenarios passed. Tests used real SDK error classes with mocked account responses and simulated layout hooks for both roles, covering offline requests, service errors, rate limits, profile failures, missing/expired sessions, invalid refresh tokens, missing/wrong-role accounts, retry and recovery, paused checks, preserving previously verified content on background failures, duplicate redirect protection, navigation-guard cleanup, and failed sign-out requests. No live Supabase calls, sessions, or account data were changed. Full browser verification remains outstanding due to the browser-launch limitation recorded above.

## Finding 6: refresh dependent views after roster changes

Student creation, editing, deletion, and batch imports now share one refresh path with section moves. It covers the Students list, all cached section rosters (including source and destination), No Section students, progress tables, assessment scores, dashboard totals, radar/progress charts, time-taken data, and accuracy views. The shared teacher/admin pages use the same refresh behavior.

Section creation and deletion additionally refresh section lists, available teacher sections, progress/assessment options, and lesson/assessment access caches. Realtime student and section events use the same helpers, and reconnecting invalidates these views to recover changes missed while disconnected.

The helpers cancel older matching reads before invalidating them, so delayed responses cannot restore outdated data. Active views refetch before the successful action finishes; inactive views are marked stale and refetch when opened. This avoids immediately reloading every prefetched section/subject combination. Login, profile-photo, and question-definition caches are left alone.

Verification: ESLint and the production build passed. Isolated checks using the actual QueryClient covered multiple section/subject/teacher cache variants, active and inactive refresh behavior, student name/section changes, unrelated caches, and delayed active/inactive responses. Actual mutation handlers were tested for nine flows (student create/edit/delete, batch imports from both pages, moves into/out of sections, and section create/delete), checking refresh after success and no invalidation after failed writes. Student/section realtime callbacks, reconnect handling, and cleanup also passed isolated checks. These checks used mock responses and did not call Supabase or change live records. Full browser verification remains outstanding.

## Finding 7: keep Progress pagination within the roster

Progress now uses a valid active page for the student rows, page number, and Previous/Next button states. When a successfully loaded roster shrinks, it also clamps the stored page to the new last page. This makes Previous work on the first click and prevents later roster growth from unexpectedly restoring the former page. Empty rosters stay on page 1 with both navigation buttons disabled. Temporary loading and query errors do not reset the stored page.

Verification: ESLint, the production build, and 13 isolated scenarios using the actual transpiled Progress component with simulated hooks passed. Cases covered page 3 shrinking to page 2, immediate Previous/Next behavior, later roster growth, shrinking to one page or no students, exact 10/11-student boundaries, loading/error recovery, and section/subject changes. No Supabase requests or live record changes were made. Full browser verification remains outstanding.

## Finding 8: confirmation popup keyboard focus

Confirmation popups now cycle Tab and Shift+Tab through their buttons and optional scrollable list. Attempts to focus a background control are redirected into the popup. Destructive confirmations start on Cancel, so pressing Enter immediately cancels; ordinary messages still start on OK. Escape cancels once, and mouse confirmation/backdrop dismissal continue to work. Dialogs have accessible names and visible keyboard-focus outlines.

The provider captures the opening control before pending-state changes can disable it. Closing restores focus on the next animation frame, allowing that control to re-enable first. If the opener was removed, remains disabled, or is inert, focus moves to the teacher/admin page's main content instead. Cleanup does not steal focus from a replacement popup. This follows the focus behavior described in the [W3C modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Verification: ESLint, the production build, and 38 isolated checks using the actual transpiled popup/provider components with simulated hooks and DOM focus passed. Checks covered both confirmation types with and without long lists, Tab/Shift+Tab wrapping, outside focus, Escape, Enter, list scrolling keys, callback resolution, cleanup, opener capture/restoration, unavailable openers, re-enabled pending buttons, and replacement popups. These checks made no Supabase requests or live record changes. Real-browser keyboard verification remains outstanding due to the browser-launch limitation recorded above.

## Finding 9: explain invalid password-reset links

Opening /resetpassword with a missing/empty token or a type other than recovery now immediately shows: "This reset link is invalid or expired. Please request a new link." The invalid page displays an accessible error and Back to login instead of an unusable password form. Tokens rejected by the existing server verification also leave the error visible after the form is hidden. Valid-link submission, password validation, and the success message keep their existing behavior.

Verification: ESLint, the production build, and nine isolated checks using the actual transpiled reset page with simulated hooks and a mocked recovery client passed. Cases covered missing/empty/wrong-type links, the valid-link form, rejected tokens, invalid staff roles, successful updates, and password mismatches. No real Supabase requests, emails, sessions, or passwords were changed. Full browser verification remains outstanding.

## Finding 10: keep page code loaded upfront

User decision: retain the existing eager page imports so switching pages does not wait for a page-code download. The accepted tradeoff is a larger first download (approximately 1.23 MB before compression and 365 KB compressed in the latest build). Page data requests and cache behavior remain separate from loading JavaScript. No loading-code changes were made for this item.

All items in this review are now fixed or recorded as intentional. Remaining verification work includes full browser checks; the server-side section-name validation recorded in VALIDATION_AUDIT.md remains deferred.
