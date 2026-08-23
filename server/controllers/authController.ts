//Register 
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';




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
 * Registers a new customer user account.
 * 
 * Flow:
 * 1. Validates required fields and enforces `@gmail.com` domain restriction.
 * 2. Checks if the user already exists in the database.
 * 3. Hashes the password using bcrypt.
 * 4. Creates the new user record in the database.
 * 5. Generates an auth token and sanitizes the user object (removes password) before responding.
 * 
 * @param req - Express Request object containing `name`, `email`, and `password` in body.
 * @param res - Express Response object.
 */
export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please provide all required fields" });
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
        return res.status(400).json({ message: "User already exists" });
    }

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
