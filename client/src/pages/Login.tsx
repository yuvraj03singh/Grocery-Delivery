import { useState, useEffect } from "react";
import { heroSectionData } from "../assets/assets";
import { Link } from "react-router";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export const Login = () => {
  const [isLoginState, setIsLoginState] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, sendOtp } = useAuth();

  useEffect(() => {
    if (otpTimer <= 0) return;

    const timer = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpTimer]);

  const handleSendOtp = async () => {
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
      console.error("Send OTP error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to send verification code. Please try again."
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
      await sendOtp(email);
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

    if (isLoginState) {
      setLoading(true);
      try {
        await login(email, password);
      } catch (error: any) {
        console.error("Login error:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "An error occurred. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      if (!otpStep) {
        await handleSendOtp();
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
    }
  };

  const switchMode = (isLogin: boolean) => {
    setIsLoginState(isLogin);
    setOtpStep(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen flex bg-app-cream dark:bg-zinc-950 relative">
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
            Welcome back to Apna Bazar
          </h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Fresh groceries delivered to your doorstep.
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
              {isLoginState
                ? "Sign in to your account"
                : otpStep
                ? "Verify your email address"
                : "Sign up for a new account"}
            </h1>

            <p className="dark:text-zinc-300">
              {isLoginState
                ? "Don't have an account? "
                : otpStep
                ? "Almost done! "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(!isLoginState)}
                className="text-orange-500 ml-1 font-semibold hover:text-orange-600 transition-colors"
              >
                {isLoginState ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50 animate-fade-in">
                {error}
              </div>
            )}

            {/* OTP Verification Step */}
            {!isLoginState && otpStep ? (
              <div className="space-y-6">
                <div className="text-center bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                  <div className="size-14 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
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
                      className="w-full pl-11 pr-4 py-3 text-center tracking-widest text-xl font-mono font-semibold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all outline-none focus:border-app-green dark:focus:border-emerald-500"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                      <ArrowLeftIcon className="size-3.5" /> Edit details
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
                  className="flex-center w-full py-3 px-4 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>
              </div>
            ) : (
              /* Regular Inputs (Sign In or Signup Details) */
              <>
                {!isLoginState && (
                  <label className="text-lg flex flex-col gap-1 dark:text-zinc-300">
                    Name
                    <div className="relative">
                      <UserIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-app-text-light" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter your name"
                        className="w-full pl-15 pr-3 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all"
                      />
                    </div>
                  </label>
                )}

                <div className="space-y-5">
                  <label className="text-lg flex flex-col gap-1 dark:text-zinc-300">
                    Email address
                    <div className="relative">
                      <MailIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-app-text-light" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your Gmail address"
                        className="w-full pl-15 pr-3 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all"
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-5">
                  <label className="text-lg flex flex-col gap-1 dark:text-zinc-300">
                    Password
                    <div className="relative">
                      <LockIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-app-text-light" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="w-full pl-15 pr-12 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all"
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
                  </label>
                </div>

                {!isLoginState && (
                  <div className="space-y-5">
                    <label className="text-lg flex flex-col gap-1 dark:text-zinc-300">
                      Confirm Password
                      <div className="relative">
                        <LockIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-app-text-light" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm your password"
                          className="w-full pl-15 pr-12 py-3 text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border not-focus:border-app-border dark:border-zinc-700 transition-all"
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
                  className="flex-center w-full py-3 px-4 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : isLoginState ? (
                    "Sign In"
                  ) : (
                    "Verify Email & Continue"
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
