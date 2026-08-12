import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/dashboardLayout.css";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Header />
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;