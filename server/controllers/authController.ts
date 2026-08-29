//Register 
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';




import sendEmail from '../config/nodemailer.js';

interface OtpRecord {
    otp: string;
    expiresAt: number;
}

const otpStore = new Map<string, OtpRecord>();

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * The token expires in 30 days.
 * 
 * @param id - The unique user ID to encode in the payload.
 * @returns A signed JWT string.
 */
const generateToken = (id: string) => {

    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '30d'
    });
}


/**
 * Checks if a given email belongs to an administrator.
 * Validates against a comma-separated list of ADMIN_EMAILS in the environment variables.
 * 
 * @param email - The email address to check.
 * @returns `true` if the email is an admin, `false` otherwise.
 */
const getAdminStatus = (email: string | null | undefined):
    boolean => {
    if (!email) {
        return false;
    }
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()) : [];
    return adminEmails.includes(email.toLowerCase());
}

/**
 * Sends a 6-digit OTP code to the specified @gmail.com address for account verification.
 * 
 * @param req - Express Request object containing `email` in body.
 * @param res - Express Response object.
 */
export const sendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ message: "Only @gmail.com email addresses are allowed" });
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase()
        }
    });
    if (existingUser) {
        return res.status(400).json({ message: "An account already exists with this email" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory for 10 minutes
    otpStore.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
        await sendEmail({
            to: email.toLowerCase(),
            subject: "Your Apna Bazar Verification Code",
            body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Apna Bazar</h1>
                    <p style="color: #dcfce7; margin: 8px 0 0 0; font-size: 14px;">Your Daily Grocery Partner</p>
                </div>
                <div style="padding: 32px 24px; text-align: center;">
                    <h2 style="color: #1e293b; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Email Verification Code</h2>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                        Thank you for registering with Apna Bazar. Use the verification code below to verify your email address and complete your signup.
                    </p>
                    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; display: inline-block;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #16a34a;">${otp}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Apna Bazar. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error: any) {
        console.error("Error sending verification OTP email:", error);
        res.status(500).json({ message: "Failed to send verification email. Please check your credentials or try again later." });
    }
};

/**
 * Registers a new customer user account with OTP verification.
 * 
 * Flow:
 * 1. Validates required fields, password match, and enforces `@gmail.com` domain restriction.
 * 2. Validates OTP code against the stored code.
 * 3. Checks if the user already exists in the database.
 * 4. Hashes the password using bcrypt.
 * 5. Creates the new user record in the database.
 * 6. Generates an auth token and sanitizes the user object (removes password) before responding.
 * 
 * @param req - Express Request object containing `name`, `email`, `password`, `confirmPassword`, and `otp` in body.
 * @param res - Express Response object.
 */
export const register = async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword, otp } = req.body;

    if (!name || !email || !password || !confirmPassword || !otp) {
        return res.status(400).json({ message: "Please provide all required fields including the verification code" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ message: "Only @gmail.com email addresses are allowed" });
    }

    // Verify OTP
    const record = otpStore.get(email.toLowerCase());
    if (!record || record.expiresAt < Date.now()) {
        return res.status(400).json({ message: "Verification code has expired or was not requested. Please request a new code." });
    }

    if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid verification code. Please check your email and try again." });
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase()
        }
    });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Clear used OTP
    otpStore.delete(email.toLowerCase());

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        }
    });

    const token = generateToken(user.id);
    const userData: any = { ...user }
    delete userData.password;
    userData.isAdmin = getAdminStatus(userData.email);
    res.status(201).json({ message: "User created successfully", user: userData, token });
}



/**
 * Authenticates an existing user and returns an access token.
 * 
 * Flow:
 * 1. Validates required fields and enforces `@gmail.com` domain restriction.
 * 2. Looks up the user by email (including their saved addresses).
 * 3. Compares the provided password against the hashed password.
 * 4. Generates a new auth token and sanitizes the user object.
 * 
 * @param req - Express Request object containing `email` and `password` in body.
 * @param res - Express Response object.
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ message: "Only @gmail.com email addresses are allowed" });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase()
        }, include: {
            addresses: true
        }
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    const userData: any = { ...user }
    delete userData.password;
    userData.isAdmin = getAdminStatus(userData.email);
    res.status(200).json({ message: "Login successful", user: userData, token });
}
