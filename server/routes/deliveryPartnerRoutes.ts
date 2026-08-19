import express from "express";
import { getMyDeliveries, loginPartner,getMyDeliveryDetails, completeDelivery, cancelDelivery, updateOrderStatus, updateLocation } from "../controllers/deliveryPartner.js";
import auth from "../middleware/auth.js";
import deliveryAuth from "../middleware/deliveryAuth.js";

const deliveryPartnerRouter=express.Router();

deliveryPartnerRouter.post('/login',loginPartner);
deliveryPartnerRouter.get('/my-deliveries',deliveryAuth,getMyDeliveries);
deliveryPartnerRouter.get('/my-deliveries/:id',deliveryAuth,getMyDeliveryDetails);
deliveryPartnerRouter.put('/my-deliveries/:id',deliveryAuth,getMyDeliveryDetails);
deliveryPartnerRouter.get('/my-deliveries/:id/complete',deliveryAuth,completeDelivery);
deliveryPartnerRouter.put('/my-deliveries/:id/cancel',deliveryAuth,cancelDelivery);
deliveryPartnerRouter.put('/my-deliveries/:id/status',deliveryAuth,updateOrderStatus);
deliveryPartnerRouter.put('/my-deliveries/:id/location',deliveryAuth,updateLocation);











export default deliveryPartnerRouter;