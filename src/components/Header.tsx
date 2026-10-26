import { Box, Typography, InputBase, Avatar } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useEffect, useState } from "react";
import { useAppSelector } from "../app/hooks";
import axios from "../utils/axiosInstance";

const Header = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [fetchedAgencyName, setFetchedAgencyName] = useState<string>("");

  useEffect(() => {
    // If not already in user state, fetch settings to get agency details
    const loadAgency = async () => {
      const stored = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
          return null;
        }
      })();

      const agency =
        user?.agency_name ||
        user?.company_name ||
        stored?.agency_name ||
        stored?.company_name;

      if (agency) {
        setFetchedAgencyName(agency);
        return;
      }

      const uid = user?.id || stored?.id;
      if (uid) {
        try {
          const res = await axios.get(`/users/${uid}/settings`);
          const data = res.data?.data;
          const name = data?.agency_name || data?.company_name || "";
          if (name) {
            setFetchedAgencyName(name);
          }
        } catch {
          // fallback gracefully
        }
      }
    };

    loadAgency();

    const handleStorageChange = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        if (stored?.agency_name || stored?.company_name) {
          setFetchedAgencyName(stored.agency_name || stored.company_name);
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const displayAgencyName =
    fetchedAgencyName ||
    user?.agency_name ||
    user?.company_name ||
    "Gas Agency";

  const displayName = user?.name || "Owner";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "OW";

  return (
    <Box
      sx={{
        height: 64,
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        backgroundColor: "#fff",
      }}
    >
      {/* LEFT */}
      <Box>
        <Typography fontWeight={600}>
          {displayAgencyName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Owner Dashboard
        </Typography>
      </Box>

      {/* SEARCH */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          background: "#f1f5f9",
          px: 2,
          py: 0.5,
          borderRadius: 2,
          width: 350,
        }}
      >
        <SearchIcon sx={{ fontSize: 18, mr: 1 }} />
        <InputBase placeholder="Search customers, drivers, orders..." />
      </Box>

      {/* RIGHT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2">📅 Today</Typography>

        <NotificationsIcon />

        <Box sx={{ textAlign: "right" }}>
          <Typography fontSize={14}>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "Owner"}
          </Typography>
        </Box>

        <Avatar sx={{ bgcolor: "#2563eb" }}>{userInitials}</Avatar>
      </Box>
    </Box>
  );
};

export default Header;