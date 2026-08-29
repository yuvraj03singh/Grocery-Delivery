import express, { Request, Response } from "express";
import { login, register, sendOtp } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/send-otp", sendOtp);
authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;