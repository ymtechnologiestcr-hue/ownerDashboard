import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExcelSheetConfig {
  sheetName?: string;
  headers: string[];
  data: (string | number | null | undefined)[][];
  totals?: (string | number | null | undefined)[];
}

export interface ExcelExportOptions {
  filename?: string;
  sheets: ExcelSheetConfig[];
}

export function exportToExcel({ filename = "report.xlsx", sheets = [] }: ExcelExportOptions) {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const { sheetName = "Sheet1", headers = [], data = [], totals = null } = sheet;

      const rows: (string | number | null | undefined)[][] = [];
      rows.push(headers);

      data.forEach((row) => {
        rows.push(row);
      });

      if (totals && Array.isArray(totals)) {
        rows.push(totals);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Auto column widths
      const colWidths = headers.map((header, colIdx) => {
        let maxLen = String(header || "").length;
        rows.forEach((r) => {
          const val = r[colIdx];
          const len = val !== null && val !== undefined ? String(val).length : 0;
          if (len > maxLen) maxLen = len;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
    });

    const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, safeFilename);
    return true;
  } catch (error) {
    console.error("exportToExcel error:", error);
    throw error;
  }
}

export interface PdfExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  dateRange?: string;
  headers: string[];
  data: (string | number | null | undefined)[][];
  totals?: (string | number | null | undefined)[];
  orientation?: "portrait" | "landscape";
  notes?: string;
}

export function exportToPdf({
  filename = "report.pdf",
  title = "Report",
  subtitle = "Owner Dashboard Official Report",
  dateRange = "",
  headers = [],
  data = [],
  totals = undefined,
  orientation = "landscape",
}: PdfExportOptions) {
  try {
    const doc = new jsPDF({
      orientation,
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Header
    doc.setFillColor(15, 28, 52); // #0f1c34 deep navy
    doc.rect(0, 0, pageWidth, 55, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("SURAJ GAS AGENCY - OWNER DASHBOARD", 30, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 200, 230);
    doc.text(subtitle, 30, 42);

    const generatedOn = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.text(`Generated: ${generatedOn}`, pageWidth - 30, 42, { align: "right" });

    // Title & Filter sub-bar
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 30, 45);
    doc.text(title, 30, 80);

    if (dateRange) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${dateRange}`, 30, 95);
    }

    const startY = dateRange ? 110 : 95;

    // Convert data to string[][] for autoTable
    const bodyRows: string[][] = data.map((row) =>
      row.map((cell) => (cell !== undefined && cell !== null ? String(cell) : ""))
    );
    if (totals && Array.isArray(totals)) {
      bodyRows.push(totals.map((cell) => (cell !== undefined && cell !== null ? String(cell) : "")));
    }

    autoTable(doc, {
      startY,
      head: [headers],
      body: bodyRows,
      theme: "grid",
      headStyles: {
        fillColor: [24, 43, 73],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (hookData) => {
        // Highlight totals row
        if (totals && hookData.section === "body" && hookData.row.index === bodyRows.length - 1) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [226, 232, 240];
          hookData.cell.styles.textColor = [15, 23, 42];
        }
      },
      margin: { left: 30, right: 30 },
    });

    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    doc.save(safeFilename);
    return true;
  } catch (error) {
    console.error("exportToPdf error:", error);
    throw error;
  }
}
