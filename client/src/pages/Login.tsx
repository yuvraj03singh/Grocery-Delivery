import { useState, useEffect } from "react";
import { heroSectionData } from "../assets/assets";
import { Link } from "react-router-dom";
import {
  BikeIcon,
  UserIcon,
  LockIcon,
  MailIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  HomeIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

type AuthMode = "login" | "register" | "forgot";

export const Login = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const { login, register, sendOtp, sendForgotPasswordOtp, resetPassword } = useAuth();

  useEffect(() => {
    if (otpTimer <= 0) return;

    const timer = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpTimer]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setOtpStep(false);
    setOtp("");
    setError("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSendRegisterOtp = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only @gmail.com email addresses are allowed");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpStep(true);
      setOtpTimer(60);
    } catch (error: any) {
      console.error("Send register OTP error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only @gmail.com email addresses are allowed");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await sendForgotPasswordOtp(email);
      setOtpStep(true);
      setOtpTimer(60);
    } catch (error: any) {
      console.error("Send forgot password OTP error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || sendingOtp) return;
    setError("");
    setSendingOtp(true);
    try {
      if (mode === "register") {
        await sendOtp(email);
      } else if (mode === "forgot") {
        await sendForgotPasswordOtp(email);
      }
      setOtpTimer(60);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to resend code. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (mode === "login") {
      setLoading(true);
      try {
        await login(email, password);
      } catch (error: any) {
        console.error("Login error:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Invalid credentials. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else if (mode === "register") {
      if (!otpStep) {
        await handleSendRegisterOtp();
      } else {
        if (!otp.trim() || otp.trim().length !== 6) {
          setError("Please enter a valid 6-digit verification code");
          return;
        }
        setLoading(true);
        try {
          await register(name, email, password, confirmPassword, otp.trim());
        } catch (error: any) {
          console.error("Registration error:", error);
          setError(
            error.response?.data?.message ||
              error.message ||
              "Registration failed. Please try again."
          );
        } finally {
          setLoading(false);
        }
      }
    } else if (mode === "forgot") {
      if (!otpStep) {
        await handleSendForgotOtp();
      } else {
        if (!otp.trim() || otp.trim().length !== 6) {
          setError("Please enter a valid 6-digit verification code");
          return;
        }
        if (!newPassword) {
          setError("Please enter a new password");
          return;
        }
        if (newPassword.length < 6) {
          setError("New password must be at least 6 characters");
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setError("Passwords do not match");
          return;
        }

        setLoading(true);
        try {
          await resetPassword(email, otp.trim(), newPassword, confirmNewPassword);
          setSuccessMessage("Password reset successfully! You can now sign in with your new password.");
          switchMode("login");
          setSuccessMessage("Password reset successfully! Please sign in with your new password.");
        } catch (error: any) {
          console.error("Reset password error:", error);
          setError(
            error.response?.data?.message ||
              error.message ||
              "Failed to reset password. Please verify the code and try again."
          );
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-app-cream dark:bg-zinc-950 relative">
      {/* Top Left Home Button */}
      <Link
        to="/"
        className="absolute top-5 left-5 z-20 flex items-center gap-2 px-4 py-2 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-full border border-app-border dark:border-zinc-800 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium transition-all group active:scale-95"
      >
        <HomeIcon className="size-4 text-app-orange group-hover:scale-110 transition-transform" />
        <span>Home</span>
      </Link>

      {/* Top right Dark Mode Toggle */}
      <div className="absolute top-5 right-5 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-1 rounded-full border border-app-border dark:border-zinc-800 shadow-sm hover:shadow transition-all">
        <ThemeToggle />
      </div>

      {/* Left side with image */}
      <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
        <img
          src={heroSectionData.hero_image}
          alt=""
          className="absolute inset-0 object-cover h-full bg-center opacity-10"
        />

        <div className="relative px-12 text-center">
          <h2 className="text-4xl font-semibold text-white mb-4">
            Welcome to Apna Bazar
          </h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Fresh groceries delivered to your doorstep in minutes.
          </p>
        </div>
      </div>

      {/* Right side with form */}
      <div className="flex-1 flex-center px-4 py-12 bg-app-cream dark:bg-zinc-950">
        <div className="max-w-md w-full">
          {/* Form header message */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-5 mb-4">
              <BikeIcon className="size-8 text-app-green dark:text-zinc-300" />
              <span className="text-2xl font-semibold text-app-green dark:text-zinc-100 mb-2">
                Apna Bazar
              </span>
            </Link>

            <h1 className="text-2xl font-semibold text-app-green dark:text-zinc-100 mb-2">
              {mode === "login"
                ? "Sign in to your account"
                : mode === "register"
                ? otpStep
                  ? "Verify your email address"
                  : "Sign up for a new account"
                : otpStep
                ? "Reset Your Password"
                : "Forgot Password"}
            </h1>

            <p className="text-sm dark:text-zinc-300">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                  >
                    Create one
                  </button>
                </>
              ) : mode === "register" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50 animate-fade-in">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 animate-fade-in">
                <CheckCircle2Icon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* OTP Verification Step for Register OR Forgot Password */}
            {otpStep ? (
              <div className="space-y-6">
                <div className="text-center bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                  <div className="size-14 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <ShieldCheckIcon className="size-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Enter Verification Code
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    We sent a 6-digit OTP code to{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {email}
                    </span>
                  </p>

                  <div className="mt-6 relative">
                    <KeyRoundIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-light size-5" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      autoFocus
                      required
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-11 pr-4 py-3 text-center tracking-widest text-xl font-mono font-semibold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-orange dark:focus:border-orange-500"
                    />
                  </div>

                  {/* If mode is forgot password, ask for new password right here */}
                  {mode === "forgot" && (
                    <div className="mt-5 space-y-4 text-left">
                      <div>
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-light size-4" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password (min 6 chars)"
                            className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-orange"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-light hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            {showNewPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-light size-4" />
                          <input
                            type={showConfirmNewPassword ? "text" : "password"}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            placeholder="Confirm your new password"
                            className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-orange"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-light hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            {showConfirmNewPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                      <ArrowLeftIcon className="size-3.5" /> Change Email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0 || sendingOtp}
                      className="inline-flex items-center gap-1 font-medium text-orange-500 hover:text-orange-600 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCwIcon
                        className={`size-3.5 ${sendingOtp ? "animate-spin" : ""}`}
                      />
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend Code"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-center w-full py-3 px-4 bg-app-orange hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-md"
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : mode === "forgot" ? (
                    "Verify OTP & Update Password"
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>
              </div>
            ) : (
              /* Regular Inputs (Sign In, Signup Details, or Forgot Password Email) */
              <>
                {mode === "register" && (
                  <label className="text-sm font-medium flex flex-col gap-1.5 dark:text-zinc-300">
                    Full Name
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-text-light size-5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter your full name"
                        className="w-full pl-11 pr-3 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-green dark:focus:border-emerald-500"
                      />
                    </div>
                  </label>
                )}

                <div className="space-y-5">
                  <label className="text-sm font-medium flex flex-col gap-1.5 dark:text-zinc-300">
                    Email address
                    <div className="relative">
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-text-light size-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your Gmail address (@gmail.com)"
                        className="w-full pl-11 pr-3 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-green dark:focus:border-emerald-500"
                      />
                    </div>
                  </label>
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium dark:text-zinc-300">
                        Password
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-text-light size-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="w-full pl-11 pr-12 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-green dark:focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-light hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-5" />
                        ) : (
                          <EyeIcon className="size-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "register" && (
                  <div className="space-y-5">
                    <label className="text-sm font-medium flex flex-col gap-1.5 dark:text-zinc-300">
                      Confirm Password
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-text-light size-5" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm your password"
                          className="w-full pl-11 pr-12 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-green dark:focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-light hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="size-5" />
                          ) : (
                            <EyeIcon className="size-5" />
                          )}
                        </button>
                      </div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-center w-full py-3.5 px-4 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md ${
                    mode === "forgot"
                      ? "bg-app-orange hover:bg-orange-600"
                      : "bg-app-green hover:bg-app-green-light"
                  }`}
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : mode === "login" ? (
                    "Sign In"
                  ) : mode === "register" ? (
                    "Verify Email & Continue"
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

