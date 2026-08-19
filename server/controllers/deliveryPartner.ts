import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const generateToken = (id: string) => {
    return jwt.sign({ id, role: "delivery" }, process.env.JWT_SECRET as string, { expiresIn: "30d" })

}
//Login delivery partner
//post /api/delivery-partner/login

export const loginPartner = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
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

//get assigned orders for delivery partner
//get /api/delivery-partner/orders

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


//get single order details for delivery partner
//get /api/delivery-partner/orders/:id

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

//complete delivery with order id otp
//put /api/delivery-partner/orders/:id/complete

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
            deliveryOtp: ""
        }
    })
    res.json({ message: "Order marked as delivered", order: updatedOrder })
}

//cancel delivery with order id otp
//put /api/delivery-partner/orders/:id/cancel

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


//update order status with order id
//put /api/delivery-partner/orders/:id/status

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


//update live location of delivery partner
//put /api/delivery-partner/location
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