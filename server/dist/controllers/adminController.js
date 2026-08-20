//get admin dashboard data
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
export const getAdminStats = async (req, res) => {
    const [totalOrders, totalUsers, totalProducts, outOfStockProducts, totalPartners, recentOrders] = await Promise.all([
        prisma.order.count({ where: { NOT: { paymentMethod: "card", isPaid: false } } }),
        prisma.user.count(),
        prisma.product.count(),
        prisma.product.count({ where: { stock: 0 } }),
        prisma.deliveryPartner.count(),
        prisma.order.findMany({
            where: { NOT: { paymentMethod: "card", isPaid: false } },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: {
                user: { select: { name: true, email: true } },
                deliveryPartner: { select: { name: true, email: true } }
            },
        })
    ]);
    res.json({ totalOrders, totalUsers, totalProducts, outOfStockProducts, totalPartners, recentOrders });
};
//delivery partner list
export const getDeliveryPartners = async (req, res) => {
    try {
        const partners = await prisma.deliveryPartner.findMany({ orderBy: { createdAt: "desc" } });
        res.json({ partners });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch delivery partners" });
    }
};
//create delivery partner
export const createDeliveryPartner = async (req, res) => {
    const { name, email, password, phone, vehicleType } = req.body;
    if (!name || !email || !password || !phone || !vehicleType) {
        res.status(400).json({ message: "All fields are required" });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = await prisma.deliveryPartner.create({
        data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            vehicleType
        }
    });
    res.status(201).json({ partner });
};
//update delivery partner profile
export const updateDeliveryPartner = async (req, res) => {
    const { name, phone, vehicleType, isActive } = req.body;
    const data = {};
    if (name)
        data.name = name;
    if (phone)
        data.phone = phone;
    if (vehicleType)
        data.vehicleType = vehicleType;
    if (isActive !== undefined) {
        data.isActive = isActive === true || isActive === "true";
    }
    try {
        const partner = await prisma.deliveryPartner.update({
            where: { id: req.params.id },
            data
        });
        res.json({ partner });
    }
    catch (error) {
        console.error("Prisma update error:", error);
        res.status(500).json({ message: error.message || "Error updating delivery partner" });
    }
};
//assign delivery partner to order
export const assignDeliveryPartner = async (req, res) => {
    try {
        const { partnerId } = req.body;
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { deliveryPartner: true }
        });
        const partner = await prisma.deliveryPartner.findUnique({
            where: { id: partnerId }
        });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        let status = order.status;
        const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        if (order.status === "Placed" || order.status === "Confirmed") {
            status = "Assigned";
            history.push({
                status: "Assigned",
                note: `Delivery partner ${partner?.name} assigned`,
                timestamp: new Date(), partnerId
            });
        }
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                deliveryPartnerId: partner.id,
                status,
                deliveryOtp: otp,
                statusHistory: history
            }
        });
        res.json({ message: "Order assigned successfully", order: updatedOrder });
    }
    catch (error) {
        console.error("Error assigning delivery partner:", error);
        res.status(500).json({ message: error.message || "Failed to assign delivery partner" });
    }
};
