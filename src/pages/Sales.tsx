import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Stack
} from "@mui/material";
import { useRef, useState } from "react";
import axios from "../utils/axiosInstance";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import DateRangePicker from "../components/DateRangePicker";

type RecentSale = {
  orderId: string;
  customer: string;
  type: string;
  quantity: number;
  amount: number;
  payment: string;
  driver: string;
  status: string;
};

const fetchSales = async ({
  pageParam = 1,
  startDate,
  endDate,
}: {
  pageParam?: number;
  startDate: string;
  endDate: string;
}) => {
  const res = await axios.get("/owner/sales/dashboard", {
    params: {
      page: pageParam,
      limit: 5,
      startDate,
      endDate,
    },
  });
  return res.data;
};


export default function Sales() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data, fetchNextPage, hasNextPage } =
    useInfiniteScroll({
      queryKey: ["sales", startDate, endDate],
      queryFn: ({ pageParam }: any) =>
        fetchSales({ pageParam, startDate, endDate })
    });

  const sales = data?.pages.flatMap((p: any) => p.data) ?? [];
  const summary = data?.pages?.[0]?.summary;
  const recentSales: RecentSale[] = data?.pages?.[0]?.recentSales ?? [];

  const formatCurrency = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getPaymentPillStyles = (payment: string) => {
    if (payment === "Cash") {
      return { bg: "#EDE9FE", color: "#4C1D95" };
    }

    if (payment === "GPay") {
      return { bg: "#E5E7EB", color: "#374151" };
    }

    if (payment === "Online") {
      return { bg: "#EEF2FF", color: "#3730A3" };
    }

    if (payment === "Mixed") {
      return { bg: "#FEF3C7", color: "#92400E" };
    }

    return { bg: "#F3F4F6", color: "#4B5563" };
  };

  const getStatusPillStyles = (status: string) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "DELIVERED") {
      return { bg: "#DBEAFE", color: "#1D4ED8", label: "Delivered" };
    }

    if (normalized === "CANCELLED") {
      return { bg: "#FEE2E2", color: "#B91C1C", label: "Cancelled" };
    }

    return { bg: "#E5E7EB", color: "#374151", label: "Pending" };
  };

  const rowVirtualizer = useVirtualizer({
    count: sales.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5
  });

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="600" mb={3}>
        Sales Management
      </Typography>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* 🔥 TOP CARDS */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "repeat(3,1fr)" }}
        gap={3}
        mb={4}
      >
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2463eb1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"></path><path d="M6 8h12"></path><path d="m6 13 8.5 8"></path><path d="M6 13h3"></path><path d="M9 13c6.667 0 6.667-10 0-10"></path></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  Cash Sales (In Hand)
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  ₹{Number(summary?.cash || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2463eb1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  GPay Sales
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  ₹{Number(summary?.gpay || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2463eb1a", borderRadius: "10px", width: 40, height: 40 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </Box>
              <Box>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  Online (Company Direct)
                </Typography>
                <Typography fontWeight="bold" sx={{ fontSize: "20px" }}>
                  ₹{Number(summary?.online || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* 🔥 TABLE */}
      <Paper sx={{ borderRadius: 3, p: 2 }}>
        <Typography fontWeight="bold" mb={2} sx={{ fontSize: "16px" }}>
          Driver-wise Collection Breakdown (Cash & GPay)
        </Typography>

        {/* HEADER */}
        <Box
          display="flex"
          px={2}
          py={1.5}
          fontWeight={600}
          fontSize="14px"
          color="text.secondary"
          borderBottom="1px solid #e5e7eb"
        >
          <Box flex={1.5}>Driver</Box>
          <Box flex={1}>Total Sales</Box>
          <Box flex={1}>Cash</Box>
          <Box flex={1}>GPay</Box>
          <Box flex={1}>Deliveries</Box>
        </Box>

        {/* BODY */}
        <Box
          ref={parentRef}
          sx={{ height: 400, overflow: "auto", position: "relative" }}
        >
          <Box
            sx={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative"
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const d = sales[virtualRow.index];
              if (!d) return null;

              // infinite scroll trigger
              if (
                virtualRow.index >= sales.length - 2 &&
                hasNextPage
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
                    px: 2,
                    fontSize: "14px",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <Box flex={1.5} fontWeight={500}>
                    {d.driver_name}
                  </Box>

                  <Box flex={1}>{formatCurrency(d.total)}</Box>
                  <Box flex={1}>{formatCurrency(d.cash)}</Box>
                  <Box flex={1}>{formatCurrency(d.gpay)}</Box>
                  <Box flex={1}>{d.deliveries}</Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 3, p: 2, mt: 2 }}>
        <Typography fontWeight="bold" mb={2} sx={{ fontSize: "16px" }}>
          Recent Sales
        </Typography>

        <Box
          display="flex"
          px={2}
          py={1.5}
          fontWeight={600}
          fontSize="14px"
          color="text.secondary"
          borderBottom="1px solid #e5e7eb"
        >
          <Box flex={1}>Order ID</Box>
          <Box flex={1.3}>Customer</Box>
          <Box flex={0.9}>Type</Box>
          <Box flex={0.7}>Qty</Box>
          <Box flex={1}>Amount</Box>
          <Box flex={0.9}>Payment</Box>
          <Box flex={1}>Driver</Box>
          <Box flex={0.9}>Status</Box>
        </Box>

        {recentSales.length ? (
          recentSales.map((sale) => {
            const paymentPill = getPaymentPillStyles(sale.payment);
            const statusPill = getStatusPillStyles(sale.status);

            return (
              <Box
                key={sale.orderId}
                display="flex"
                px={2}
                py={1.5}
                fontSize="14px"
                alignItems="center"
                borderBottom="1px solid #f1f5f9"
              >
                <Box flex={1} fontWeight={600}>{sale.orderId}</Box>
                <Box flex={1.3}>{sale.customer}</Box>
                <Box flex={0.9}>{sale.type}</Box>
                <Box flex={0.7}>{sale.quantity}</Box>
                <Box flex={1}>{formatCurrency(sale.amount)}</Box>
                <Box flex={0.9}>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.4,
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor: paymentPill.bg,
                      color: paymentPill.color,
                    }}
                  >
                    {sale.payment}
                  </Box>
                </Box>
                <Box flex={1}>{sale.driver}</Box>
                <Box flex={0.9}>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.4,
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor: statusPill.bg,
                      color: statusPill.color,
                    }}
                  >
                    {statusPill.label}
                  </Box>
                </Box>
              </Box>
            );
          })
        ) : (
          <Box px={2} py={2} color="text.secondary" fontSize="14px">
            No recent sales found for selected date range.
          </Box>
        )}
      </Paper>
    </Box>
  );
}