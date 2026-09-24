import React, { useState, useEffect } from "react";
import { Sparkles, ChefHat, ArrowRight, Flame, Clock } from "lucide-react";
import api from "../../config/api";
import RecipeModal from "./RecipeModal";

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

export const RecipeBanner: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get("/ai/recipe-suggestions");
        if (res.data?.suggestions) {
          setSuggestions(res.data.suggestions);
        }
      } catch (err) {
        console.warn("Could not load suggestions in banner:", err);
      }
    };
    fetchSuggestions();
  }, []);

  const handleOpenWithPrompt = (promptText: string) => {
    setSelectedPrompt(promptText);
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl mb-12 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-10 text-white shadow-xl">
        {/* Glow & Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 size-72 rounded-full bg-yellow-300/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 size-60 rounded-full bg-rose-600/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Text & CTA */}
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-100 border border-white/20">
              <Sparkles className="size-3.5 text-yellow-200 animate-spin" />
              <span>AI Recipe-to-Cart Feature</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif leading-tight">
              Craving something special? <br />
              <span className="text-yellow-200">Let AI cook the cart for you.</span>
            </h2>

            <p className="text-sm sm:text-base text-orange-100 leading-relaxed max-w-lg">
              Type dish names like <em>"Paneer Butter Masala for 4"</em> or <em>"Healthy High-Protein Breakfast"</em>.
              Our Gemini AI extracts all necessary ingredients and adds them to your cart in 1 click!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleOpenWithPrompt("")}
                className="px-6 py-3.5 bg-white text-orange-600 font-bold rounded-2xl hover:bg-orange-50 transition shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-[0.98]"
              >
                <ChefHat className="size-5 text-orange-500" />
                <span>Try AI Recipe Chef</span>
                <ArrowRight className="size-4 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Right Preview Cards of Trending Dishes */}
          <div className="w-full lg:max-w-md grid grid-cols-2 gap-3 sm:gap-4">
            {suggestions.slice(0, 4).map((sug) => (
              <div
                key={sug.id}
                onClick={() => handleOpenWithPrompt(sug.prompt)}
                className="group relative cursor-pointer bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/30 text-white">
                    {sug.badge}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-yellow-100">
                    <Clock className="size-3" />
                    <span>{sug.prepTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 my-1">
                  <img
                    src={sug.image}
                    alt={sug.title}
                    className="size-12 rounded-xl object-contain bg-white/20 p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold truncate group-hover:text-yellow-200 transition">
                      {sug.title}
                    </h4>
                    <span className="text-[11px] text-orange-100 flex items-center gap-1 mt-0.5">
                      <Flame className="size-3 text-yellow-300" />
                      {sug.calories}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-yellow-200 group-hover:text-white">
                  <span>Get Ingredients</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Modal */}
      <RecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPrompt={selectedPrompt}
      />
    </>
  );
};

export default RecipeBanner;
