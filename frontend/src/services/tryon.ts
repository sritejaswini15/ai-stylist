import { getApiUrl } from "./api";

export const performTryOn = async (personImage: string, garmentImage: string, description: string = "clothing item") => {
  const token = localStorage.getItem("token");

  const response = await fetch(getApiUrl("/api/tryon/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      person_image: personImage,
      garment_image: garmentImage,
      garment_description: description
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Try-on failed");
  }

  return response.json();
};
