import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import axios from "../utils/axiosInstance";
import { exportToExcel, exportToPdf } from "../utils/reportExportUtils";

export default function CashSettlement() {
  const [activeTab, setActiveTab] = useState<"driver" | "credit">("driver");
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [driverSettlements, setDriverSettlements] = useState<any[]>([]);
  const [driverSummary, setDriverSummary] = useState({ totalCollected: 0, totalSettled: 0, totalPending: 0 });

  const [creditSales, setCreditSales] = useState<any[]>([]);
  const [creditSummary, setCreditSummary] = useState({ totalCreditSales: 0, totalReceived: 0, totalPending: 0, pendingCount: 0 });

  // Modals
  const [recordPayModalOpen, setRecordPayModalOpen] = useState(false);
  const [selectedCreditSale, setSelectedCreditSale] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDate, setPayDate] = useState(todayStr);
  const [payNotes, setPayNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedDriverItems, setSelectedDriverItems] = useState<any>(null);

  const fetchDriverSettlements = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/owner/settlements/driver-settlements", {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      });
      if (res.data?.success) {
        setDriverSettlements(res.data.data || []);
        if (res.data.summary) setDriverSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Fetch driver settlements error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/owner/settlements/credit-sales", {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
      });
      if (res.data?.success) {
        setCreditSales(res.data.data || []);
        if (res.data.summary) setCreditSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Fetch credit sales error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "driver") {
      fetchDriverSettlements();
    } else {
      fetchCreditSales();
    }
  }, [activeTab, startDate, endDate]);

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleOpenRecordPayment = (sale: any) => {
    setSelectedCreditSale(sale);
    setPayAmount(String(sale.pending || ""));
    setPayMethod("CASH");
    setPayDate(todayStr);
    setPayNotes("");
    setRecordPayModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedCreditSale) return;
    const num = Number(payAmount);
    if (!num || num <= 0 || num > selectedCreditSale.pending) {
      alert(`Please enter a valid amount between ₹1 and ₹${selectedCreditSale.pending}`);
      return;
    }

    try {
      setSubmittingPayment(true);
      await axios.post(`/owner/settlements/credit-sales/${selectedCreditSale.saleId}/pay`, {
        amount: num,
        paymentMethod: payMethod,
        paymentDate: payDate,
        notes: payNotes,
      });
      setRecordPayModalOpen(false);
      fetchCreditSales();
    } catch (err) {
      console.error("Failed to record credit payment:", err);
      alert("Failed to record payment. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenHistory = async (sale: any) => {
    setSelectedCreditSale(sale);
    setHistoryModalOpen(true);
    try {
      setLoadingHistory(true);
      const res = await axios.get(`/owner/settlements/credit-sales/${sale.saleId}/history`);
      if (res.data?.success) {
        setPaymentHistory(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSettleDriver = async (row: any) => {
    if (row.pending <= 0) return;
    try {
      await axios.post("/settlements", {
        driver_id: row.driverId,
        amount: row.collected,
        status: "SETTLED",
        settlement_date: todayStr,
      });
      fetchDriverSettlements();
    } catch (err) {
      console.error("Failed to settle driver:", err);
    }
  };

  const handleExportExcel = () => {
    const sheets: any[] = [];
    if (activeTab === "driver") {
      sheets.push({
        sheetName: "Driver Cash Settlement",
        headers: ["Date", "Delivery Boy", "Collected (₹)", "Settled (₹)", "Pending (₹)", "Status"],
        data: driverSettlements.map((d) => [d.date, d.deliveryBoy, d.collected.toFixed(2), d.settled.toFixed(2), d.pending.toFixed(2), d.status]),
        totals: ["TOTALS", "", driverSummary.totalCollected.toFixed(2), driverSummary.totalSettled.toFixed(2), driverSummary.totalPending.toFixed(2), ""],
      });
    } else {
      sheets.push({
        sheetName: "Credit Sales",
        headers: ["Date", "Voucher Number", "Delivery Boy", "Customer Name", "Consumer Number", "Item Name", "Quantity", "Taxable Value (₹)", "CGST (₹)", "SGST (₹)", "Total Amount (₹)", "Pending (₹)", "Status"],
        data: creditSales.map((c) => [
          c.date, c.voucherNumber, c.deliveryBoy, c.customerName, c.consumerNumber, c.itemName, c.quantity, c.taxableValue.toFixed(2), c.cgst.toFixed(2), c.sgst.toFixed(2), c.totalAmount.toFixed(2), c.pending.toFixed(2), c.status
        ]),
        totals: ["TOTALS", "", "", "", "", "", "", "", "", "", creditSummary.totalCreditSales.toFixed(2), creditSummary.totalPending.toFixed(2), ""],
      });
    }
    exportToExcel({ filename: `Settlement_${activeTab}_${todayStr}.xlsx`, sheets });
  };

  const handleExportPdf = () => {
    if (activeTab === "driver") {
      exportToPdf({
        filename: `Driver_Cash_Settlement_${todayStr}.pdf`,
        title: "Cash Settlement – Driver",
        subtitle: "Driver Cash Collection, Settlement & Pending Balances (Credit Excluded)",
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
        headers: ["Date", "Delivery Boy", "Collected", "Settled", "Pending", "Status"],
        data: driverSettlements.map((d) => [d.date, d.deliveryBoy, `₹${d.collected.toFixed(2)}`, `₹${d.settled.toFixed(2)}`, `₹${d.pending.toFixed(2)}`, d.status]),
        totals: ["TOTALS", "", `₹${driverSummary.totalCollected.toFixed(2)}`, `₹${driverSummary.totalSettled.toFixed(2)}`, `₹${driverSummary.totalPending.toFixed(2)}`, ""],
        orientation: "landscape",
      });
    } else {
      exportToPdf({
        filename: `Customer_Credit_Sales_${todayStr}.pdf`,
        title: "Customer Credit Sales Report",
        subtitle: "Individual Invoice Tracking, GST & Pending Balances",
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : "All Time",
        headers: ["Date", "Voucher No", "Delivery Boy", "Customer", "Item", "Qty", "Taxable", "CGST", "SGST", "Total", "Pending", "Status"],
        data: creditSales.map((c) => [
          c.date, c.voucherNumber, c.deliveryBoy, c.customerName, c.itemName, c.quantity, `₹${c.taxableValue.toFixed(2)}`, `₹${c.cgst.toFixed(2)}`, `₹${c.sgst.toFixed(2)}`, `₹${c.totalAmount.toFixed(2)}`, `₹${c.pending.toFixed(2)}`, c.status
        ]),
        totals: ["TOTALS", "", "", "", "", "", "", "", "", `₹${creditSummary.totalCreditSales.toFixed(2)}`, `₹${creditSummary.totalPending.toFixed(2)}`, ""],
        orientation: "landscape",
      });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="#0f172a">
            Cash Settlement & Credit Sales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reconcile driver cash collections and manage customer credit sales with invoice-level payment tracking
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
            Export Excel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfOutlinedIcon />}
            onClick={handleExportPdf}
            sx={{ textTransform: "none", bgcolor: "#0f172a", fontWeight: 600 }}
          >
            Export PDF
          </Button>
        </Stack>
      </Box>

      {/* SUMMARY STAT CARDS */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={2.5} mb={3}>
        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              TOTAL DRIVER COLLECTED
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#2563eb" mt={0.5}>
              {formatCurrency(driverSummary.totalCollected)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Cash & UPI from delivered sales
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="#16a34a" fontWeight={700}>
              TOTAL DRIVER SETTLED
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#15803d" mt={0.5}>
              {formatCurrency(driverSummary.totalSettled)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Deposited with cashier
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="#dc2626" fontWeight={700}>
              PENDING DRIVER SETTLEMENT
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#b91c1c" mt={0.5}>
              {formatCurrency(driverSummary.totalPending)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Balance held with drivers
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none", bgcolor: "#f8fafc" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="#b45309" fontWeight={700}>
              CREDIT SALES OUTSTANDING
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#d97706" mt={0.5}>
              {formatCurrency(creditSummary.totalPending)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {creditSummary.pendingCount} unpaid / partial invoice(s)
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* FILTER BAR */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Clear Date Filter
          </Button>
        </Box>
      </Paper>

      {/* TABS */}
      <Paper sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "none" }}>
        <Box borderBottom="1px solid #e2e8f0" px={2} bgcolor="#f8fafc">
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "14px", py: 2 },
            }}
          >
            <Tab value="driver" label={`A. Cash Settlement – Driver [${driverSettlements.length}]`} />
            <Tab value="credit" label={`B. Separate Credit Sales Details [${creditSales.length}]`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box p={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box p={2}>
            {/* TAB A: DRIVER CASH SETTLEMENT */}
            {activeTab === "driver" && (
              <Table sx={{ minWidth: 700, "& td, & th": { py: 1.5, px: 2 } }}>
                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Delivery Boy</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Items Details</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Collected</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Settled</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Pending</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {driverSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#64748b" }}>
                        No driver cash settlement records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    driverSettlements.map((row, idx) => {
                      const isSettled = row.status === "Settled";
                      const isPartial = row.status === "Partially Settled";

                      return (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{row.date}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>{row.deliveryBoy}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => {
                                setSelectedDriverItems(row);
                                setItemsModalOpen(true);
                              }}
                              sx={{ textTransform: "none", fontWeight: 600, p: 0 }}
                            >
                              View Items ({row.items?.length || 0})
                            </Button>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(row.collected)}</TableCell>
                          <TableCell align="right" sx={{ color: "#16a34a", fontWeight: 600 }}>{formatCurrency(row.settled)}</TableCell>
                          <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{formatCurrency(row.pending)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: isSettled ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                                color: isSettled ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {row.pending > 0 ? (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleSettleDriver(row)}
                                sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#0f172a" }}
                              >
                                Settle Now
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.secondary">All Settled</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB B: SEPARATE CREDIT SALES DETAILS */}
            {activeTab === "credit" && (
              <Table sx={{ minWidth: 900, "& td, & th": { py: 1.5, px: 2 } }}>
                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Voucher Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Delivery Boy</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Consumer No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Taxable</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>CGST</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>SGST</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "right" }}>Pending</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creditSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} align="center" sx={{ py: 4, color: "#64748b" }}>
                        No pending credit sales found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    creditSales.map((c, idx) => {
                      const isPaid = c.status === "Paid";
                      const isPartial = c.status === "Partially Paid";

                      return (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{c.date}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>{c.voucherNumber}</TableCell>
                          <TableCell>{c.deliveryBoy}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{c.customerName}</TableCell>
                          <TableCell>{c.consumerNumber}</TableCell>
                          <TableCell>{c.itemName}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{c.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(c.taxableValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(c.cgst)}</TableCell>
                          <TableCell align="right">{formatCurrency(c.sgst)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(c.totalAmount)}</TableCell>
                          <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{formatCurrency(c.pending)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={c.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: isPaid ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                                color: isPaid ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              {c.pending > 0 && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PaymentOutlinedIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => handleOpenRecordPayment(c)}
                                  sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#16a34a" }}
                                >
                                  Pay
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<HistoryOutlinedIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleOpenHistory(c)}
                                sx={{ textTransform: "none", fontWeight: 600 }}
                              >
                                History
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: RECORD PAYMENT AGAINST CREDIT SALE */}
      <Dialog open={recordPayModalOpen} onClose={() => setRecordPayModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Record Payment – {selectedCreditSale?.voucherNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Box bgcolor="#f8fafc" p={2} borderRadius={2} border="1px solid #e2e8f0">
              <Typography variant="body2" color="text.secondary">
                Customer: <strong>{selectedCreditSale?.customerName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invoice: <strong>{formatCurrency(selectedCreditSale?.totalAmount)}</strong>
              </Typography>
              <Typography variant="body2" color="#dc2626" fontWeight={700}>
                Pending Balance: {formatCurrency(selectedCreditSale?.pending)}
              </Typography>
            </Box>

            <TextField
              label="Payment Amount (₹)"
              type="number"
              fullWidth
              size="small"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              helperText={`Maximum payable: ₹${selectedCreditSale?.pending}`}
            />

            <TextField
              select
              label="Payment Mode"
              fullWidth
              size="small"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="UPI">UPI / GPay / PhonePe</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer / NEFT</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
            </TextField>

            <TextField
              label="Payment Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />

            <TextField
              label="Notes / Reference Number"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. UPI Ref / Cash receipt details"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRecordPayModalOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={submittingPayment}
            sx={{ textTransform: "none", bgcolor: "#16a34a", fontWeight: 600 }}
          >
            {submittingPayment ? <CircularProgress size={20} color="inherit" /> : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: PAYMENT HISTORY */}
      <Dialog open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Payment History – {selectedCreditSale?.voucherNumber} ({selectedCreditSale?.customerName})
        </DialogTitle>
        <DialogContent dividers>
          {loadingHistory ? (
            <Box p={4} display="flex" justifyContent="center">
              <CircularProgress size={28} />
            </Box>
          ) : paymentHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" py={3}>
              No payments recorded yet for this invoice.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Recorded By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#16a34a" }}>
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip label={p.payment_method} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{p.notes || "-"}</TableCell>
                    <TableCell>{p.recorded_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryModalOpen(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: DRIVER ITEMS DETAIL */}
      <Dialog open={itemsModalOpen} onClose={() => setItemsModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Item-wise Details – {selectedDriverItems?.deliveryBoy}
        </DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedDriverItems?.items?.map((it: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 500 }}>{it.itemName}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{it.qty}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(it.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setItemsModalOpen(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
