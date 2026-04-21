export interface WishlistItem {
  id?: number;
  _id?: string;
  imageUrl: string;
  title?: string;
  category?: string;
  link?: string;
  source?: string;
}

export interface InspoItem {
  imageUrl: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StyleItem {
  name?: string;
  item?: string;
  hex?: string;
  reason: string;
}

export interface AnalysisData {
  sub_season: string;
  body_shape: string;
  needs_info?: string[];
  color_analysis: {
    undertone: string;
    contrast_level: string;
    best_colors: {
      power_colors: StyleItem[];
      neutrals: StyleItem[];
      accents: StyleItem[];
    };
    avoid_colors: StyleItem[];
    dataset_palette?: {
      primary: string[];
      secondary: string[];
      neutrals: string[];
      accents: string[];
    };
  };
  clothing_analysis: {
    styles_to_embrace: StyleItem[];
    styles_to_avoid: StyleItem[];
  };
  fashion_advice: {
    tops: string;
    bottoms: string;
    dresses: string;
    general: string;
    dataset_recommendations?: {
      necklines: string;
      sleeves: string;
      fabrics: string;
      patterns: string;
      outerwear: string;
      footwear: string;
    };
  };
}

export interface ClothingItem {
  id: number;
  _id: string;
  imageUrl: string;
  category: string | null;
  subCategory: string | null;
  color: string | null;
  isFavorite: boolean;
  addedAt: string | null;
  tags: string[];
  occasion: string[];
  style_aesthetic: string[];
  mood: string[];
  time: string[];
  location: string[];
  weather: string[];
  specific_colors: string[];
  color_palette: string[];
}

export interface Outfit {
  _id: string;
  title?: string;
  topId: string | null;
  bottomId: string | null;
  shoesId: string | null;
  dressId: string | null;
  outerTopId?: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string | null;
  age: number | null;
  profilePicture: string | null;
  stylistPicture: string | null;
  clothesOwned: ClothingItem[];
  fashionInspoBoard: InspoItem[];
  wishlist: WishlistItem[];
  bestOutfits: Outfit[];
  savedGeneratedOutfits: Outfit[];
  personalizedMannequin: string | null;
  height: number | null;
  weight: number | null;
  bodyShape: string | null;
  skinTone: string | null;
  colorPalette: string | null;
  sunReaction: string | null;
  hairColor: string | null;
  styleAdvice: AnalysisData | null;
  is_active: boolean;
  created_at: string;
}
