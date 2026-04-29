# Technical Context

## Technology Stack
- **Backend:** Java 25, Spring Boot 4.0.3, Lombok, Jakarta Validation
- **Frontend:** React.js 18+ (Hooks, Context, Formik, Yup), Vite, TypeScript
- **Database:** PostgreSQL (managed locally via pgAdmin)
- **Real-Time Communication:** Spring Boot WebSockets (STOMP/SockJS) via `@stomp/stompjs` + `sockjs-client`
- **AI Integration:** Google Gemini API (`spring-ai-google-genai-starter`) — planned
- **Reporting:** OpenPDF — planned
- **Testing:** JUnit 5 (Backend)
- **Rich Text:** CKEditor integration (`RichTextEditor.tsx`)
- **HTTP Client:** Axios with JWT interceptor
- **Styling:** TailwindCSS (exclusively, no standard CSS files)
- **Icons:** Google Material Symbols

## Development Setup
- Local environment only (localhost). No cloud deployment.
- Backend: `http://localhost:8080` (Spring Boot)
- Frontend: `http://localhost:5173` (Vite dev server)
- MVC architecture on backend.
- RESTful APIs for standard CRUD operations.
- WebSocket endpoint: `/ws` (SockJS fallback)

## Technical Constraints & Rules
- **Backend Guidelines:**
  - Strict MVC design pattern.
  - Spring Data JPA for ORM.
  - Constructor injection over field injection.
  - Custom exceptions with `@ControllerAdvice` (`GlobalExceptionHandler`).
  - Spring Security for robust RBAC.
  - UUID-based primary keys across all entities.
  - `BaseEntity` superclass for common audit fields.
  - Optimistic locking with `@Version` for sequential issue ID generation.
- **Frontend Guidelines:**
  - TailwindCSS exclusively for styling (no standard CSS files/tags).
  - typography MUST use the "Inter" font project-wide. Both `font-inter` and standard `font-sans` map to Inter in `tailwind.config.js`. Avoid hardcoding other font families without prior approval.
  - Strict component size (<150 lines target). Early returns, extracted logic (custom hooks).
  - Modern functional React component structure (Hooks -> Derived -> Handlers -> Effects -> Render).
  - Context7 MCP server must be used for latest React docs/best practices checks.
  - `useWebSocket` custom hook centralizes all WebSocket lifecycle.
  - Axios-based `api.ts` service layer with JWT auto-attach interceptor.
  - Barrel exports via `index.ts` in each directory.

## Key Dependencies & Libraries
- **Backend:** spring-boot-starter-web, spring-boot-starter-data-jpa, spring-boot-starter-websocket, spring-boot-starter-security, lombok, postgresql driver, spring-ai-google-genai-starter (planned)
- **Frontend:** react, react-router-dom, axios, formik, yup, @stomp/stompjs, sockjs-client, @ckeditor/ckeditor5-react, tailwindcss
