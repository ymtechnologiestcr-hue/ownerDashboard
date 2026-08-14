import "../styles/dashboardPage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DateRangePicker from "../components/DateRangePicker";
import {
  getOwnerDashboard,
  getDashboardOverview,
} from "../services/ownerService";
import DashboardInsights from "../components/DashboardInsights";

type DriverBreakdownRow = {
  driverId: number;
  driverName: string;
  totalSales: number;
  cash: number;
  gpay: number;
  deliveries: number;
};

type RecentSaleRow = {
  orderId: string;
  customer: string;
  type: string;
  quantity: number;
  amount: number;
  payment: string;
  driver: string;
  status: string;
};

type DashboardState = {
  totalSales: number;
  cylindersDelivered: number;
  cashPendingWithDrivers: number;
  stock: { domestic: number; commercial: number; total: number };
  systemStock: { domestic: number; commercial: number; total: number };
  empty: { domestic: number; commercial: number; total: number };
  totalExpenses: number;
  paymentSummary: {
    cashSales: number;
    gpaySales: number;
    onlineSales: number;
  };
  driverCollectionBreakdown: DriverBreakdownRow[];
  recentSales: RecentSaleRow[];
  totalConnections: number;
  customerIssuesTotal: number;
};

const initialDashboardState: DashboardState = {
  totalSales: 0,
  cylindersDelivered: 0,
  cashPendingWithDrivers: 0,
  stock: { domestic: 0, commercial: 0, total: 0 },
  systemStock: { domestic: 0, commercial: 0, total: 0 },
  empty: { domestic: 0, commercial: 0, total: 0 },
  totalExpenses: 0,
  paymentSummary: {
    cashSales: 0,
    gpaySales: 0,
    onlineSales: 0,
  },
  driverCollectionBreakdown: [],
  recentSales: [],
  totalConnections: 0,
  customerIssuesTotal: 0,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date state - initialize with today
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardState>(
    initialDashboardState,
  );

  console.log(dashboardData, "checking databoard data");

  // Fetch dashboard data
  const fetchDashboardData = async (start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch main dashboard data and overview data in parallel
      const [dashboardResponse, overviewResponse] = await Promise.all([
        getOwnerDashboard(start, end),
        getDashboardOverview(),
      ]);

      if (dashboardResponse.data?.data) {
        const data = dashboardResponse.data.data;
        const overviewData = overviewResponse.data?.data || {};

        setDashboardData({
          totalSales: Number(data.totalSales || 0),
          cylindersDelivered: Number(data.cylindersDelivered || 0),
          cashPendingWithDrivers: Number(data.cashPendingWithDrivers || 0),
          stock: {
            domestic: Number(data.stock?.domestic || 0),
            commercial: Number(data.stock?.commercial || 0),
            total: Number(data.stock?.total || 0),
          },
          systemStock: {
            domestic: Number(data.systemStock?.domestic || 0),
            commercial: Number(data.systemStock?.commercial || 0),
            total: Number(data.systemStock?.total || 0),
          },
          empty: {
            domestic: Number(data.empty?.domestic || 0),
            commercial: Number(data.empty?.commercial || 0),
            total: Number(data.empty?.total || 0),
          },
          totalExpenses: Number(data.totalExpenses || 0),
          paymentSummary: {
            cashSales: Number(data.paymentSummary?.cashSales || 0),
            gpaySales: Number(data.paymentSummary?.gpaySales || 0),
            onlineSales: Number(data.paymentSummary?.onlineSales || 0),
          },
          driverCollectionBreakdown: Array.isArray(
            data.driverCollectionBreakdown,
          )
            ? data.driverCollectionBreakdown
            : [],
          recentSales: Array.isArray(data.recentSales) ? data.recentSales : [],
          totalConnections: Number(overviewData.cards?.totalConnections || 0),
          customerIssuesTotal: Number(
            overviewData.cards?.pendingComplaints || 0,
          ),
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dates change
  useEffect(() => {
    fetchDashboardData(startDate, endDate);
  }, [startDate, endDate]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const dateRangeLabel =
    startDate === endDate
      ? new Date(startDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : `${new Date(startDate).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })} - ${new Date(endDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2 className="page-title">Agency Overview: {dateRangeLabel}</h2>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading dashboard data...</div>
      ) : (
        <>
          {/* 8 CARD GRID */}
          <div className="dashboard-cards-grid">
            {/* Card 1: Total Sales */}
            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/sales")}
            >
              <div className="card-icon blue-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" x2="12" y1="2" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <p className="card-label">Total Sales Today</p>
              <h2 className="card-value">
                {formatCurrency(dashboardData.totalSales)}
              </h2>
              {/* <div className="card-breakdown">
                <span className="breakdown-item">
                  Cash{" "}
                  <span className="amount">
                    {formatCurrency(dashboardData.paymentSummary.cashSales)}
                  </span>
                </span>
                <span className="breakdown-item">
                  GPay{" "}
                  <span className="amount">
                    {formatCurrency(dashboardData.paymentSummary.gpaySales)}
                  </span>
                </span>
                <span className="breakdown-item">
                  Online{" "}
                  <span className="amount">
                    {formatCurrency(dashboardData.paymentSummary.onlineSales)}
                  </span>
                </span>
              </div> */}
            </div>

            {/* Card 2: Cylinders Delivered */}
            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/drivers")}
            >
              <div className="card-icon green-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
                  <path d="M12 22V12"></path>
                  <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path>
                  <path d="m7.5 4.27 9 5.15"></path>
                </svg>
              </div>
              <p className="card-label">Cylinders Delivered Today</p>
              <h2 className="card-value">{dashboardData.cylindersDelivered}</h2>
              <div className="card-breakdown">
                {/* <span className="breakdown-item">
                  Delivered:{" "}
                  <span className="amount">
                    {dashboardData.cylindersDelivered}
                  </span>
                </span>
                <span className="breakdown-item">
                  In Hand: <span className="amount">13</span>
                </span> */}
              </div>
            </div>

            {/* Card 3: Empty Cylinders */}
            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/stocks")}
            >
              <div className="card-icon blue-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <p className="card-label">Empty Cylinders</p>
              <h2 className="card-value">{dashboardData.empty.total}</h2>
              <div className="card-breakdown">
                <span className="breakdown-item">
                  Domestic:{" "}
                  <span className="amount">{dashboardData.empty.domestic}</span>
                </span>
                <span className="breakdown-item">
                  Commercial:{" "}
                  <span className="amount">
                    {dashboardData.empty.commercial}
                  </span>
                </span>
              </div>
            </div>

            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/cash-settlement")}
            >
              <div className="card-icon orange-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                </svg>
              </div>
              <p className="card-label">Cash Pending With Drivers</p>
              <h2 className="card-value">
                {formatCurrency(dashboardData.cashPendingWithDrivers)}
              </h2>
              <div className="card-breakdown">
                {/* <span className="breakdown-item">
                  Collected:{" "}
                  <span className="amount">
                    {formatCurrency(totalCollected)}
                  </span>
                </span> */}
                {/* <span className="breakdown-item">
                  Settled:{" "}
                  <span className="amount">{formatCurrency(totalSettled)}</span>
                </span> */}
              </div>
            </div>

            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/stocks")}
            >
              <div className="card-icon purple-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                  <path d="m3.3 7 8.7 5 8.7-5"></path>
                  <path d="M12 22V12"></path>
                </svg>
              </div>
              <p className="card-label">Total Stock Available</p>
              <h2 className="card-value">{dashboardData.stock.total}</h2>
              <div className="card-breakdown">
                <span className="breakdown-item">
                  Domestic:{" "}
                  <span className="amount">{dashboardData.stock.domestic}</span>
                </span>
                <span className="breakdown-item">
                  Commercial:{" "}
                  <span className="amount">
                    {dashboardData.stock.commercial}
                  </span>
                </span>
              </div>
            </div>

            {/* Card: System Stock Available */}
            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/stocks")}
            >
              <div className="card-icon purple-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <p className="card-label">System Stock Available</p>
              <h2 className="card-value">{dashboardData.systemStock.total}</h2>
            </div>

            {/* Card 6: Today's Expenses */}
            <div
              className="dashboard-card clickable"
              onClick={() => navigate("/expense")}
            >
              <div className="card-icon red-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                  <polyline points="16 17 22 17 22 11"></polyline>
                </svg>
              </div>
              <p className="card-label">Today's Expenses</p>
              <h2 className="card-value">
                {formatCurrency(dashboardData.totalExpenses)}
              </h2>
              <div className="card-breakdown">
                <span className="breakdown-item">Driver + Office expenses</span>
              </div>
            </div>

            {/* Card 7: Total Connections (NO REDIRECT) */}
            <div className="dashboard-card">
              <div className="card-icon blue-user-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p className="card-label">Total Connections</p>
              <h2 className="card-value">{dashboardData.totalConnections}</h2>
              <div className="card-breakdown">
                <span className="breakdown-item">
                  New connections this period
                </span>
              </div>
              {/* <p className="card-metric growth">📈 Connections active</p> */}
            </div>

            {/* Card 8: Customer Issues (NO REDIRECT) */}
            <div className="dashboard-card">
              <div className="card-icon warning-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
              </div>
              <p className="card-label">Customer Issues</p>
              <h2 className="card-value">
                {dashboardData.customerIssuesTotal}
              </h2>
              <div className="card-breakdown">
                <span className="breakdown-item">
                  Pending complaints and complaints
                </span>
              </div>
              <p className="card-metric neutral">➖ Under review</p>
            </div>
          </div>

          {/* SALES / STOCK / DRIVER CASH / RECENT ACTIVITY */}
          <DashboardInsights startDate={startDate} endDate={endDate} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
