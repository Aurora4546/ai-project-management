# Week 8 & 9 In-Depth Tutorial: AI Summarization and PDF Reporting (Step-by-Step)

This document provides a highly technical, chronological walkthrough of the reporting and AI features we implemented in Weeks 8 and 9. We moved beyond simple CRUD operations to building an intelligent, automated project manager assistant that summarizes real-time project data using the **Google Gemini API** via **Spring AI**, and exports these insights into polished management reports using **OpenPDF**.

---

## 1. The Architecture of AI-Powered Reporting

In a typical Agile project, stakeholders want to know the health of the project, what was accomplished, and what is blocking progress. Instead of making them manually read through hundreds of chat messages and tickets, we use AI to synthesize this information.

### The Two-Step Process:
1.  **Data Gathering & AI Synthesis (Week 9)**: We collect the current state of all issues, compute statistics, and extract recent chat history. We feed this into a highly structured prompt to Google Gemini.
2.  **PDF Generation (Week 8)**: We take the structured output from the AI and generate a beautifully formatted, downloadable PDF using OpenPDF.

---

## 2. Week 9: AI Summarization with Spring AI

The brain of our reporting system lives in `ReportService.java`. This service orchestrates the data collection, prompt building, and interaction with the Gemini API.

### Step 1: Gathering Project Context
Before we can ask the AI to summarize, we need to provide it with raw data.

```java
// Inside /service/ReportService.java

public ReportResponse generateReport(UUID projectId, User currentUser) {
    // 1. Fetch core entities
    Project project = projectRepository.findById(projectId).orElseThrow();
    List<Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(projectId);
    
    // 2. Fetch the most recent 200 chat messages to understand team dynamics
    List<ChatMessage> chatMessages = chatMessageRepository
            .findRecentProjectMessages(projectId, PageRequest.of(0, 200));

    // 3. Compute raw statistics (completed vs overdue, assignee workload)
    long completedIssues = issues.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
    // ...
}
```

### Step 2: Building the Context Prompt
We construct a large string containing a text-based representation of the project.

```java
private String buildContextPrompt(Project project, List<Issue> issues, List<ChatMessage> chatMessages, /* stats */) {
    StringBuilder sb = new StringBuilder();
    
    // Append Project Info
    sb.append("=== PROJECT INFO ===\nName: ").append(project.getName()).append("\n...");
    
    // Append Critical Issues
    sb.append("=== CRITICAL/OVERDUE ISSUES ===\n");
    
    // Append Chat History
    sb.append("=== TEAM CHAT HISTORY ===\n");
    
    return sb.toString();
}
```

### Step 3: Prompting Gemini via Spring AI
We use Spring AI's `ChatClient` combined with native structured JSON output capabilities. By passing our `AiReportStructure` record class to the `.entity()` method, Spring AI automatically creates a JSON schema from the class's `@JsonPropertyDescription` annotations and instructs Gemini to return a strictly typed JSON response.

```java
private AiReportStructure callGemini(String contextPrompt) {
    String systemPrompt = """
            You are a project reporting assistant...
            Keep sentences short and direct. Avoid jargon.
            """;

    ChatClient chatClient = chatClientBuilder.build();
    return chatClient.prompt()
            .system(systemPrompt)
            .user(contextPrompt)
            .call()
            .entity(AiReportStructure.class);
}
```

### Step 4: Parsing and Persistence
Because we leverage Spring AI's built-in `BeanOutputConverter` via the `.entity()` method, the JSON response is seamlessly deserialized directly into our `AiReportStructure` Java object. We bypass brittle string parsing entirely and save the strongly typed data into the `ProjectReport` entity in our PostgreSQL database, ensuring reports are immutable and reliable.

---

## 3. Week 8: PDF Report Generation with OpenPDF

While displaying the report in the React UI is great, stakeholders often need a portable PDF. We implemented `PdfReportService.java` to handle this.

### Constructing the PDF Document
We use `OpenPDF` (a fork of iText) to programmatically draw the document.

```java
// Inside /service/PdfReportService.java

public byte[] generatePdf(ReportResponse report) {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    Document document = new Document(PageSize.A4, 40, 40, 40, 40);
    PdfWriter.getInstance(document, out);
    document.open();

    // 1. Add Title and Metadata
    addTitle(document, report);

    // 2. Add Key Metrics (Colored Boxes)
    addKeyMetrics(document, report);

    // 3. Add AI Generated Narrative Sections
    addAiSection(document, "Executive Summary", report.getExecutiveSummary(), PRIMARY_COLOR);
    addAiSection(document, "Accomplishments", report.getAccomplishments(), SUCCESS_COLOR);

    // 4. Add Data Tables
    addStatisticsSection(document, report);

    document.close();
    return out.toByteArray();
}
```

We utilize `PdfPTable` for complex layouts (like side-by-side metric boxes) and `Paragraph` with custom `Font` objects to ensure a premium aesthetic that matches our Tailwind UI.

---

## 4. The Controller Layer: Bridging Backend and Frontend

The `ReportController.java` exposes these services via REST endpoints. **Security is paramount here**: only users with the `PROJECT_MANAGER` role are permitted to generate or view these reports.

```java
// Inside /controller/ReportController.java

@PostMapping("/project/{projectId}")
public ResponseEntity<ReportResponse> generateReport(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal User currentUser) {

    // Strict Role-Based Access Control
    verifyProjectManager(projectId, currentUser);
    
    ReportResponse report = reportService.generateReport(projectId, currentUser);
    return ResponseEntity.ok(report);
}

@GetMapping("/project/{projectId}/{reportId}/pdf")
public ResponseEntity<byte[]> downloadPdfReport(...) {
    // ... verification ...
    byte[] pdfBytes = pdfReportService.generatePdf(report);

    return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Report.pdf\"")
            .body(pdfBytes);
}
```

By returning a `byte[]` with the `APPLICATION_PDF` media type, the browser automatically handles the file download prompt.

---

## 5. Detailed Code Example: The Full Generation Lifecycle

To truly understand Weeks 8 and 9, let's trace the flow of generating a new report:

1.  **UI Level**: A Project Manager clicks "Generate AI Report" in `Reports.tsx`.
2.  **Controller Level**: The `ReportController` intercepts the POST request and validates the user's role.
3.  **Data Gathering**: `ReportService` queries PostgreSQL for all `Issue` and `ChatMessage` records belonging to the project.
4.  **AI Prompting**: `ReportService` builds a massive context string and sends it to `Google Gemini` via Spring AI.
5.  **AI Synthesis**: Gemini processes the data and returns a structured JSON object matching our `AiReportStructure` schema.
6.  **Deserialization & Persistence**: Spring AI converts the JSON directly into our Java record, which is then mapped and saved to the `project_reports` table.
7.  **React Render**: The frontend receives the JSON and renders it using the `NarrativeCard` components, parsing the Markdown for bold and italic text.
8.  **PDF Download (Optional)**: The user clicks "Download PDF". The frontend triggers a GET request to the `/pdf` endpoint. `PdfReportService` translates the JSON into a byte array, which is downloaded directly to the user's machine.

## Summary of Architecture

By combining raw database queries with Large Language Model summarization, we transformed our simple issue tracker into an intelligent assistant. The strict decoupling of the AI layer (`ReportService`) and the Presentation layer (`PdfReportService` and React) ensures our codebase remains maintainable while delivering powerful, actionable insights to project managers.
