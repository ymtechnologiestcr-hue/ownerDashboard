import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Stack,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import axios from "../utils/axiosInstance";
import { exportToExcel, exportToPdf } from "../utils/reportExportUtils";

export default function Sales() {
  const [activeTab, setActiveTab] = useState<"domestic" | "commercial" | "online" | "credit">("domestic");
  const [loading, setLoading] = useState(false);

  // Filters
  const todayStr = new Date().toISOString().split("T")[0];
  const [timeframe, setTimeframe] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverId, setDriverId] = useState("ALL");
  const [productId, setProductId] = useState("ALL");
  const [customerId, setCustomerId] = useState("ALL");

  const [metadata, setMetadata] = useState<{
    drivers: Array<{ id: number; name: string }>;
    products: Array<{ id: number; name: string; type: string }>;
    customers: Array<{ id: number; name: string; consumer_number: string }>;
  }>({ drivers: [], products: [], customers: [] });

  const [data, setData] = useState<any>({
    domestic: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    commercial: { items: [], totals: { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalAmount: 0 } },
    online: { items: [], totals: { totalQty: 0, totalAmount: 0 } },
    credit: { items: [], totals: { totalQty: 0, totalAmount: 0, totalReceived: 0, totalPending: 0 } },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { timeframe };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (driverId !== "ALL") params.driverId = driverId;
      if (productId !== "ALL") params.productId = productId;
      if (customerId !== "ALL") params.customerId = customerId;

      const res = await axios.get("/owner/sales/report", { params });
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.metadata) setMetadata(res.data.metadata);
      }
    } catch (err) {
      console.error("Fetch sales report error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, startDate, endDate, driverId, productId, customerId]);

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportExcel = () => {
    const sheets: any[] = [];

    // Domestic Sheet
    sheets.push({
      sheetName: "Domestic Sales (5%)",
      headers: ["Date", "Voucher Number", "Delivery Boy Name", "Category", "Item Name", "Total Quantity Sold", "Rate", "Taxable Value", "CGST @ 2.5%", "SGST @ 2.5%", "Total Amount"],
      data: data.domestic.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.category, i.itemName, i.totalQuantity, i.rate.toFixed(2), i.taxableValue.toFixed(2), i.cgst.toFixed(2), i.sgst.toFixed(2), i.totalAmount.toFixed(2)
      ]),
      totals: ["TOTALS", "", "", "", "", data.domestic.totals.totalQty, "", data.domestic.totals.totalTaxable.toFixed(2), data.domestic.totals.totalCgst.toFixed(2), data.domestic.totals.totalSgst.toFixed(2), data.domestic.totals.totalAmount.toFixed(2)]
    });

    // Commercial Sheet
    sheets.push({
      sheetName: "Commercial Sales (18%)",
      headers: ["Date", "Voucher Number", "Delivery Boy Name", "Customer Name", "Category", "Item Name", "Total Quantity Sold", "Rate", "Taxable Value", "CGST @ 9%", "SGST @ 9%", "Total Amount"],
      data: data.commercial.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.category, i.itemName, i.totalQuantity, i.rate.toFixed(2), i.taxableValue.toFixed(2), i.cgst.toFixed(2), i.sgst.toFixed(2), i.totalAmount.toFixed(2)
      ]),
      totals: ["TOTALS", "", "", "", "", "", data.commercial.totals.totalQty, "", data.commercial.totals.totalTaxable.toFixed(2), data.commercial.totals.totalCgst.toFixed(2), data.commercial.totals.totalSgst.toFixed(2), data.commercial.totals.totalAmount.toFixed(2)]
    });

    // Online Sheet
    sheets.push({
      sheetName: "Online Sales",
      headers: ["Date", "Voucher / Txn Number", "Delivery Boy Name", "Customer Name", "Consumer Number", "Item Name", "Quantity", "Payment Mode", "Total Amount", "Payment Status"],
      data: data.online.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.consumerNumber, i.itemName, i.quantity, i.paymentMode, i.totalAmount.toFixed(2), i.paymentStatus
      ]),
      totals: ["TOTALS", "", "", "", "", "", data.online.totals.totalQty, "", data.online.totals.totalAmount.toFixed(2), ""]
    });

    // Credit Sheet
    sheets.push({
      sheetName: "Credit Sales",
      headers: ["Date", "Voucher Number", "Delivery Boy Name", "Customer Name", "Consumer Number", "Item Name", "Refill Quantity", "Empty Cylinder Returned", "Total Sales Amount", "Amount Received", "Pending Amount", "Credit Status"],
      data: data.credit.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.consumerNumber, i.itemName, i.refillQuantity, i.emptyCylinderReturned, i.totalSalesAmount.toFixed(2), i.amountReceived.toFixed(2), i.pendingAmount.toFixed(2), i.creditStatus
      ]),
      totals: ["TOTALS", "", "", "", "", "", data.credit.totals.totalQty, "", data.credit.totals.totalAmount.toFixed(2), data.credit.totals.totalReceived.toFixed(2), data.credit.totals.totalPending.toFixed(2), ""]
    });

    exportToExcel({ filename: `Owner_Sales_Report_${todayStr}.xlsx`, sheets });
  };

  const handleExportPdf = () => {
    let title = "Domestic Cylinder Sales Report – 5% GST";
    let headers: string[] = [];
    let rows: any[] = [];
    let totals: any[] = [];

    if (activeTab === "domestic") {
      title = "Domestic Cylinder Sales Report – 5% GST";
      headers = ["Date", "Voucher No", "Delivery Boy", "Category", "Item Name", "Qty", "Rate", "Taxable", "CGST 2.5%", "SGST 2.5%", "Total"];
      rows = data.domestic.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.category, i.itemName, i.totalQuantity, `₹${i.rate.toFixed(2)}`, `₹${i.taxableValue.toFixed(2)}`, `₹${i.cgst.toFixed(2)}`, `₹${i.sgst.toFixed(2)}`, `₹${i.totalAmount.toFixed(2)}`
      ]);
      totals = ["TOTALS", "", "", "", "", data.domestic.totals.totalQty, "", `₹${data.domestic.totals.totalTaxable.toFixed(2)}`, `₹${data.domestic.totals.totalCgst.toFixed(2)}`, `₹${data.domestic.totals.totalSgst.toFixed(2)}`, `₹${data.domestic.totals.totalAmount.toFixed(2)}`];
    } else if (activeTab === "commercial") {
      title = "Commercial Cylinder Sales Report – 18% GST";
      headers = ["Date", "Voucher No", "Delivery Boy", "Customer", "Item Name", "Qty", "Rate", "Taxable", "CGST 9%", "SGST 9%", "Total"];
      rows = data.commercial.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.itemName, i.totalQuantity, `₹${i.rate.toFixed(2)}`, `₹${i.taxableValue.toFixed(2)}`, `₹${i.cgst.toFixed(2)}`, `₹${i.sgst.toFixed(2)}`, `₹${i.totalAmount.toFixed(2)}`
      ]);
      totals = ["TOTALS", "", "", "", "", data.commercial.totals.totalQty, "", `₹${data.commercial.totals.totalTaxable.toFixed(2)}`, `₹${data.commercial.totals.totalCgst.toFixed(2)}`, `₹${data.commercial.totals.totalSgst.toFixed(2)}`, `₹${data.commercial.totals.totalAmount.toFixed(2)}`];
    } else if (activeTab === "online") {
      title = "Online Sales Report – Customer Direct";
      headers = ["Date", "Voucher / Txn", "Delivery Boy", "Customer", "Consumer No", "Item Name", "Qty", "Payment Mode", "Total Amount", "Status"];
      rows = data.online.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.consumerNumber, i.itemName, i.quantity, i.paymentMode, `₹${i.totalAmount.toFixed(2)}`, i.paymentStatus
      ]);
      totals = ["TOTALS", "", "", "", "", "", data.online.totals.totalQty, "", `₹${data.online.totals.totalAmount.toFixed(2)}`, ""];
    } else {
      title = "Credit Sales Report – Delivery Agent";
      headers = ["Date", "Voucher No", "Delivery Boy", "Customer", "Consumer No", "Item Name", "Refill Qty", "Empty Ret", "Total Sales", "Received", "Pending", "Status"];
      rows = data.credit.items.map((i: any) => [
        i.date, i.voucherNumber, i.deliveryBoyName, i.customerName, i.consumerNumber, i.itemName, i.refillQuantity, i.emptyCylinderReturned, `₹${i.totalSalesAmount.toFixed(2)}`, `₹${i.amountReceived.toFixed(2)}`, `₹${i.pendingAmount.toFixed(2)}`, i.creditStatus
      ]);
      totals = ["TOTALS", "", "", "", "", "", data.credit.totals.totalQty, "", `₹${data.credit.totals.totalAmount.toFixed(2)}`, `₹${data.credit.totals.totalReceived.toFixed(2)}`, `₹${data.credit.totals.totalPending.toFixed(2)}`, ""];
    }

    exportToPdf({
      filename: `Sales_Report_${activeTab}_${todayStr}.pdf`,
      title,
      subtitle: "Official Owner Sales Report",
      dateRange: timeframe === "all" ? "All Time" : `${startDate} to ${endDate}`,
      headers,
      data: rows,
      totals,
      orientation: "landscape",
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="#0f172a">
            Owner Dashboard – Sales Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Separate Domestic, Commercial, Online & Credit Sales with GST & credit tracking
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
              DOMESTIC SALES (5% GST)
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#1e293b" mt={0.5}>
              {formatCurrency(data.domestic.totals.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Qty: <strong>{data.domestic.totals.totalQty}</strong> | Taxable: {formatCurrency(data.domestic.totals.totalTaxable)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              COMMERCIAL SALES (18% GST)
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#1e293b" mt={0.5}>
              {formatCurrency(data.commercial.totals.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Qty: <strong>{data.commercial.totals.totalQty}</strong> | Taxable: {formatCurrency(data.commercial.totals.totalTaxable)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ONLINE SALES
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#2563eb" mt={0.5}>
              {formatCurrency(data.online.totals.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Qty: <strong>{data.online.totals.totalQty}</strong> | Direct Customer Portal
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none", bgcolor: "#f8fafc" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="#dc2626" fontWeight={700}>
              CREDIT SALES (PENDING)
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#b91c1c" mt={0.5}>
              {formatCurrency(data.credit.totals.totalPending)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Total: {formatCurrency(data.credit.totals.totalAmount)} | Recv: {formatCurrency(data.credit.totals.totalReceived)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* FILTER BAR */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
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

          <TextField
            select
            size="small"
            label="Delivery Agent"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Delivery Agents</MenuItem>
            {metadata.drivers.map((d) => (
              <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Item / Cylinder"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Items</MenuItem>
            {metadata.products.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>{p.name} ({p.type})</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Customers</MenuItem>
            {metadata.customers.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>{c.name} {c.consumer_number ? `(${c.consumer_number})` : ""}</MenuItem>
            ))}
          </TextField>
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
            <Tab value="domestic" label={`1. Domestic Sales (5% GST) [${data.domestic.items.length}]`} />
            <Tab value="commercial" label={`2. Commercial Sales (18% GST) [${data.commercial.items.length}]`} />
            <Tab value="online" label={`3. Online Sales [${data.online.items.length}]`} />
            <Tab value="credit" label={`4. Credit Sales Report [${data.credit.items.length}]`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box p={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box p={2} sx={{ overflowX: "auto" }}>
            {/* TAB 1: DOMESTIC CYLINDER SALES REPORT - 5% GST */}
            {activeTab === "domestic" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Voucher Number</th>
                    <th style={{ padding: "10px 12px" }}>Delivery Boy Name</th>
                    <th style={{ padding: "10px 12px" }}>Category</th>
                    <th style={{ padding: "10px 12px" }}>Item Name</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Quantity Sold</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Taxable Value</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>CGST @ 2.5%</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>SGST @ 2.5%</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.domestic.items.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No domestic cylinder sales found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    data.domestic.items.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px" }}>{row.date}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.voucherNumber}</td>
                        <td style={{ padding: "10px 12px" }}>{row.deliveryBoyName}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <Chip label={row.category} size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }} />
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.itemName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{row.totalQuantity}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.rate)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.taxableValue)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.cgst)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.sgst)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{formatCurrency(row.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                  {data.domestic.items.length > 0 && (
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={5} style={{ padding: "12px" }}>TOTALS</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{data.domestic.totals.totalQty}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>-</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.domestic.totals.totalTaxable)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.domestic.totals.totalCgst)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.domestic.totals.totalSgst)}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#0f172a" }}>{formatCurrency(data.domestic.totals.totalAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* TAB 2: COMMERCIAL CYLINDER SALES REPORT - 18% GST */}
            {activeTab === "commercial" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Voucher Number</th>
                    <th style={{ padding: "10px 12px" }}>Delivery Boy Name</th>
                    <th style={{ padding: "10px 12px" }}>Customer Name</th>
                    <th style={{ padding: "10px 12px" }}>Category</th>
                    <th style={{ padding: "10px 12px" }}>Item Name</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Quantity Sold</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Taxable Value</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>CGST @ 9%</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>SGST @ 9%</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commercial.items.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No commercial cylinder sales found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    data.commercial.items.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px" }}>{row.date}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.voucherNumber}</td>
                        <td style={{ padding: "10px 12px" }}>{row.deliveryBoyName}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.customerName}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <Chip label={row.category} size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }} />
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.itemName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{row.totalQuantity}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.rate)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.taxableValue)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.cgst)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(row.sgst)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{formatCurrency(row.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                  {data.commercial.items.length > 0 && (
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={6} style={{ padding: "12px" }}>TOTALS</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{data.commercial.totals.totalQty}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>-</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.commercial.totals.totalTaxable)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.commercial.totals.totalCgst)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.commercial.totals.totalSgst)}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#0f172a" }}>{formatCurrency(data.commercial.totals.totalAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* TAB 3: ONLINE SALES REPORT */}
            {activeTab === "online" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Voucher / Txn Number</th>
                    <th style={{ padding: "10px 12px" }}>Delivery Boy Name</th>
                    <th style={{ padding: "10px 12px" }}>Customer Name</th>
                    <th style={{ padding: "10px 12px" }}>Consumer Number</th>
                    <th style={{ padding: "10px 12px" }}>Item Name</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "10px 12px" }}>Payment Mode / Channel</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Amount</th>
                    <th style={{ padding: "10px 12px" }}>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.online.items.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No direct online sales found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    data.online.items.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px" }}>{row.date}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.voucherNumber}</td>
                        <td style={{ padding: "10px 12px" }}>{row.deliveryBoyName}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.customerName}</td>
                        <td style={{ padding: "10px 12px" }}>{row.consumerNumber}</td>
                        <td style={{ padding: "10px 12px" }}>{row.itemName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{row.quantity}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <Chip label={row.paymentMode} size="small" sx={{ bgcolor: "#e0e7ff", color: "#3730a3", fontWeight: 600 }} />
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{formatCurrency(row.totalAmount)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <Chip label={row.paymentStatus} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                        </td>
                      </tr>
                    ))
                  )}
                  {data.online.items.length > 0 && (
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={6} style={{ padding: "12px" }}>TOTALS</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{data.online.totals.totalQty}</td>
                      <td style={{ padding: "12px" }}>-</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#0f172a" }}>{formatCurrency(data.online.totals.totalAmount)}</td>
                      <td style={{ padding: "12px" }}>-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* TAB 4: CREDIT SALES REPORT - DELIVERY AGENT */}
            {activeTab === "credit" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Voucher Number</th>
                    <th style={{ padding: "10px 12px" }}>Delivery Boy Name</th>
                    <th style={{ padding: "10px 12px" }}>Customer Name</th>
                    <th style={{ padding: "10px 12px" }}>Consumer Number</th>
                    <th style={{ padding: "10px 12px" }}>Item Name</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Refill Qty</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Empty Returned</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Sales Amount</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Amount Received</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Pending Amount</th>
                    <th style={{ padding: "10px 12px" }}>Credit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.credit.items.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No credit sales recorded for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    data.credit.items.map((row: any, idx: number) => {
                      const isPaid = row.creditStatus === "Paid";
                      const isPartial = row.creditStatus === "Partially Paid";

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px" }}>{row.date}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.voucherNumber}</td>
                          <td style={{ padding: "10px 12px" }}>{row.deliveryBoyName}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{row.customerName}</td>
                          <td style={{ padding: "10px 12px" }}>{row.consumerNumber}</td>
                          <td style={{ padding: "10px 12px" }}>{row.itemName}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{row.refillQuantity}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>{row.emptyCylinderReturned}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{formatCurrency(row.totalSalesAmount)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{formatCurrency(row.amountReceived)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#dc2626", fontWeight: 700 }}>{formatCurrency(row.pendingAmount)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <Chip
                              label={row.creditStatus}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: isPaid ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                                color: isPaid ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {data.credit.items.length > 0 && (
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={6} style={{ padding: "12px" }}>TOTALS</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{data.credit.totals.totalQty}</td>
                      <td style={{ padding: "12px" }}>-</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(data.credit.totals.totalAmount)}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#16a34a" }}>{formatCurrency(data.credit.totals.totalReceived)}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#dc2626" }}>{formatCurrency(data.credit.totals.totalPending)}</td>
                      <td style={{ padding: "12px" }}>-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
