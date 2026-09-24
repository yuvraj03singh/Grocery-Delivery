import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChefHat,
  Clock,
  Flame,
  Users,
  Check,
  ShoppingCart,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Search,
  Utensils
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/api";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";

interface MatchedItem {
  product: Product;
  quantity: number;
  recipeIngredientName: string;
  quantityRequired: string;
  isCore: boolean;
  matchScore: number;
}

interface MissingItem {
  name: string;
  quantityRequired: string;
  isCore: boolean;
  note: string;
}

interface RecipeDetails {
  name: string;
  description: string;
  servings: number;
  prepTime: string;
  calories: string;
  dietaryType: string;
  difficulty: string;
  instructions: string[];
}

interface RecipeSuggestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
  prepTime: string;
  calories: string;
  badge: string;
  tag: string;
  image: string;
  servings: number;
}

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = "",
}) => {
  const { addMultipleToCart } = useCart();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [clarificationMessage, setClarificationMessage] = useState<{ text: string; prompts?: string[] } | null>(null);

  const [showInstructions, setShowInstructions] = useState(true);
  const [showMissingItems, setShowMissingItems] = useState(false);
  const [showOptionalItems, setShowOptionalItems] = useState(false);

  // Sync initialPrompt prop when modal opens
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Fetch recipe suggestions on first open
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get("/ai/recipe-suggestions");
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.warn("Could not fetch recipe suggestions:", err);
    }
  };

  // Loading animation simulation steps
  useEffect(() => {
    let timer: any;
    if (loading) {
      setLoadingStep(0);
      const steps = [
        "Analyzing culinary recipe & portion sizes...",
        "Identifying required ingredients & spices...",
        "Matching items with live store inventory...",
        "Calculating optimal quantities and bundle savings...",
      ];
      let current = 0;
      timer = setInterval(() => {
        current = (current + 1) % steps.length;
        setLoadingStep(current);
      }, 900);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleGenerateRecipe = async (customPrompt?: string, customServings?: number) => {
    const query = (customPrompt ?? prompt).trim();
    if (!query) {
      toast.error("Please enter a dish name or recipe request!");
      return;
    }

    const currentServings = customServings ?? servings;

    try {
      setLoading(true);
      setRecipe(null);
      setMatchedItems([]);
      setMissingItems([]);
      setClarificationMessage(null);

      const response = await api.post("/ai/recipe-to-cart", {
        prompt: query,
        servings: currentServings,
      });

      if (response.data?.success) {
        const recipeData = response.data.recipe;
        const matched = response.data.matchedItems || [];
        const missing = response.data.missingItems || [];

        setRecipe(recipeData);
        setMatchedItems(matched);
        setMissingItems(missing);

        // Auto-select ONLY core items by default (not optional ones)
        const coreIds = new Set<string>(
          matched.filter((m: MatchedItem) => m.isCore).map((m: MatchedItem) => m.product.id)
        );
        setSelectedProductIds(coreIds);

        const coreCount = matched.filter((m: MatchedItem) => m.isCore).length;
        const optionalCount = matched.filter((m: MatchedItem) => !m.isCore).length;
        if (coreCount > 0) {
          toast.success(`✅ ${coreCount} essential ingredient${coreCount > 1 ? 's' : ''} matched${optionalCount > 0 ? ` + ${optionalCount} optional add-on${optionalCount > 1 ? 's' : ''} available` : ''}!`);
        } else {
          toast("Recipe generated, but some ingredients might be out of stock.", { icon: "ℹ️" });
        }
      } else {
        if (response.data?.isGreeting || response.data?.message) {
          setClarificationMessage({
            text: response.data.message,
            prompts: response.data.suggestedPrompts || []
          });
          toast(response.data.message, { icon: "👋" });
        } else {
          toast.error(response.data?.message || "Failed to generate recipe.");
        }
      }
    } catch (err: any) {
      console.error("AI Recipe error:", err);
      toast.error(err.response?.data?.message || "Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: RecipeSuggestion) => {
    setPrompt(suggestion.prompt);
    setServings(suggestion.servings || 4);
    handleGenerateRecipe(suggestion.prompt, suggestion.servings || 4);
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === matchedItems.length) {
      // Deselect all -> only keep core selected
      const coreIds = new Set<string>(matchedItems.filter(i => i.isCore).map(i => i.product.id));
      setSelectedProductIds(coreIds);
    } else {
      setSelectedProductIds(new Set(matchedItems.map((item) => item.product.id)));
    }
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setMatchedItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Pricing calculations for selected items
  const selectedItemsList = matchedItems.filter((item) => selectedProductIds.has(item.product.id));
  const selectedTotalPrice = selectedItemsList.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const selectedOriginalPrice = selectedItemsList.reduce(
    (sum, item) => sum + (item.product.originalPrice || item.product.price) * item.quantity,
    0
  );
  const selectedTotalSavings = Math.max(0, selectedOriginalPrice - selectedTotalPrice);

  const handleAddToCart = () => {
    if (selectedItemsList.length === 0) {
      toast.error("Please select at least 1 ingredient to add to cart!");
      return;
    }

    const itemsToAdd = selectedItemsList.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

    addMultipleToCart(itemsToAdd, true);
    toast.success(
      `Added ${selectedItemsList.length} ingredients for "${recipe?.name || "Recipe"}" to your cart! 🛒`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-orange-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <ChefHat className="size-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">AI Recipe-to-Cart Chef</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-sm">
                    <Sparkles className="size-3" /> Powered by Gemini
                  </span>
                </div>
                <p className="text-sm text-orange-100 mt-0.5">
                  Type any recipe or meal idea — we'll generate the recipe and pack all ingredients into your cart!
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search / Prompt Input Bar */}
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateRecipe();
              }}
              className="relative flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Street Style Maggi for 2', 'Paneer Butter Masala for 4', 'Egg Omelette'..."
                  className="w-full h-13 pl-12 pr-10 rounded-2xl bg-orange-50/60 dark:bg-zinc-800 border border-orange-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-base shadow-inner"
                />
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Servings Adjuster in Input Row */}
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-orange-50/60 dark:bg-zinc-800 border border-orange-200 dark:border-zinc-700 rounded-2xl px-3 py-1.5 h-13">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <Users className="size-4 text-orange-500" />
                  <span>Servings:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setServings((s) => Math.max(1, s - 1))}
                    className="size-7 rounded-lg bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-orange-100 dark:hover:bg-zinc-600 transition font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-zinc-900 dark:text-white">
                    {servings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setServings((s) => Math.min(12, s + 1))}
                    className="size-7 rounded-lg bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-orange-100 dark:hover:bg-zinc-600 transition font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="h-13 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-5 animate-spin" />
                    <span>Cooking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    <span>Get Recipe & Items</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            {!recipe && !clarificationMessage && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Utensils className="size-3.5" /> Popular Recipe Ideas (Click to cook):
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug.id}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-zinc-800/80 hover:bg-orange-100 dark:hover:bg-zinc-700 border border-orange-200/70 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 transition text-left"
                    >
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {sug.badge}
                      </span>
                      <span>{sug.title}</span>
                      <span className="text-[11px] text-zinc-400">({sug.prepTime})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversational / Clarification Guidance Bubble */}
            {!recipe && clarificationMessage && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-zinc-800 dark:to-zinc-800/70 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ChefHat className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      AI Chef Assistant
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                      {clarificationMessage.text}
                    </p>
                  </div>
                </div>

                {clarificationMessage.prompts && clarificationMessage.prompts.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-zinc-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="size-3" /> Try one of these delicious recipes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clarificationMessage.prompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPrompt(p);
                            handleGenerateRecipe(p, servings);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-700/80 hover:bg-amber-100 dark:hover:bg-zinc-600 border border-amber-200 dark:border-zinc-600 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition active:scale-95 text-left"
                        >
                          🍳 {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading Animation Card */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-orange-50/50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-orange-200 dark:border-zinc-700 p-8">
              <div className="relative">
                <div className="size-20 rounded-full bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center animate-pulse">
                  <ChefHat className="size-10 text-orange-500 animate-bounce" />
                </div>
                <Sparkles className="size-6 text-amber-500 absolute -top-1 -right-1 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  AI Chef is preparing your grocery list...
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium animate-pulse">
                  {[
                    "Analyzing culinary recipe & portion sizes...",
                    "Identifying required ingredients & spices...",
                    "Matching items with live store inventory...",
                    "Calculating optimal quantities and bundle savings...",
                  ][loadingStep]}
                </p>
              </div>
            </div>
          )}

          {/* Result View */}
          {!loading && recipe && (
            <div className="space-y-6">
              {/* Recipe Meta Header Card */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50/40 to-white dark:from-zinc-800 dark:via-zinc-800/80 dark:to-zinc-900 rounded-3xl p-5 border border-orange-200/80 dark:border-zinc-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-xs">
                        {recipe.dietaryType || "Recipe"}
                      </span>
                      {recipe.difficulty && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                          {recipe.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                      {recipe.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Quick Meta Badges */}
                  <div className="flex flex-wrap gap-2.5 sm:shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-700 shadow-xs border border-orange-100 dark:border-zinc-600 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      <Clock className="size-4 text-orange-500" />
                      <span>{recipe.prepTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-700 shadow-xs border border-orange-100 dark:border-zinc-600 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      <Flame className="size-4 text-amber-500" />
                      <span>{recipe.calories}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-zinc-700 shadow-xs border border-orange-100 dark:border-zinc-600 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      <Users className="size-4 text-green-500" />
                      <span>{recipe.servings} Servings</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Step-by-Step Cooking Guide */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-orange-200/60 dark:border-zinc-700">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:text-orange-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <Utensils className="size-3.5" />
                        Cooking Instructions ({recipe.instructions.length} Steps)
                      </span>
                      {showInstructions ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>

                    {showInstructions && (
                      <ol className="mt-3 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                        {recipe.instructions.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>

              {/* Matched Grocery Catalog Items */}
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Grocery Items
                    </h4>
                    <span className="text-xs text-zinc-500">
                      ({selectedProductIds.size} selected)
                    </span>
                  </div>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {selectedProductIds.size === matchedItems.length
                      ? "Reset to Essentials"
                      : "Select All"}
                  </button>
                </div>

                {/* CORE ESSENTIALS SECTION */}
                {(() => {
                  const coreItems = matchedItems.filter(i => i.isCore);
                  const optionalItems = matchedItems.filter(i => !i.isCore);

                  if (matchedItems.length === 0) {
                    return (
                      <div className="p-6 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        No catalog items matched. Try one of our popular recipe suggestions!
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Core / Essential Items */}
                      {coreItems.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                              Essential Ingredients ({coreItems.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {coreItems.map((item) => {
                              const isSelected = selectedProductIds.has(item.product.id);
                              return (
                                <div
                                  key={item.product.id}
                                  className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                    isSelected
                                      ? "bg-white dark:bg-zinc-800 border-orange-300 dark:border-orange-500/50 shadow-xs"
                                      : "bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 opacity-60"
                                  }`}
                                >
                                  <button
                                    onClick={() => toggleItemSelection(item.product.id)}
                                    className={`size-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                                      isSelected
                                        ? "bg-orange-500 text-white"
                                        : "border border-zinc-300 dark:border-zinc-600 text-transparent"
                                    }`}
                                  >
                                    <Check className="size-4 stroke-[3]" />
                                  </button>
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="size-14 rounded-xl object-contain bg-zinc-100 dark:bg-zinc-700/50 p-1 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                                      ✅ {item.recipeIngredientName.replace(" (optional)", "")} ({item.quantityRequired})
                                    </span>
                                    <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {item.product.name}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                        ₹{item.product.price}
                                      </span>
                                      {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                        <span className="text-[11px] text-zinc-400 line-through">
                                          ₹{item.product.originalPrice}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-zinc-500">/{item.product.unit}</span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-zinc-700/70 rounded-xl p-1 shrink-0">
                                      <button
                                        onClick={() => updateItemQuantity(item.product.id, -1)}
                                        className="size-6 rounded-lg bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-orange-200 dark:hover:bg-zinc-500 transition text-xs font-bold"
                                      >
                                        -
                                      </button>
                                      <span className="w-5 text-center text-xs font-bold text-zinc-900 dark:text-white">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateItemQuantity(item.product.id, 1)}
                                        className="size-6 rounded-lg bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-orange-200 dark:hover:bg-zinc-500 transition text-xs font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Optional Add-ons — collapsed by default */}
                      {optionalItems.length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => setShowOptionalItems(!showOptionalItems)}
                            className="flex items-center justify-between w-full text-left group"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 group-hover:text-amber-700">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                              Optional Add-ons ({optionalItems.length}) — click to {showOptionalItems ? 'hide' : 'show'}
                            </span>
                            {showOptionalItems ? (
                              <ChevronUp className="size-3.5 text-amber-500" />
                            ) : (
                              <ChevronDown className="size-3.5 text-amber-500" />
                            )}
                          </button>

                          {showOptionalItems && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {optionalItems.map((item) => {
                                const isSelected = selectedProductIds.has(item.product.id);
                                return (
                                  <div
                                    key={item.product.id}
                                    className={`relative flex items-center gap-3 p-3 rounded-2xl border border-dashed transition-all ${
                                      isSelected
                                        ? "bg-amber-50/60 dark:bg-zinc-800 border-amber-300 dark:border-amber-500/40 shadow-xs"
                                        : "bg-zinc-50/40 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/40 opacity-55"
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleItemSelection(item.product.id)}
                                      className={`size-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                                        isSelected
                                          ? "bg-amber-500 text-white"
                                          : "border border-zinc-300 dark:border-zinc-600 text-transparent"
                                      }`}
                                    >
                                      <Check className="size-4 stroke-[3]" />
                                    </button>
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="size-14 rounded-xl object-contain bg-zinc-100 dark:bg-zinc-700/50 p-1 shrink-0 opacity-80"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block truncate">
                                        ✨ {item.recipeIngredientName.replace(" (optional)", "")} — optional ({item.quantityRequired})
                                      </span>
                                      <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {item.product.name}
                                      </h5>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                          ₹{item.product.price}
                                        </span>
                                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                          <span className="text-[11px] text-zinc-400 line-through">
                                            ₹{item.product.originalPrice}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-zinc-500">/{item.product.unit}</span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-zinc-700/70 rounded-xl p-1 shrink-0">
                                        <button
                                          onClick={() => updateItemQuantity(item.product.id, -1)}
                                          className="size-6 rounded-lg bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-zinc-500 transition text-xs font-bold"
                                        >
                                          -
                                        </button>
                                        <span className="w-5 text-center text-xs font-bold text-zinc-900 dark:text-white">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => updateItemQuantity(item.product.id, 1)}
                                          className="size-6 rounded-lg bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-zinc-500 transition text-xs font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Pantry Staples / Missing items note */}
              {missingItems.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-4">
                  <button
                    onClick={() => setShowMissingItems(!showMissingItems)}
                    className="flex items-center justify-between w-full text-left text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 text-amber-500" />
                      Pantry Staples / Spices Needed ({missingItems.length})
                    </span>
                    {showMissingItems ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {showMissingItems && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {missingItems.map((item, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300"
                        >
                          {item.name} ({item.quantityRequired})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        {recipe && matchedItems.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/90 border-t border-orange-100 dark:border-zinc-800 p-4 sm:p-5 px-6 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Selected Bundle Total:</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white">
                  ₹{selectedTotalPrice}
                </span>
                {selectedTotalSavings > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                    Save ₹{selectedTotalSavings}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {selectedItemsList.length} products ({selectedItemsList.reduce((s, i) => s + i.quantity, 0)} total units) ready for 1-click add
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={selectedItemsList.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <ShoppingCart className="size-5" />
                <span>Add {selectedItemsList.length} Items to Cart (₹{selectedTotalPrice})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeModal;
