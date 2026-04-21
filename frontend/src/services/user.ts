import { UserProfile } from "@/types";
import { getApiUrl } from "./api";

// User service for Clueless API

export const getMe = async (token: string) => {
  const res = await fetch(getApiUrl("/api/users/me"), {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }
  
  return await res.json();
};

export const updateMe = async (token: string, userData: Partial<UserProfile>) => {
  const res = await fetch(getApiUrl("/api/users/updateMe"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    throw new Error("Failed to update profile");
  }

  return await res.json();
};

export const addToWishlist = async (token: string, item: { imageUrl: string; title?: string; link?: string; source?: string }) => {
  const res = await fetch(getApiUrl("/api/users/wishlist"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    throw new Error("Failed to add to wishlist");
  }

  return await res.json();
};

export const removeFromWishlist = async (token: string, id: string) => {
  const res = await fetch(getApiUrl(`/api/users/wishlist/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error("Failed to remove from wishlist");
  }

  return await res.json();
};

export const searchProducts = async (query: Record<string, unknown>) => {
  const res = await fetch(getApiUrl("/api/users/search-products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) {
    throw new Error("Search failed");
  }

  return await res.json();
};
