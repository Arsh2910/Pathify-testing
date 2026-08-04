# Trailhead Backend

The AI-powered learning roadmap generator backend.

## Tech Stack
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication
- `@google/genai` for AI roadmap generation

## Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- Gemini API Key

## Setup Instructions

1. Install Backend Dependencies:
   ```bash
   npm install
   ```

2. Install Frontend Dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` (in the root) and fill in your details, notably `MONGODB_URI` and `GEMINI_API_KEY`.
   The frontend `.env` is already configured to point to the backend locally (`http://localhost:5000/api/v1`).

4. Run the full stack (in separate terminal windows):
   
   **Backend:**
   ```bash
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Note: Add `"dev": "nodemon src/server.js"` to your package.json scripts.*

## API Documentation

### Auth
- `POST /api/v1/auth/register` - Register a new user
  - Body: `{ email, password, skillLevel, hoursPerDay }`
- `POST /api/v1/auth/login` - Login
  - Body: `{ email, password }`

### Roadmaps (Requires Auth Header: `Bearer <token>`)
- `POST /api/v1/roadmaps` - Generate a new roadmap
  - Body: `{ goal: "Learn Python", targetTimeframe: "3 months" }`
- `GET /api/v1/roadmaps` - List all roadmaps for the logged-in user
- `GET /api/v1/roadmaps/:id` - Get roadmap details (including phases and milestones)

### Milestones (Requires Auth Header)
- `PATCH /api/v1/milestones/:id` - Update milestone completion status
  - Body: `{ isCompleted: true }`
