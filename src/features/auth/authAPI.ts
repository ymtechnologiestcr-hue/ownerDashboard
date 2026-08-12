import axios from "../../utils/axiosInstance";

export const googleLoginAPI = (token: string) =>
  axios.post("/auth/google", { token });

export const phoneLoginAPI = (token: string) =>
  axios.post("/auth/phone", { token });

export const identifyAuthMethodAPI = (identifier: string) =>
  axios.post("/auth/identify", { identifier });

export const loginWithPasswordAPI = (identifier: string, password: string) =>
  axios.post("/auth/login/password", { identifier, password });

export const requestOtpLoginAPI = (identifier: string) =>
  axios.post("/auth/login/otp/request", { identifier });

export const verifyOtpLoginAPI = (identifier: string, otp: string) =>
  axios.post("/auth/login/otp/verify", { identifier, otp });