import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "../utils/axiosInstance";

interface AgencyDetails {
  agencyName: string;
  ownerName: string;
  phone: string;
  email: string;
}

interface UserSettingsResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    created_at: string;
  };
}

const Settings: React.FC = () => {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = storedUser?.id;

  const [form, setForm] = useState<AgencyDetails>({
    agencyName: "",
    ownerName: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fetchSettings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get<UserSettingsResponse>(
        `/users/${userId}/settings`
      );

      const user = response.data.data;

      setForm({
        agencyName: user.company_name || "",
        ownerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) {
      alert("User not found in local storage");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.ownerName,
        company_name: form.agencyName,
        email: form.email || null,
        phone: form.phone,
      };

      const response = await axios.put(
        `/users/${userId}/settings`,
        payload
      );

      if (!response.data?.success) {
        throw new Error("Failed to update settings");
      }

      const updatedUser = {
        ...storedUser,
        id: userId,
        email: form.email || null,
        phone: form.phone,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Settings updated successfully");
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      alert(
        error?.response?.data?.message || "Error updating settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Settings
      </Typography>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          mb: 3,
          maxWidth: 760,
          boxShadow: "none",
        }}
      >
        <Typography fontWeight={700} mb={3}>
          Agency Details
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            label="Agency Name"
            name="agencyName"
            value={form.agencyName}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Owner Name"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            size="small"
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            size="small"
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          maxWidth: 760,
          boxShadow: "none",
        }}
      >
        <Typography fontWeight={700} mb={1}>
          Account
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Signed in as {form.email || storedUser?.phone || "Unknown User"}
        </Typography>

        <Button
          variant="contained"
          color="error"
          onClick={handleSignOut}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Sign Out
        </Button>
      </Paper>
    </Box>
  );
};

export default Settings;