import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  Button,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQueryClient } from "@tanstack/react-query";
import axios from "../utils/axiosInstance";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
  icon: React.ReactNode;
}

type ExpenseStatus = "APPROVED" | "PENDING" | "REJECTED";

interface ExpenseRow {
  id: string;
  rawId: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  by: string;
  byRole: string;
  status: ExpenseStatus;
  source: "PURCHASE_MANAGER" | "CASHIER_OFFICE";
  canApprove: boolean;
}

interface ExpenseSummary {
  totalExpense: number;
  monthlyTotalSales: number;
  pendingApproval: number;
}

interface ExpenseResponse {
  success: boolean;
  summary: ExpenseSummary;
  data: ExpenseRow[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type Filters = {
  search: string;
  startDate: string;
  endDate: string;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const today = new Date();
  const startDate = formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
  const endDate = formatDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  return { startDate, endDate };
};

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const StatCard: React.FC<StatCardProps> = ({ title, value, bgColor, icon }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      p: 2,
      borderRadius: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
      border: "1px solid #e5e7eb",
      backgroundColor: "#f8fafc",
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
      <Typography color="text.secondary" sx={{ fontSize: ".75rem", lineHeight: "1rem" }}>
        {title}
      </Typography>
      <Typography fontWeight={700} sx={{ fontSize: "1.25rem", lineHeight: "1.75rem" }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const StatusChip: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
  const map: Record<ExpenseStatus, { label: string; color: "success" | "warning" | "error" }> = {
    APPROVED: { label: "Approved", color: "success" },
    PENDING: { label: "Pending", color: "warning" },
    REJECTED: { label: "Rejected", color: "error" },
  };

  return <Chip label={map[status].label} color={map[status].color} size="small" />;
};

const SourceChip: React.FC<{ source: ExpenseRow["source"] }> = ({ source }) => {
  const map: Record<ExpenseRow["source"], { label: string; color: "info" | "secondary" }> = {
    PURCHASE_MANAGER: { label: "Purchase Manager", color: "info" },
    CASHIER_OFFICE: { label: "Cashier Office", color: "secondary" },
  };

  return <Chip label={map[source].label} color={map[source].color} size="small" variant="outlined" />;
};

const fetchExpenses = async ({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: [string, Filters];
}): Promise<ExpenseResponse> => {
  const [, filters] = queryKey;

  const res = await axios.get("/owner/expenses/dashboard", {
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

const ExpenseManagement: React.FC = () => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const initialRange = getCurrentMonthRange();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
  });
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteScroll({
    queryKey: ["expenses-dashboard", filters],
    queryFn: fetchExpenses,
  });

  const summary = data?.pages?.[0]?.summary;
  const dateRange = data?.pages?.[0]?.dateRange ?? filters;

  const rows = useMemo(
    () => data?.pages?.flatMap((page: ExpenseResponse) => page.data) ?? [],
    [data]
  );

  const handleApprove = async (row: ExpenseRow) => {
    setApprovingId(row.rawId);

    try {
      await axios.put(`/owner/expenses/${row.rawId}/approve`);
      await queryClient.invalidateQueries({ queryKey: ["expenses-dashboard"] });
    } finally {
      setApprovingId(null);
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {(error as Error)?.message || "Failed to load expenses"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Expense Management
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Showing expenses from {dateRange.startDate} to {dateRange.endDate}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Search Expense / Category"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
          sx={{ minWidth: 240 }}
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

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpense ?? 0)}
          bgColor="#fee2e2"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#ef4444" }}
            >
              <path d="M6 3h12" />
              <path d="M6 8h12" />
              <path d="m6 13 8.5 8" />
              <path d="M6 13h3" />
              <path d="M9 13c6.667 0 6.667-10 0-10" />
            </Box>
          }
        />
        <StatCard
          title="Monthly Total Sales"
          value={formatCurrency(summary?.monthlyTotalSales ?? 0)}
          bgColor="#2463eb1a"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#2563eb" }}
            >
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 17.5v-11" />
            </Box>
          }
        />
        <StatCard
          title="Pending Approval"
          value={String(summary?.pendingApproval ?? 0)}
          bgColor="#f1f5f9"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#64748b" }}
            >
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 17.5v-11" />
            </Box>
          }
        />
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ fontSize: "1rem", lineHeight: "1.5rem" }}>
            All Expenses
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            p: 2,
            columnGap: 2,
            backgroundColor: "#f8fafc",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "20px",
            borderBottom: "1px solid #e5e7eb",
            color: "text.secondary",
          }}
        >
          <Box sx={{ flex: 1 }}>ID</Box>
          <Box sx={{ flex: 1.4 }}>Category</Box>
          <Box sx={{ flex: 2.5 }}>Description</Box>
          <Box sx={{ flex: 1 }}>Amount</Box>
          <Box sx={{ flex: 1 }}>Date</Box>
          <Box sx={{ flex: 1.2 }}>By</Box>
          <Box sx={{ flex: 1.4 }}>Source</Box>
          <Box sx={{ flex: 1 }}>Status</Box>
          <Box sx={{ flex: 1.2 }}>Action</Box>
        </Box>

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
                    p: 2,
                    columnGap: 2,
                    fontSize: "14px",
                    lineHeight: "20px",
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                  }}
                >
                  <Box sx={{ flex: 1 }}>{row.id}</Box>
                  <Box sx={{ flex: 1.4 }}>{row.category}</Box>
                  <Box sx={{ flex: 2.5 }}>{row.description}</Box>
                  <Box sx={{ flex: 1 }}>{formatCurrency(row.amount)}</Box>
                  <Box sx={{ flex: 1 }}>{row.date}</Box>
                  <Box sx={{ flex: 1.2 }}>{row.by}</Box>
                  <Box sx={{ flex: 1.4 }}>
                    <SourceChip source={row.source} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <StatusChip status={row.status} />
                  </Box>
                  <Box sx={{ flex: 1.2 }}>
                    {row.canApprove ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleApprove(row)}
                        disabled={approvingId === row.rawId}
                      >
                        {approvingId === row.rawId ? "Approving..." : "Approve"}
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
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

export default ExpenseManagement;