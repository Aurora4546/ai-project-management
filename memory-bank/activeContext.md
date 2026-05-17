# Active Context

## Current Work Focus
- All core features through **Week 10 (Backend Testing)** are complete and 100% verified.
- **Code Freeze:** Finalizing the current backend phase for deployment readiness.
- **System Stability:** Maintaining a robust test suite for the Spring Boot 4.0.5 ecosystem.

## Recent Changes (from conversation history)
- **Week 10: Backend Testing Stabilization:**
    - Achieved a 100% pass rate across **23 tests** covering Repository, Service, and Controller layers.
    - Migrated to **Spring Boot 4.0.5** test standards, utilizing `@MockitoBean` and modular test starters.
    - Implemented **Context Isolation** using `@Profile("!test")` to prevent production startup beans (schema updates, migrations) from failing during test context initialization.
    - Standardized **Persistence Parity** by configuring H2 in PostgreSQL mode, resolving constraint discrepancies.
    - Refactored **Controller Slice Tests** to use real `JwtAuthenticationFilter` with mocked dependencies, ensuring the security filter chain is fully exercised.
    - Resolved **Spring AI Integration Errors** in tests by excluding provider-specific autoconfigurations and providing mock beans for `ChatModel` and `ChatClient.Builder`.
- **AI Reporting Enhancements:** Expanded the Gemini API integration to generate 8 comprehensive narrative sections. Improved frontend rendering with `NarrativeCard` and contextual icons in `ReportDetailsModal`.
- **Issue Validation Feedback:** Enforced character limits for issue titles (max 50) and descriptions (max 500) with intuitive visual feedback in create/update modals.
- **Chat Styling & Layout Refinements:** Applied global `font-inter` to the chat feature. Resolved AI response text cropping issues in modals.
- **AI Report Stabilization:** Resolved "Unable to access lob stream" errors and implemented snapshot-based data persistence.
- **AI Report Delete Confirmation:** Integrated `DeleteConfirmModal` into the `Reports.tsx` page.
- **Issue Card Commenting Refinements:**
    - Resolved the "edited" badge appearing immediately on newly created issue comments by applying a 1-second threshold comparison to timestamps.
    - Restored issue tag navigation by correcting the regex in `UpdateIssueModal.tsx` to properly capture the issue database ID and support dynamic modal switching.

## Next Steps
- **Production Deployment:** Finalize deployment of the stabilized backend to Render.
- **Frontend Sync:** Ensure frontend testing or integration points align with the stabilized backend.
- **Component Decomposition:** Consider decomposing oversized components (`Backlog.tsx`, `UpdateIssueModal.tsx`, `AgileBoard.tsx`, `TeamChat.tsx`).

## Active Decisions and Considerations
- Maintaining strict premium aesthetic with TailwindCSS throughout the UI.
- `mentionUtils.tsx` is the single source of truth for mention/tag rendering — all notification surfaces must use it.
- WebSocket subscriptions use both project-level topics (`/topic/chat/{projectId}`) and user-specific queues (`/user/queue/chat`, `/user/queue/notifications`, `/user/queue/app-notifications`).
- Chat supports both group (project-level) and direct (1:1) messaging within the same `TeamChat` page via channel switching.
- `onIssueClick` callback pattern is used to intercept issue tag clicks and show modals instead of navigating.
