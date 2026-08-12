import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../utils/axiosInstance";

type Summary = {
  totalPending: number;
  settledToday: number;
  totalCollected: number;
};

type SettlementRow = {
  driver_id: number;
  driverName: string;
  collected: number;
  settled: number;
  pending: number;
  date: string | null;
  status: "SETTLED" | "PARTIAL" | "PENDING" | "NO_ACTIVITY";
};

type SettlementResponse = {
  success: boolean;
  summary: Summary;
  data: SettlementRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type Filters = {
  search: string;
  startDate: string;
  endDate: string;
};

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatStatus = (status: SettlementRow["status"]) => {
  switch (status) {
    case "SETTLED":
      return "Settled";
    case "PARTIAL":
      return "Partial";
    case "PENDING":
      return "Pending";
    case "NO_ACTIVITY":
      return "No Activity";
    default:
      return status;
  }
};

const getChipColor = (
  status: SettlementRow["status"],
): "primary" | "default" | "error" | "warning" => {
  switch (status) {
    case "SETTLED":
      return "primary";
    case "PARTIAL":
      return "warning";
    case "PENDING":
      return "error";
    case "NO_ACTIVITY":
      return "default";
    default:
      return "default";
  }
};

const fetchCashSettlements = async ({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: [string, Filters];
}): Promise<SettlementResponse> => {
  const [, filters] = queryKey;

  const res = await axios.get("/settlements/dashboard", {
    params: {
      page: pageParam,
      limit: 10,
      search: filters.search || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });

  return res.data;
};

const StatCard: React.FC<{
  title: string;
  value: string;
  bgColor: string;
  icon: React.ReactNode;
}> = ({ title, value, bgColor, icon }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      p: 2,
      borderRadius: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
      backgroundColor: "#f8fafc",
      border: "1px solid #e5e7eb",
      minWidth: 280,
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: "12px", lineHeight: "16px" }}
      >
        {title}
      </Typography>
      <Typography
        fontWeight={700}
        sx={{ fontSize: "20px", lineHeight: "28px" }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const CashSettlement: React.FC = () => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    startDate: "",
    endDate: "",
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteScroll({
    queryKey: ["cash-settlements", filters],
    queryFn: fetchCashSettlements,
  });

  const settleMutation = useMutation({
    mutationFn: async ({
      driver_id,
      amount,
      status,
      settlement_date,
    }: {
      driver_id: number;
      amount: number;
      status: "SETTLED" | "PARTIAL" | "PENDING";
      settlement_date: string;
    }) => {
      const res = await axios.post("/settlements", {
        driver_id,
        amount,
        status,
        settlement_date,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-settlements"] });
    },
  });

  const summary = data?.pages?.[0]?.summary;

  const rows = useMemo(
    () => data?.pages?.flatMap((page: SettlementResponse) => page.data) ?? [],
    [data],
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 62,
    overscan: 6,
  });

  const handleSettle = (row: SettlementRow) => {
    if (row.pending <= 0) return;

    settleMutation.mutate({
      driver_id: row.driver_id,
      amount: row.pending,
      status: "SETTLED",
      settlement_date: new Date().toISOString().split("T")[0],
    });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {(error as Error)?.message ||
            "Failed to load cash settlement dashboard"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        fontWeight={700}
        mb={2}
        sx={{ fontSize: "18px", lineHeight: "24px" }}
      >
        Cash Settlement
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Search Driver"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
          sx={{ minWidth: 220 }}
        />

        <TextField
          size="small"
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
        />

        <TextField
          size="small"
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              endDate: e.target.value,
            }))
          }
        />
      </Box>

      {}

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          title="Total Pending"
          value={formatCurrency(summary?.totalPending ?? 0)}
          bgColor="#fee2e2"
          icon={<WalletOutlinedIcon sx={{ color: "#ef4444", fontSize: 22 }} />}
        />
        <StatCard
          title="Settled Total"
          value={formatCurrency(summary?.settledToday ?? 0)}
          bgColor="#dcfce7"
          icon={
            <CheckCircleOutlineOutlinedIcon
              sx={{ color: "#22c55e", fontSize: 22 }}
            />
          }
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          bgColor="#dbeafe"
          icon={
            <AccountBalanceWalletOutlinedIcon
              sx={{ color: "#2563eb", fontSize: 22 }}
            />
          }
        />
      </Box>

      {/* Table */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            fontWeight={700}
            sx={{ fontSize: "16px", lineHeight: "24px" }}
          >
            Driver Settlements
          </Typography>
        </Box>

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            px: 2,
            py: 1.5,
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "20px",
            color: "text.secondary",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Box sx={{ flex: 2 }}>Driver</Box>
          <Box sx={{ flex: 1 }}>Collected</Box>
          <Box sx={{ flex: 1 }}>Settled</Box>
          <Box sx={{ flex: 1 }}>Pending</Box>
          <Box sx={{ flex: 1 }}>Date</Box>
          <Box sx={{ flex: 1 }}>Status</Box>
          <Box sx={{ flex: 1 }}>Action</Box>
        </Box>

        {/* Virtualized Body */}
        <Box
          ref={parentRef}
          sx={{
            height: 360,
            overflow: "auto",
            position: "relative",
          }}
        >
          <Box
            sx={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              if (
                virtualRow.index >= rows.length - 2 &&
                hasNextPage &&
                !isFetchingNextPage
              ) {
                fetchNextPage();
              }

              const highlight =
                row.status === "PENDING" || row.status === "PARTIAL";

              return (
                <Box
                  key={virtualRow.key}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    fontSize: "14px",
                    lineHeight: "20px",
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: highlight ? "#fff7ed" : "#fff",
                  }}
                >
                  <Box sx={{ flex: 2, fontWeight: 500 }}>{row.driverName}</Box>
                  <Box sx={{ flex: 1 }}>{formatCurrency(row.collected)}</Box>
                  <Box sx={{ flex: 1 }}>{formatCurrency(row.settled)}</Box>
                  <Box
                    sx={{
                      flex: 1,
                      color: row.pending > 0 ? "#ef4444" : "inherit",
                      fontWeight: row.pending > 0 ? 600 : 400,
                    }}
                  >
                    {formatCurrency(row.pending)}
                  </Box>
                  <Box sx={{ flex: 1 }}>{formatDate(row.date)}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Chip
                      label={formatStatus(row.status)}
                      color={getChipColor(row.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {(row.status === "PENDING" || row.status === "PARTIAL") &&
                    row.pending > 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleSettle(row)}
                        disabled={settleMutation.isPending}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          minWidth: 80,
                        }}
                      >
                        {settleMutation.isPending ? "Saving..." : "Settle"}
                      </Button>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {isFetchingNextPage && (
          <Box textAlign="center" py={2}>
            <CircularProgress size={22} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CashSettlement;
