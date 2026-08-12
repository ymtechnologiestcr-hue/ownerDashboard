import axios from "../utils/axiosInstance";

export type OwnerDashboardData = {
  success: boolean;
  message: string;
  data: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    totalSales: number;
    cylindersDelivered: number;
    cashPendingWithDrivers: number;
    stock: {
      domestic: number;
      commercial: number;
      total: number;
    };
    empty?: {
      domestic: number;
      commercial: number;
      total: number;
    };
    totalExpenses: number;
    paymentSummary?: {
      cashSales: number;
      gpaySales: number;
      onlineSales: number;
    };
    driverCollectionBreakdown?: Array<{
      driverId: number;
      driverName: string;
      totalSales: number;
      cash: number;
      gpay: number;
      deliveries: number;
    }>;
    recentSales?: Array<{
      orderId: string;
      customer: string;
      type: string;
      quantity: number;
      amount: number;
      payment: string;
      driver: string;
      status: string;
    }>;
  };
};

export const getOwnerDashboard = (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const queryString = params.toString();
  const url = queryString ? `/owner/dashboard?${queryString}` : "/owner/dashboard";

  return axios.get<OwnerDashboardData>(url);
};

export type SalesTrendPoint = {
  date: string;
  label: string;
  sales: number;
  delivered: number;
};

export type StockOverviewLevel = {
  current: number;
  total: number;
  low: boolean;
};

export type DriverCashRow = {
  driverId: number;
  driverName: string;
  cylinders: number;
  collected: number;
  settled: number;
  pending: number;
  status: "Settled" | "Pending" | "No Activity" | string;
};

export type RecentActivityItem = {
  type: "SETTLEMENT" | "STOCK" | "DELIVERY" | "EXPENSE" | "ORDER" | string;
  title: string;
  createdAt: string;
};

export type ExpenseBreakdownItem = {
  category: string;
  amount: number;
};

export type TopDriverItem = {
  driverId: number;
  driverName: string;
  deliveries: number;
};

export type OwnerDashboardInsights = {
  success: boolean;
  message: string;
  data: {
    dateRange: { startDate: string; endDate: string };
    salesTrend: { days: number; points: SalesTrendPoint[] };
    stockOverview: {
      domestic: StockOverviewLevel;
      commercial: StockOverviewLevel;
      empty: StockOverviewLevel;
    };
    driverCashTracking: DriverCashRow[];
    recentActivity: RecentActivityItem[];
    expenseBreakdown: { items: ExpenseBreakdownItem[]; total: number };
    topDrivers: TopDriverItem[];
  };
};

export const getOwnerDashboardInsights = (
  startDate?: string,
  endDate?: string,
  days?: number
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (days) params.append("days", String(days));

  const queryString = params.toString();
  const url = queryString
    ? `/owner/dashboard/insights?${queryString}`
    : "/owner/dashboard/insights";

  return axios.get<OwnerDashboardInsights>(url);
};

export type DashboardOverviewData = {
  success: boolean;
  data: {
    cards: {
      pendingComplaints: number;
      leakageComplaints: number;
      totalConnections: number;
      transferRequests: number;
      nameChangeRequests: number;
      pendingManagerVerification: number;
    };
    recentComplaints?: Array<Record<string, unknown>>;
  };
};

export const getDashboardOverview = () => {
  return axios.get<DashboardOverviewData>("/dashboard/overview");
};

export type JobAssignmentRole =
  | "GODOWN_MANAGER"
  | "PURCHASE_DRIVER"
  | "DELIVERY_AGENT"
  | "CASHIER"
  | "CUSTOMER_SERVICE"
  | "MANAGER";

export type OwnerJobAssignmentUser = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  role: JobAssignmentRole | string;
  roleLabel: string;
  systemRole: string;
  status: "ACTIVE" | "INACTIVE" | string;
  age: number | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  vehicleNumber: string | null;
  vehicleType: string | null;
  drivingLicenseNumber: string | null;
  aadhaarNumber: string | null;
  bankAccountHolderName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  createdAt: string;
};

export type OwnerJobAssignmentUsersResponse = {
  success: boolean;
  data: OwnerJobAssignmentUser[];
};

export type CreateOwnerJobAssignmentPayload = {
  role: JobAssignmentRole;
  fullName: string;
  phoneNumber: string;
  email: string;
  age?: number | string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  aadhaarNumber?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  drivingLicenseNumber?: string;
};

export const getOwnerJobAssignmentUsers = () => {
  return axios.get<OwnerJobAssignmentUsersResponse>("/owner/job-assignment/users");
};

export const createOwnerJobAssignmentUser = (
  payload: CreateOwnerJobAssignmentPayload
) => {
  return axios.post("/owner/job-assignment/users", payload);
};

export const updateOwnerJobAssignmentUserStatus = (
  userId: number,
  status: "ACTIVE" | "INACTIVE"
) => {
  return axios.patch(`/owner/job-assignment/users/${userId}/status`, { status });
};


export const updateOwnerJobAssignmentUser = (
  userId: number,
  payload: Partial<CreateOwnerJobAssignmentPayload>
) => {
  return axios.patch(`/owner/job-assignment/users/${userId}`, payload);
};
export const deleteOwnerJobAssignmentUser = (userId: number) => {
  return axios.delete(`/owner/job-assignment/users/${userId}`);
};
