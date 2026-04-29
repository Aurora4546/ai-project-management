# Product Context

## Purpose
To provide a minimalist, highly functional Agile Project Management system acting as a local, simplified alternative to complex tools like Jira.

## Problems Solved
- Eliminates cloud dependency and hosting costs by running entirely on a local environment.
- Reduces feature bloat by adhering strictly to an 8-feature MVP scope.
- Streamlines project communication by integrating real-time chat directly within the project context, including direct messaging, `@mentions`, and `#issue` tagging.
- Minimizes manual reporting overhead through AI-driven summarization and automated PDF reporting.
- Provides a cohesive notification system (toasts, bell history, unread counts) so users never miss important messages or mentions.

## How It Should Work
- Users operate within scoped projects as Managers or Members. Managers control access.
- Work is organized hierarchically: Projects contain Epics, which contain Tasks/Stories/Bugs.
- Tasks are managed via an interactive drag-and-drop Kanban board and a filterable/groupable Backlog.
- Project members communicate via real-time WebSocket chat with group channels and 1:1 DMs.
- Users can `@mention` teammates and `#tag` issues in chat for cross-referencing. Issue tags open detail modals inline without leaving the chat screen.
- File sharing in chat with upload, preview, and download capabilities.
- Global notification system with toast popups, a bell icon with notification history, and persistent mention tracking.
- Managers can generate PDF reports and utilize AI summaries of chat and task history to understand project status, blockers, and next steps quickly.

## User Experience Goals
- **Minimalist & Fast**: No page reloads for core interactions (chat, drag-and-drop). WebSocket-driven real-time updates.
- **Clear Feedback**: Form validation errors must be sharp, distinct (no pastels), with immediate inline instructional feedback.
- **Intuitive Workflow**: Standard agile board interactions that feel natural and require zero learning curve.
- **Premium Aesthetic**: TailwindCSS-driven design with consistent theming, avatar colors, material icons, and polished modals/toasts.
- **Never Miss a Beat**: Unread counts on navigation, toast notifications for new messages, and persistent mention history ensure users stay informed.
