import express from "express";
import { login, register, sendOtp, forgotPasswordSendOtp, resetPassword } from "../controllers/authController.js";
const authRouter = express.Router();
authRouter.post("/send-otp", sendOtp);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password/send-otp", forgotPasswordSendOtp);
authRouter.post("/forgot-password/reset", resetPassword);
export default authRouter;
