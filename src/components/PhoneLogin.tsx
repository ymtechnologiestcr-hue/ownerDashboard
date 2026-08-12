import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { phoneLogin } from "../features/auth/authSlice";
import "../styles/login.css";

const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState<any>(null);

  const dispatch = useAppDispatch();

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha",
        { size: "invisible" }
      );
    }
  };

  const sendOTP = async () => {
    try {
      setupRecaptcha();

      const appVerifier = (window as any).recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        appVerifier
      );

      setConfirm(confirmation);
    } catch (err) {
      console.error("OTP send error", err);
    }
  };

  const verifyOTP = async () => {
    try {
      const result = await confirm.confirm(otp);
      const token = await result.user.getIdToken();

      dispatch(phoneLogin(token));
    } catch (err) {
      console.error("OTP verify error", err);
    }
  };

  return (
    <div className="phone-section">
      <label>Phone Number</label>

      <div className="phone-input">
        <div className="country-code">+91</div>
        <input
          type="text"
          placeholder="9876543210"
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {!confirm ? (
        <button className="otp-btn" onClick={sendOTP}>
          📞 Send OTP
        </button>
      ) : (
        <>
        <div className="phone-input">
          <input
            className="otp-input"
            placeholder="Enter OTP"
            onChange={(e) => setOtp(e.target.value)}
          />
          </div>

          <button className="otp-btn" onClick={verifyOTP}>
            Verify OTP
          </button>
        </>
      )}

      <div id="recaptcha"></div>
    </div>
  );
};

export default PhoneLogin;