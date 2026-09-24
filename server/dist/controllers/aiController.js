import { prisma } from "../config/prisma.js";
import { genAI } from "../config/gemini.js";
// Helper regex escape
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Inappropriate / Profane words list to protect responses and prevent offensive messages
const OFFENSIVE_WORDS = [
    "bitch", "bastard", "fuck", "shit", "asshole", "idiot", "stupid", "madarchod",
    "behenchod", "bhenchod", "chutiya", "gandu", "harami", "kutta", "saala", "kamina",
    "mc", "bc", "dick", "pussy", "cunt", "nude", "porn", "sex"
];
// Conversational / greeting phrases
const GREETINGS_AND_CASUAL = [
    "hi", "hello", "hey", "hola", "namaste", "good morning", "good evening",
    "good afternoon", "who are you", "what can you do", "what are you", "help",
    "sup", "yo", "test", "testing", "ok", "okay", "bye", "goodbye", "thanks",
    "thank you", "how are you", "what is this", "tell me a joke"
];
// Truly non-food keywords
const NON_FOOD_KEYWORDS = [
    "weather", "car", "phone", "laptop", "code", "python", "javascript", "crypto",
    "bitcoin", "politics", "movie", "song", "dance", "game", "cricket", "football"
];
/**
 * Normalizes user queries:
 * 1. Handles common Indian/informal spellings (maggie -> maggi, omlet -> omelette, etc.)
 * 2. Strips intent boilerplate ("i want to make an", "how to cook", "bana do")
 * 3. Detects offensive words and food intent
 */
