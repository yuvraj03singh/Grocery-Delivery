import { Request, Response } from "express"
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import { eventNames } from "node:cluster";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeWebhook = async (request: Request, response: Response) => {
    let event;

    //get the signature sent by the stripe

    const signature = request.headers["stripe-signature"] as string

    //construct the event
    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            signature as string,
            endpointSecret as string
        );
    } catch (err) {
        console.log(`webhook signature verification failed`)
        return response.sendStatus(400);
    }


    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const paymentIntentId = paymentIntent.id;

            //getting session metadata
            const session = await stripe.checkout.sessions.list(
                { payment_intent: paymentIntentId }
            )

            const { orderId } = session.data[0].metadata as any;


            //marked as paid
            const paidOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                }
            })

            //decrease stock

            const orderItems = (Array.isArray(paidOrder.items)) ? paidOrder.items : [] as any[];


            //send stock update events for each product in the order
            for (const item of orderItems) {
                await prisma.product.update({
                    where: { id: item.product },
                    data: { stock: { decrement: item.quantity } }
                })
            }

            if (paidOrder) {
                await inngest.send({ name: "order/placed", data: { orderId: orderId } })
            }


            //send stock update events for each product in the order
            for (const item of orderItems) {
                await inngest.send({
                    name: "inventory/stock.updated",
                    data: { productId: item.product, quantity: item.quantity }
                })
            }
            break;

        case 'payment_intent.canceled':
        case 'payment_intent.payment_failed': {
            const paymentIntentFailure = event.data.object as Stripe.PaymentIntent;
            const paymentIntentFailureId = paymentIntentFailure.id;

            //getting session metadata
            const sessionFailure = await stripe.checkout.sessions.list(
                { payment_intent: paymentIntentFailureId }
            )

            const failureOrderId =
                (sessionFailure.data[0].metadata as any).orderId;

            //updating order as failed
            await prisma.order.delete({
                where: { id: failureOrderId },
            })
            break;
        }
        default:
            console.log(`Unknown event type:${event.type}`)
    }

    response.json({ received: true });
}