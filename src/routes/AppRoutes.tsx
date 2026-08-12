import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Sales from "../pages/Sales";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Drivers from "../pages/Drivers";
import Stocks from "../pages/Stocks";
import CashSettlement from "../pages/CashSettlement";
import ExpenseManagement from "../pages/Expense";
import CustomerIssues from "../pages/CustomerIssue";
import JobAssignment from "../pages/JobAssignment";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Sales />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Drivers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stocks"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Stocks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
                
        <Route
          path="/cash-settlement"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CashSettlement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/expense"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpenseManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-issue"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CustomerIssues />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-assignment"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <JobAssignment />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;