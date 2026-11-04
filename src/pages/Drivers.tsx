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
  CircularProgress,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import axios from "../utils/axiosInstance";
import { exportToExcel, exportToPdf } from "../utils/reportExportUtils";

export default function Drivers() {
  const [activeTab, setActiveTab] = useState<"overview" | "vehicleHistory">("overview");
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [summary, setSummary] = useState({
    totalDrivers: 0,
    activeToday: 0,
    deliveredToday: 0,
    inHandToday: 0,
  });

  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);

  // Edit Vehicle Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    vehicleNumber: "",
    pollutionExpiry: "",
    fitnessExpiry: "",
    explosivesExpiry: "",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/owner/drivers/management", {
        params: { startDate, endDate },
      });
      if (res.data?.success) {
        setSummary(res.data.summary);
        setDrivers(res.data.data.drivers || []);
        setVehicleHistory(res.data.data.vehicleHistory || []);
      }
    } catch (err) {
      console.error("Fetch driver management error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleOpenEditVehicle = (veh: any) => {
    setSelectedVehicle(veh);
    setEditForm({
      vehicleNumber: veh.vehicleNumber || "",
      pollutionExpiry: veh.pollutionExpiry || "",
      fitnessExpiry: veh.fitnessExpiry || "",
      explosivesExpiry: veh.explosivesExpiry || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      setSavingVehicle(true);
      await axios.put(`/owner/drivers/${selectedVehicle.driverId}/vehicle-documents`, editForm);
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update vehicle documents:", err);
    } finally {
      setSavingVehicle(false);
    }
  };

  const getDocStatusChip = (status: string) => {
    if (status === "Valid") {
      return <Chip label="Valid" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />;
    }
    if (status === "Expiring Soon") {
      return <Chip label="Expiring Soon" size="small" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700 }} />;
    }
    return <Chip label="Expired" size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }} />;
  };

  const handleExportExcel = () => {
    const sheets: any[] = [];
    if (activeTab === "overview") {
      sheets.push({
        sheetName: "Driver Operations",
        headers: ["Delivery Agent Name", "Total Delivered", "Delivered System Updated", "Total In Hand", "In Hand System Updated", "Status (Daily Allocation)"],
        data: drivers.map((d) => [
          d.name,
          d.totalDelivered,
          d.totalSystemUpdated,
          d.totalInHand,
          d.totalSystemInHand,
          d.status === "ACTIVE" ? "Active (Allocated)" : "Inactive (No Allocation)"
        ]),
      });
    } else {
      sheets.push({
        sheetName: "Vehicle History",
        headers: ["Delivery Agent Name", "Vehicle Number", "Pollution Expiry (PUC)", "Fitness / Test Expiry", "Explosives Licence Expiry", "Document Status"],
        data: vehicleHistory.map((v) => [
          v.driverName,
          v.vehicleNumber,
          v.pollutionExpiry,
          v.fitnessExpiry,
          v.explosivesExpiry,
          v.documentStatus
        ]),
      });
    }
    exportToExcel({ filename: `Driver_Management_${activeTab}_${todayStr}.xlsx`, sheets });
  };

  const handleExportPdf = () => {
    if (activeTab === "overview") {
      exportToPdf({
        filename: `Driver_Operations_${todayStr}.pdf`,
        title: "Driver Management – Operational Overview",
        subtitle: "Item-wise Deliveries, In-Hand Cylinders & SDMS Update Reconciliation",
        dateRange: `${startDate} to ${endDate}`,
        headers: ["Driver Name", "Delivered Qty", "System Updated", "In-Hand Qty", "In-Hand System", "Daily Status"],
        data: drivers.map((d) => [
          d.name,
          d.totalDelivered,
          d.totalSystemUpdated,
          d.totalInHand,
          d.totalSystemInHand,
          d.status === "ACTIVE" ? "Active (Green)" : "Inactive (Red)"
        ]),
        orientation: "landscape",
      });
    } else {
      exportToPdf({
        filename: `Vehicle_History_${todayStr}.pdf`,
        title: "Vehicle History & Document Expiry Tracking",
        subtitle: "PUC, Fitness & Explosives Licence Expiry Monitoring",
        dateRange: `As of ${todayStr}`,
        headers: ["Driver Name", "Vehicle Number", "PUC Expiry", "Fitness Expiry", "Explosives Expiry", "Status"],
        data: vehicleHistory.map((v) => [
          v.driverName,
          v.vehicleNumber,
          v.pollutionExpiry,
          v.fitnessExpiry,
          v.explosivesExpiry,
          v.documentStatus
        ]),
        orientation: "landscape",
      });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="#0f172a">
            Driver Management Screen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor item-wise cylinder allocation, deliveries, in-hands, SDMS updates, and vehicle document validity
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
              TOTAL DRIVERS
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#1e293b" mt={0.5}>
              {summary.totalDrivers}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Registered delivery agents
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="#16a34a" fontWeight={700}>
              ACTIVE TODAY (ALLOCATED)
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#15803d" mt={0.5}>
              {summary.activeToday}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Allocated cylinders by Godown Manager
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              DELIVERED TODAY
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#2563eb" mt={0.5}>
              {summary.deliveredToday}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Total delivered cylinders
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              IN HAND WITH DRIVERS
            </Typography>
            <Typography variant="h5" fontWeight="700" color="#f97316" mt={0.5}>
              {summary.inHandToday}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Remaining with drivers for delivery
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* DATE FILTER */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "none" }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setStartDate(todayStr);
              setEndDate(todayStr);
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Reset to Today
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
            <Tab value="overview" label="1. Driver Operations & Item-wise Breakdown" />
            <Tab
              value="vehicleHistory"
              icon={<DirectionsCarOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`2. Vehicle History & Expiry Tracking [${vehicleHistory.length}]`}
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box p={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box p={2}>
            {/* TAB 1: DRIVER MANAGEMENT TABLE REDESIGN */}
            {activeTab === "overview" && (
              <Table sx={{ minWidth: 700, "& td, & th": { py: 1.5, px: 2 } }}>
                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: "22%" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: "35%" }}>
                      Deliveries
                      <Typography variant="caption" display="block" color="text.secondary">
                        Item-wise Delivered Qty & System Updated Qty
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: "30%" }}>
                      In Hands
                      <Typography variant="caption" display="block" color="text.secondary">
                        Item-wise In-Hand Qty & System Updated Qty
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: "13%", textAlign: "center" }}>
                      Status
                      <Typography variant="caption" display="block" color="text.secondary">
                        Daily Allocation
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#64748b" }}>
                        No driver records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((d) => {
                      const isActive = d.status === "ACTIVE";

                      return (
                        <TableRow key={d.id} hover sx={{ verticalAlign: "top" }}>
                          {/* Name */}
                          <TableCell>
                            <Typography fontWeight={700} color="#0f172a" fontSize="14px">
                              {d.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: #{d.id} • {d.phone || "No phone"}
                            </Typography>
                          </TableCell>

                          {/* Deliveries: Item-wise */}
                          <TableCell>
                            {d.deliveries && d.deliveries.length > 0 ? (
                              <Box>
                                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                      <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item Name</th>
                                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>Delivered</th>
                                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>System Updated</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {d.deliveries.map((item: any, idx: number) => (
                                      <tr key={idx} style={{ borderBottom: "1px dashed #f1f5f9" }}>
                                        <td style={{ padding: "4px 0", fontWeight: 500 }}>{item.itemName}</td>
                                        <td style={{ textAlign: "right", padding: "4px 0", fontWeight: 600 }}>{item.deliveredQty}</td>
                                        <td style={{ textAlign: "right", padding: "4px 0", color: "#16a34a", fontWeight: 600 }}>
                                          {item.systemUpdatedQty}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                                      <td style={{ paddingTop: "4px" }}>Total</td>
                                      <td style={{ textAlign: "right", paddingTop: "4px" }}>{d.totalDelivered}</td>
                                      <td style={{ textAlign: "right", paddingTop: "4px", color: "#16a34a" }}>{d.totalSystemUpdated}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No deliveries yet for this period
                              </Typography>
                            )}
                          </TableCell>

                          {/* In Hands: Item-wise */}
                          <TableCell>
                            {d.inHands && d.inHands.length > 0 ? (
                              <Box>
                                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                                      <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item Name</th>
                                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>In Hand</th>
                                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>System In Hand</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {d.inHands.map((item: any, idx: number) => (
                                      <tr key={idx} style={{ borderBottom: "1px dashed #f1f5f9" }}>
                                        <td style={{ padding: "4px 0", fontWeight: 500 }}>{item.itemName}</td>
                                        <td style={{ textAlign: "right", padding: "4px 0", fontWeight: 600, color: "#f97316" }}>
                                          {item.inHandQty}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "4px 0", fontWeight: 600 }}>
                                          {item.systemUpdatedQty}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                                      <td style={{ paddingTop: "4px" }}>Total</td>
                                      <td style={{ textAlign: "right", paddingTop: "4px", color: "#f97316" }}>{d.totalInHand}</td>
                                      <td style={{ textAlign: "right", paddingTop: "4px" }}>{d.totalSystemInHand}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                0 cylinders in hand
                              </Typography>
                            )}
                          </TableCell>

                          {/* Status: Active / Inactive based on daily allocation */}
                          <TableCell align="center">
                            <Chip
                              label={isActive ? "Active" : "Inactive"}
                              size="medium"
                              sx={{
                                fontWeight: 700,
                                px: 1.5,
                                bgcolor: isActive ? "#dcfce7" : "#fee2e2",
                                color: isActive ? "#15803d" : "#b91c1c",
                                border: `1px solid ${isActive ? "#86efac" : "#fca5a5"}`,
                              }}
                            />
                            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                              {isActive ? "Allocated Today" : "No Allocation"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* TAB 2: SEPARATE TAB – VEHICLE HISTORY & DOCUMENT EXPIRY TRACKING */}
            {activeTab === "vehicleHistory" && (
              <Table sx={{ minWidth: 700, "& td, & th": { py: 1.5, px: 2 } }}>
                <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Delivery Agent Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Vehicle Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Pollution Certificate Expiry (PUC)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Fitness / Test Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Explosives Licence Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Document Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicleHistory.map((veh) => (
                    <TableRow key={veh.driverId} hover>
                      <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>{veh.driverName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{veh.vehicleNumber}</TableCell>
                      <TableCell>{veh.pollutionExpiry}</TableCell>
                      <TableCell>{veh.fitnessExpiry}</TableCell>
                      <TableCell>{veh.explosivesExpiry}</TableCell>
                      <TableCell align="center">{getDocStatusChip(veh.documentStatus)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditOutlinedIcon fontSize="small" />}
                          onClick={() => handleOpenEditVehicle(veh)}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          View / Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: VIEW / UPDATE VEHICLE DOCUMENTS */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Update Vehicle Documents – {selectedVehicle?.driverName}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Vehicle Registration Number"
              fullWidth
              size="small"
              value={editForm.vehicleNumber}
              onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
            />
            <TextField
              label="Pollution Certificate Expiry (PUC)"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={editForm.pollutionExpiry}
              onChange={(e) => setEditForm({ ...editForm, pollutionExpiry: e.target.value })}
            />
            <TextField
              label="Fitness / Test Certificate Expiry"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={editForm.fitnessExpiry}
              onChange={(e) => setEditForm({ ...editForm, fitnessExpiry: e.target.value })}
            />
            <TextField
              label="Explosives Licence Expiry Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={editForm.explosivesExpiry}
              onChange={(e) => setEditForm({ ...editForm, explosivesExpiry: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveVehicle}
            disabled={savingVehicle}
            sx={{ textTransform: "none", bgcolor: "#0f172a", fontWeight: 600 }}
          >
            {savingVehicle ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
