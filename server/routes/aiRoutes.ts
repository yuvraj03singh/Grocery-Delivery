import express from "express";
import { recipeToCart, getRecipeSuggestions } from "../controllers/aiController.js";

const aiRouter = express.Router();

// POST /api/ai/recipe-to-cart
aiRouter.post("/recipe-to-cart", recipeToCart);

// GET /api/ai/recipe-suggestions
aiRouter.get("/recipe-suggestions", getRecipeSuggestions);

export default aiRouter;