export function normalizeCookingQuery(rawPrompt) {
    const clean = rawPrompt.toLowerCase().trim();
    // Check for offensive words
    const isOffensive = OFFENSIVE_WORDS.some((badWord) => {
        const rx = new RegExp(`\\b${escapeRegex(badWord)}\\b`, "i");
        return rx.test(clean);
    });
    // Standardize phonetic and colloquial spellings
    let normalized = clean
        .replace(/\b(maggie|maggy|meggi|meggie|magi|mege)\b/gi, "maggi")
        .replace(/\b(noodles|chowmein|ramen|hakka noodles|wai wai|yippee|choumin)\b/gi, "noodles")
        .replace(/\b(omlet|omlete|omlette|omelet|half fry|bullseye)\b/gi, "omelette")
        .replace(/\b(bhurji|anda bhurji)\b/gi, "egg bhurji")
        // Paneer typo normalization — MUST be before kadhai so 'panner' → 'paneer'
        .replace(/\b(panir|paner|panner|panar|panear|pneer)\b/gi, "paneer")
        // Kadhai / Kadai / Karahi cooking vessel normalization
        .replace(/\b(kadhai|karahi|karai|kadai|kadahi|kadha)\b/gi, "kadhai")
        .replace(/\b(sandwhich|sandwitch)\b/gi, "sandwich")
        .replace(/\b(chiken|chikn)\b/gi, "chicken")
        .replace(/\b(chawal)\b/gi, "rice")
        .replace(/\b(anda|ande)\b/gi, "egg")
        .replace(/\b(tamatar|tamaatar)\b/gi, "tomato")
        .replace(/\b(pyaz|pyaaz|kanda|kande)\b/gi, "onion")
        .replace(/\b(shimla mirch|capsicum|bell pepper|shimalamirch)\b/gi, "capsicum")
        .replace(/\b(aloo|alu|batata)\b/gi, "potato")
        .replace(/\b(doodh|dhudh)\b/gi, "milk")
        .replace(/\b(palak)\b/gi, "spinach")
        .replace(/\b(gajar)\b/gi, "carrot")
        .replace(/\b(makhan|makkhan)\b/gi, "butter")
        .replace(/\b(chai|chay|chaai)\b/gi, "tea")
        .replace(/\b(kafi|cofy)\b/gi, "coffee")
        .replace(/\b(biriyani|briyani)\b/gi, "biryani")
        .replace(/\b(dosaa|dhosa)\b/gi, "dosa")
        .replace(/\b(idly)\b/gi, "idli")
        .replace(/\b(poha|pohe|pauwa)\b/gi, "poha")
        .replace(/\b(chole|chhole|choley)\b/gi, "chole")
        .replace(/\b(bhatura|bhature)\b/gi, "bhature")
        .replace(/\b(paratha|pratha|parantha|paranthas)\b/gi, "paratha");
    // Strip conversational preambles and articles
    let stripped = normalized
        .replace(/^(in|for|i want to cook|i want to make|i want to eat|i want to prepare|i feel like eating|i want|how to cook|how to make|how can i make|how do i make|can you make|recipe for|recipes for|teach me how to make|give me a recipe for|give me recipe for|make me|make|cook|prepare|craving for|craving|show me|tell me|get me|find me)(\s+(a|an|some|the))?\s+/gi, "")
        .replace(/^(a|an|some|the)\s+/gi, "")
        .replace(/\s+(recipe|recipes|dish|curry|sabzi|bana do|banao|banani hai|chahiye|khana hai|kaise banaye|ki recipe|bana ke do|banana hai|please|batao)$/gi, "")
        .replace(/\s+for\s+\d+\s*(people|persons|servings|serving|members|pax)?$/gi, "")
        .trim();
    // Words that indicate food or cooking intention
    const foodKeywords = [
        "maggi", "noodles", "paneer", "egg", "tea", "coffee", "rice", "roti", "bread",
        "sandwich", "cheese", "soup", "salad", "smoothie", "shake", "quinoa", "croissant",
        "cook", "make", "eat", "food", "dish", "recipe", "breakfast", "lunch", "dinner",
        "snack", "meal", "pasta", "biryani", "aloo", "potato", "spinach", "tomato", "onion",
        "curry", "dosa", "idli", "chole", "poha", "paratha", "fries",
        // Indian dish keywords that survive normalization
        "kadhai", "karahi", "makhani", "tikka", "masala", "sabzi", "bhurji", "halwa",
        "khichdi", "upma", "dalma", "korma", "biryani", "pulao", "raita"
    ];
    const hasCookingIntent = foodKeywords.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(normalized)) ||
        foodKeywords.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(clean));
    return {
        clean,
        normalized,
        detectedDish: stripped.length > 1 ? stripped : normalized,
        hasCookingIntent,
        isOffensive,
    };
}
// Curated Knowledge Base with 18+ rich recipes
const RECIPE_KNOWLEDGE_BASE = [
    {
        id: "kadhai-paneer",
        name: "Spicy Kadhai Paneer",
        aliases: [
            "kadhai paneer", "kadai paneer", "karahi paneer", "karai paneer",
            "kadhai panner", "kadai panner", "karahi panner",
            "kadha paneer", "kadha panner",
            "kadhai panir", "kadai panir",
            "kadhai masala paneer", "restaurant kadhai paneer",
            "spicy paneer", "dry paneer", "paneer masala", "paneer sabzi"
        ],
        description: "Bold, restaurant-style spicy cottage cheese stir-fry tossed in a fragrant dry kadhai masala with ripe tomatoes and crisp onions.",
        servings: 4,
        prepTime: "25-30 mins",
        calories: "360 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Medium",
        instructions: [
            "Cut fresh paneer into generous cubes; slice tomatoes and onions into thick wedges.",
            "Dry roast coriander seeds, dried red chillies, and cumin in a hot kadhai for 1 minute until fragrant. Grind coarsely.",
            "Heat oil in the kadhai, sauté onion wedges until slightly charred, then add ginger-garlic paste.",
            "Toss in chopped tomatoes and the ground kadhai masala. Cook on high flame for 4-5 minutes until oil separates.",
            "Add paneer cubes. Stir-fry together on high flame for 3-4 minutes until coated.",
            "Finish with crushed kasuri methi, a squeeze of lemon, and fresh coriander. Serve sizzling hot!"
        ],
        ingredients: [
            { name: "Fresh Paneer", searchTerms: ["paneer"], suggestedCount: 2, quantityRequired: "400g", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
        ]
    },
    {
        id: "classic-maggi",
        name: "Classic 2-Minute Maggi Noodles",
        aliases: [
            "maggi", "maggie", "maggy", "meggi", "meggie", "maggi noodles", "maggie noodles",
            "instant noodles", "noodles", "plain maggi", "plain maggie",
            "2 minute noodles", "two minute noodles", "meri maggie",
            "make maggi", "make maggie", "cook maggi", "cook maggie", "quick maggi",
            "how to make maggi", "how to cook maggi"
        ],
        description: "The iconic, comforting 2-minute instant noodles with the signature Tastemaker spice blend — ready in minutes.",
        servings: 2,
        prepTime: "5-8 mins",
        calories: "310 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Boil 1.5 cups of water in a pan over medium-high heat.",
            "Break the Maggi noodle cake in half and drop into the boiling water.",
            "Empty the authentic Maggi Tastemaker pouch into the pan and stir well.",
            "Cook for exactly 2 minutes, stirring occasionally until noodles are soft and the savory broth has reduced.",
            "Pour into a bowl and serve steaming hot!"
        ],
        ingredients: [
            { name: "Maggi Instant Noodles", searchTerms: ["maggi", "noodles"], suggestedCount: 2, quantityRequired: "280g pack", isCore: true },
        ]
    },
    {
        id: "cheese-maggi",
        name: "Cheesy Street-Style Maggi",
        aliases: [
            "cheese maggi", "cheese maggie", "cheesy maggi", "cheesy maggie"
        ],
        description: "Decadent street-style Maggi topped with gooey melted cheese and aromatic Tastemaker spices.",
        servings: 2,
        prepTime: "8-10 mins",
        calories: "410 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Boil 1.5 cups of water with the Maggi noodle cake and Tastemaker.",
            "Cook on medium flame for 2 minutes until noodles are tender.",
            "Place a generous slice or grated cheese on top and cover the pan with a lid for 30 seconds until melted.",
            "Garnish with a pinch of oregano or chilli flakes and enjoy hot!"
        ],
        ingredients: [
            { name: "Maggi Instant Noodles", searchTerms: ["maggi", "noodles"], suggestedCount: 2, quantityRequired: "280g pack", isCore: true },
            { name: "Cheese Slice / Block", searchTerms: ["cheese"], suggestedCount: 1, quantityRequired: "200g", isCore: true },
        ]
    },
    {
        id: "veggie-maggi",
        name: "Special Masala Veggie Maggi",
        aliases: [
            "veggie maggi", "veggie maggie", "vegetable maggi", "vegetable maggie",
            "masala maggi", "masala maggie", "street maggi"
        ],
        description: "Dhabha-style spiced instant noodles tossed with freshly diced onions and juicy ripe tomatoes.",
        servings: 2,
        prepTime: "10-12 mins",
        calories: "350 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Heat a pan with a little oil and sauté finely chopped onions until translucent.",
            "Add diced tomatoes and sauté until soft and pulpy.",
            "Pour in 1.5 cups of water and bring to a rolling boil.",
            "Add the Maggi noodle cake and Tastemaker sachet, cook for 2 minutes, and serve hot."
        ],
        ingredients: [
            { name: "Maggi Instant Noodles", searchTerms: ["maggi", "noodles"], suggestedCount: 2, quantityRequired: "280g pack", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
        ]
    },
    {
        id: "paneer-butter-masala",
        name: "Paneer Butter Masala",
        aliases: [
            "paneer butter masala", "paneer makhani", "butter paneer", "shahi paneer",
            "paneer gravy", "paneer tikka masala",
            "paneer makhni", "makhani paneer"
        ],
        description: "A rich, creamy North Indian restaurant-style cottage cheese curry with a buttery tomato gravy.",
        servings: 4,
        prepTime: "25-30 mins",
        calories: "380 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Medium",
        instructions: [
            "Cut fresh paneer into bite-sized cubes and lightly sauté in butter.",
            "Finely chop the onions and blend fresh tomatoes into a smooth puree.",
            "Heat butter/oil in a pan, sauté onions until golden brown, then add ginger-garlic and spices.",
            "Pour in tomato puree and cook until fragrant and oil starts to separate.",
            "Stir in a splash of fresh milk/cream, then gently fold in the paneer cubes.",
            "Simmer for 5 minutes on low flame and serve warm with naan, roti, or basmati rice."
        ],
        ingredients: [
            { name: "Fresh Paneer", searchTerms: ["paneer"], suggestedCount: 2, quantityRequired: "400g", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Milk", searchTerms: ["milk", "amul milk"], suggestedCount: 1, quantityRequired: "1L", isCore: true },
        ]
    },
    {
        id: "palak-paneer",
        name: "Healthy Palak Paneer",
        aliases: ["palak paneer", "spinach paneer", "saag paneer", "spinach cottage cheese", "palak", "spinach"],
        description: "Vibrant green spinach gravy infused with aromatic mild spices and soft paneer cubes.",
        servings: 3,
        prepTime: "20-25 mins",
        calories: "290 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Blanch fresh spinach leaves in hot boiling water for 2 minutes, then blend into a bright green puree.",
            "Sauté chopped onions and tomatoes in a pan with cumin, turmeric, and garam masala.",
            "Add the smooth spinach puree and simmer for 5-7 minutes.",
            "Gently add paneer cubes and a splash of milk for a velvety finish.",
            "Garnish with a dollop of butter and serve warm with hot rotis."
        ],
        ingredients: [
            { name: "Fresh Spinach (Palak)", searchTerms: ["spinach"], suggestedCount: 2, quantityRequired: "1 kg", isCore: true },
            { name: "Paneer", searchTerms: ["paneer"], suggestedCount: 1, quantityRequired: "200g", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Fresh Milk", searchTerms: ["milk"], suggestedCount: 1, quantityRequired: "1L", isCore: false },
        ]
    },
    {
        id: "egg-omelette-bhurji",
        name: "Classic Masala Egg Bhurji & Toast",
        aliases: [
            "egg bhurji", "scrambled eggs", "omelette", "egg omelet", "masala egg",
            "anda bhurji", "boiled eggs", "omlet", "omlete", "omlette", "egg toast",
            "half fry", "anda", "eggs", "boiled egg", "egg curry"
        ],
        description: "Street-style spiced scrambled eggs tossed with diced onions, tomatoes, and golden brown toast.",
        servings: 2,
        prepTime: "10-12 mins",
        calories: "320 kcal / serving",
        dietaryType: "Non-Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Heat a pan with oil/butter and sauté chopped onions and tomatoes until soft.",
            "Crack in farm fresh eggs and scramble continuously on medium flame.",
            "Season with salt, black pepper, and green chillies.",
            "Toast brown bread slices until crunchy and serve immediately."
        ],
        ingredients: [
            { name: "Farm Fresh Eggs", searchTerms: ["eggs", "egg"], suggestedCount: 1, quantityRequired: "12 pcs", isCore: true },
            { name: "Brown Bread", searchTerms: ["bread", "brown bread"], suggestedCount: 1, quantityRequired: "400g", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
        ]
    },
    {
        id: "high-protein-breakfast",
        name: "High-Protein Breakfast Power Plate",
        aliases: [
            "high protein breakfast", "protein breakfast", "gym breakfast", "fitness breakfast",
            "bodybuilding breakfast", "high protein meal", "fitness meal", "post workout meal"
        ],
        description: "Nutrient-packed morning power feast loaded with farm fresh eggs, whole grain brown bread, and ripe fruits.",
        servings: 2,
        prepTime: "12-15 mins",
        calories: "450 kcal / serving (35g Protein)",
        dietaryType: "High Protein",
        difficulty: "Easy",
        instructions: [
            "Whisk eggs with a pinch of salt, pepper, and finely diced onions and tomatoes.",
            "Cook into fluffy scrambled eggs or a golden omelette in a pan.",
            "Toast slices of wholesome brown bread until golden and crisp.",
            "Serve hot alongside freshly sliced bananas or oranges for natural electrolytes."
        ],
        ingredients: [
            { name: "Farm Fresh Eggs", searchTerms: ["eggs", "egg"], suggestedCount: 1, quantityRequired: "12 pcs", isCore: true },
            { name: "Brown Bread", searchTerms: ["brown bread", "bread"], suggestedCount: 1, quantityRequired: "400g", isCore: true },
            { name: "Banana", searchTerms: ["banana"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
            { name: "Amul Milk", searchTerms: ["milk"], suggestedCount: 1, quantityRequired: "1L", isCore: false },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: false },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
        ]
    },
    {
        id: "homestyle-aloo-sabzi",
        name: "Homestyle Aloo Sabzi & Warm Rotis",
        aliases: [
            "aloo sabzi", "potato curry", "aloo roti", "aloo gobi", "jeera aloo",
            "dum aloo", "potato sabzi", "aloo pyaz", "aloo", "potato", "potatoes"
        ],
        description: "A comforting everyday spiced potato curry paired with soft, wholesome wheat rotis.",
        servings: 4,
        prepTime: "25 mins",
        calories: "310 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Boil, peel, and dice fresh potatoes into bite-sized chunks.",
            "Sauté cumin, chopped onions, and tomatoes in a pan with turmeric and red chilli.",
            "Toss potatoes into the masala and simmer with water for 5 minutes.",
            "Knead wheat flour into soft dough and roll fresh, warm rotis to pair."
        ],
        ingredients: [
            { name: "Fresh Potato", searchTerms: ["potato"], suggestedCount: 2, quantityRequired: "1 kg", isCore: true },
            { name: "Wheat Flour", searchTerms: ["wheat flour", "flour"], suggestedCount: 1, quantityRequired: "5kg", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
        ]
    },
    {
        id: "veg-biryani-rice",
        name: "Aromatic Veg Biryani & Jeera Rice",
        aliases: [
            "biryani", "veg biryani", "pulao", "jeera rice", "fried rice", "rice meal",
            "khichdi", "dal rice", "biriyani", "pulav", "rice"
        ],
        description: "Royal fragrant Basmati rice slow-cooked with fresh onions, carrots, potatoes, and mild whole spices.",
        servings: 4,
        prepTime: "30 mins",
        calories: "410 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Medium",
        instructions: [
            "Wash and soak long-grain Basmati rice for 15 minutes.",
            "Sauté sliced onions until golden brown, then add diced carrots, potatoes, and tomatoes.",
            "Add whole spices, biryani masala, and soaked rice with 2 cups of water.",
            "Cover and simmer on low flame (dum) for 15 minutes until grains are fluffy."
        ],
        ingredients: [
            { name: "Basmati Rice", searchTerms: ["basmati rice", "rice"], suggestedCount: 1, quantityRequired: "5kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Carrot", searchTerms: ["carrot"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Potato", searchTerms: ["potato"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
        ]
    },
    {
        id: "creamy-tomato-pasta",
        name: "Creamy Tomato & Cheese Pasta",
        aliases: [
            "pasta", "macaroni", "spaghetti", "tomato pasta", "cheese pasta", "italian pasta",
            "white sauce pasta", "red sauce pasta", "cheesy pasta"
        ],
        description: "Italian-style pasta coated in a tangy fresh tomato-basil sauce, finished with melted cheese and fresh milk.",
        servings: 3,
        prepTime: "20 mins",
        calories: "390 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Boil pasta in salted water until al dente.",
            "Make fresh sauce by sautéing onions, garlic, and pureed ripe tomatoes.",
            "Add fresh milk and grated cheese into the sauce for a velvety texture.",
            "Toss in the boiled pasta, season with herbs, and serve hot."
        ],
        ingredients: [
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Cheese Block / Slice", searchTerms: ["cheese"], suggestedCount: 1, quantityRequired: "200g", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Milk", searchTerms: ["milk"], suggestedCount: 1, quantityRequired: "1L", isCore: false },
        ]
    },
    {
        id: "grilled-cheese-sandwich",
        name: "Golden Grilled Cheese Sandwich",
        aliases: [
            "cheese sandwich", "grilled sandwich", "sandwich", "veg sandwich", "toast sandwich",
            "cheese toast", "bread butter", "sandwhich", "sandwitch", "toast", "grilled cheese", "bread"
        ],
        description: "Crispy golden toasted brown bread layered with melting cheese, sliced tomatoes, and crisp onions.",
        servings: 2,
        prepTime: "10 mins",
        calories: "310 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Butter both sides of brown bread slices.",
            "Layer generously with cheese slices, thinly cut onions, and fresh tomato rounds.",
            "Toast on a heated pan or sandwich press until golden brown and cheese is bubbling.",
            "Slice diagonally and serve hot with dip or soup!"
        ],
        ingredients: [
            { name: "Brown Bread", searchTerms: ["brown bread", "bread"], suggestedCount: 1, quantityRequired: "400g", isCore: true },
            { name: "Cheese 200g", searchTerms: ["cheese"], suggestedCount: 1, quantityRequired: "200g", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: false },
        ]
    },
    {
        id: "healthy-fruit-bowl",
        name: "Superfood Fruit & Smoothie Bowl",
        aliases: [
            "fruit salad", "smoothie bowl", "fruit bowl", "fruits", "banana shake",
            "mango shake", "apple smoothie", "healthy salad", "fruit chaat", "fruit plate", "fruit"
        ],
        description: "A revitalizing antioxidant bowl featuring fresh crisp apples, ripe bananas, juicy mangoes, grapes, and chilled milk.",
        servings: 2,
        prepTime: "8 mins",
        calories: "220 kcal / serving",
        dietaryType: "Vegan/Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Wash and chop apples, bananas, and sweet mangoes into bite-sized chunks.",
            "Blend half the fruit mix with chilled fresh milk into a creamy base.",
            "Pour into bowls, top with sliced fruits, juicy grapes, and organic quinoa.",
            "Serve chilled for instant natural energy and essential vitamins!"
        ],
        ingredients: [
            { name: "Fresh Apple", searchTerms: ["apple"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Ripe Banana", searchTerms: ["banana"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Sweet Mango", searchTerms: ["mango"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
            { name: "Fresh Grapes", searchTerms: ["grapes"], suggestedCount: 1, quantityRequired: "500g", isCore: false },
            { name: "Orange", searchTerms: ["orange"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
            { name: "Amul Milk", searchTerms: ["milk"], suggestedCount: 1, quantityRequired: "1L", isCore: false },
        ]
    },
    {
        id: "quinoa-fitness-bowl",
        name: "Mediterranean Protein Quinoa Salad",
        aliases: [
            "quinoa", "quinoa salad", "quinoa bowl", "weight loss salad", "healthy diet",
            "keto salad", "low carb meal", "superfood salad"
        ],
        description: "Gluten-free, fiber-dense superfood salad with cooked organic quinoa, crunchy carrots, onions, tomatoes, and spinach.",
        servings: 2,
        prepTime: "15 mins",
        calories: "280 kcal / serving",
        dietaryType: "Gluten-Free / Vegan",
        difficulty: "Easy",
        instructions: [
            "Rinse organic quinoa and boil in 1 cup of water for 12 minutes until fluffy.",
            "Chop fresh spinach, crunchy carrots, tomatoes, and onions.",
            "Toss the warm quinoa with the chopped veggies and lemon dressing.",
            "Serve warm or chilled for a guilt-free nutrient boost."
        ],
        ingredients: [
            { name: "Organic Quinoa", searchTerms: ["quinoa"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Spinach", searchTerms: ["spinach"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Carrot", searchTerms: ["carrot"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
        ]
    },
    {
        id: "soup-and-bread",
        name: "Comforting Hot Vegetable Soup & Warm Bread",
        aliases: [
            "soup", "cup soup", "knorr soup", "tomato soup", "vegetable soup", "hot soup",
            "sick food", "light dinner"
        ],
        description: "A soothing bowl of steaming soup paired with lightly toasted brown bread and butter croissant.",
        servings: 2,
        prepTime: "8 mins",
        calories: "190 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Mix Knorr soup mix with boiling water and simmer for 3 minutes.",
            "Toast brown bread or warm butter croissants in a toaster or pan.",
            "Pour hot soup into bowls, garnish with a swirl of milk/butter, and dip warm bread!"
        ],
        ingredients: [
            { name: "Knorr Cup Soup", searchTerms: ["soup", "knorr"], suggestedCount: 2, quantityRequired: "70g", isCore: true },
            { name: "Brown Bread", searchTerms: ["brown bread", "bread"], suggestedCount: 1, quantityRequired: "400g", isCore: true },
            { name: "Fresh Carrot", searchTerms: ["carrot"], suggestedCount: 1, quantityRequired: "500g", isCore: false },
        ]
    },
    {
        id: "chai-and-milk",
        name: "Authentic Masala Milk Chai",
        aliases: [
            "chai", "tea", "masala chai", "kadak chai", "adrak chai", "chay", "chaai", "milk tea"
        ],
        description: "Classic Indian spiced milk tea brewed to perfection with fresh milk and aromatic spices.",
        servings: 2,
        prepTime: "8 mins",
        calories: "160 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Boil fresh milk with crushed ginger, cardamom, and tea leaves.",
            "Simmer for 4-5 minutes until rich golden brown.",
            "Strain into warm mugs and serve steaming hot!"
        ],
        ingredients: [
            { name: "Fresh Milk", searchTerms: ["milk", "amul milk"], suggestedCount: 1, quantityRequired: "1L", isCore: true },
        ]
    },
    {
        id: "creamy-cold-coffee",
        name: "Chilled Creamy Cold Coffee",
        aliases: [
            "cold coffee", "iced coffee", "chilled coffee", "frappe", "coffee shake",
            "milk coffee", "coffee", "kafi"
        ],
        description: "A rich, frothy, café-style iced cold coffee blended with chilled Amul milk.",
        servings: 2,
        prepTime: "5 mins",
        calories: "180 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Whisk instant coffee powder and sugar with 2 tbsp warm water until light and frothy.",
            "Add chilled Amul milk and ice cubes into a blender.",
            "Blend on high speed for 60 seconds until thick and foamy.",
            "Pour into tall glasses and serve chilled!"
        ],
        ingredients: [
            { name: "Amul Milk 1L", searchTerms: ["milk", "amul milk"], suggestedCount: 1, quantityRequired: "1L", isCore: true },
        ]
    },
    {
        id: "fresh-croissant-snack",
        name: "Warm Butter Croissant & Hot Milk",
        aliases: ["croissant", "croissants", "butter croissant", "bakery croissant"],
        description: "Flaky, golden French bakery croissants served warm with fresh milk.",
        servings: 2,
        prepTime: "5 mins",
        calories: "280 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Warm the butter croissants in an oven or pan until crisp and fragrant.",
            "Serve warm alongside a glass of fresh milk or hot beverage."
        ],
        ingredients: [
            { name: "Butter Croissant", searchTerms: ["croissant"], suggestedCount: 2, quantityRequired: "100g", isCore: true },
            { name: "Fresh Milk", searchTerms: ["milk", "amul milk"], suggestedCount: 1, quantityRequired: "1L", isCore: true },
        ]
    },
    {
        id: "comforting-dal-rice",
        name: "Homestyle Dal & Steamed Basmati Rice",
        aliases: [
            "dal", "dal tadka", "dal rice", "yellow dal", "dal khichdi", "toor dal",
            "khichdi", "comfort food"
        ],
        description: "Heartwarming spiced yellow lentil curry tempered with cumin, onions, and tomatoes, served over steaming Basmati rice.",
        servings: 4,
        prepTime: "25 mins",
        calories: "340 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Wash and cook Basmati rice until soft and fluffy.",
            "In a pan, temper cumin seeds in oil, then sauté finely chopped onions and ripe tomatoes.",
            "Add turmeric, salt, and lentils, simmering for 10-12 minutes.",
            "Serve warm over steaming rice with sliced onions on the side."
        ],
        ingredients: [
            { name: "Basmati Rice", searchTerms: ["basmati rice", "rice"], suggestedCount: 1, quantityRequired: "5kg", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Potato", searchTerms: ["potato"], suggestedCount: 1, quantityRequired: "500g", isCore: false },
        ]
    },
    {
        id: "fresh-banana-shake",
        name: "Thick Banana & Milk Energy Smoothie",
        aliases: ["banana shake", "banana smoothie", "banana milk", "kela shake", "banana drink"],
        description: "Thick, naturally sweetened energy milkshake crafted with fresh ripe bananas and chilled milk.",
        servings: 2,
        prepTime: "5 mins",
        calories: "230 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Peel and slice fresh ripe bananas.",
            "Add bananas, chilled Amul milk, and optional honey into a blender.",
            "Blend until smooth, creamy, and frothy.",
            "Pour into glasses and serve fresh for an instant energy boost."
        ],
        ingredients: [
            { name: "Banana", searchTerms: ["banana"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Amul Milk", searchTerms: ["milk"], suggestedCount: 1, quantityRequired: "1L", isCore: true },
            { name: "Apple", searchTerms: ["apple"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
        ]
    },
    {
        id: "crispy-french-fries",
        name: "Crispy Golden Potato Fries / Wedges",
        aliases: ["french fries", "fries", "potato wedges", "fried aloo", "potato snack", "chips"],
        description: "Crispy exterior, fluffy interior potato fries seasoned with salt, herbs, and melted cheese dip.",
        servings: 3,
        prepTime: "20 mins",
        calories: "290 kcal / serving",
        dietaryType: "Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Wash, peel, and cut fresh potatoes into even finger-length batons.",
            "Soak in cold water for 10 minutes to remove excess starch, then pat completely dry.",
            "Shallow fry or air fry until golden and crispy.",
            "Toss with salt, pepper, and serve alongside melted cheese!"
        ],
        ingredients: [
            { name: "Fresh Potato", searchTerms: ["potato"], suggestedCount: 2, quantityRequired: "1 kg", isCore: true },
            { name: "Cheese 200g", searchTerms: ["cheese"], suggestedCount: 1, quantityRequired: "200g", isCore: false },
            { name: "Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: false },
        ]
    },
    {
        id: "healthy-green-salad",
        name: "Fresh Garden Green Salad",
        aliases: ["green salad", "salad", "raw salad", "diet salad", "cucumber tomato salad", "fresh salad"],
        description: "A crisp, hydrating salad packed with fresh spinach, carrots, juicy tomatoes, and sliced onions with lemon seasoning.",
        servings: 2,
        prepTime: "8 mins",
        calories: "120 kcal / serving",
        dietaryType: "Vegan/Vegetarian",
        difficulty: "Easy",
        instructions: [
            "Wash fresh spinach thoroughly and pat dry.",
            "Slice carrots, onions, and tomatoes into thin rounds.",
            "Toss all fresh greens in a bowl with a pinch of salt and lemon juice.",
            "Serve crisp and fresh as a nutrient-dense side or light meal."
        ],
        ingredients: [
            { name: "Fresh Spinach", searchTerms: ["spinach"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Carrot", searchTerms: ["carrot"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
        ]
    }
];
/**
 * Checks if prompt is greeting, inappropriate, or non-food query
 */
function isGreetingOrNonFood(prompt) {
    const { clean, normalized, hasCookingIntent, isOffensive } = normalizeCookingQuery(prompt);
    // 1. Inappropriate / Offensive language guard
    if (isOffensive) {
        return {
            isNonFood: true,
            reason: "Hello! 👋 I am your AI Recipe Chef. I'm here to help you whip up mouthwatering recipes and assemble quick grocery carts with pure culinary care. What delicious meal or snack would you like to cook today?",
            isOffensive: true,
        };
    }
    // 2. If it clearly has cooking or food intent (like "maggie", "maggi", "egg", "tea"), it's NEVER non-food!
    if (hasCookingIntent) {
        return { isNonFood: false, reason: "", isOffensive: false };
    }
    if (!clean || clean.length < 2) {
        return {
            isNonFood: true,
            reason: "Please enter a specific dish or recipe name to get started!",
            isOffensive: false,
        };
    }
    // 3. Exact greeting match
    if (GREETINGS_AND_CASUAL.includes(clean)) {
        return {
            isNonFood: true,
            reason: "Hello! 👋 I am your AI Recipe Chef. Tell me what dish or meal you'd like to cook — for example: 'Street Style Masala Maggi', 'Paneer Butter Masala', or 'Classic Masala Omelette'!",
            isOffensive: false,
        };
    }
    // Short queries under 4 letters that aren't specific foods
    const validShortFoods = ["tea", "egg", "dal", "sub", "bun", "pie", "jam", "dip"];
    if (clean.length <= 3 && !validShortFoods.includes(clean)) {
        return {
            isNonFood: true,
            reason: `"${prompt}" is a bit short. Try asking for a meal like "Quick Masala Maggi", "Paneer Butter Masala", or "Egg Omelette".`,
            isOffensive: false,
        };
    }
    // Non-food keyword check
    for (const word of NON_FOOD_KEYWORDS) {
        const wordRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
        if (wordRegex.test(clean) || wordRegex.test(normalized)) {
            return {
                isNonFood: true,
                reason: `I am specialized in cooking recipes and fresh groceries! Let me know what you'd like to cook, such as 'Veggie Maggi', 'Paneer Butter Masala', or 'Egg Bhurji'.`,
                isOffensive: false,
            };
        }
    }
    return { isNonFood: false, reason: "", isOffensive: false };
}
/**
 * Parses user recipe prompt using Google Gemini LLM with resilience
 */
async function parseRecipeWithGemini(prompt, servings = 4) {
    if (!genAI)
        return null;
    // Multi-model fallback list in order of preference
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2,
                },
            });
            const aiPrompt = `
You are an expert culinary chef and smart grocery curator for Blinkit, India's leading quick-commerce delivery platform.
You think exactly like Claude, ChatGPT, or Gemini Advanced — precise, culturally aware, and ingredient-accurate.

User request: "${prompt}" (for ${servings} servings)

===== CORE RULES =====

1. DIALECT & COLLOQUIAL UNDERSTANDING:
   Understand casual, Hinglish, and misspelled food queries perfectly:
   - "maggie", "maggy", "meggi", "magi", "maggie noodles" → Masala Veggie Maggi (2-minute noodles)
   - "omlet", "anda bhurji", "anda", "egg toast" → Classic Masala Egg Bhurji
   - "chai", "adrak chai", "kadak chai" → Masala Milk Chai
   - "cheese sandwich", "bread butter" → Golden Grilled Cheese Sandwich
   - "cold coffee", "iced coffee" → Chilled Creamy Cold Coffee
   - "kadhai paneer", "kadai paneer", "karahi paneer", "kadhai panner" → Spicy Kadhai Paneer (stir-fry, dry, NOT makhani/butter gravy)
   - "paneer butter masala", "paneer makhani", "butter paneer" → Rich Paneer Butter Masala (gravy, creamy)
   - "aloo sabzi", "dum aloo", "jeera aloo" → Homestyle Aloo Sabzi
   Any food/snack/drink/meal desire = valid recipe request!

2. CRITICALLY IMPORTANT — RECIPE PRECISION (dish names must match actual dishes):
   NEVER confuse similar dishes:
   ❌ WRONG: Returning Maggi for "kadhai paneer"
   ❌ WRONG: Returning Paneer Butter Masala for "Kadhai Paneer" (they are DIFFERENT dishes)
   ✅ RIGHT: Kadhai Paneer = dry spicy stir-fry, NOT creamy gravy
   ✅ RIGHT: Paneer Butter Masala = creamy tomato-butter gravy dish

   "isCore: true" means: WITHOUT this ingredient, the dish CANNOT be made at all.
   "isCore: false" means: This is an optional, nice-to-have upgrade (garnish, topping, variation).

   EXAMPLES OF CORRECT isCore CLASSIFICATION:
   ✅ Maggi recipe:
      - Maggi Noodles pack → isCore: TRUE (the dish IS this item)
      - Onion, Tomato, Carrot → isCore: FALSE (optional veggie add-ins, Maggi works without them)
      - Cheese, Butter → isCore: FALSE (optional toppings)
   ✅ Paneer Butter Masala:
      - Paneer → isCore: TRUE (main protein)
      - Tomato, Onion, Milk/Cream → isCore: TRUE (essential for the gravy)
      - Butter → isCore: TRUE (defines the dish)
   ✅ Masala Omelette:
      - Eggs → isCore: TRUE
      - Onion, Tomato → isCore: TRUE (part of masala)
      - Bread → isCore: FALSE (optional side)
   ✅ Grilled Cheese Sandwich:
      - Bread → isCore: TRUE
      - Cheese → isCore: TRUE
      - Tomato, Onion → isCore: FALSE (optional fillings)
   ✅ Chai (Masala Tea):
      - Milk → isCore: TRUE
      - Ginger → isCore: TRUE (in store: may not have exact match, skip)
   ✅ Banana Milkshake:
      - Banana → isCore: TRUE
      - Milk → isCore: TRUE
      - Apple → isCore: FALSE (optional fruit mix-in)

3. INGREDIENT SEARCH TERMS — match to Blinkit store catalog:
   Available catalog keywords (use ONLY these searchTerms):
   ["maggi", "noodles"], ["paneer"], ["cheese"], ["milk", "amul milk"],
   ["eggs", "egg"], ["onion"], ["tomato"], ["potato"], ["spinach"],
   ["carrot"], ["rice", "basmati rice"], ["bread", "brown bread"],
   ["banana"], ["apple"], ["mango"], ["orange"], ["grapes"],
   ["quinoa"], ["soup", "knorr"], ["croissant", "butter"]

4. RESPONSE FORMAT — return ONLY strict valid JSON, no markdown:

For non-food queries (greetings, jokes, tech, repair, crypto, etc.):
{
  "isValidRecipe": false,
  "clarificationMessage": "Hello! 👋 I am your AI Recipe Chef. Tell me what you'd love to cook — Maggi, Paneer Butter Masala, Masala Omelette, or anything else!"
}

For valid food requests:
{
  "isValidRecipe": true,
  "recipeName": "Dish title (max 6 words)",
  "dishDescription": "1-2 appetizing sentences describing the dish",
  "servings": ${servings},
  "prepTime": "e.g. 10 mins",
  "calories": "e.g. 320 kcal / serving",
  "dietaryType": "Vegetarian | Non-Vegetarian | Vegan | Gluten-Free | High Protein",
  "difficulty": "Easy | Medium | Hard",
  "instructions": [
    "Step 1: Clear, concise cooking action",
    "Step 2: ..."
  ],
  "ingredients": [
    {
      "name": "Ingredient display name (add ' (optional)' suffix if isCore is false)",
      "searchTerms": ["catalog_keyword"],
      "suggestedCount": 1,
      "quantityRequired": "e.g. 280g pack",
      "isCore": true
    }
  ]
}

REMINDER: Only include ingredients that are ACTUALLY needed for the dish. Do NOT add unrelated items (e.g. don't add Croissant or Carrot to a basic Maggi recipe unless the user explicitly asked for them).
`;
            const result = await model.generateContent(aiPrompt);
            const responseText = result.response.text();
            if (responseText) {
                const parsed = JSON.parse(responseText);
                if (parsed && typeof parsed.isValidRecipe === "boolean") {
                    return parsed;
                }
            }
        }
        catch (error) {
            console.warn(`Gemini model ${modelName} call skipped or rate-limited:`, error);
            continue;
        }
    }
    return null;
}
/**
 * Intelligent Fallback Matcher with Word-Boundary & Stem Accuracy
 */
function parseRecipeFallback(rawPrompt, requestedServings = 4) {
    const { clean, normalized, detectedDish, hasCookingIntent } = normalizeCookingQuery(rawPrompt);
    // 1. Precise Alias & Word-Boundary Match in Knowledge Base
    let bestMatch = null;
    let highestMatchScore = 0;
    for (const recipe of RECIPE_KNOWLEDGE_BASE) {
        for (const alias of recipe.aliases) {
            const aliasLower = alias.toLowerCase().trim();
            // Direct exact equality with detected dish or normalized query
            if (aliasLower === detectedDish || aliasLower === normalized || aliasLower === clean) {
                return {
                    isValidRecipe: true,
                    recipeName: recipe.name,
                    dishDescription: recipe.description,
                    servings: requestedServings || recipe.servings,
                    prepTime: recipe.prepTime,
                    calories: recipe.calories,
                    dietaryType: recipe.dietaryType,
                    difficulty: recipe.difficulty,
                    instructions: recipe.instructions,
                    ingredients: recipe.ingredients,
                };
            }
            // Check if all words in alias are present in the prompt (checking both normalized and raw)
            const aliasWords = aliasLower.split(/\s+/);
            const matchesInClean = aliasWords.every((word) => {
                const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
                return regex.test(clean) || regex.test(normalized);
            });
            if (matchesInClean) {
                const score = aliasWords.length * 15 + (clean.includes(aliasLower) ? 20 : 0);
                if (score > highestMatchScore) {
                    highestMatchScore = score;
                    bestMatch = recipe;
                }
            }
        }
    }
    if (bestMatch) {
        return {
            isValidRecipe: true,
            recipeName: bestMatch.name,
            dishDescription: bestMatch.description,
            servings: requestedServings || bestMatch.servings,
            prepTime: bestMatch.prepTime,
            calories: bestMatch.calories,
            dietaryType: bestMatch.dietaryType,
            difficulty: bestMatch.difficulty,
            instructions: bestMatch.instructions,
            ingredients: bestMatch.ingredients,
        };
    }
    // 2. Dynamic Ingredient Extractor (matching food terms across prompt)
    const extractedIngredients = [];
    const catalogVocab = [
        { words: ["maggi", "maggie", "maggy", "meggi", "meggie", "noodles", "noodle", "chowmein", "ramen", "yippee", "wai wai"], name: "Maggi Instant Noodles", terms: ["maggi", "noodles"], count: 2, qty: "280g pack", core: true },
        { words: ["paneer", "panir", "cottage cheese"], name: "Fresh Paneer", terms: ["paneer"], count: 2, qty: "400g", core: true },
        { words: ["cheese", "cheesy"], name: "Cheese Block / Slice", terms: ["cheese"], count: 1, qty: "200g", core: true },
        { words: ["milk", "doodh", "amul milk"], name: "Fresh Milk", terms: ["milk", "amul milk"], count: 1, qty: "1L", core: true },
        { words: ["egg", "eggs", "anda", "ande", "omelette", "omlet", "bhurji"], name: "Farm Fresh Eggs", terms: ["eggs", "egg"], count: 1, qty: "12 pcs", core: true },
        { words: ["tomato", "tomatoes", "tamatar"], name: "Fresh Tomato", terms: ["tomato"], count: 1, qty: "1 kg", core: true },
        { words: ["onion", "onions", "pyaz", "pyaaz"], name: "Onion", terms: ["onion"], count: 1, qty: "500g", core: true },
        { words: ["potato", "potatoes", "aloo", "alu", "fries"], name: "Fresh Potato", terms: ["potato"], count: 1, qty: "500g", core: true },
        { words: ["spinach", "palak"], name: "Fresh Spinach", terms: ["spinach"], count: 1, qty: "500g", core: true },
        { words: ["carrot", "carrots", "gajar"], name: "Fresh Carrot", terms: ["carrot"], count: 1, qty: "500g", core: true },
        { words: ["rice", "chawal", "basmati", "biryani", "pulao"], name: "Basmati Rice", terms: ["rice", "basmati"], count: 1, qty: "1-5 kg", core: true },
        { words: ["flour", "atta", "roti", "wheat"], name: "Wheat Flour", terms: ["flour", "wheat flour"], count: 1, qty: "5kg", core: true },
        { words: ["bread", "toast", "sandwich"], name: "Brown Bread", terms: ["bread", "brown bread"], count: 1, qty: "400g", core: true },
        { words: ["apple", "apples", "seb"], name: "Fresh Apple", terms: ["apple"], count: 1, qty: "1 kg", core: true },
        { words: ["banana", "bananas", "kela"], name: "Ripe Banana", terms: ["banana"], count: 1, qty: "1 kg", core: true },
        { words: ["mango", "mangoes", "aam"], name: "Sweet Mango", terms: ["mango"], count: 1, qty: "1 kg", core: true },
        { words: ["grape", "grapes", "angoor"], name: "Fresh Grapes", terms: ["grapes"], count: 1, qty: "500g", core: true },
        { words: ["orange", "oranges", "santra"], name: "Fresh Orange", terms: ["orange"], count: 1, qty: "1 kg", core: false },
        { words: ["soup", "knorr"], name: "Knorr Cup Soup", terms: ["soup", "knorr"], count: 2, qty: "70g", core: true },
        { words: ["quinoa"], name: "Organic Quinoa", terms: ["quinoa"], count: 1, qty: "500g", core: true },
        { words: ["croissant"], name: "Butter Croissant", terms: ["croissant"], count: 1, qty: "100g", core: true },
        { words: ["coffee", "kafi", "frappe"], name: "Amul Milk 1L", terms: ["milk", "amul milk"], count: 1, qty: "1L", core: true },
        { words: ["tea", "chai"], name: "Amul Milk 1L", terms: ["milk", "amul milk"], count: 1, qty: "1L", core: true },
    ];
    for (const item of catalogVocab) {
        for (const w of item.words) {
            const regex = new RegExp(`\\b${escapeRegex(w)}\\b`, "i");
            if (regex.test(clean) || regex.test(normalized)) {
                if (!extractedIngredients.some((i) => i.name === item.name)) {
                    extractedIngredients.push({
                        name: item.name,
                        searchTerms: item.terms,
                        suggestedCount: item.count,
                        quantityRequired: item.qty,
                        isCore: item.core,
                    });
                }
                break;
            }
        }
    }
    if (extractedIngredients.length > 0 || hasCookingIntent) {
        const rawDish = detectedDish || "Homemade Specialty Dish";
        const title = rawDish.charAt(0).toUpperCase() + rawDish.slice(1);
        // If no ingredients matched from catalog yet, provide sensible generic basics (NOT Maggi!)
        const finalIngredients = extractedIngredients.length > 0 ? extractedIngredients : [
            { name: "Onion", searchTerms: ["onion"], suggestedCount: 1, quantityRequired: "500g", isCore: true },
            { name: "Fresh Tomato", searchTerms: ["tomato"], suggestedCount: 1, quantityRequired: "1 kg", isCore: true },
            { name: "Fresh Paneer", searchTerms: ["paneer"], suggestedCount: 1, quantityRequired: "200g", isCore: false },
        ];
        return {
            isValidRecipe: true,
            recipeName: title.length > 2 ? title : "Custom Homemade Dish",
            dishDescription: `A delicious homemade preparation of ${title} crafted with fresh, handpicked groceries.`,
            servings: requestedServings,
            prepTime: "15-20 mins",
            calories: "340 kcal / serving",
            dietaryType: clean.includes("egg") ? "Non-Vegetarian" : "Vegetarian",
            difficulty: "Easy",
            instructions: [
                `Wash and prep all fresh ingredients and spices.`,
                `Heat a pan with a splash of oil or butter and sauté aromatics until fragrant.`,
                `Add the key ingredients and simmer on medium flame until cooked through.`,
                `Season to taste and serve piping hot!`
            ],
            ingredients: finalIngredients,
        };
    }
    // Warm, respectful, polite clarification message
    return {
        isValidRecipe: false,
        clarificationMessage: `I would love to help you cook! While I find the ideal recipe for "${rawPrompt}", here are some quick and delicious recipes you can make in minutes:`,
    };
}
/**
 * Main Controller: POST /api/ai/recipe-to-cart
 */
export const recipeToCart = async (req, res) => {
    try {
        const { prompt, servings } = req.body;
        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                isGreeting: true,
                message: "Please enter a dish name or recipe request to get started!",
            });
        }
        const rawPrompt = prompt.trim();
        const servingCount = Number(servings) || 4;
        // 1. Fast Greeting, Inappropriate & Non-Food Check
        const check = isGreetingOrNonFood(rawPrompt);
        if (check.isNonFood) {
            return res.status(200).json({
                success: false,
                isGreeting: true,
                message: check.reason,
                suggestedPrompts: [
                    "Street Style Masala Maggi for 2",
                    "Paneer Butter Masala for 4",
                    "Classic Masala Egg Bhurji & Toast",
                    "Golden Grilled Cheese Sandwich",
                    "Chilled Creamy Cold Coffee"
                ],
            });
        }
        // 2. Parse Recipe using Gemini LLM with Fallback
        let recipeData = await parseRecipeWithGemini(rawPrompt, servingCount);
        if (!recipeData || !recipeData.ingredients) {
            recipeData = parseRecipeFallback(rawPrompt, servingCount);
        }
        // If AI or Fallback determined it's not a valid recipe
        if (!recipeData || recipeData.isValidRecipe === false) {
            return res.status(200).json({
                success: false,
                isGreeting: true,
                message: recipeData?.clarificationMessage ||
                    `I'd love to help you cook! Tell me what dish you have in mind, or try one of our trending chef recipes below:`,
                suggestedPrompts: [
                    "Street Style Masala Maggi for 2",
                    "Paneer Butter Masala for 4",
                    "Classic Masala Egg Bhurji & Toast",
                    "Golden Grilled Cheese Sandwich",
                    "Chilled Creamy Cold Coffee"
                ],
            });
        }
        // 3. Fetch Active In-Stock Products from Database
        const dbProducts = await prisma.product.findMany({
            where: {
                stock: { gt: 0 },
            },
        });
        const productsWithDiscount = dbProducts.map((p) => {
            const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
            return { ...p, discount };
        });
        // 4. Match Ingredients to Products
        const matchedItems = [];
        const missingItems = [];
        const usedProductIds = new Set();
        for (const ingredient of recipeData.ingredients) {
            const searchTerms = Array.isArray(ingredient.searchTerms)
                ? ingredient.searchTerms
                : [ingredient.name.toLowerCase()];
            let bestProduct = null;
            let highestScore = 0;
            for (const prod of productsWithDiscount) {
                if (usedProductIds.has(prod.id))
                    continue;
                const prodName = prod.name.toLowerCase();
                const prodDesc = (prod.description || "").toLowerCase();
                const prodCat = (prod.category || "").toLowerCase();
                let score = 0;
                for (const term of searchTerms) {
                    const t = term.toLowerCase().trim();
                    if (!t)
                        continue;
                    // Word boundary exact match bonus
                    const wordRegex = new RegExp(`\\b${escapeRegex(t)}\\b`, "i");
                    if (wordRegex.test(prodName)) {
                        score += 25;
                    }
                    else if (prodName.includes(t)) {
                        score += 10;
                    }
                    if (wordRegex.test(prodDesc)) {
                        score += 8;
                    }
                    else if (prodDesc.includes(t)) {
                        score += 4;
                    }
                    if (wordRegex.test(prodCat)) {
                        score += 5;
                    }
                }
                if (score > highestScore) {
                    highestScore = score;
                    bestProduct = prod;
                }
            }
            if (bestProduct && highestScore >= 5) {
                usedProductIds.add(bestProduct.id);
                const quantity = Math.max(1, ingredient.suggestedCount || 1);
                matchedItems.push({
                    product: bestProduct,
                    quantity,
                    recipeIngredientName: ingredient.name,
                    quantityRequired: ingredient.quantityRequired || bestProduct.unit,
                    isCore: ingredient.isCore !== false,
                    matchScore: highestScore,
                });
            }
            else {
                missingItems.push({
                    name: ingredient.name,
                    quantityRequired: ingredient.quantityRequired || "As per taste",
                    isCore: ingredient.isCore !== false,
                    note: "Pantry staple or currently unavailable in store",
                });
            }
        }
        // 5. Compute Bundle Pricing
        const totalBundlePrice = matchedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const totalOriginalPrice = matchedItems.reduce((sum, item) => sum + (item.product.originalPrice || item.product.price) * item.quantity, 0);
        const totalSavings = Math.max(0, totalOriginalPrice - totalBundlePrice);
        return res.status(200).json({
            success: true,
            message: "Recipe parsed and ingredients matched successfully",
            recipe: {
                name: recipeData.recipeName,
                description: recipeData.dishDescription,
                servings: recipeData.servings || servingCount,
                prepTime: recipeData.prepTime,
                calories: recipeData.calories,
                dietaryType: recipeData.dietaryType,
                difficulty: recipeData.difficulty,
                instructions: recipeData.instructions || [],
            },
            matchedItems,
            missingItems,
            bundleSummary: {
                totalItemsCount: matchedItems.reduce((sum, item) => sum + item.quantity, 0),
                uniqueProductsCount: matchedItems.length,
                totalBundlePrice,
                totalOriginalPrice,
                totalSavings,
            },
        });
    }
    catch (error) {
        console.error("Error in recipeToCart:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process recipe request",
        });
    }
};
/**
 * Suggestions: GET /api/ai/recipe-suggestions
 */
