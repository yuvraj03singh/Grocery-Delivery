//create order
//post /api/orders
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from "stripe";


export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order cannot be empty' });
        }

        //lookup product details from database and calculate total price
        const productIds = items.map((item: any) => item.product);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        const productMap: Record<string, (typeof products[0])> = {};
        products.forEach((product: any) => {
            productMap[product.id] = product;
        });

        for (const item of items) {
            const product = productMap[item.product];
            if (!product || (product.stock ?? 0) < item.quantity) {
                return res.status(400).json({ message: `Product with id ${item.product} not found or insufficient stock` });

            }
        }

        const orderItems = items.map((item: any) => {
            const dbProduct = productMap[item.product];
            if (!dbProduct) {
                throw new Error(`Product with id ${item.product} not found`);
            }
            return {
                product: dbProduct.id,
                name: dbProduct.name,
                image: dbProduct.image,
                price: dbProduct.price,
                quantity: item.quantity,
                unit: dbProduct.unit
            }
        });

        const subTotal = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subTotal > 20 ? 0 : 1.99;
        const tax = Math.round(subTotal * 0.08 * 100) / 100;
        const total = Math.round((subTotal + deliveryFee + tax) * 100) / 100;



        const order = await prisma.order.create({
            data: {
                userId: req.user?.id as string,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                subtotal: subTotal,
                deliveryFee,
                tax,
                total,
                statusHistory: [{ status: "Placed", note: "Order placed successfully", timestamp: new Date() }]
            }
        })

        if (paymentMethod === "card") {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

            const session = await stripe.checkout.sessions.create({
                success_url: `${req.headers.origin || 'http://localhost:5173'}/orders?clearCart=true`,
                cancel_url: `${req.headers.origin || 'http://localhost:5173'}/checkout`,
                line_items: [
                    {
                        price_data: {
                            currency: "inr",
                            product_data: {
                                name: "Payment Grocery",
                            },
                            unit_amount: Math.max(Math.round(total * 100), 5000)
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: { orderId: order.id }
            });
            
            return res.json({ url: session.url })
        }
        res.json({ order })

        //decrease stock of products
        for (const item of orderItems) {
            await prisma.product.update({
                where: { id: item.product },
                data: { stock: { decrement: item.quantity } }
            })
        }

        //send stock update event to clients via websocket

        for (const item of orderItems) {
            await inngest.send({ name: "inventory/stock.updates", data: { productId: item.product, quantity: item.quantity } })
        }
        await inngest.send({ name: "order/placed", data: { orderId: order.id } })
    } catch (error: any) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: "Failed to create order", error: error.message, stack: error.stack });
    }
}

//get orders for user
//get/api/orders

export const getUserOrders = async (req: Request, res: Response) => {
    const { status } = req.query;

    const where: any = { userId: req.user!.id, NOT: [{ paymentMethod: "card", isPaid: false }] };
    if (status && status !== "all") {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: { deliveryPartner: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" }
    });

    res.json({ orders })
}

//get single order by id
//get/api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
        include: { deliveryPartner: { select: { name: true, phone: true, avatar: true, vehicleType: true } } }
    })
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    res.json({ order })
}

//update order status by admin
//put /api/orders/:id/status

export const updateOrderStatus = async (req: Request, res: Response) => {
    const { status, note } = req.body;
    const order = await prisma.order.findUnique({
        where: { id: req.params.id as string }
    })

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];
    history.push({ status, note: note || `Order ${status.toLowerCase()}`, timestamp: new Date() });

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id as string },
        data: { status, statusHistory: history }
    });
    res.json({ message: "Order status updated successfully", order: updatedOrder })
}

//get all orders for admin
//get /api/orders/all

export const getAllOrders = async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
        include: {
            user: { select: { name: true, email: true } },
            deliveryPartner: { select: { name: true, phone: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    res.json({ orders })
}

//get order location by order id
//get /api/orders/:id/location

export const getOrderLocation = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
        select: { liveLocation: true, status: true }
    })

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    res.json({ location: order.liveLocation, status: order.status })
}

