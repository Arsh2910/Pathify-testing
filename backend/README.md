# Trailhead Backend

The AI-powered learning roadmap generator backend.

## Tech Stack

- Node.js & Express.js (TypeScript)
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
   Create a `.env` file in the `backend/` directory and fill in your details:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_random_secret_string
   JWT_EXPIRES_IN=30d
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   ```

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
