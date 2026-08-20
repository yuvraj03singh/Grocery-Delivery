import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeWebhook = async (request, response) => {
    let event;
    //get the signature sent by the stripe
    const signature = request.headers["stripe-signature"];
    //construct the event
    try {
        event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
    }
    catch (err) {
        console.log(`webhook signature verification failed`);
        return response.sendStatus(400);
    }
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const orderId = session.metadata?.orderId;
            if (!orderId) {
                console.error("No orderId found in session metadata");
                break;
            }
            //marked as paid
            const paidOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                }
            });
            //decrease stock
            const orderItems = (Array.isArray(paidOrder.items)) ? paidOrder.items : [];
            //send stock update events for each product in the order
            for (const item of orderItems) {
                await prisma.product.update({
                    where: { id: item.product },
                    data: { stock: { decrement: item.quantity } }
                });
            }
            if (paidOrder) {
                await inngest.send({ name: "order/placed", data: { orderId: orderId } });
            }
            //send stock update events for each product in the order
            for (const item of orderItems) {
                await inngest.send({
                    name: "inventory/stock.updated",
                    data: { productId: item.product, quantity: item.quantity }
                });
            }
            break;
        }
        case 'payment_intent.canceled':
        case 'payment_intent.payment_failed': {
            const paymentIntentFailure = event.data.object;
            const paymentIntentFailureId = paymentIntentFailure.id;
            //getting session metadata
            const sessionFailure = await stripe.checkout.sessions.list({ payment_intent: paymentIntentFailureId });
            const failureOrderId = sessionFailure.data[0]?.metadata?.orderId;
            if (failureOrderId) {
                //updating order as failed
                await prisma.order.delete({
                    where: { id: failureOrderId },
                });
            }
            break;
        }
        default:
            console.log(`Unknown event type:${event.type}`);
    }
    response.json({ received: true });
};
