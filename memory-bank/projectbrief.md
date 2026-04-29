# Project Brief: Agile Project Management System (MVP)

## Project Overview
A minimalist, Agile Project Management web application serving as a simplified Jira alternative. The system is designed to run entirely on a local environment (localhost) without any cloud deployment or server hosting infrastructure.

## Core Requirements & Goals
Strictly limited scope to the following 8 features to prevent over-engineering:
1. Role-Based Access Control (RBAC): Project Manager and Project Member roles with horizontal and vertical isolation.
2. Client-Server Form Validation: Two-layered validation (React Formik+Yup and Spring @Valid) with sharp UI error indicators.
3. Hierarchical Data Model: Project -> Epic -> Task with cascading deletion.
4. Interactive Agile Boards: Scrum/Kanban boards with drag-and-drop task status updates.
5. Backlog & Filtering: Dedicated Backlog view with dynamic filtering (assignee, status, project).
6. Synchronous Team Chat: Real-time, bi-directional project-level chat via Spring Boot WebSockets, saved for AI context.
7. Reporting Module: PDF management report generation via OpenPDF.
8. AI-Driven Cognitive Summarization: Google Gemini API integration (via spring-ai) to summarize task history and chat transcripts ("what was done, issues/blockers, next steps").

## 10-Week Roadmap
- **Week 1:** Foundation (Spring Boot, React, PostgreSQL schema, MVC skeleton).
- **Week 2:** Security (User login and registration with Spring Security, React screens).
- **Week 3:** Validation (Backend @Valid, Frontend Formik & Yup).
- **Week 4:** Hierarchy (JPA/Hibernate tables, CRUD APIs).
- **Week 5:** Backlog (React screen, filtering).
- **Week 6:** Agile Boards (Drag-and-drop React boards).
- **Week 7:** Sync Chat (WebSockets).
- **Week 8:** Reporting (OpenPDF endpoints).
- **Week 9:** AI Summarization (Gemini API).
- **Week 10:** Testing (JUnit code freeze).
