# Week 8 & 9 In-Depth Tutorial: AI Analytics & Project Reporting

This document provides a highly technical, chronological walkthrough of the **AI Reporting & Analytics System** implemented in Weeks 8 and 9. We moved beyond simple task tracking to a sophisticated analysis engine that uses Google Gemini AI to synthesize chat history, issue data, and team workload into actionable business reports.

---

## 1. The Architecture of AI Insights

The reporting system is built on a **Data-Snapshot** architecture. Instead of just showing live data, we "capture" the state of the project at the moment a report is generated. This ensures that a report from last month remains accurate even if issues were deleted or chat history was cleared.

### The 4-Layer Flow
1.  **Collector Layer**: Aggregates all project artifacts (Issues, Chat Messages, Team Members, Dates).
2.  **Synthesis Layer (AI)**: Enriches raw data into a structured 8-section narrative using **Google Gemini**.
3.  **Persistence Layer**: Saves the AI narrative *and* a snapshot of the raw data (JSON) into PostgreSQL.
4.  **Presentation Layer**: Renders high-fidelity charts (Recharts) and detailed narrative cards (TailwindCSS).
5.  **Validation Layer**: Enforces data integrity with character limits and visual feedback.

---

## 2. Backend: The Intelligence Engine

The heart of the reporting system is `ReportService.java`. This file orchestrates the entire lifecycle of a report.

### Step 1: Gathering Multi-Modal Context
We don't just send a count of issues. We send the "vibe" of the project by including recent chat logs and detailed issue descriptions.

```java
// Inside /service/ReportService.java

public ReportResponse generateReport(UUID projectId, User currentUser) {
    // 1. Fetch raw data
    List<Issue> issues = issueRepository.findByProjectId(projectId);
    List<ChatMessage> chatMessages = chatMessageRepository.findRecentMessages(projectId);
    
    // 2. Compute complex stats (Overdue, Unassigned, Completion Rate)
    long overdue = issues.stream().filter(i -> i.isOverdue()).count();
    
    // 3. Build the Context Prompt (The "Secret Sauce")
    String contextPrompt = buildContextPrompt(project, issues, chatMessages, ...);
    
    // 4. Call Gemini via Spring AI
    AiReportStructure aiResponse = callGemini(contextPrompt);
    
    // 5. Persist as a Snapshot
    return persistReport(project, currentUser, aiResponse, issues, chatMessages);
}
```

### Step 2: The 8-Section Prompt
We instructed Gemini to strictly follow a structured format. This prevents "hallucinations" and ensures the UI always knows where to find specific insights.

**The 8 Sections:**
1.  **Executive Summary**: High-level status.
2.  **Accomplishments**: What was completed.
3.  **Blockers**: Critical risks/stalls.
4.  **Next Steps**: Actionable tasks for the coming week.
5.  **Team Dynamics**: Analysis of collaboration based on chat logs.
6.  **Sprint Health**: Burn-down and velocity trends.
7.  **Risk Assessment**: Identifying potential failure points.
8.  **Velocity Analysis**: Team throughput metrics.

---

## 3. PDF Exporting: The "Stakeholder Ready" Feature

In Week 9, we added `PdfReportService.java` using **OpenPDF**. This translates our vibrant React UI into a professional, printable document.

### Key Logic: Visual Consistency
We defined a custom color palette in the PDF engine to match our TailwindCSS theme exactly.

```java
// Inside /service/PdfReportService.java

private static final Color PRIMARY = new Color(79, 70, 229); // Indigo-600
private static final Color SUCCESS = new Color(16, 185, 129); // Emerald-500

public byte[] generatePdf(ReportResponse report) {
    Document document = new Document(PageSize.A4);
    // 1. Add Title & Metrics Bar
    // 2. Loop through AI Narrative sections
    // 3. Render Statistical Tables (Status, Priority, Assignee)
    document.close();
}
```

---

## 4. Frontend: The Analytics Dashboard

The frontend (`Reports.tsx`) uses a sidebar-driven layout to manage historical reports and live generation.

### Feature 1: Snapshot-Driven Modals
When you click on "Overdue Issues" in a report from 2 weeks ago, the modal doesn't show *currently* overdue issues. It uses the `issueSnapshots` array saved inside that specific report.

```typescript
// Inside /components/ReportDetailsModal.tsx

useEffect(() => {
    if (report.issueSnapshots) {
        // Use the saved history for high integrity reporting
        setIssues(report.issueSnapshots.filter(i => isMatchingType(i, reportType)));
    }
}, [report, reportType]);
```

### Feature 2: Narrative Cards
We created a specialized `NarrativeCard` component that handles Markdown-style rendering for AI text, ensuring bolding, bullet points, and spacing are premium and readable.

---

## 5. Input Validation & UX Refinements

In Week 8, we focused on "Bulletproofing" the issue creation process to ensure high-quality data for the AI to analyze.

### Character Limits & Feedback
We implemented strict limits for issue metadata to prevent database bloat and ensure the AI remains focused on concise data.
- **Title**: 50 character limit.
- **Description**: 500 character limit.

### AI Insight UI Fixes
To ensure AI recommendations are never truncated, we applied flex-box constraints and overflow handling to the `InsightPanel` within the issue modals.
- Used `flex-1` and `overflow-y-auto` for content containers.
- Standardized `font-inter` across all AI-generated text blocks for a premium, unified look.

### Clean Report Layout
We removed redundant "Historical Snapshot" headers in the report view, replacing them with a minimal, elegant timestamp line. This maximizes screen real-estate for actual analytics.

