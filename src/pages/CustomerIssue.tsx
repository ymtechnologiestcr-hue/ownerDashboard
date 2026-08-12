import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "../utils/axiosInstance";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

// TYPES
interface StatCardProps {
  title: string;
  value: string | number;
  bgColor: string;
  icon: React.ReactNode;
}

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type Priority = "HIGH" | "MEDIUM" | "LOW";

interface IssueRow {
  id: string;
  customer: string;
  issue: string;
  priority: Priority;
  date: string;
  assignedTo: string;
  status: IssueStatus;
}

interface IssueSummary {
  openIssues: number;
  resolvedIssues: number;
  resolvedThisWeek: number;
}

interface IssuesResponse {
  success: boolean;
  summary: IssueSummary;
  data: IssueRow[];
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

// COMPONENTS
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
      <Typography color="text.secondary" sx={{ fontSize: "12px", lineHeight: "16px" }}>
        {title}
      </Typography>
      <Typography fontWeight={700} sx={{ fontSize: "20px", lineHeight: "28px" }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const StatusChip: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const config: Record<IssueStatus, { label: string; color: "error" | "default" | "primary" }> = {
    OPEN: { label: "Open", color: "error" },
    IN_PROGRESS: { label: "In Progress", color: "default" },
    RESOLVED: { label: "Resolved", color: "primary" },
  };

  return <Chip label={config[status].label} color={config[status].color} size="small" />;
};

const PriorityChip: React.FC<{ priority: Priority }> = ({ priority }) => {
  const config: Record<Priority, { label: string; color: "error" | "default" }> = {
    HIGH: { label: "High", color: "error" },
    MEDIUM: { label: "Medium", color: "default" },
    LOW: { label: "Low", color: "default" },
  };

  return <Chip label={config[priority].label} color={config[priority].color} size="small" />;
};

const fetchCustomerIssues = async ({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: [string, Filters];
}): Promise<IssuesResponse> => {
  const [, filters] = queryKey;

  const res = await axios.get("/issues/dashboard", {
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

const CustomerIssues: React.FC = () => {
  const parentRef = useRef<HTMLDivElement | null>(null);

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
    queryKey: ["customer-issues", filters],
    queryFn: fetchCustomerIssues,
  });

  const summary = data?.pages?.[0]?.summary;

  const rows = useMemo(
    () => data?.pages?.flatMap((page: IssuesResponse) => page.data) ?? [],
    [data]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
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
          {(error as Error)?.message || "Failed to load customer issues"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography fontWeight={700} mb={2} sx={{ fontSize: "18px", lineHeight: "24px" }}>
        Customer Issues
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Search Issue / Customer"
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

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          title="Open Issues"
          value={summary?.openIssues ?? 0}
          bgColor="#fee2e2"
          icon={<ErrorOutlineOutlinedIcon sx={{ color: "#ef4444", fontSize: 20 }} />}
        />
        <StatCard
          title="In Progress"
          value={summary?.resolvedIssues ?? 0}
          bgColor="#dbeafe"
          icon={<AccessTimeOutlinedIcon sx={{ color: "#2563eb", fontSize: 20 }} />}
        />
        <StatCard
          title="Resolved This Week"
          value={summary?.resolvedThisWeek ?? 0}
          bgColor="#dcfce7"
          icon={<CheckCircleOutlineOutlinedIcon sx={{ color: "#22c55e", fontSize: 20 }} />}
        />
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ fontSize: "16px", lineHeight: "24px" }}>
            All Issues
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            p: 2,
            backgroundColor: "#f8fafc",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "20px",
            borderBottom: "1px solid #e5e7eb",
            color: "text.secondary",
          }}
        >
          <Box sx={{ flex: 1 }}>ID</Box>
          <Box sx={{ flex: 1.4 }}>Customer</Box>
          <Box sx={{ flex: 2.4 }}>Issue</Box>
          <Box sx={{ flex: 1 }}>Priority</Box>
          <Box sx={{ flex: 1 }}>Date</Box>
          <Box sx={{ flex: 1.4 }}>Assigned To</Box>
          <Box sx={{ flex: 1 }}>Status</Box>
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
                    fontSize: "14px",
                    lineHeight: "20px",
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                  }}
                >
                  <Box sx={{ flex: 1 }}>{row.id}</Box>
                  <Box sx={{ flex: 1.4 }}>{row.customer}</Box>
                  <Box sx={{ flex: 2.4 }}>{row.issue}</Box>
                  <Box sx={{ flex: 1 }}>
                    <PriorityChip priority={row.priority} />
                  </Box>
                  <Box sx={{ flex: 1 }}>{row.date}</Box>
                  <Box sx={{ flex: 1.4 }}>{row.assignedTo}</Box>
                  <Box sx={{ flex: 1 }}>
                    <StatusChip status={row.status} />
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

export default CustomerIssues;