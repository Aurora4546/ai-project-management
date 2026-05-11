# Active Context

## Current Work Focus
- All core features through **Week 9 (AI Summarization)** are complete and polished.
- Recent work was focused on implementing PDF reporting, expanding the AI summarization system into 8 distinct data-driven sections, enhancing the UI for reports, and adding robust input validation for issue modals.
- Next milestone: **Week 10 (Testing)** — JUnit backend tests, Code Freeze.

## Recent Changes (from conversation history)
- **AI Reporting Enhancements:** Expanded the Gemini API integration to generate 8 comprehensive narrative sections (Executive Summary, Accomplishments, Blockers, Next Steps, Team Dynamics, Sprint Health, Risk Assessment, and Velocity Analysis). Improved frontend rendering with `NarrativeCard` and contextual icons in `ReportDetailsModal`.
- **Issue Validation Feedback:** Enforced character limits for issue titles (max 50) and descriptions (max 500) with intuitive visual feedback in create/update modals.
- **Chat Styling & Layout Refinements:** Applied global `font-inter` to the chat feature. Resolved AI response text cropping issues in modals by implementing flex-box constraints and scrollable containers. Cleaned up the AI Reports UI by removing redundant header boxes and standardizing generation timestamps.
- **Week 8 & 9 Tutorial:** Created `tutorials/week8_9_tutorial.md` covering AI Summarization (Gemini API), PDF Reporting (OpenPDF), and Input Validation refinements.
- **Chat Notification Navigation:** Fixed notification navigation to pass `messageId` and `isDirect` context to toasts and dropdowns. Chat view now reactively handles deep-link parameters for scrolling to specific messages.
- **Mention Notification Styling:** Centralized mention/tag parsing into `mentionUtils.tsx` utility. Updated `ChatNotificationToast` and Layout notification dropdown to render styled `@mentions` and `#ISSUE` tags identically to live chat.
- **Issue Click in Chat:** Tagged issues (`#PROJ-1`) in chat now open a modal instead of navigating to the agile board, keeping users on the chat screen.
- **AI Report Stabilization:** Resolved critical "Unable to access lob stream" (HTTP 500) and bean creation errors. Implemented snapshot-based data persistence for historical project reports, ensuring they remain static even as project data changes. Fixed PostgreSQL compatibility issues with column types (`TEXT` vs `LONGTEXT`).
- **Historical Report Integrity:** Enhanced `ReportService` to persist assignee metadata in snapshots and updated the frontend to prioritize these snapshots for rendering stats cards and issue lists in past reports.

## Next Steps
- Implement **Week 10: Testing** — JUnit backend tests, Code Freeze.
- Consider decomposing oversized components (`Backlog.tsx`, `UpdateIssueModal.tsx`, `AgileBoard.tsx`, `TeamChat.tsx`).

## Active Decisions and Considerations
- Maintaining strict premium aesthetic with TailwindCSS throughout the UI.
- `mentionUtils.tsx` is the single source of truth for mention/tag rendering — all notification surfaces must use it.
- WebSocket subscriptions use both project-level topics (`/topic/chat/{projectId}`) and user-specific queues (`/user/queue/chat`, `/user/queue/notifications`, `/user/queue/app-notifications`).
- Chat supports both group (project-level) and direct (1:1) messaging within the same `TeamChat` page via channel switching.
- `onIssueClick` callback pattern is used to intercept issue tag clicks and show modals instead of navigating.