**Frontend Implementation (`UpdateIssueModal.tsx`):**
```typescript
// Visual counter with color-coded feedback
<span className={`text-[10px] font-bold ${title.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>
    {title.length}/50
</span>

// Logical guard before submission
if (title.length > 50) {
    showToast("Title must be 50 characters or less", "error");
    return;
}
```

---

## 6. Important File Locations

| File | Path | Responsibility |
| :--- | :--- | :--- |
| **Report Service** | `pmanage/src/main/java/com/projectmanagement/pmanage/service/ReportService.java` | Main AI orchestration & stat computation. |
| **Assignment Service** | `pmanage/src/main/java/com/projectmanagement/pmanage/service/AiAssignmentService.java` | Analyzes workloads & history to suggest assignees. |
| **PDF Engine** | `pmanage/src/main/java/com/projectmanagement/pmanage/service/PdfReportService.java` | OpenPDF generation and layout. |
| **Report Controller** | `pmanage/src/main/java/com/projectmanagement/pmanage/controller/ReportController.java` | API endpoints for history, generation, and downloads. |
| **Main Page** | `frontend/src/pages/Reports.tsx` | Dashboard UI and Recharts integration. |
| **Details Modal** | `frontend/src/components/ReportDetailsModal.tsx` | Displays snapshot data for specific metrics. |
| **Data Types** | `frontend/src/types/index.ts` | Defines the `IReport` and `IReportSection` interfaces. |

---

---

## 7. Implementation Deep Dive: AI Project Reports

The **AI Reporting System** is the crown jewel of the analytics suite. It doesn't just show charts; it reads the project's pulse.

### The Orchestration logic (`ReportService.java`)
The backend gathers four distinct data streams:
1.  **Issues**: Every task, its status, and priority.
2.  **Chat History**: The last 200 messages for sentiment analysis.
3.  **Member Activity**: Who is doing what.
4.  **Raw Stats**: Pre-calculated counts of overdue and unassigned tasks.

```java
@Transactional
public ReportResponse generateReport(UUID projectId, User currentUser) {
    // 1. Data Collection
    List<Issue> issues = issueRepository.findByProjectId(projectId);
    List<ChatMessage> chatMessages = chatMessageRepository.findRecentMessages(projectId, 200);

    // 2. Prompt Building
    String contextPrompt = buildContextPrompt(project, issues, chatMessages, ...);

    // 3. AI Call (Gemini)
    AiReportStructure aiResponse = callGemini(contextPrompt);

    // 4. Snapshotting (Critical for historical integrity)
    List<IssueResponse> issueSnapshots = issues.stream()
            .map(issueService::mapToResponse)
            .collect(Collectors.toList());

    // 5. Persistence
    ProjectReport saved = persistReport(project, currentUser, aiResponse, issueSnapshots);
    return mapToReportResponse(saved);
}
```

---

## 8. Implementation Deep Dive: AI Auto-Assignment

The **AI Auto-Assign** feature acts as an intelligent dispatcher, matching new tasks to the most capable and available team members.

### How it works (`AiAssignmentService.java`)
Instead of just checking who has fewer tasks, the AI looks at **Implicit Skills** derived from past performance.

```java
private String buildContextPrompt(AiAssignmentRequest request, Project project, List<Issue> allIssues) {
    StringBuilder sb = new StringBuilder();
    sb.append("=== NEW TASK TO ASSIGN ===\n");
    sb.append("Title: ").append(request.getTitle()).append("\n");

    for (ProjectMember member : project.getMembers()) {
        // AI analyzes the last 10 completed tasks to infer expertise
        List<Issue> completedIssues = memberIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.DONE)
                .limit(10).toList();
        
        sb.append("Candidate: ").append(member.getUser().getFirstName()).append("\n");
        sb.append("Current Workload: ").append(activeIssues.size()).append("\n");
        sb.append("Past Performance Context: ").append(completedIssues.stream().map(Issue::getTitle).collect(joining(", ")));
    }
    return sb.toString();
}
```

### The AI Decision Logic
The System Prompt instructs Gemini to:
- Analyze task title/description.
- Compare against candidate "Implicit Skills" (frontend, backend, fixing bugs).
- Balance capability vs. availability.
- Provide a human-readable **Reason** for the choice.

---

## 9. Final Flow: Generating a Report

1.  **Trigger**: User clicks "New AI Report" in `Reports.tsx`.
2.  **Backend Fetch**: `ReportService` pulls the last 200 chat messages and every issue in the project.
3.  **Prompt Construction**: The backend builds a ~2000 word text block describing every team member's activity.
4.  **AI Analysis**: Gemini analyzes the tone of the chat (e.g., "User A seems frustrated about the API delay") and the status of issues.
5.  **JSON Mapping**: Gemini returns a JSON object mapped to `AiReportStructure.java`.
6.  **Persistence**: The report is saved. **CRITICAL:** Chat and Issue snapshots are serialized into JSON columns to preserve history.
7.  **Return & UI Update**: The frontend receives the new ID (along with the 8 narrative sections and snapshot data), reloads the history, and renders the charts and narrative.

---

## Summary of Advances

Weeks 8 and 9 transformed the application from a "System of Record" to a **"System of Intelligence"**. By combining **LLMs (Gemini)** with **Relational Snapshots (PostgreSQL)**, we've provided PMs with a tool that doesn't just list data, but explains *why* the project is on track or at risk.

***
