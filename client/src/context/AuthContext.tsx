import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { toast } from "react-hot-toast/headless";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string, otp: string) => Promise<void>;
  loading: boolean;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The AuthProvider component wraps the application and provides global authentication state.
 * It manages the current user session, token storage, and provides methods to mutate auth state.
 * 
 * @param children - The child React components that will consume this context.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Authenticates the user with the backend API and updates local state on success.
   * Also enforces that the email domain is `@gmail.com`.
   * 
   * @param email - User's email address.
   * @param password - User's password.
   */
  const login = async (email: string, password: string) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast.error("Only @gmail.com email addresses are allowed");
      throw new Error("Invalid email domain");
    }
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      toast.success("Login successful");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
      throw error;
    }
  };
  /**
   * Sends an OTP verification code to the user's Gmail address.
   * 
   * @param email - The user's email address.
   */
  const sendOtp = async (email: string) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast.error("Only @gmail.com email addresses are allowed");
      throw new Error("Invalid email domain");
    }
    try {
      const { data } = await api.post("/auth/send-otp", { email });
      toast.success(data?.message || "Verification code sent to your email");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to send verification code");
      throw error;
    }
  };

  /**
   * Registers a new user account with the backend API.
   * Enforces the `@gmail.com` domain rule.
   * 
   * @param name - The user's full name.
   * @param email - The user's email address.
   * @param password - The user's password.
   * @param confirmPassword - The password confirmation.
   * @param otp - The 6-digit OTP code received in email.
   */
  const register = async (name: string, email: string, password: string, confirmPassword: string, otp: string) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast.error("Only @gmail.com email addresses are allowed");
      throw new Error("Invalid email domain");
    }
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        confirmPassword,
        otp,
      });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      toast.success("Registration successful");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
      throw error;
    }
  };

  /**
   * Clears the user session by removing tokens from local storage and resetting context state.
   * Redirects the user back to the login page.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/login");
  };
  /**
   * Updates the authenticated user's data in the React state and local storage.
   * 
   * @param userData - Partial user object containing the fields to update.
   */
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem("auth_user", JSON.stringify(updated));
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, token, login, sendOtp, register, loading, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume the AuthContext.
 * Must be used within a component wrapped by the `<AuthProvider>`.
 * 
 * @returns The authentication context value containing the user object and auth methods.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
