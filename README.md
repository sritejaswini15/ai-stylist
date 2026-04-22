# Clueless AI

**Clueless AI** is an AI-powered personal styling platform that transforms how users manage their wardrobe, understand their style, and make fashion decisions. It combines computer vision, generative AI, and intelligent recommendation systems to deliver a seamless, personalized styling experience.

---

## Overview

Clueless AI is a full-stack fashion-tech application that brings together wardrobe digitization, AI-driven styling, conversational assistance, and product discovery into a single ecosystem.

Instead of treating fashion as scattered tasks (closet management, outfit selection, shopping), the platform unifies everything into one intelligent workflow powered by structured data and AI.

---

## Core Capabilities

* Digitizes user wardrobes through AI-powered image processing
* Builds a structured fashion profile based on preferences and appearance
* Generates personalized outfit recommendations
* Enables conversational styling guidance using AI
* Supports product discovery and wishlist curation
* Integrates virtual try-on for enhanced decision-making

---

## Problem Statement

Fashion decision-making today is fragmented and inefficient:

* Wardrobes are unorganized
* Outfit planning is repetitive
* Shopping lacks personalization

Clueless AI addresses these gaps by converting wardrobe and user preferences into actionable insights, enabling smarter, faster, and more personalized decisions.

---

## Target Audience

* Individuals seeking a smarter way to manage and style their wardrobe
* Users looking for AI-driven personal styling without human intervention
* Developers and teams building AI-first solutions in fashion and retail

---

## Key Features

* **Authentication System**
  Secure JWT-based login with protected routes

* **AI Wardrobe Ingestion**
  Upload garments and automatically generate metadata

* **Image Processing Pipeline**
  Background removal and compression for clean assets

* **Clothing Classification**
  Categorization by type, color, occasion, mood, and aesthetic

* **Embedding-Based Matching**
  Visual similarity detection for better outfit pairing

* **AI Stylist Chat**
  Context-aware fashion guidance based on wardrobe and profile

* **Appearance Analysis**
  Body shape and color palette recommendations

* **Outfit Generation Engine**
  Hybrid approach using tags and embedding similarity

* **Product Discovery**
  Search and save fashion items for future purchase

* **Virtual Try-On**
  External AI-powered garment visualization

* **User Data Persistence**
  Stores outfits, favorites, wishlist, and inspiration board

---

## Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* React Router
* TanStack Query
* Tailwind CSS
* Radix UI
* Vitest & Testing Library

### Backend

* FastAPI
* SQLAlchemy
* Alembic
* PostgreSQL
* Pydantic Settings
* JWT Authentication + bcrypt

### AI & External Services

* Google Gemini — classification, styling, chat
* Hugging Face — embeddings & virtual try-on
* remove.bg — background removal
* SerpApi — product discovery
* Pillow & NumPy — image preprocessing

---

## Deployment

* Backend hosted on Render with managed PostgreSQL
* Frontend deployed using Vercel

---

## System Workflow

1. User logs in via the frontend application
2. JWT token is used for secure backend communication
3. Garment upload triggers:

   * Image compression
   * Background removal
   * AI classification
   * Embedding generation
4. Processed data is stored in PostgreSQL
5. Outfit engine generates recommendations using:

   * Wardrobe metadata
   * Visual embeddings
   * User preferences
6. AI stylist provides contextual recommendations
7. Product discovery extends styling into shopping
8. Virtual try-on renders outfit previews via external models

---

## Project Structure

```bash
project-root/
│
├── frontend/        # React application
├── backend/         # FastAPI services
├── render.yaml      # Backend deployment config
└── README.md
```

# Getting Started

## Prerequisites

Make sure you have the following installed:

* Python 3.11+
* Node.js 18+ and npm
* PostgreSQL
* Git
* API keys for required AI services

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd fitmedeploy
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

**Activate virtual environment**

* Windows:

```bash
.venv\Scripts\Activate.ps1
```

* macOS / Linux:

```bash
source .venv/bin/activate
```

**Install dependencies**

```bash
pip install -r requirements.txt
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## Environment Configuration

Create a `.env` file inside the `backend/` directory:

```env
SECRET_KEY=
DATABASE_URL=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_CORS_ORIGINS=http://localhost:8080
GEMINI_API_KEY=
HF_TOKEN=
SERPAPI_KEY=
REMOVE_BG_API_KEY=
```

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

> If `VITE_API_URL` is not set, the frontend will proxy API requests to the backend automatically.

---

## Database Setup

Run migrations:

```bash
cd backend
alembic upgrade head
```

---

## Running the Application

### Start Backend

```bash
cd backend
uvicorn main:app --reload
```

Backend runs at:
👉 http://127.0.0.1:8000

---

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:
👉 http://127.0.0.1:8080

---

## Example API Usage

### Upload Clothing Item

```bash
curl -X POST http://127.0.0.1:8000/api/clothing/upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"data:image/png;base64,<BASE64_IMAGE>\"}"
```

---

### Generate Outfit

```bash
curl -X POST http://127.0.0.1:8000/api/users/generate-outfit \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"occasion\":[\"Casual\"],\"aesthetic\":[\"Minimalist\"],\"mood\":[\"Chill\"]}"
```

---

## Sample API Response

```json
{
  "status": "success",
  "data": {
    "outfit": {
      "topId": "12",
      "bottomId": "27",
      "shoesId": "9",
      "dressId": null
    }
  }
}
```

---

## API Endpoints

### Authentication

* POST `/api/auth/signup`
* POST `/api/auth/login`
* GET `/api/auth/check-email`
* GET `/api/auth/check-username`

### User & Styling

* GET `/api/users/me`
* PATCH `/api/users/updateMe`
* POST `/api/users/stylist-chat`
* POST `/api/users/analyze-appearance`
* GET `/api/users/wardrobe`
* POST `/api/users/generate-outfit`
* POST `/api/users/search-products`

### Wardrobe & Content

* POST `/api/clothing/upload`
* GET `/api/clothing/`
* PATCH `/api/clothing/{id}`
* DELETE `/api/clothing/{id}`

### Extras

* POST `/api/chatbot/`
* POST `/api/tryon/`

---

## AI & Model Workflow

This project integrates external AI services rather than training models locally:

* **Gemini Flash** → classification, chat, appearance analysis
* **CLIP (Hugging Face)** → embeddings & similarity
* **Virtual Try-On Models** → image generation via external endpoints

### Processing Flow

* Images are compressed before inference
* Background removal improves classification accuracy
* AI tags are normalized into structured metadata
* Embeddings are stored with wardrobe items
* Outfit recommendations combine:

  * semantic matching
  * visual similarity

---

## Summary

Clueless AI transforms a static wardrobe into an intelligent system that understands, suggests, and evolves with the user’s personal style — bridging the gap between fashion, AI, and everyday decision-making.
