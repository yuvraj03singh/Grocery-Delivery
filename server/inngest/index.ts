import { Inngest, cron } from "inngest";
import { prisma } from "../config/prisma.js";
import sendEmail from "../config/nodemailer.js";

const LOW_STOCK_THRESHOLD = 10;

export const inngest = new Inngest({
    id: "grocery-delivery",
});

// Low stock alert
const checkLowStock = inngest.createFunction(
    {
        id: "check-low-stock",
        name: "Low stock alert",
        triggers: [{ event: "inventory/stock.updated" }],
    },

    async ({ event, step }) => {
        const { productId, stockLevel } = event.data;

        const product = await step.run("fetch-product", async () => {
            return await prisma.product.findUnique({
                where: { id: productId },
            });
        });

        if (
            !product ||
            product.stock === null ||
            product.stock > LOW_STOCK_THRESHOLD
        ) {
            return {
                skipped: true,
                stock: product?.stock,
            };
        }

        const result = await step.run(
            "send-low-stock-alert",
            async () => {
                const adminEmails = process.env.ADMIN_EMAILS
                    ? process.env.ADMIN_EMAILS
                        .split(",")
                        .map((e) => e.trim())
                    : [];

                if (adminEmails.length === 0) {
                    return {
                        skipped: true,
                        reason: "No admin emails configured",
                    };
                }
                await sendEmail({
                    to: adminEmails.join(","),
                    subject: `Low stock alert for ${product.name}`,
                    body: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px 28px;">
                            <h2 style="color: #fff; margin: 0; font-size: 20px;">Low Stock Alert</h2>
                        </div>
                        <div style="padding: 28px;">
                            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover;" />` : ""}
                                <div>
                                    <h3 style="margin: 0 0 4px; font-size: 18px; color: #111827;">${product.name}</h3>
                                    <p style="margin: 0; font-size: 14px; color: #6b7280;">${product.category} • ${product.unit}</p>
                                </div>
                            </div>
                            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; font-size: 13px; color: #991b1b; font-weight: 600;">CURRENT STOCK</p>
                                <p style="margin: 0; font-size: 32px; font-weight: 700; color: #dc2626;">${product.stock}</p>
                                <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">units remaining</p>
                            </div>
                            <p style="margin: 20px 0 0; font-size: 13px; color: #9ca3af; text-align: center;">Please restock this item as soon as possible.</p>
                        </div>
                    </div>`,
                })




            }
        );

        return { alerted: true, product: product.name, stock: product.stock };
    }
);

// monthly offer email

const sendMonthlyOfferEmail = inngest.createFunction(
    {
        id: "send-monthly-offers",
        name: "Send monthly offer emails",
        triggers: [cron("0 10 1 * *")],
    },
    async ({ step }) => {
        const { deals, users } = await step.run("fetch-deals-and-users", async () => {
            const products = await prisma.product.findMany({
                where: { stock: { gt: 0 } },
                orderBy: { originalPrice: "desc" },
                take: 6,
            });

            const allUsers = await prisma.user.findMany({
                select: { email: true, name: true },
            });

            return { deals: products, users: allUsers };
        });

        if (users.length === 0 || deals.length === 0) {
            return { skipped: true, reason: "No users or deals found" };
        }

        let sendCount = 0;
        const batchSize = 10;

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            await step.run(`send-offers-batch-${i / batchSize + 1}`, async () => {
                for (const user of batch) {
                    await sendEmail({
                        to: user.email,
                        subject: "Exclusive Monthly Offers Just for You!",
                        body: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 24px 28px;">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">Fresh Picks Just For You!</h2>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
                        Exclusive offers to kick off your month right
                    </p>
                </div>

                <div style="padding: 28px;">
                    <p style="margin: 0 0 20px; font-size: 15px; color: #374151;">
                        Hi <strong>${user.name}</strong>, check out this month's top picks!
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${deals
                                .reduce((rows: any[], _deal, index: number) => {
                                    if (index % 3 === 0) {
                                        rows.push(deals.slice(index, index + 3));
                                    }

                                    return rows;
                                }, [])
                                .map(
                                    (row: any[]) => `
                                <tr>
                                    ${row
                                            .map(
                                                (product: any) => `
                                            <td style="width: 33%; padding: 8px; vertical-align: top;">
                                                <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; text-align: center;">
                                                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100px; object-fit: cover;" />` : ""}
                                                    <div style="padding: 10px;">
                                                        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">
                                                            ${product.name}
                                                        </p>
                                                        <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #16a34a;">
                                                            $${product.price.toFixed(2)}
                                                            ${product.originalPrice > product.price ? `<span style="font-size: 11px; color: #9ca3af; text-decoration: line-through; margin-left: 4px;">$${product.originalPrice.toFixed(2)}</span>` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>`
                                            )
                                            .join("")}
                                </tr>`
                                )
                                .join("")}
                    </table>

                    <div style="text-align: center; margin-top: 24px;">
                        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/products"
                           style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
                           Shop All Deals →
                        </a>
                    </div>
                </div>
            </div>`,
                    });

                    sendCount += batch.length;
                }
            });
        }

        return { alerted: true, sent: sendCount };
    }
);

const autoAssignRider = inngest.createFunction(
    {
        id: "auto-assign-rider",
        name: "Auto assign rider to order",
        triggers: [{ event: "order/created" }],
    },
    async ({ event, step }) => {
        const { orderId } = event.data;

        await step.sleep("wait-for-5-minutes", "5m");

        return await step.run("assign-rider", async () => {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (!order) return { skipped: true, reason: "Order not found" };

            if (order.deliveryPartnerId) {
                return { skipped: true, reason: "Rider already assigned" };
            }

            if (["Cancelled", "Delivered"].includes(order.status)) {
                return { skipped: true, reason: `Order is already ${order.status}` };
            }

            const busyOrders = await prisma.order.findMany({
                where: {
                    status: { in: ["Assigned", "Packed", "Out for Delivery"] },
                    deliveryPartnerId: { not: null },
                },
                select: { deliveryPartnerId: true },
            });

            const busyRiderIds = busyOrders
                .map((o) => o.deliveryPartnerId)
                .filter((id): id is string => Boolean(id));

            const availableRider = await prisma.deliveryPartner.findFirst({
                where: {
                    isActive: true,
                    id: { notIn: busyRiderIds },
                },
                orderBy: { createdAt: "asc" },
            });

            if (!availableRider) {
                return { skipped: true, reason: "No available rider found" };
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            const history = Array.isArray(order.statusHistory)
                ? (order.statusHistory as any[])
                : [];

            history.push({
                status: "Assigned",
                note: `Order assigned to rider ${availableRider.name} (ID: ${availableRider.id})`,
                timestamp: new Date().toISOString(),
            });

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    deliveryPartnerId: availableRider.id,
                    deliveryOtp: otp,
                    status: "Assigned",
                    statusHistory: history,
                },
            });

            return {
                assigned: true,
                riderId: availableRider.id,
                riderName: availableRider.name,
                otp,
            };

        });

    }
);

export const functions = [checkLowStock, sendMonthlyOfferEmail, autoAssignRider];