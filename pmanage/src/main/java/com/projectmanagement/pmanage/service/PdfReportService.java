package com.projectmanagement.pmanage.service;
// Refresh

import org.openpdf.text.*;
import org.openpdf.text.Font;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.openpdf.text.pdf.draw.LineSeparator;
import com.projectmanagement.pmanage.dto.ReportResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Service for generating PDF reports from ReportResponse data using OpenPDF.
 */
@Slf4j
@Service
public class PdfReportService {

    private static final DateTimeFormatter PDF_DATE_FMT = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' HH:mm");

    // Color palette
    private static final Color PRIMARY = new Color(79, 70, 229);       // Indigo-600
    private static final Color DARK_TEXT = new Color(17, 24, 39);       // Gray-900
    private static final Color MUTED_TEXT = new Color(107, 114, 128);   // Gray-500
    private static final Color SECTION_BG = new Color(243, 244, 246);   // Gray-100
    private static final Color TABLE_HEADER_BG = new Color(79, 70, 229); // Indigo-600
    private static final Color TABLE_ALT_ROW = new Color(249, 250, 251); // Gray-50
    private static final Color SUCCESS = new Color(16, 185, 129);       // Emerald-500
    private static final Color WARNING = new Color(245, 158, 11);       // Amber-500
    private static final Color DANGER = new Color(239, 68, 68);         // Red-500

