import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

// TYPES
interface ReportCardProps {
  title: string;
  description: string;
  lastGenerated: string;
  iconBg?: string;
}

// EXPORT FUNCTION
const handleExport = async () => {
  try {
    const response = await fetch("/api/reports/download");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
  }
};

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  lastGenerated,
  iconBg = "#e0e7ff",
}) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      p: 2.5,
      borderRadius: 3,
      border: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ffffff",
    }}
  >
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {/* ICON BOX */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          backgroundColor: iconBg,
        }}
      />

      {/* TEXT */}
      <Box>
        <Typography fontWeight={600} fontSize={15}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last generated: {lastGenerated}
        </Typography>
      </Box>
    </Box>

    {/* EXPORT BUTTON */}
    <Button
      variant="outlined"
      size="small"
      startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
      onClick={handleExport}
      sx={{
        textTransform: "none",
        fontWeight: 500,
        borderColor: "#cbd5e1",
        color: "#0f172a",
        px: 2,
      }}
    >
      Export
    </Button>
  </Paper>
);

const Reports: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Reports
      </Typography>

      {/* ROW 1 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <ReportCard
          title="Daily Sales Report"
          description="Sales breakdown by product type and driver"
          lastGenerated="Today"
        />
        <ReportCard
          title="Driver Performance Report"
          description="Delivery counts, ratings, and cash settlements"
          lastGenerated="Today"
        />
      </Box>

      {/* ROW 2 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <ReportCard
          title="Stock Inventory Report"
          description="Current stock levels and movement history"
          lastGenerated="Yesterday"
        />
        <ReportCard
          title="Monthly P&L Statement"
          description="Revenue, expenses, and profit analysis"
          lastGenerated="Mar 01, 2026"
        />
      </Box>

      {/* ROW 3 */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <ReportCard
          title="Customer Complaints Log"
          description="All issues with resolution status"
          lastGenerated="Yesterday"
        />
        <ReportCard
          title="Cash Flow Report"
          description="Daily collection vs settlement tracking"
          lastGenerated="Today"
        />
      </Box>
    </Box>
  );
};

export default Reports;