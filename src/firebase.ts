import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "YOUR_KEY",
//   authDomain: "YOUR_DOMAIN",
//   projectId: "YOUR_ID",
//   appId: "YOUR_APP_ID",
// };


const firebaseConfig = {
  apiKey: "AIzaSyCzt1faOKjQQ-V-8poa0gX99XQZIBvc_GM",
  authDomain: "lpg-auth-e8a27.firebaseapp.com",
  projectId: "lpg-auth-e8a27",
  storageBucket: "lpg-auth-e8a27.firebasestorage.app",
  messagingSenderId: "50993383474",
  appId: "1:50993383474:web:93a47a2675bc9701a6942b",
  measurementId: "G-H0TMP7JHCN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCzt1faOKjQQ-V-8poa0gX99XQZIBvc_GM",
//   authDomain: "lpg-auth-e8a27.firebaseapp.com",
//   projectId: "lpg-auth-e8a27",
//   storageBucket: "lpg-auth-e8a27.firebasestorage.app",
//   messagingSenderId: "50993383474",
//   appId: "1:50993383474:web:93a47a2675bc9701a6942b",
//   measurementId: "G-H0TMP7JHCN"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);