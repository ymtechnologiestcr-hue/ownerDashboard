import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Stack
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import axios from "../utils/axiosInstance";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import DateRangePicker from "../components/DateRangePicker";

const fetchDrivers = async ({
  pageParam = 1,
  startDate,
  endDate,
}: {
  pageParam?: number;
  startDate: string;
  endDate: string;
}) => {
  const res = await axios.get("/owner/drivers/dashboard", {
    params: { page: pageParam, limit: 10, startDate, endDate },
  });
  return res.data;
};

export default function Drivers() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data, fetchNextPage, hasNextPage } = useInfiniteScroll({
    queryKey: ["drivers", startDate, endDate],
    queryFn: ({ pageParam }: any) =>
      fetchDrivers({ pageParam, startDate, endDate }),
  });

  const drivers = data?.pages.flatMap((p: any) => p.data) ?? [];
  const summary = data?.pages?.[0]?.summary;

  const rowVirtualizer = useVirtualizer({
    count: drivers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const getStatusPill = (status: string, isAvailable: number) => {
    if (Number(isAvailable) === 0) {
      return { bg: "#FEF3C7", color: "#92400E", label: "On Leave" };
    }
    if (String(status || "").toUpperCase() === "INACTIVE") {
      return { bg: "#FEE2E2", color: "#B91C1C", label: "Inactive" };
    }
    return { bg: "#2463eb", color: "#FFFFFF", label: "Active" };
  };

  return (
    <Box p={3}>
      <Typography fontWeight="600" mb={3} sx={{ fontSize: "1.125rem", lineHeight: "1.75rem" }}>
        Driver Management
      </Typography>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* SUMMARY CARDS */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "repeat(4,1fr)" }}
        gap={3}
        mb={4}
      >
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#2463eb", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2463eb1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: "12px" }}>
                  Total Drivers
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  {summary?.totalDrivers || 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#21c45d", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#21c45d1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: "12px" }}>
                  Active Today
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  {summary?.activeToday || 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#21c45d", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#21c45d1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: "12px" }}>
                  Delivered Today
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  {summary?.deliveredToday || 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#f97415", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f974151a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: "12px" }}>
                  In Hand
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  {summary?.cylindersInHand || 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* DRIVER TABLE */}
      <Paper sx={{ borderRadius: 3, p: 2 }}>
        <Typography fontWeight="bold" mb={2} sx={{ fontSize: "16px" }}>
          All Drivers
        </Typography>

        {/* HEADER */}
        <Box
          display="flex"
          px={2}
          py={1.5}
          fontSize="14px"
          color="text.secondary"
          fontWeight={600}
          borderBottom="1px solid #e5e7eb"
        >
          <Box flex={1.2}>Name</Box>
          <Box flex={1}>Phone</Box>
          <Box flex={1}>Vehicle No.</Box>
          <Box flex={1}>Deliveries</Box>
          <Box flex={1}>In Hand</Box>
          <Box flex={1}>Rating</Box>
          <Box flex={1}>Status</Box>
        </Box>

        {/* BODY */}
        <Box
          ref={parentRef}
          sx={{ height: 400, overflow: "auto", position: "relative" }}
        >
          <Box sx={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const d = drivers[virtualRow.index];
              if (!d) return null;

              if (virtualRow.index >= drivers.length - 2 && hasNextPage) {
                fetchNextPage();
              }

              const pill = getStatusPill(d.status, d.is_available);

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
                    px: 2,
                    fontSize: "14px",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9",
                    bgcolor: "white",
                  }}
                >
                  <Box flex={1.2} fontWeight={500}>
                    {d.name}
                  </Box>

                  <Box flex={1}>{d.phone}</Box>

                  <Box flex={1}>{d.vehicle_number || "—"}</Box>

                  <Box flex={1}>{d.deliveriesToday}</Box>

                  <Box flex={1}>{d.inHand}</Box>

                  <Box flex={1}>⭐ {Number(d.rating || 0).toFixed(1)}</Box>

                  <Box flex={1}>
                    <Box
                      component="span"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        backgroundColor: pill.bg,
                        color: pill.color,
                      }}
                    >
                      {pill.label}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
