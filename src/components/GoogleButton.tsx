import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useAppDispatch } from "../app/hooks";
import { googleLogin } from "../features/auth/authSlice";
import "../styles/login.css";

const GoogleButton = () => {
  const dispatch = useAppDispatch();

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();

      dispatch(googleLogin(idToken));
    } catch (err) {
      console.error("Google login error", err);
    }
  };

  return (
    <button className="google-btn" onClick={handleGoogle}>
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="google"
      />
      Continue with Google
    </button>
  );
};

export default GoogleButton;