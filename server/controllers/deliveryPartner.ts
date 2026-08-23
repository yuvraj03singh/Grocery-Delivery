import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const generateToken = (id: string) => {
    return jwt.sign({ id, role: "delivery" }, process.env.JWT_SECRET as string, { expiresIn: "30d" })

}
/**
 * Authenticates a delivery partner and returns a JWT.
 * 
 * Flow:
 * 1. Validates required fields and domain rules (`@gmail.com`).
 * 2. Checks if the delivery partner exists and is active.
 * 3. Compares passwords using bcrypt.
 * 4. Generates an auth token with role 'delivery'.
 * 
 * @param req - Express Request object containing `email` and `password`.
 * @param res - Express Response object.
 */
export const loginPartner = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ message: "Only @gmail.com email addresses are allowed" });
    }

    const partner = await prisma.deliveryPartner.findUnique({
        where: { email: email.toLowerCase() }
    })
    if (!partner) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!partner.isActive) {
        return res.status(403).json({ message: "Your account is inactive. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(partner.id);
    const { password: _, ...partnerData } = partner;
    res.json({ token, partner: partnerData });
}

/**
 * Fetches the assigned orders for the authenticated delivery partner.
 * Orders can be filtered by `active` (Assigned, Packed, Out for Delivery)
 * or `completed` (Delivered, Cancelled) statuses.
 * 
 * @param req - Express Request object containing optional `status` query parameter.
 * @param res - Express Response object.
 */
export const getMyDeliveries = async (req: Request, res: Response) => {
    const { status } = req.query;

    const where: any = { deliveryPartnerId: req.partner!.id };
    if (status === "active") {
        where.status = { in: ["Assigned", "Packed", "Out for Delivery"] };
    } else if (status === "completed") {
        where.status = { in: ["Delivered", "Cancelled"] };
    }

    const orders = await prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: "desc" }
    })
    res.json({ orders })


}


/**
 * Retrieves the full details of a specific order assigned to the authenticated delivery partner.
 * Includes user metadata (name, phone, email) for contact purposes.
 * 
 * @param req - Express Request object containing order `id`.
 * @param res - Express Response object.
 */
export const getMyDeliveryDetails = async (req: Request, res: Response) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id },
        include: { user: { select: { name: true, email: true, phone: true } } }

    })
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    res.json({ order })
}

/**
 * Marks an order as 'Delivered'.
 * Requires a valid OTP provided by the customer to confirm the handoff.
 * 
 * @param req - Express Request object containing order `id` parameter and `otp` in body.
 * @param res - Express Response object.
 */
export const completeDelivery = async (req: Request, res: Response) => {
    const { otp } = req.body;
    const order = await prisma.order.findUnique({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id }

    })
    if (!order || order.status === "Cancelled" || order.status === "Delivered") {
        return res.status(404).json({ message: "Order not found or already completed" });
    }
    if (order.deliveryOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    const history = order.statusHistory as any[];
    history.push({
        status: "Delivered",
        note: "Order delivered successfully",
        timestamp: new Date(),
        partnerId: req.partner!.id
    })
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            status: "Delivered",
            statusHistory: history,
            deliveryOtp: "",
            isPaid: true
        }
    })
    res.json({ message: "Order marked as delivered", order: updatedOrder })
}

/**
 * Cancels a delivery due to specified reasons (e.g., customer unavailable).
 * Requires the order OTP for validation to prevent unauthorized cancellations.
 * 
 * @param req - Express Request object containing `otp` and `reason`.
 * @param res - Express Response object.
 */
export const cancelDelivery = async (req: Request, res: Response) => {
    const { otp, reason } = req.body;
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id }
    })
    if (!order || order.status === "Cancelled" || order.status === "Delivered") {
        return res.status(404).json({ message: "Order not found or already completed" });
    }
    if (order.deliveryOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }
    const history = order.statusHistory as any[];
    history.push({
        status: "Cancelled",
        note: reason,
        timestamp: new Date(),
        partnerId: req.partner!.id
    })
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            status: "Cancelled",
            statusHistory: history,
            deliveryOtp: ""
        }
    })
    res.json({ message: "Order cancelled successfully", order: updatedOrder })
}


/**
 * Progresses the order status strictly to 'Packed' or 'Out for Delivery'.
 * This endpoint allows the delivery partner to update the order state during the delivery lifecycle.
 * 
 * @param req - Express Request object containing the new `status`.
 * @param res - Express Response object.
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const allowedStatuses = ["Packed", "Out for Delivery"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    const order = await prisma.order.findUnique({
        where: { id: req.params.id as string, deliveryPartnerId: req.partner!.id }
    })

    const history = order!.statusHistory as any[];
    history.push({
        status,
        note: `Order status updated to ${status}`,
        timestamp: new Date(),
    })
    const updatedOrder = await prisma.order.update({
        where: { id: order!.id },
        data: {
            status,
            statusHistory: history
        }
    })
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order status updated successfully", order: updatedOrder })
}


/**
 * Updates the live GPS coordinates (latitude, longitude) of the delivery partner
 * for active orders so the customer can track them on a map.
 * 
 * @param req - Express Request object containing `lat`, `lng`, and `orderId`.
 * @param res - Express Response object.
 */
export const updateLocation = async (req: Request, res: Response) => {
    const { lat, lng } = req.body;
    const order = await prisma.order.findFirst({
        where: {
            id: req.body.orderId as string,
            deliveryPartnerId: req.partner!.id,
            status: { in: ["Assigned", "Packed", "Out for Delivery"] }
        }
    })

    await prisma.order.update({
        where: { id: order!.id },
        data: {
            liveLocation: {
                lat,
                lng,
                updatedAt: new Date()
            }
        }
    })
    res.json({ message: "Location updated successfully" })
}