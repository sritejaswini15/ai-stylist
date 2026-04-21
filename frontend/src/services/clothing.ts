import { getApiUrl } from "./api";

// Clothing service for Clueless API

export const getWardrobe = async (token: string) => {
  const res = await fetch(getApiUrl("/api/clothing/"), {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch wardrobe");
  }
  
  return await res.json();
};

export const uploadClothing = async (token: string, clothingData: { image_base64: string }) => {
  const res = await fetch(getApiUrl("/api/clothing/upload"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(clothingData)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Upload failed");
  }

  return await res.json();
};

export const deleteClothing = async (token: string, id: number) => {
  const res = await fetch(getApiUrl(`/api/clothing/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error("Failed to delete item");
  }

  return await res.json();
};

export const toggleFavorite = async (token: string, id: number) => {
  const res = await fetch(getApiUrl(`/api/clothing/${id}/favorite`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error("Failed to toggle favorite");
  }

  return await res.json();
};
