# Active Context

## Current Work Focus
- All core features through **Week 7 (Sync Chat)** are complete and polished.
- Recent work was focused on refining the chat notification system: global unread counts, mention-based persistent notifications, toast styling, deep-link navigation to specific messages, and DM-specific behavior.
- Next milestone: **Week 8 (Reporting)** — PDF management report generation via OpenPDF.

## Recent Changes (from conversation history)
- **Chat Notification Navigation:** Fixed notification navigation to pass `messageId` and `isDirect` context to toasts and dropdowns. Chat view now reactively handles deep-link parameters for scrolling to specific messages.
- **Mention Notification Styling:** Centralized mention/tag parsing into `mentionUtils.tsx` utility. Updated `ChatNotificationToast` and Layout notification dropdown to render styled `@mentions` and `#ISSUE` tags identically to live chat.
- **Issue Click in Chat:** Tagged issues (`#PROJ-1`) in chat now open a modal instead of navigating to the agile board, keeping users on the chat screen.
- **DM Mention Restrictions:** `ChatInput` accepts an `isDirect` flag; when in DM mode, the `@` mention suggestion list only shows the current user.
- **Global Unread Count:** Refactored unread message counting to a global state independent of active project. Persistent unread counter on "Team Chat" sidebar nav item. Removed redundant pulsing indicators from project dashboard cards.
- **Chat History Sync Fix:** Aligned `ChatSearch` and file/message loading with the `activeChannel` state (project vs. DM) to prevent orphaned or irrelevant records.
- **Modal Z-Index Fix:** Adjusted top nav bar z-index in `Layout.tsx` to sit behind modal windows.
- **Week 7 Tutorial:** Created `tutorials/week7_tutorial.md` covering Spring Data JPA repositories.

## Next Steps
- Implement **Week 8: Reporting Module** — OpenPDF PDF generation endpoints for management reports.
- Implement **Week 9: AI Summarization** — Google Gemini API integration via `spring-ai` for task history and chat transcript summarization.
- Consider decomposing oversized components (`Backlog.tsx`, `UpdateIssueModal.tsx`, `AgileBoard.tsx`, `TeamChat.tsx`).

## Active Decisions and Considerations
- Maintaining strict premium aesthetic with TailwindCSS throughout the UI.
- `mentionUtils.tsx` is the single source of truth for mention/tag rendering — all notification surfaces must use it.
- WebSocket subscriptions use both project-level topics (`/topic/chat/{projectId}`) and user-specific queues (`/user/queue/chat`, `/user/queue/notifications`, `/user/queue/app-notifications`).
- Chat supports both group (project-level) and direct (1:1) messaging within the same `TeamChat` page via channel switching.
- `onIssueClick` callback pattern is used to intercept issue tag clicks and show modals instead of navigating.
