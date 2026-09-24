import { prisma } from "./config/prisma.js";
async function backfill() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        console.log(`Found ${orders.length} orders in the database.`);
        for (const order of orders) {
            const targetName = order.user?.name || "Customer";
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    userName: targetName
                }
            });
            console.log(`Order ID: ${order.id} | User Name updated to: "${targetName}" (${order.user?.email})`);
        }
        console.log("All orders successfully updated with userName!");
    }
    catch (err) {
        console.error("Backfill failed:", err);
    }
    finally {
        await prisma.$disconnect();
    }
}
backfill();
