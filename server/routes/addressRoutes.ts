import express  from "express";
import { addAddress, deleteAddress, getAddress, updateAddress } from "../controllers/addressController.js";
import auth from "../middleware/auth.js";



const addressRouter=express.Router();
addressRouter.use(auth);


addressRouter.get("/",auth,getAddress);
addressRouter.post("/",auth,addAddress);
addressRouter.put("/:id",auth,updateAddress);
addressRouter.delete("/:id",auth,deleteAddress);

export default addressRouter;
