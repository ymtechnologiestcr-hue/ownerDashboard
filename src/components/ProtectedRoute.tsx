import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAppSelector((state) => state.auth);

  const storedToken = localStorage.getItem("token");
  const storedUserRaw = localStorage.getItem("user");

  let storedUser: any = null;
  try {
    storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  } catch {
    storedUser = null;
  }

  const effectiveToken = token || storedToken;
  const effectiveUser = user || storedUser;

  if (!effectiveToken || !effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (effectiveUser.role !== "OWNER") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;