export const getRecipeSuggestions = async (req, res) => {
    const suggestions = [
        {
            id: "kadhai-paneer",
            title: "Spicy Kadhai Paneer",
            prompt: "How to make Spicy Kadhai Paneer for 4",
            category: "North Indian Special",
            prepTime: "25 mins",
            calories: "360 kcal",
            badge: "Chef's Special 🌶️",
            tag: "Veg Stir-Fry",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/vihqr6wquv57byurvz46.png",
            servings: 4,
        },
        {
            id: "classic-maggi",
            title: "Classic 2-Min Maggi",
            prompt: "I want to make an maggie for 2",
            category: "Quick Snack",
            prepTime: "5 mins",
            calories: "310 kcal",
            badge: "Fast & Tasty ⚡",
            tag: "Instant Noodles",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/dsep7owmwvfrukzbslqo.png",
            servings: 2,
        },
        {
            id: "veggie-maggi",
            title: "Street Style Veggie Maggi",
            prompt: "Masala Veggie Maggi for 2",
            category: "10-Min Snack",
            prepTime: "10 mins",
            calories: "350 kcal",
            badge: "Street Style 🍜",
            tag: "Snack",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/dsep7owmwvfrukzbslqo.png",
            servings: 2,
        },
        {
            id: "paneer-butter-masala",
            title: "Paneer Butter Masala",
            prompt: "I want to cook Paneer Butter Masala for 4 people",
            category: "Dinner Special",
            prepTime: "25 mins",
            calories: "380 kcal",
            badge: "Popular ⭐",
            tag: "Veg Curry",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/vihqr6wquv57byurvz46.png",
            servings: 4,
        },
        {
            id: "palak-paneer",
            title: "Healthy Palak Paneer",
            prompt: "Healthy Palak Paneer recipe for 3 people",
            category: "Healthy & Green",
            prepTime: "20 mins",
            calories: "290 kcal",
            badge: "High Iron 🍃",
            tag: "Green Curry",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/bhrtl76sscvmeiq4kchm.png",
            servings: 3,
        },
        {
            id: "high-protein-breakfast",
            title: "High-Protein Breakfast Plate",
            prompt: "Healthy high-protein breakfast under 500 kcal for 2",
            category: "Breakfast Power",
            prepTime: "15 mins",
            calories: "450 kcal",
            badge: "35g Protein 💪",
            tag: "Fitness",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/cnjrpbcnqesqxy1wr30g.png",
            servings: 2,
        },
        {
            id: "fruit-smoothie-bowl",
            title: "Antioxidant Fruit & Smoothie Bowl",
            prompt: "Refreshing fruit and smoothie bowl for breakfast",
            category: "Fresh & Healthy",
            prepTime: "8 mins",
            calories: "220 kcal",
            badge: "Vitamin Rich 🍓",
            tag: "Superfood",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/nb1mpxuo4fdcik6ey5yj.png",
            servings: 2,
        },
        {
            id: "homestyle-aloo-sabzi",
            title: "Homestyle Aloo Sabzi & Rotis",
            prompt: "Comforting Aloo Sabzi and Rotis for 4",
            category: "Comfort Food",
            prepTime: "25 mins",
            calories: "310 kcal",
            badge: "Classic 🍛",
            tag: "Lunch/Dinner",
            image: "https://raw.githubusercontent.com/avinashdm/gs-images/main/greencart/tzibj2ntsnbn4e0u5kwv.png",
            servings: 4,
        },
    ];
    return res.status(200).json({
        success: true,
        suggestions,
    });
};
