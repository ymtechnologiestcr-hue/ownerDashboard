import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOwnerJobAssignmentUser,
  getOwnerJobAssignmentUsers,
  updateOwnerJobAssignmentUserStatus,
  updateOwnerJobAssignmentUser,
  deleteOwnerJobAssignmentUser,
  type CreateOwnerJobAssignmentPayload,
  type JobAssignmentRole,
  type OwnerJobAssignmentUser,
} from "../services/ownerService";

const ROLE_OPTIONS: Array<{ value: JobAssignmentRole; label: string }> = [
  { value: "GODOWN_MANAGER", label: "Godown Manager" },
  { value: "PURCHASE_DRIVER", label: "Purchase Driver" },
  { value: "DELIVERY_AGENT", label: "Delivery Agent" },
  { value: "CASHIER", label: "Cashier" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service" },
  { value: "MANAGER", label: "Manager" },
];

const VEHICLE_TYPE_OPTIONS = [
  "Bike",
  "Scooter",
  "Auto",
  "Van",
  "Truck",
  "Other",
];

const isVehicleRole = (role: string) =>
  role === "PURCHASE_DRIVER" || role === "DELIVERY_AGENT";

type FormState = {
  role: JobAssignmentRole;
  fullName: string;
  phoneNumber: string;
  email: string;
  age: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  aadhaarNumber: string;
  bankAccountHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  vehicleNumber: string;
  vehicleType: string;
  drivingLicenseNumber: string;
};

const initialForm: FormState = {
  role: "GODOWN_MANAGER",
  fullName: "",
  phoneNumber: "",
  email: "",
  age: "",
  dateOfBirth: "",
  gender: "MALE",
  address: "",
  aadhaarNumber: "",
  bankAccountHolderName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfscCode: "",
  vehicleNumber: "",
  vehicleType: "",
  drivingLicenseNumber: "",
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN");
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}> = ({ title, value, icon, bgColor }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      p: 2,
      borderRadius: 3,
      border: "1px solid #e5e7eb",
      backgroundColor: "#f8fafc",
      minWidth: 260,
      display: "flex",
      gap: 2,
      alignItems: "center",
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
      }}
    >
      {icon}
    </Box>

    <Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: "12px", lineHeight: "16px" }}
      >
        {title}
      </Typography>
      <Typography
        fontWeight={700}
        sx={{ fontSize: "20px", lineHeight: "28px" }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const USERS_GRID_COLUMNS = "2fr 1.4fr 1.4fr 1.2fr 1fr 1.8fr 1.6fr";

const UsersTable: React.FC<{
  users: OwnerJobAssignmentUser[];
  onEdit: (user: OwnerJobAssignmentUser) => void;
  onDelete: (user: OwnerJobAssignmentUser) => void;
}> = ({ users, onEdit, onDelete }) => {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "ACTIVE" | "INACTIVE";
    }) => updateOwnerJobAssignmentUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-job-assignment-users"],
      });
    },
  });

  return (
    <Paper
      sx={{ border: "1px solid #e5e7eb", borderRadius: 3, overflow: "hidden" }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
        <Typography fontWeight={700}>Users</Typography>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 1180 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: USERS_GRID_COLUMNS,
              gap: 2,
              px: 2,
              py: 1.5,
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            <Box>User</Box>
            <Box>Role</Box>
            <Box>System Role</Box>
            <Box>Status</Box>
            <Box>Phone</Box>
            <Box>Created At</Box>
            <Box textAlign="center">Action</Box>
          </Box>

          {users.length ? (
            users.map((user) => {
              const isSaving =
                statusMutation.isPending &&
                statusMutation.variables?.id === user.id;
              const isActive = user.status === "ACTIVE";

              return (
                <Box
                  key={user.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: USERS_GRID_COLUMNS,
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{user.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email || "No email"}
                    </Typography>
                  </Box>
                  <Box>{user.roleLabel}</Box>
                  <Box>
                    <Chip
                      label={user.systemRole}
                      size="small"
                      sx={{
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                  </Box>
                  <Box>
                    <Chip
                      label={isActive ? "Active" : "Inactive"}
                      color={isActive ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box>{user.phoneNumber || "-"}</Box>
                  <Box>{formatDateTime(user.createdAt)}</Box>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={isActive ? "outlined" : "contained"}
                      color={isActive ? "error" : "success"}
                      disabled={isSaving}
                      onClick={() =>
                        statusMutation.mutate({
                          id: user.id,
                          status: isActive ? "INACTIVE" : "ACTIVE",
                        })
                      }
                      sx={{ textTransform: "none", minWidth: 84 }}
                    >
                      {isSaving ? "..." : isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <IconButton size="small" onClick={() => onEdit(user)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(user)}>
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              No users created yet.
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const JobAssignment: React.FC = () => {
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<OwnerJobAssignmentUser | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["owner-job-assignment-users"],
    queryFn: async () => {
      const response = await getOwnerJobAssignmentUsers();
      return response.data;
    },
  });

  const users = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: CreateOwnerJobAssignmentPayload) => {
      const response = await createOwnerJobAssignmentUser(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-job-assignment-users"],
      });
      setOpenModal(false);
      setForm(initialForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<CreateOwnerJobAssignmentPayload> }) => {
      const response = await updateOwnerJobAssignmentUser(id, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-job-assignment-users"],
      });
      setOpenModal(false);
      setIsEditMode(false);
      setEditingUserId(null);
      setForm(initialForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteOwnerJobAssignmentUser(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-job-assignment-users"],
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const createdToday = users.filter((user) =>
      String(user.createdAt || "").startsWith(today),
    ).length;

    const activeUsers = users.filter((user) => user.status === "ACTIVE").length;

    return {
      createdToday,
      activeUsers,
      completed: 0,
    };
  }, [users]);

  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (user: OwnerJobAssignmentUser) => {
    setForm({
      role: (user.role as JobAssignmentRole) || "GODOWN_MANAGER",
      fullName: user.fullName || "",
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
      age: user.age ? String(user.age) : "",
      dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "MALE",
      address: user.address || "",
      aadhaarNumber: user.aadhaarNumber || "",
      bankAccountHolderName: user.bankAccountHolderName || "",
      bankName: user.bankName || "",
      bankAccountNumber: user.bankAccountNumber || "",
      bankIfscCode: user.bankIfscCode || "",
      vehicleNumber: user.vehicleNumber || "",
      vehicleType: user.vehicleType || "",
      drivingLicenseNumber: user.drivingLicenseNumber || "",
    });
    setEditingUserId(user.id);
    setIsEditMode(true);
    setOpenModal(true);
  };

  const handleDeleteClick = (user: OwnerJobAssignmentUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCreateNew = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setEditingUserId(null);
    setOpenModal(true);
  };

  const onSubmit = () => {
    if (
      !form.fullName.trim() ||
      !form.phoneNumber.trim() ||
      !form.email.trim()
    ) {
      return;
    }

    const payload: CreateOwnerJobAssignmentPayload = {
      role: form.role,
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      age: form.age.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender,
      address: form.address.trim() || undefined,
      aadhaarNumber: form.aadhaarNumber.trim() || undefined,
      bankAccountHolderName: form.bankAccountHolderName.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      bankAccountNumber: form.bankAccountNumber.trim() || undefined,
      bankIfscCode: form.bankIfscCode.trim() || undefined,
      vehicleNumber: form.vehicleNumber.trim() || undefined,
      vehicleType: form.vehicleType || undefined,
      drivingLicenseNumber: form.drivingLicenseNumber.trim() || undefined,
    };

    if (isEditMode && editingUserId) {
      updateMutation.mutate({ id: editingUserId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            fontWeight={700}
            sx={{ fontSize: "18px", lineHeight: "24px" }}
          >
            Job Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create users by role and manage assignment-ready team members
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddAltOutlinedIcon />}
          onClick={handleCreateNew}
        >
          Assign New Job
        </Button>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <StatCard
          title="Total Jobs Today"
          value={String(summary.createdToday)}
          bgColor="#dbeafe"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#2563eb" }}
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <path d="M12 11h4"></path>
              <path d="M12 16h4"></path>
              <path d="M8 11h.01"></path>
              <path d="M8 16h.01"></path>
            </Box>
          }
        />
        <StatCard
          title="Employees Assigned"
          value={String(summary.activeUsers)}
          bgColor="#dcfce7"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#16a34a" }}
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </Box>
          }
        />
        <StatCard
          title="Completed"
          value={String(summary.completed)}
          bgColor="#f1f5f9"
          icon={
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 20, height: 20, color: "#64748b" }}
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <path d="M12 11h4"></path>
              <path d="M12 16h4"></path>
              <path d="M8 11h.01"></path>
              <path d="M8 16h.01"></path>
            </Box>
          }
        />
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Paper sx={{ p: 2, border: "1px solid #fee2e2", color: "#b91c1c" }}>
          {(error as Error)?.message || "Failed to load users"}
        </Paper>
      ) : (
        <UsersTable users={users} onEdit={handleEdit} onDelete={handleDeleteClick} />
      )}

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>{isEditMode ? "Edit Job Assignment" : "Assign New Job"}</DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="job-role-label">Role / Job</InputLabel>
              <Select
                labelId="job-role-label"
                label="Role / Job"
                value={form.role}
                onChange={(e) =>
                  updateForm("role", e.target.value as JobAssignmentRole)
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography fontWeight={600} fontSize={14}>
              Personal Details
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Full Name"
                fullWidth
                value={form.fullName}
                onChange={(e) => updateForm("fullName", e.target.value)}
              />
              <TextField
                size="small"
                label="Phone Number"
                fullWidth
                value={form.phoneNumber}
                onChange={(e) => updateForm("phoneNumber", e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Age"
                fullWidth
                value={form.age}
                onChange={(e) => updateForm("age", e.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.dateOfBirth}
                onChange={(e) => updateForm("dateOfBirth", e.target.value)}
              />
            </Stack>

            <FormControl>
              <Typography fontSize={13} color="text.secondary" mb={0.5}>
                Gender
              </Typography>
              <RadioGroup
                row
                value={form.gender}
                onChange={(e) =>
                  updateForm(
                    "gender",
                    e.target.value as "MALE" | "FEMALE" | "OTHER",
                  )
                }
              >
                <FormControlLabel
                  value="MALE"
                  control={<Radio size="small" />}
                  label="Male"
                />
                <FormControlLabel
                  value="FEMALE"
                  control={<Radio size="small" />}
                  label="Female"
                />
                <FormControlLabel
                  value="OTHER"
                  control={<Radio size="small" />}
                  label="Other"
                />
              </RadioGroup>
            </FormControl>

            <TextField
              size="small"
              label="Address"
              multiline
              minRows={2}
              value={form.address}
              onChange={(e) => updateForm("address", e.target.value)}
            />

            <TextField
              size="small"
              label="Aadhar Number"
              value={form.aadhaarNumber}
              onChange={(e) => updateForm("aadhaarNumber", e.target.value)}
            />

            {isVehicleRole(form.role) && (
              <>
                <Typography fontWeight={600} fontSize={14}>
                  Vehicle Details
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    size="small"
                    label="Vehicle Number"
                    fullWidth
                    value={form.vehicleNumber}
                    onChange={(e) =>
                      updateForm("vehicleNumber", e.target.value)
                    }
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel id="vehicle-type-label">
                      Vehicle Type
                    </InputLabel>
                    <Select
                      labelId="vehicle-type-label"
                      label="Vehicle Type"
                      value={form.vehicleType}
                      onChange={(e) =>
                        updateForm("vehicleType", e.target.value)
                      }
                    >
                      {VEHICLE_TYPE_OPTIONS.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <TextField
                  size="small"
                  label="Driving License Number"
                  value={form.drivingLicenseNumber}
                  onChange={(e) =>
                    updateForm("drivingLicenseNumber", e.target.value)
                  }
                />
              </>
            )}

            <Typography fontWeight={600} fontSize={14}>
              Bank Account Details
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Account Holder Name"
                fullWidth
                value={form.bankAccountHolderName}
                onChange={(e) =>
                  updateForm("bankAccountHolderName", e.target.value)
                }
              />
              <TextField
                size="small"
                label="Bank Name"
                fullWidth
                value={form.bankName}
                onChange={(e) => updateForm("bankName", e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Account Number"
                fullWidth
                value={form.bankAccountNumber}
                onChange={(e) =>
                  updateForm("bankAccountNumber", e.target.value)
                }
              />
              <TextField
                size="small"
                label="IFSC Code"
                fullWidth
                value={form.bankIfscCode}
                onChange={(e) => updateForm("bankIfscCode", e.target.value)}
              />
            </Stack>

            <TextField
              size="small"
              label="Email"
              required
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />

            {createMutation.isError && (
              <Typography color="error" fontSize={14}>
                {(createMutation.error as Error)?.message ||
                  "Unable to create user"}
              </Typography>
            )}
            {updateMutation.isError && (
              <Typography color="error" fontSize={14}>
                {(updateMutation.error as Error)?.message ||
                  "Unable to update user"}
              </Typography>
            )}

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                onClick={() => setOpenModal(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !form.fullName.trim() ||
                  !form.phoneNumber.trim() ||
                  !form.email.trim()
                }
              >
                {isEditMode
                  ? updateMutation.isPending
                    ? "Saving..."
                    : "Save Changes"
                  : createMutation.isPending
                    ? "Assigning..."
                    : "Assign Job"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {userToDelete?.fullName}? This action cannot be undone.
          </Typography>
          {deleteMutation.isError && (
            <Typography color="error" fontSize={14} mt={1}>
              {(deleteMutation.error as Error)?.message || "Failed to delete user"}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobAssignment;
