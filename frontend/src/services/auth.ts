import { getApiUrl } from "./api";

// Authentication service for Clueless API

export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await fetch(getApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    throw { 
      status: res.status, 
      detail: data?.detail || "Failed to sign in",
      data 
    };
  }

  return data;
};

export const signup = async (userData: Record<string, unknown>) => {
  const res = await fetch(getApiUrl("/api/auth/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    throw { 
      status: res.status, 
      detail: data?.detail || "Failed to sign in",
      data 
    };
  }

  return data;
};

export const checkEmail = async (email: string) => {
  const res = await fetch(getApiUrl(`/api/auth/check-email?email=${encodeURIComponent(email)}`));
  return await res.json();
};

export const checkUsername = async (username: string) => {
  const res = await fetch(getApiUrl(`/api/auth/check-username?username=${encodeURIComponent(username)}`));
  return await res.json();
};
