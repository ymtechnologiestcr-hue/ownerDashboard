import "../styles/login.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  identifyAuthMethodAPI,
  loginWithPasswordAPI,
  requestOtpLoginAPI,
  verifyOtpLoginAPI,
} from "../features/auth/authAPI";
import { setSession } from "../features/auth/authSlice";

type AuthStep = "IDENTIFIER" | "METHOD" | "PASSWORD" | "OTP";

type IdentifyResponse = {
  success: boolean;
  data?: {
    role?: string;
    masked?: string;
    availableMethods?: {
      password?: boolean;
      otp?: boolean;
    };
  };
  message?: string;
};

type LoginResponse = {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status?: string;
  };
  message?: string;
};

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<AuthStep>("IDENTIFIER");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [masked, setMasked] = useState("");
  const [availablePassword, setAvailablePassword] = useState(false);
  const [availableOtp, setAvailableOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && user?.role === "OWNER") {
      navigate("/");
    }
  }, [navigate, user]);

  const resolveErrorMessage = (err: any, fallback: string) => {
    return (
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  };

  const completeLogin = (payload: LoginResponse) => {
    if (!payload?.success || !payload?.token || !payload?.user) {
      setError("Invalid login response");
      return;
    }

    if (payload.user.role !== "OWNER") {
      setError("This dashboard is for OWNER role only.");
      return;
    }

    dispatch(
      setSession({
        token: payload.token,
        user: payload.user,
      })
    );
    navigate("/");
  };

  const handleIdentify = async () => {
    if (!identifier.trim()) {
      setError("Enter email or phone number");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await identifyAuthMethodAPI(identifier.trim());
      const data = (res.data || {}) as IdentifyResponse;

      if (!data.success) {
        setError(data.message || "Unable to identify user");
        return;
      }

      if (data.data?.role !== "OWNER") {
        setError("This dashboard is for OWNER role only.");
        return;
      }

      setMasked(data.data?.masked || "");
      setAvailablePassword(Boolean(data.data?.availableMethods?.password));
      setAvailableOtp(Boolean(data.data?.availableMethods?.otp));
      setStep("METHOD");
    } catch (err: any) {
      setError(resolveErrorMessage(err, "Unable to identify user"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password.trim()) {
      setError("Enter password");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await loginWithPasswordAPI(identifier.trim(), password.trim());
      completeLogin(res.data as LoginResponse);
    } catch (err: any) {
      setError(resolveErrorMessage(err, "Unable to login with password"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await requestOtpLoginAPI(identifier.trim());
      setStep("OTP");
    } catch (err: any) {
      setError(resolveErrorMessage(err, "Unable to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Enter OTP");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await verifyOtpLoginAPI(identifier.trim(), otp.trim());
      completeLogin(res.data as LoginResponse);
    } catch (err: any) {
      setError(resolveErrorMessage(err, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">📦</div>

        <h2 className="title">Owner Dashboard</h2>
        <p className="subtitle">Sign in with your OWNER account</p>

        {(step === "IDENTIFIER" || step === "METHOD" || step === "PASSWORD" || step === "OTP") && (
          <>
            <label className="auth-label">Email or Phone</label>
            <input
              className="auth-input"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={step !== "IDENTIFIER"}
              placeholder="Enter email or phone"
            />
          </>
        )}

        {step === "IDENTIFIER" && (
          <button className="otp-btn" onClick={handleIdentify} disabled={loading}>
            {loading ? "Please wait..." : "Continue"}
          </button>
        )}

        {step === "METHOD" && (
          <div className="auth-step">
            <p className="auth-info">Authenticate as {masked || "user"}</p>
            {availablePassword && (
              <button
                className="otp-btn"
                onClick={() => setStep("PASSWORD")}
                disabled={loading}
              >
                Login with Password
              </button>
            )}
            {availableOtp && (
              <button className="secondary-btn" onClick={handleSendOtp} disabled={loading}>
                {loading ? "Sending..." : "Login with OTP"}
              </button>
            )}
          </div>
        )}

        {step === "PASSWORD" && (
          <div className="auth-step">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
            <button className="otp-btn" onClick={handlePasswordLogin} disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
            <button className="link-btn" onClick={() => setStep("METHOD")} type="button">
              Back
            </button>
          </div>
        )}

        {step === "OTP" && (
          <div className="auth-step">
            <label className="auth-label">OTP</label>
            <input
              className="auth-input"
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter OTP"
            />
            <button className="otp-btn" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className="secondary-btn" onClick={handleSendOtp} type="button" disabled={loading}>
              Resend OTP
            </button>
            <button className="link-btn" onClick={() => setStep("METHOD")} type="button">
              Back
            </button>
          </div>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;