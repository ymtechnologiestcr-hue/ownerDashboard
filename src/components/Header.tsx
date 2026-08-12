import { Box, Typography, InputBase, Avatar } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";

const Header = () => {
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
          Shree Ganesh Gas Agency
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
          <Typography fontSize={14}>Rajesh Kumar</Typography>
          <Typography variant="caption" color="text.secondary">
            Owner
          </Typography>
        </Box>

        <Avatar sx={{ bgcolor: "#2563eb" }}>RK</Avatar>
      </Box>
    </Box>
  );
};

export default Header;