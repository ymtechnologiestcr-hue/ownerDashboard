import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import axios from "../utils/axiosInstance";
import { exportToExcel, exportToPdf } from "../utils/reportExportUtils";

export default function Reports() {
  const [activeTab, setActiveTab] = useState<
    "dailySales" | "stock" | "driver" | "pnl" | "complaints" | "cashFlow"
  >("dailySales");

  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const [timeframe, setTimeframe] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sub-tab for Daily Sales
  const [salesSubTab, setSalesSubTab] = useState<"domestic" | "commercial" | "online">("domestic");

  // Filter state for complaints
  const [complaintPriority, setComplaintPriority] = useState("ALL");
  const [complaintStatus, setComplaintStatus] = useState("ALL");

  // Detail Modal for Complaints
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Data states
  const [salesData, setSalesData] = useState<any>({
    domestic: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    commercial: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    online: { items: [], totals: { totalQty: 0, totalAmount: 0 } },
  });

  const [stockData, setStockData] = useState<any>({ items: [], summary: {} });
  const [driverData, setDriverData] = useState<any>({ items: [], summary: {} });
  const [pnlData, setPnlData] = useState<any>({});
  const [complaintsData, setComplaintsData] = useState<any>({ items: [], summary: {} });
  const [cashFlowData, setCashFlowData] = useState<any>({ inflows: {}, outflows: {}, paymentModeSummary: {} });

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchCurrentReport = async () => {
    try {
      setLoading(true);
      const params: any = { timeframe };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (activeTab === "dailySales") {
        const res = await axios.get("/owner/reports/daily-sales", { params });
        if (res.data?.success) setSalesData(res.data.data);
      } else if (activeTab === "stock") {
        const res = await axios.get("/owner/reports/stock-inventory", { params });
        if (res.data?.success) {
          setStockData({ items: res.data.data, summary: res.data.summary });
        }
      } else if (activeTab === "driver") {
        const res = await axios.get("/owner/reports/driver-performance", { params });
        if (res.data?.success) {
          setDriverData({ items: res.data.data, summary: res.data.summary });
        }
      } else if (activeTab === "pnl") {
        const res = await axios.get("/owner/reports/pnl-statement", { params });
        if (res.data?.success) setPnlData(res.data.data);
      } else if (activeTab === "complaints") {
        params.priority = complaintPriority;
        params.status = complaintStatus;
        const res = await axios.get("/owner/reports/complaints-log", { params });
        if (res.data?.success) {
          setComplaintsData({ items: res.data.data, summary: res.data.summary });
        }
      } else if (activeTab === "cashFlow") {
        const res = await axios.get("/owner/reports/cash-flow", { params });
        if (res.data?.success) setCashFlowData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
  }, [activeTab, timeframe, startDate, endDate, complaintPriority, complaintStatus]);

  // Export to Excel
  const handleExportExcel = () => {
    const sheets: any[] = [];

    if (activeTab === "dailySales") {
      sheets.push({
        sheetName: "Domestic 5%",
        headers: ["Date", "Voucher Number", "Delivery Boy", "Category", "Item Name", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total Amount"],
        data: salesData.domestic.items.map((i: any) => [
          i.date, i.voucherNumber, i.deliveryBoyName, i.category, i.itemName, i.totalQuantity, i.rate.toFixed(2), i.taxableValue.toFixed(2), i.cgst.toFixed(2), i.sgst.toFixed(2), i.totalAmount.toFixed(2)
        ]),
        totals: ["TOTALS", "", "", "", "", salesData.domestic.totals.totalQty, "", salesData.domestic.totals.totalTaxable.toFixed(2), salesData.domestic.totals.totalCgst.toFixed(2), salesData.domestic.totals.totalSgst.toFixed(2), salesData.domestic.totals.totalAmount.toFixed(2)]
      });
      sheets.push({
        sheetName: "Commercial 18%",
        headers: ["Date", "Voucher Number", "Delivery Boy", "Customer", "Category", "Item Name", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total Amount"],
        data: salesData.commercial.items.map((i: any) => [
          i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.category, i.itemName, i.totalQuantity, i.rate.toFixed(2), i.taxableValue.toFixed(2), i.cgst.toFixed(2), i.sgst.toFixed(2), i.totalAmount.toFixed(2)
        ]),
        totals: ["TOTALS", "", "", "", "", "", salesData.commercial.totals.totalQty, "", salesData.commercial.totals.totalTaxable.toFixed(2), salesData.commercial.totals.totalCgst.toFixed(2), salesData.commercial.totals.totalSgst.toFixed(2), salesData.commercial.totals.totalAmount.toFixed(2)]
      });
      sheets.push({
        sheetName: "Online Sales",
        headers: ["Date", "Voucher / Txn", "Delivery Boy", "Customer", "Consumer No", "Item Name", "Qty", "Payment Mode", "Total Amount", "Status"],
        data: salesData.online.items.map((i: any) => [
          i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.consumerNumber, i.itemName, i.quantity, i.paymentMode, i.totalAmount.toFixed(2), i.paymentStatus
        ]),
        totals: ["TOTALS", "", "", "", "", "", salesData.online.totals.totalQty, "", salesData.online.totals.totalAmount.toFixed(2), ""]
      });
    } else if (activeTab === "stock") {
      sheets.push({
        sheetName: "Stock Inventory",
        headers: ["Category", "Item Name", "Opening", "Purchase", "Sales", "Defective", "System Stock", "Closing Stock", "Empty System", "Empty Physical", "Difference"],
        data: stockData.items.map((i: any) => [
          i.category, i.itemName, i.opening, i.purchase, i.sales, i.defective, i.systemStock, i.closingStock, i.emptySystemStock, i.emptyPhysicalStock, i.difference
        ]),
      });
    } else if (activeTab === "driver") {
      sheets.push({
        sheetName: "Driver Performance",
        headers: ["Delivery Boy Name", "Item Name", "Delivered Qty", "System Updated Qty", "Total Amount (₹)", "Pending Qty", "Active Days"],
        data: driverData.items.map((i: any) => [
          i.deliveryBoyName, i.itemName, i.deliveredQty, i.systemUpdatedQty, i.totalAmount.toFixed(2), i.pendingQty, i.activeDays
        ]),
      });
    } else if (activeTab === "pnl") {
      sheets.push({
        sheetName: "Monthly P&L",
        headers: ["Particulars", "Amount (₹)"],
        data: [
          ["Total Sales", pnlData.totalSales?.toFixed(2) || "0.00"],
          ["Less: Sales Returns / Adjustments", pnlData.salesReturns?.toFixed(2) || "0.00"],
          ["Net Sales", pnlData.netSales?.toFixed(2) || "0.00"],
          ["Less: Cost of Goods Sold (COGS)", pnlData.cogs?.toFixed(2) || "0.00"],
          ["Gross Profit", pnlData.grossProfit?.toFixed(2) || "0.00"],
          ["Less: Operating Expenses", pnlData.operatingExpenses?.toFixed(2) || "0.00"],
          ["Net Profit / Loss", pnlData.netProfitLoss?.toFixed(2) || "0.00"],
        ],
      });
    } else if (activeTab === "complaints") {
      sheets.push({
        sheetName: "Customer Complaints",
        headers: ["ID", "Customer", "Phone", "Consumer No", "Issue", "Priority", "Date", "Assigned To", "Status"],
        data: complaintsData.items.map((c: any) => [
          c.id, c.customer, c.customerPhone, c.consumerNumber, c.issue, c.priority, c.date, c.assignedTo, c.status
        ]),
      });
    } else if (activeTab === "cashFlow") {
      sheets.push({
        sheetName: "Cash Flow",
        headers: ["Particulars", "Amount (₹)"],
        data: [
          ["Opening Cash Balance", cashFlowData.openingCashBalance?.toFixed(2) || "0.00"],
          ["Cash Inflows", ""],
          ["  Driver Cash Collections", cashFlowData.inflows?.driverCashCollections?.toFixed(2) || "0.00"],
          ["  Office Sales - Cash", cashFlowData.inflows?.officeSalesCash?.toFixed(2) || "0.00"],
          ["  Customer Credit Payments Received", cashFlowData.inflows?.customerCreditPaymentsReceived?.toFixed(2) || "0.00"],
          ["  Other Cash Receipts", cashFlowData.inflows?.otherCashReceipts?.toFixed(2) || "0.00"],
          ["Total Cash Inflows", cashFlowData.inflows?.totalInflows?.toFixed(2) || "0.00"],
          ["Cash Outflows", ""],
          ["  Driver Expenses", cashFlowData.outflows?.driverExpenses?.toFixed(2) || "0.00"],
          ["  Office Expenses", cashFlowData.outflows?.officeExpenses?.toFixed(2) || "0.00"],
          ["  Supplier Payments", cashFlowData.outflows?.supplierPayments?.toFixed(2) || "0.00"],
          ["  Other Cash Payments", cashFlowData.outflows?.otherCashPayments?.toFixed(2) || "0.00"],
          ["Total Cash Outflows", cashFlowData.outflows?.totalOutflows?.toFixed(2) || "0.00"],
          ["Closing Cash Balance", cashFlowData.closingCashBalance?.toFixed(2) || "0.00"],
        ],
      });
    }

    exportToExcel({ filename: `Owner_Report_${activeTab}_${todayStr}.xlsx`, sheets });
  };

  // Export to PDF
  const handleExportPdf = () => {
    let title = "Owner Dashboard Report";
    let headers: string[] = [];
    let rows: any[] = [];
    let totals: any[] = [];

    if (activeTab === "dailySales") {
      title = "Daily Sales Report – Official";
      headers = ["Date", "VCH No", "Delivery Boy", "Category", "Item", "Qty", "Taxable", "CGST", "SGST", "Total"];
      const targetItems = salesSubTab === "domestic" ? salesData.domestic.items : salesSubTab === "commercial" ? salesData.commercial.items : salesData.online.items;
      rows = targetItems.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.category || "Online", i.itemName, i.totalQuantity || i.quantity, `₹${(i.taxableValue || i.totalAmount).toFixed(2)}`, i.cgst ? `₹${i.cgst.toFixed(2)}` : "-", i.sgst ? `₹${i.sgst.toFixed(2)}` : "-", `₹${i.totalAmount.toFixed(2)}`
      ]);
    } else if (activeTab === "stock") {
      title = "Stock Inventory Report";
      headers = ["Category", "Item", "Opening", "Purchase", "Sales", "Defective", "System Stock", "Closing Stock", "Empty System", "Empty Physical", "Diff"];
      rows = stockData.items.map((i: any) => [
        i.category, i.itemName, i.opening, i.purchase, i.sales, i.defective, i.systemStock, i.closingStock, i.emptySystemStock, i.emptyPhysicalStock, i.difference
      ]);
    } else if (activeTab === "driver") {
      title = "Driver Performance Report";
      headers = ["Driver Name", "Item Name", "Delivered Qty", "System Updated", "Total Amount", "Pending Qty", "Active Days"];
      rows = driverData.items.map((i: any) => [
        i.deliveryBoyName, i.itemName, i.deliveredQty, i.systemUpdatedQty, `₹${i.totalAmount.toFixed(2)}`, i.pendingQty, i.activeDays
      ]);
    } else if (activeTab === "pnl") {
      title = "Monthly P&L Statement";
      headers = ["Particulars", "Amount"];
      rows = [
        ["Total Sales", `₹${pnlData.totalSales?.toFixed(2) || "0.00"}`],
        ["Less: Returns / Adjustments", `₹${pnlData.salesReturns?.toFixed(2) || "0.00"}`],
        ["Net Sales", `₹${pnlData.netSales?.toFixed(2) || "0.00"}`],
        ["Less: Cost of Goods Sold (COGS)", `₹${pnlData.cogs?.toFixed(2) || "0.00"}`],
        ["Gross Profit", `₹${pnlData.grossProfit?.toFixed(2) || "0.00"}`],
        ["Less: Operating Expenses", `₹${pnlData.operatingExpenses?.toFixed(2) || "0.00"}`],
        ["Net Profit / Loss", `₹${pnlData.netProfitLoss?.toFixed(2) || "0.00"}`],
      ];
    } else if (activeTab === "complaints") {
      title = "Customer Complaints Log";
      headers = ["ID", "Customer", "Issue", "Priority", "Date", "Assigned To", "Status"];
      rows = complaintsData.items.map((c: any) => [
        c.id, c.customer, c.issue, c.priority, c.date, c.assignedTo, c.status
      ]);
    } else if (activeTab === "cashFlow") {
      title = "Cash Flow Report";
      headers = ["Particulars", "Amount"];
      rows = [
        ["Opening Cash Balance", `₹${cashFlowData.openingCashBalance?.toFixed(2) || "0.00"}`],
        ["Driver Cash Collections", `₹${cashFlowData.inflows?.driverCashCollections?.toFixed(2) || "0.00"}`],
        ["Office Sales - Cash", `₹${cashFlowData.inflows?.officeSalesCash?.toFixed(2) || "0.00"}`],
        ["Customer Credit Payments", `₹${cashFlowData.inflows?.customerCreditPaymentsReceived?.toFixed(2) || "0.00"}`],
        ["Other Receipts", `₹${cashFlowData.inflows?.otherCashReceipts?.toFixed(2) || "0.00"}`],
        ["Total Inflows", `₹${cashFlowData.inflows?.totalInflows?.toFixed(2) || "0.00"}`],
        ["Driver Expenses", `₹${cashFlowData.outflows?.driverExpenses?.toFixed(2) || "0.00"}`],
        ["Office Expenses", `₹${cashFlowData.outflows?.officeExpenses?.toFixed(2) || "0.00"}`],
        ["Supplier Payments", `₹${cashFlowData.outflows?.supplierPayments?.toFixed(2) || "0.00"}`],
        ["Total Outflows", `₹${cashFlowData.outflows?.totalOutflows?.toFixed(2) || "0.00"}`],
        ["Closing Cash Balance", `₹${cashFlowData.closingCashBalance?.toFixed(2) || "0.00"}`],
      ];
    }

    exportToPdf({
      filename: `Owner_Report_${activeTab}_${todayStr}.pdf`,
      title,
      subtitle: "Official Owner Operations & Financial Report",
      dateRange: timeframe === "all" ? "All Time" : `${startDate} to ${endDate}`,
      headers,
      data: rows,
      totals: totals.length ? totals : undefined,
      orientation: "landscape",
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="#0f172a">
            Reports Module
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive business reports: Sales, Stock Inventory, Driver Performance, P&L Statement, Complaints & Cash Flow
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExportExcel}
            sx={{ textTransform: "none", borderColor: "#0284c7", color: "#0284c7", fontWeight: 600 }}
          >
            Download Excel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfOutlinedIcon />}
            onClick={handleExportPdf}
            sx={{ textTransform: "none", bgcolor: "#0f172a", fontWeight: 600 }}
          >
            Download PDF
          </Button>
        </Stack>
      </Box>

      {/* GLOBAL DATE FILTER BAR */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Date Range Filter"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="custom">Custom Date Range</MenuItem>
          </TextField>

          {timeframe === "custom" && (
            <>
              <TextField
                size="small"
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          {activeTab === "complaints" && (
            <>
              <TextField
                select
                size="small"
                label="Priority"
                value={complaintPriority}
                onChange={(e) => setComplaintPriority(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Status"
                value={complaintStatus}
                onChange={(e) => setComplaintStatus(e.target.value)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
              </TextField>
            </>
          )}
        </Box>
      </Paper>

      {/* 6 REPORT TABS */}
      <Paper sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "none" }}>
        <Box borderBottom="1px solid #e2e8f0" px={2} bgcolor="#f8fafc">
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "14px", py: 2 },
            }}
          >
            <Tab value="dailySales" icon={<AssessmentOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Daily Sales Report" />
            <Tab value="stock" icon={<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Stock Inventory Report" />
            <Tab value="driver" icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Driver Performance Report" />
            <Tab value="pnl" icon={<TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="4. Monthly P&L Statement" />
            <Tab value="complaints" icon={<ReportProblemOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="5. Customer Complaints Log" />
            <Tab value="cashFlow" icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="6. Cash Flow Report" />
          </Tabs>
        </Box>

        {loading ? (
          <Box p={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box p={2.5}>
            {/* ========================================================
                REPORT 1: DAILY SALES REPORT
            ======================================================== */}
            {activeTab === "dailySales" && (
              <Box>
                {/* SUB-TABS */}
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Tabs
                    value={salesSubTab}
                    onChange={(_, val) => setSalesSubTab(val)}
                    sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 } }}
                  >
                    <Tab value="domestic" label={`Domestic (5% GST) [${salesData.domestic.items.length}]`} />
                    <Tab value="commercial" label={`Commercial (18% GST) [${salesData.commercial.items.length}]`} />
                    <Tab value="online" label={`Online Sales [${salesData.online.items.length}]`} />
                  </Tabs>
                </Box>

                {salesSubTab === "domestic" && (
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Voucher No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Delivery Boy</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable Value</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>CGST @ 2.5%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>SGST @ 2.5%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.domestic.items.map((i: any, idx: number) => (
                        <TableRow key={idx} hover>
                          <TableCell>{i.date}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{i.voucherNumber}</TableCell>
                          <TableCell>{i.deliveryBoyName}</TableCell>
                          <TableCell><Chip label={i.category} size="small" /></TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{i.itemName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{i.totalQuantity}</TableCell>
                          <TableCell align="right">{formatCurrency(i.rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.taxableValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.cgst)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.sgst)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(i.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                        <TableCell colSpan={5} sx={{ fontWeight: 700 }}>TOTALS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{salesData.domestic.totals.totalQty}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.domestic.totals.totalTaxable)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.domestic.totals.totalCgst)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.domestic.totals.totalSgst)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(salesData.domestic.totals.totalAmount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {salesSubTab === "commercial" && (
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Voucher No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Delivery Boy</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable Value</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>CGST @ 9%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>SGST @ 9%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.commercial.items.map((i: any, idx: number) => (
                        <TableRow key={idx} hover>
                          <TableCell>{i.date}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{i.voucherNumber}</TableCell>
                          <TableCell>{i.deliveryBoyName}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{i.customerName}</TableCell>
                          <TableCell><Chip label={i.category} size="small" /></TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{i.itemName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{i.totalQuantity}</TableCell>
                          <TableCell align="right">{formatCurrency(i.rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.taxableValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.cgst)}</TableCell>
                          <TableCell align="right">{formatCurrency(i.sgst)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(i.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                        <TableCell colSpan={6} sx={{ fontWeight: 700 }}>TOTALS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{salesData.commercial.totals.totalQty}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.commercial.totals.totalTaxable)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.commercial.totals.totalCgst)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(salesData.commercial.totals.totalSgst)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(salesData.commercial.totals.totalAmount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {salesSubTab === "online" && (
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Voucher / Txn No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Delivery Boy</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Consumer No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.online.items.map((i: any, idx: number) => (
                        <TableRow key={idx} hover>
                          <TableCell>{i.date}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{i.voucherNumber}</TableCell>
                          <TableCell>{i.deliveryBoyName}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{i.customerName}</TableCell>
                          <TableCell>{i.consumerNumber}</TableCell>
                          <TableCell>{i.itemName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{i.quantity}</TableCell>
                          <TableCell><Chip label={i.paymentMode} size="small" /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(i.totalAmount)}</TableCell>
                          <TableCell><Chip label={i.paymentStatus} color="success" size="small" variant="outlined" /></TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                        <TableCell colSpan={6} sx={{ fontWeight: 700 }}>TOTALS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{salesData.online.totals.totalQty}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(salesData.online.totals.totalAmount)}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {/* ========================================================
                REPORT 2: STOCK INVENTORY REPORT
            ======================================================== */}
            {activeTab === "stock" && (
              <Box>
                <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={2.5}>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="text.secondary">TOTAL PHYSICAL CLOSING</Typography>
                    <Typography variant="h6" fontWeight={700}>{stockData.summary?.totalPhysicalStock || 0} Cylinders</Typography>
                  </Card>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="text.secondary">TOTAL SYSTEM (SDMS)</Typography>
                    <Typography variant="h6" fontWeight={700}>{stockData.summary?.totalSystemStock || 0} Cylinders</Typography>
                  </Card>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="text.secondary">EMPTY PHYSICAL CYLINDERS</Typography>
                    <Typography variant="h6" fontWeight={700}>{stockData.summary?.totalEmptyPhysical || 0} Cylinders</Typography>
                  </Card>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="text.secondary">STOCK MISMATCH DIFFERENCE</Typography>
                    <Typography variant="h6" fontWeight={700} color={stockData.summary?.totalMismatch ? "#dc2626" : "#16a34a"}>
                      {stockData.summary?.totalMismatch || 0} Mismatches
                    </Typography>
                  </Card>
                </Box>

                <Table sx={{ minWidth: 900 }}>
                  <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Opening</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Purchase</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Sales</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Defective</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>System Stock</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Closing Stock</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Empty System</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Empty Physical</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockData.items.map((row: any, idx: number) => {
                      const hasMismatch = row.difference !== 0;

                      return (
                        <TableRow key={idx} hover sx={{ bgcolor: hasMismatch ? "#fffbeb" : "inherit" }}>
                          <TableCell><Chip label={row.category} size="small" /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                          <TableCell align="right">{row.opening}</TableCell>
                          <TableCell align="right" sx={{ color: "#2563eb", fontWeight: 600 }}>{row.purchase}</TableCell>
                          <TableCell align="right" sx={{ color: "#16a34a", fontWeight: 600 }}>{row.sales}</TableCell>
                          <TableCell align="right" sx={{ color: "#dc2626" }}>{row.defective}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{row.systemStock}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{row.closingStock}</TableCell>
                          <TableCell align="right">{row.emptySystemStock}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{row.emptyPhysicalStock}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.difference === 0 ? "Matched" : `${row.difference > 0 ? "+" : ""}${row.difference}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: row.difference === 0 ? "#dcfce7" : "#fee2e2",
                                color: row.difference === 0 ? "#15803d" : "#b91c1c",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* ========================================================
                REPORT 3: DRIVER PERFORMANCE REPORT
            ======================================================== */}
            {activeTab === "driver" && (
              <Box>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Delivery Boy Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Delivered Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>System Updated Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Pending SDMS Update</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Active Days</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {driverData.items.map((row: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>{row.deliveryBoyName}</TableCell>
                        <TableCell>{row.itemName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.deliveredQty}</TableCell>
                        <TableCell align="right" sx={{ color: "#16a34a", fontWeight: 600 }}>{row.systemUpdatedQty}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: row.pendingQty > 0 ? "#dc2626" : "inherit", fontWeight: 600 }}>
                          {row.pendingQty}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${row.activeDays} Days`} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 700 }}>TOTALS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{driverData.summary?.totalDeliveredQty}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#16a34a" }}>{driverData.summary?.totalSystemUpdatedQty}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(driverData.summary?.totalAmount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>{driverData.summary?.totalPendingQty}</TableCell>
                      <TableCell align="center">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* ========================================================
                REPORT 4: MONTHLY P&L STATEMENT
            ======================================================== */}
            {activeTab === "pnl" && (
              <Box maxWidth={750} mx="auto">
                <Paper sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "none" }}>
                  <Typography variant="h6" fontWeight={700} align="center" mb={1}>
                    Monthly Profit & Loss Statement
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" mb={3}>
                    Comprehensive accounting of Sales, COGS (Stock Valuation), Operating Expenses & Net Margin
                  </Typography>

                  <Table>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "14px" }}>Particulars</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "14px" }}>Amount (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Total Sales</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(pnlData.totalSales)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary", pl: 3 }}>Less: Sales Returns / Adjustments</TableCell>
                        <TableCell align="right" sx={{ color: "text.secondary" }}>{formatCurrency(pnlData.salesReturns)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: "#f1f5f9", fontWeight: 700 }}>
                        <TableCell sx={{ fontWeight: 700 }}>Net Sales</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(pnlData.netSales)}</TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, pt: 2.5 }}>Less: Cost of Goods Sold (COGS)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, pt: 2.5, color: "#dc2626" }}>
                          - {formatCurrency(pnlData.cogs)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: "text.secondary", pl: 3, fontSize: "12px" }}>
                          Opening Stock Val ({formatCurrency(pnlData.openingStockVal)}) + Purchases ({formatCurrency(pnlData.netPurchases)}) − Closing Stock Val ({formatCurrency(pnlData.closingStockVal)})
                        </TableCell>
                        <TableCell align="right" sx={{ color: "text.secondary", fontSize: "12px" }}>Formula Applied</TableCell>
                      </TableRow>

                      <TableRow sx={{ bgcolor: "#ecfdf5", borderTop: "2px solid #a7f3d0", borderBottom: "2px solid #a7f3d0" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#065f46", fontSize: "15px" }}>Gross Profit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#065f46", fontSize: "15px" }}>
                          {formatCurrency(pnlData.grossProfit)}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, pt: 2.5 }}>Less: Operating Expenses</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, pt: 2.5, color: "#dc2626" }}>
                          - {formatCurrency(pnlData.operatingExpenses)}
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ bgcolor: pnlData.isProfit ? "#eff6ff" : "#fef2f2", borderTop: "2px solid #3b82f6" }}>
                        <TableCell sx={{ fontWeight: 800, fontSize: "16px", color: pnlData.isProfit ? "#1d4ed8" : "#b91c1c" }}>
                          {pnlData.isProfit ? "Net Profit" : "Net Loss"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: "16px", color: pnlData.isProfit ? "#1d4ed8" : "#b91c1c" }}>
                          {formatCurrency(pnlData.netProfitLoss)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}

            {/* ========================================================
                REPORT 5: CUSTOMER COMPLAINTS LOG
            ======================================================== */}
            {activeTab === "complaints" && (
              <Box>
                <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} mb={2.5}>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="text.secondary">TOTAL COMPLAINTS</Typography>
                    <Typography variant="h6" fontWeight={700}>{complaintsData.summary?.totalComplaints || 0}</Typography>
                  </Card>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="#16a34a">RESOLVED COMPLAINTS</Typography>
                    <Typography variant="h6" fontWeight={700} color="#15803d">{complaintsData.summary?.resolvedComplaints || 0}</Typography>
                  </Card>
                  <Card sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Typography variant="caption" color="#dc2626">PENDING / OVERDUE</Typography>
                    <Typography variant="h6" fontWeight={700} color="#b91c1c">{complaintsData.summary?.pendingComplaints || 0}</Typography>
                  </Card>
                </Box>

                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Issue</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complaintsData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#64748b" }}>
                          No complaints match the filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      complaintsData.items.map((c: any) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{c.id}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{c.customer}</TableCell>
                          <TableCell>{c.issue}</TableCell>
                          <TableCell>
                            <Chip
                              label={c.priority}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: c.priority === "HIGH" ? "#fee2e2" : c.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9",
                                color: c.priority === "HIGH" ? "#b91c1c" : c.priority === "MEDIUM" ? "#b45309" : "#475569",
                              }}
                            />
                          </TableCell>
                          <TableCell>{c.date}</TableCell>
                          <TableCell>{c.assignedTo}</TableCell>
                          <TableCell>
                            <Chip
                              label={c.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: c.status === "Resolved" ? "#dcfce7" : c.status === "In Progress" ? "#e0e7ff" : "#fee2e2",
                                color: c.status === "Resolved" ? "#15803d" : c.status === "In Progress" ? "#3730a3" : "#b91c1c",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedComplaint(c)}
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* ========================================================
                REPORT 6: CASH FLOW REPORT
            ======================================================== */}
            {activeTab === "cashFlow" && (
              <Box maxWidth={800} mx="auto">
                <Paper sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "none" }}>
                  <Typography variant="h6" fontWeight={700} align="center" mb={1}>
                    Official Cash Flow Statement
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" mb={3}>
                    Inflows, Outflows, Mode Reconciliation (Cash / Bank / UPI) & Net Working Cash
                  </Typography>

                  <Table>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "14px" }}>Particulars</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "14px" }}>Amount (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Opening Cash Balance</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                          {formatCurrency(cashFlowData.openingCashBalance)}
                        </TableCell>
                      </TableRow>

                      {/* INFLOWS */}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 700, color: "#16a34a", pt: 2 }}>
                          CASH INFLOWS
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Driver Cash Collections</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.inflows?.driverCashCollections)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Office Sales – Cash</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.inflows?.officeSalesCash)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Customer Credit Payments Received</TableCell>
                        <TableCell align="right" sx={{ color: "#16a34a", fontWeight: 600 }}>
                          {formatCurrency(cashFlowData.inflows?.customerCreditPaymentsReceived)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Other Cash Receipts</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.inflows?.otherCashReceipts)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: "#ecfdf5", fontWeight: 700 }}>
                        <TableCell sx={{ fontWeight: 700, color: "#065f46" }}>Total Cash Inflows</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#065f46" }}>
                          + {formatCurrency(cashFlowData.inflows?.totalInflows)}
                        </TableCell>
                      </TableRow>

                      {/* OUTFLOWS */}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 700, color: "#dc2626", pt: 2 }}>
                          CASH OUTFLOWS
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Driver Expenses</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.outflows?.driverExpenses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Office Expenses</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.outflows?.officeExpenses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Supplier Payments</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.outflows?.supplierPayments)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3 }}>Other Cash Payments</TableCell>
                        <TableCell align="right">{formatCurrency(cashFlowData.outflows?.otherCashPayments)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: "#fef2f2", fontWeight: 700 }}>
                        <TableCell sx={{ fontWeight: 700, color: "#991b1b" }}>Total Cash Outflows</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#991b1b" }}>
                          - {formatCurrency(cashFlowData.outflows?.totalOutflows)}
                        </TableCell>
                      </TableRow>

                      {/* CLOSING */}
                      <TableRow sx={{ bgcolor: "#eff6ff", borderTop: "2px solid #3b82f6" }}>
                        <TableCell sx={{ fontWeight: 800, fontSize: "16px", color: "#1e3a8a" }}>
                          Closing Cash Balance
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: "16px", color: "#1e3a8a" }}>
                          {formatCurrency(cashFlowData.closingCashBalance)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* PAYMENT MODE SUMMARY */}
                  <Box mt={3} p={2} bgcolor="#f8fafc" borderRadius={2} border="1px solid #e2e8f0">
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Payment-Mode-Wise Summary
                    </Typography>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Physical Cash Net</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(cashFlowData.paymentModeSummary?.cash?.net)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">UPI Collections</Typography>
                        <Typography variant="body2" fontWeight={700} color="#16a34a">
                          {formatCurrency(cashFlowData.paymentModeSummary?.upi?.inflows)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Bank / Online Collections</Typography>
                        <Typography variant="body2" fontWeight={700} color="#2563eb">
                          {formatCurrency(cashFlowData.paymentModeSummary?.bankOnline?.inflows)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: COMPLAINT DETAILS */}
      <Dialog open={Boolean(selectedComplaint)} onClose={() => setSelectedComplaint(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Complaint Details – {selectedComplaint?.id}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Customer Name</Typography>
              <Typography variant="body1" fontWeight={600}>{selectedComplaint?.customer}</Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {selectedComplaint?.customerPhone} | Consumer No: {selectedComplaint?.consumerNumber}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Issue Category & Priority</Typography>
              <Box display="flex" gap={1} mt={0.5}>
                <Chip label={selectedComplaint?.issue} />
                <Chip label={`Priority: ${selectedComplaint?.priority}`} color={selectedComplaint?.priority === "HIGH" ? "error" : "default"} />
                <Chip label={`Status: ${selectedComplaint?.status}`} color="primary" />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography variant="body2" sx={{ bgcolor: "#f8fafc", p: 1.5, borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
                {selectedComplaint?.description || "No additional description provided."}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Assigned Staff & Date</Typography>
              <Typography variant="body2">
                Assigned to: <strong>{selectedComplaint?.assignedTo}</strong> on {selectedComplaint?.date}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedComplaint(null)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
