# Progress Tracker

## Current Status
- **Phase:** Testing & Code Freeze
- **Action:** Weeks 1–9 completed. Chat system, PDF reporting, and comprehensive AI summarization fully operational. Preparing for Week 10 (Testing).

## What Works
- Spring Boot backend context loads successfully connected to local PostgreSQL database.
- React Vite frontend builds and runs perfectly.
- Complete Auth flow with User Roles (Spring Security + JWT).
- Project Creation, Management, and Dashboard splits (Managed vs Joined) work perfectly.
- Jira-style Issue models (Epic, Task, Story, Bug) deployed to Hibernate with single-table architecture.
- Full Backlog view with advanced filtering (assignee, status, priority, type, epic, labels) and grouping (by assignee, epic, status).
- Interactive Agile Board (drag-and-drop) with Kanban columns and status updates.
- Complete Issue CRUD with UpdateIssueModal (comments, history tracking, labels, parent/epic assignment, rich text descriptions).
- Real-time WebSocket chat (STOMP/SockJS) with project-level channels.
- Direct messaging (DMs) between project members.
- `@user` mentions and `#ISSUE-KEY` issue tagging in chat with styled rendering.
- Centralized `mentionUtils.tsx` for consistent mention/tag formatting across chat, notifications, and toasts.
- Chat file attachments (upload, preview, download).
- Chat message editing and deletion with real-time propagation via WebSocket events.
- Typing indicators and online presence tracking.
- Read receipts and unread message counts (per-project and per-DM).
- Global notification system: toast notifications for new messages, bell icon with notification history, mention-based `AppNotification` persistence.
- Chat search (messages and files) for both project channels and DMs.
- Issue modal opens from tagged issues in chat (instead of navigating away).
- DM mention restrictions (can only mention self in DMs).
- Layout with sidebar navigation, global unread counts on Team Chat link.
- **Reporting:** PDF management report generation via OpenPDF endpoints.
- **AI Summarization:** Google Gemini API integration generating 8 comprehensive project analysis sections (Executive Summary, Accomplishments, Blockers, Next Steps, Team Dynamics, Sprint Health, Risk Assessment, Velocity Analysis).
- **Report UI:** Robust frontend rendering of AI reports with `NarrativeCard` and contextual stat modal icons.
- **Form Validation:** Enforced character limits for issue titles (max 50) and descriptions (max 500) with intuitive visual feedback.
- **Reporting Stability:** Resolved 500 errors and LOB stream issues; implemented data snapshots to preserve historical report integrity.
- **AI Report Delete Confirmation:** Integrated confirmation modal for report deletion.

## What's Left to Build (10-Week Roadmap)
- [x] **Week 1:** Foundation (Spring Boot, React, Postgres setup, MVC skeleton)
- [x] **Week 2:** Security (User login & registration Spring Security, React screens)
- [x] **Week 3:** Validation (Backend @Valid, Frontend Formik & Yup)
- [x] **Week 4:** Hierarchy (JPA Entities, CRUD APIs)
- [x] **Week 5:** Backlog (React screen, filtering, grouping)
- [x] **Week 6:** Agile Boards (React drag-and-drop, status updates)
- [x] **Week 7:** Sync Chat (WebSockets, DMs, mentions, notifications, file sharing)
- [x] **Week 8:** Reporting (OpenPDF endpoints)
- [x] **Week 9:** AI Summarization (Gemini API integration, technical documentation complete)
- [ ] **Week 10:** Testing (JUnit backend tests, Code Freeze)

## Known Issues
- Some large components exceed the 150-line target (e.g., `Backlog.tsx` ~53KB, `UpdateIssueModal.tsx` ~46KB, `AgileBoard.tsx` ~36KB, `TeamChat.tsx` ~29KB). These could benefit from decomposition.
- `AppNotification.java` uses manual getters/setters instead of Lombok (inconsistent with other entities).