    // Fonts
    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 22, Font.BOLD, PRIMARY);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 11, Font.NORMAL, MUTED_TEXT);
    private static final Font SECTION_HEADER_FONT = new Font(Font.HELVETICA, 14, Font.BOLD, DARK_TEXT);
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, DARK_TEXT);
    private static final Font BODY_BOLD_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, DARK_TEXT);
    private static final Font STAT_LABEL_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, MUTED_TEXT);
    private static final Font TABLE_HEADER_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
    private static final Font TABLE_CELL_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, DARK_TEXT);

    /**
     * Generates a PDF byte array from the report data.
     */
    public byte[] generatePdf(ReportResponse report) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // Title Section
            addTitle(document, report);

            // Key Metrics Bar
            addKeyMetrics(document, report);

            // AI Sections
            addAiSection(document, "Executive Summary", report.getExecutiveSummary(), PRIMARY);
            addAiSection(document, "Accomplishments", report.getAccomplishments(), SUCCESS);
            addAiSection(document, "Blockers & Risks", report.getBlockers(), DANGER);
            addAiSection(document, "Next Steps", report.getNextSteps(), WARNING);
            addAiSection(document, "Team Dynamics", report.getTeamDynamics(), PRIMARY);

            // Statistics Tables
            addStatisticsSection(document, report);

            document.close();
        } catch (Exception e) {
            log.error("Failed to generate PDF report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }

        return out.toByteArray();
    }

    private void addTitle(Document document, ReportResponse report) throws DocumentException {
        Paragraph title = new Paragraph(report.getProjectName() + " — Project Report", TITLE_FONT);
        title.setAlignment(Element.ALIGN_LEFT);
        document.add(title);

        Paragraph subtitle = new Paragraph(
                "Project Key: " + report.getProjectKey() + "  |  Generated: " +
                        (report.getGeneratedAt() != null ? report.getGeneratedAt().format(PDF_DATE_FMT) : "N/A"),
                SUBTITLE_FONT);
        subtitle.setSpacingAfter(8);
        document.add(subtitle);

        document.add(new LineSeparator(1f, 100f, PRIMARY, Element.ALIGN_CENTER, -2));
        document.add(Chunk.NEWLINE);
    }

    private void addKeyMetrics(Document document, ReportResponse report) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(5);
        table.setSpacingAfter(15);

        addMetricCell(table, String.valueOf(report.getTotalIssues()), "Total Issues", PRIMARY);
        addMetricCell(table, String.valueOf(report.getCompletedIssues()), "Completed", SUCCESS);
        addMetricCell(table, String.valueOf(report.getTotalIssues() - report.getCompletedIssues()), "Open", WARNING);
        addMetricCell(table, String.valueOf(report.getTotalMessages()), "Chat Messages", PRIMARY);

        document.add(table);
    }

    private void addMetricCell(PdfPTable table, String value, String label, Color accentColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.BOX);
        cell.setBorderColor(new Color(229, 231, 235)); // Gray-200
        cell.setPadding(10);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(SECTION_BG);

        Font numberFont = new Font(Font.HELVETICA, 20, Font.BOLD, accentColor);
        Paragraph number = new Paragraph(value, numberFont);
        number.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(number);

        Paragraph labelPara = new Paragraph(label, STAT_LABEL_FONT);
        labelPara.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(labelPara);

        table.addCell(cell);
    }

    private void addAiSection(Document document, String title, String content, Color accentColor) throws DocumentException {
        if (content == null || content.isBlank()) return;

        // Section header with colored accent
        Paragraph header = new Paragraph();
        Chunk accent = new Chunk("■  ", new Font(Font.HELVETICA, 14, Font.BOLD, accentColor));
        header.add(accent);
        header.add(new Chunk(title, SECTION_HEADER_FONT));
        header.setSpacingBefore(12);
        header.setSpacingAfter(6);
        document.add(header);

        // Content
        Paragraph body = new Paragraph(content, BODY_FONT);
        body.setSpacingAfter(10);
        body.setLeading(14);
        document.add(body);
    }

    private void addStatisticsSection(Document document, ReportResponse report) throws DocumentException {
        document.add(new LineSeparator(0.5f, 100f, MUTED_TEXT, Element.ALIGN_CENTER, -2));
        Paragraph header = new Paragraph("\nDetailed Statistics", SECTION_HEADER_FONT);
        header.setSpacingAfter(10);
        document.add(header);

        // Issues by Status
        if (report.getIssuesByStatus() != null && !report.getIssuesByStatus().isEmpty()) {
            addStatsTable(document, "Issues by Status", report.getIssuesByStatus());
        }

        // Issues by Priority
        if (report.getIssuesByPriority() != null && !report.getIssuesByPriority().isEmpty()) {
            addStatsTable(document, "Issues by Priority", report.getIssuesByPriority());
        }

        // Issues by Type
        if (report.getIssuesByType() != null && !report.getIssuesByType().isEmpty()) {
            addStatsTable(document, "Issues by Type", report.getIssuesByType());
        }

        // Issues by Assignee
        if (report.getIssuesByAssignee() != null && !report.getIssuesByAssignee().isEmpty()) {
            addStatsTable(document, "Issues by Assignee", report.getIssuesByAssignee());
        }
    }

    private void addStatsTable(Document document, String title, Map<String, Long> data) throws DocumentException {
        Paragraph tableTitle = new Paragraph(title, BODY_BOLD_FONT);
        tableTitle.setSpacingBefore(8);
        tableTitle.setSpacingAfter(4);
        document.add(tableTitle);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.setWidths(new float[]{3, 1});

        // Header Row
        PdfPCell headerCell1 = new PdfPCell(new Phrase("Category", TABLE_HEADER_FONT));
        headerCell1.setBackgroundColor(TABLE_HEADER_BG);
        headerCell1.setPadding(6);
        table.addCell(headerCell1);

        PdfPCell headerCell2 = new PdfPCell(new Phrase("Count", TABLE_HEADER_FONT));
        headerCell2.setBackgroundColor(TABLE_HEADER_BG);
        headerCell2.setPadding(6);
        headerCell2.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(headerCell2);

        // Data Rows
        int rowIndex = 0;
        for (Map.Entry<String, Long> entry : data.entrySet()) {
            Color rowBg = (rowIndex % 2 == 0) ? Color.WHITE : TABLE_ALT_ROW;

            PdfPCell keyCell = new PdfPCell(new Phrase(formatKey(entry.getKey()), TABLE_CELL_FONT));
            keyCell.setBackgroundColor(rowBg);
            keyCell.setPadding(5);
            table.addCell(keyCell);

            PdfPCell valueCell = new PdfPCell(new Phrase(String.valueOf(entry.getValue()), TABLE_CELL_FONT));
            valueCell.setBackgroundColor(rowBg);
            valueCell.setPadding(5);
            valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(valueCell);

            rowIndex++;
        }

        table.setSpacingAfter(10);
        document.add(table);
    }

    private String formatKey(String key) {
        if (key == null || key.isBlank()) return "N/A";
        String upper = key.toUpperCase().trim();
        switch (upper) {
            case "IN_REVIEW": return "In Review";
            case "IN_PROGRESS": return "In Progress";
            case "TODO": return "To Do";
            case "DONE": return "Done";
            default:
                String normalized = key.toLowerCase().replace("_", " ");
                StringBuilder sb = new StringBuilder();
                boolean capitalizeNext = true;
                for (char c : normalized.toCharArray()) {
                    if (c == ' ') {
                        sb.append(c);
                        capitalizeNext = true;
                    } else if (capitalizeNext) {
                        sb.append(Character.toUpperCase(c));
                        capitalizeNext = false;
                    } else {
                        sb.append(c);
                    }
                }
                return sb.toString();
        }
    }
}
