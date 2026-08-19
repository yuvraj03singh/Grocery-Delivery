import { prisma } from "../config/prisma.js";
const admin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()) : [];
        if (adminEmails.includes(user.email.toLowerCase())) {
            if (req.user)
                req.user.isAdmin = true;
            next();
        }
        else {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unauthorized",
            error: error.message
        });
    }
};
export default admin;
