import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";




const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { id: string };

        req.user = {
            id: decoded.id
        };

        next();

    } catch (error: any) {
        console.error(error);

        return res.status(401).json({
            message: "Unauthorized",
            error: error.message
        });
    }
};

export default auth;
