export const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Dresses", "Accessories", "Other"];

export const OCCASIONS = ["Work", "Casual", "Party", "Wedding", "Date Night", "Brunch", "Travel", "Airport", "Festival", "Formal Event", "Gym", "Lounge"];
export const STYLE_AESTHETICS = ["Minimalist", "Classic", "Streetwear", "Old Money", "Y2K", "Chic", "Bohemian", "Korean", "Vintage", "Sporty", "Luxury", "Edgy"];
export const MOODS = ["Confident", "Soft", "Bold", "Elegant", "Playful", "Mysterious", "Chill", "Romantic", "Powerful", "Cute"];
export const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
export const LOCATIONS = ["Indoor", "Outdoor", "Beach", "City", "Office", "Resort", "Street", "Home"];
export const WEATHERS = ["Summer", "Winter", "Spring", "Fall", "Rainy", "Snowy", "Humid", "Windy"];
export const SPECIFIC_COLORS = ["Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Black", "White", "Brown", "Grey", "Beige"];
export const COLOR_PALETTES = ["Neutral", "Dark", "Light", "Bold", "Monochrome", "Pastel"];

export const COLOR_OPTIONS = [
  "Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Pink", "Brown", "Beige",
  "Navy", "Olive", "Maroon", "Lavender", "Turquoise", "Coral", "Cream", "Mustard", "Teal", "Rust", "Khaki", "Orange", "Purple", "Cyan", "Magenta"
];

export const SUB_CATEGORIES: Record<string, string[]> = {
  "Tops": ["T-Shirt", "Blouse", "Shirt", "Hoodie", "Crop Top", "Tank Top"],
  "Bottoms": ["Jeans", "Trousers", "Skirt", "Shorts", "Leggings"],
  "Shoes": ["Sneaker", "Heel", "Boot", "Flat", "Sandal"],
  "Dresses": ["Maxi Dress", "Mini Dress", "Midi Dress", "Evening Gown"],
  "Accessories": ["Bag", "Belt", "Scarf", "Jewelry", "Sunglasses"]
};

export const FILTER_GROUPS = [
  { key: "color", label: "Color", options: ["Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Black", "White", "Brown", "Grey", "Beige"] },
  { key: "occasion", label: "Occasion", options: ["Work", "Casual", "Party", "Wedding", "Date Night", "Brunch", "Travel", "Formal"] },
  { key: "aesthetic", label: "Aesthetic", options: ["Minimalist", "Streetwear", "Old Money", "Y2K", "Chic", "Vintage", "Luxury", "Edgy"] },
  { key: "mood", label: "Mood", options: ["Confident", "Soft", "Bold", "Elegant", "Playful", "Mysterious", "Chill", "Romantic"] },
  { key: "material", label: "Material", options: ["Cotton", "Denim", "Silk", "Linen", "Wool", "Leather", "Knit"] },
];

export const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "A-Z Name", value: "name" }
];