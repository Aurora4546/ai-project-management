# System Patterns

## Architecture Integration
- **Backend:** Strict MVC Pattern (Controllers, Services, Repositories, Entities). Package: `com.projectmanagement.pmanage`.
- **Frontend:** React Functional Components with Custom Hooks for logic separation. Vite + TypeScript.

## Key Technical Decisions
- **Validation:** Dual-layer. Formik+Yup on React; `@Valid`+`@ControllerAdvice` on Spring.
- **Data Hierarchy:** Relational DB (PostgreSQL) enforcing `Project > Epic > Task` with explicit cascade rules. Single-table `Issue` entity with self-referencing `parent` and `epic` fields.
- **Security:** Spring Security with JWT. Horizontal isolation (project visibility) and vertical isolation (Manager vs Member roles). `JwtAuthenticationFilter` + `JwtService` + `SecurityConfiguration`.
- **Real-time Comms:** WebSocket with STOMP/SockJS over standard REST polling. DB persistence for messages. `WebSocketConfig` + `WebSocketAuthInterceptor` for JWT-authenticated WS connections.
- **AI Integration:** Spring AI module abstracting Google Gemini API interactions, generating 8 distinct narrative sections (Executive Summary, Accomplishments, Blockers, etc.).
- **Reporting:** OpenPDF integration for creating downloadable project management reports.

## Design Patterns in Use
- **RESTful API:** Resource-based URLs, standard HTTP methods. `/api/v1/` prefix for project/user routes, `/api/issues/` for issues, `/api/chat/` for chat.
- **DTO Pattern:** Decoupling internal entities from external API contracts. Dedicated request/response DTOs in `dto` package.
- **Observer/Pub-Sub (WebSockets):** For real-time chat updates, typing indicators, presence, read receipts, and notifications.
- **Repository Pattern:** Spring Data JPA standardizing data access.
- **Centralized Utility Pattern:** `mentionUtils.tsx` for consistent `@mention` and `#issue` parsing/rendering across all surfaces.
- **Context + Hooks Pattern:** `AuthContext` for authentication state; `useWebSocket` custom hook for all WS lifecycle management.

## Testing Patterns (Backend)
- **Slice Testing:** Utilizing `@DataJpaTest` for repositories and `@WebMvcTest` for controllers to ensure isolated, high-performance validation.
- **Bean Overriding:** Leveraging `@MockitoBean` (Spring Boot 4+) for clean dependency mocking within slice contexts.
- **Security Integration:** Explicitly using `@Import(JwtAuthenticationFilter.class)` in controller tests to validate the security filter chain while mocking underlying `JwtService` and `UserRepository` dependencies.
- **Environment Parity:** H2 configured in `MODE=PostgreSQL` for testing to mirror production database behavior (e.g., column constraints, sequence logic).
- **Profile-Based Isolation:** Using `@Profile("!test")` on production-only infrastructure beans (database migrations, schema update listeners) to ensure test contexts initialize without side effects or missing production environment variables.
- **Mock AI Layer:** Explicitly mocking `ChatModel` and `ChatClient.Builder` to maintain unit test isolation from external LLM providers.

## Component Architecture

### Backend (Spring Boot MVC)
```
controller/
  ├── AuthenticationController     — Login/Register
  ├── ProjectController            — Project CRUD
  ├── IssueController              — Issue CRUD, comments, history, labels
  ├── ChatController               — REST endpoints for messages, files, search, read status
  ├── ChatWebSocketController      — STOMP message handlers (send, typing, presence)
  ├── AppNotificationController    — Persistent notification CRUD
  ├── UserController               — User search
  └── ReportController             — AI Summarization and PDF Generation

service/
  ├── AuthenticationService        — JWT auth logic
  ├── ProjectService               — Project business logic
  ├── IssueService                 — Issue business logic with history tracking
  ├── ChatService                  — Chat messaging, DMs, notifications, mentions, read status
  ├── ChatFileService              — File upload/download for chat
  ├── AiService                    — Gemini API interaction and system prompt building
  └── PdfReportService             — OpenPDF document generation

model/
  ├── User, Project, ProjectMember, ProjectRole
  ├── Issue, IssueType, IssueStatus, IssuePriority
  ├── Comment, IssueHistory, Label
  ├── ChatMessage, MessageType, ChatFileAttachment
  ├── ChatReadReceipt, ChatReadStatus
  └── AppNotification
```

### Frontend (React)
```
pages/
  ├── Login, Register              — Auth screens
  ├── Dashboard                    — Project list (Managed/Joined split)
  ├── AgileBoard                   — Drag-and-drop Kanban board
  ├── Backlog                      — Filterable/groupable issue list
  ├── TeamChat                     — Real-time chat (group + DM)
  └── Reports                      — AI Project Reports and PDF download

components/
  ├── Layout                       — Sidebar nav, top bar, global notifications
  ├── CreateProjectModal           — Project creation with member assignment
  ├── CreateIssueModal             — Issue creation form
  ├── UpdateIssueModal             — Full issue detail/edit with comments & history
  ├── DeleteConfirmModal           — Confirmation dialog
  ├── LabelSelector, ParentIssueSelector, Calendar  — Reusable form controls
  ├── GenericDropdown              — Reusable dropdown
  ├── RichTextEditor               — CKEditor integration
  ├── MentionTextarea              — @mention and #issue autocomplete input
  ├── ProtectedRoute               — Auth guard
  ├── chat/
  │   ├── ChatInput                — Message input with mention support
  │   ├── ChatMessage              — Individual message rendering
  │   ├── ChatMembersSidebar       — Online users panel
  │   ├── ChatSearch               — Message & file search
  │   ├── ChatNotificationToast    — Toast popup for new messages
  │   └── FilePreviewModal         — File attachment viewer
  └── report/
      ├── NarrativeCard            — Markdown rendering for AI narrative sections
      └── ReportDetailsModal       — Statistical data visualization with dynamic icons
```

## WebSocket Topic Structure
- `/topic/chat/{projectId}` — Project channel messages
- `/topic/chat/{projectId}/events` — Message update/delete events
- `/topic/chat/{projectId}/typing` — Typing indicators
- `/topic/chat/{projectId}/read` — Read receipts
- `/topic/presence` — Global online presence
- `/user/queue/chat` — Private DM messages
- `/user/queue/chat/events` — Private DM events
- `/user/queue/notifications` — Unread count + toast notifications
- `/user/queue/app-notifications` — Persistent notification history (mentions)
