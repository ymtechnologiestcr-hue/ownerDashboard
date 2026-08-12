import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { googleLoginAPI, phoneLoginAPI } from "./authAPI";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

export const googleLogin = createAsyncThunk(
  "auth/google",
  async (token: string) => {
    const res = await googleLoginAPI(token);
    return res.data;
  }
);

export const phoneLogin = createAsyncThunk(
  "auth/phone",
  async (token: string) => {
    const res = await phoneLoginAPI(token);
    return res.data;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user") || "null"),
    token: localStorage.getItem("token"),
  } as AuthState,
  reducers: {
    setSession: (state, action: { payload: { token: string; user: AuthUser } }) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    clearSession: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(phoneLogin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      });
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;