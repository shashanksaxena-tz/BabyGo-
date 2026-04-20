# Backend Architecture Review & Production Readiness Audit

**Target:** `backend/src/` (Node.js/Express/MongoDB environment)
**Objective:** Identify architectural bottlenecks, anti-patterns, and required changes to support the new "Guided Path" UX and achieve production-scale readiness.

## 1. The Core Bottleneck: Synchronous External API Calls
**Finding:** A static analysis of `backend/src/routes/` reveals that `analysis.js`, `recommendations.js`, `stories.js`, and `auth.js` contain direct calls to external APIs (specifically Google Gemini).
**The Problem:** Node.js operates on a single-threaded event loop. If a route handler awaits an LLM response (which can take 5-20 seconds), the thread is blocked. Under load, this will cause severe performance degradation, dropped requests, and mobile client timeouts.
**Production Solution:**
*   **Implement an Event-Driven Queue:** Introduce a message broker (Redis + BullMQ is recommended for Node ecosystems).
*   **Refactor Routes:** The `/api/analysis` endpoint must only validate the incoming data, save the raw request to MongoDB (with status: `PENDING`), push a job ID to the BullMQ queue, and immediately return `HTTP 202 Accepted` to the frontend.
*   **Worker Processes:** Create a separate `backend/src/workers/` directory containing the logic to communicate with Gemini. These workers operate outside the main API event loop.
*   **Client Notification:** Use WebSockets (Socket.io) or Server-Sent Events (SSE) to notify the frontend when the background job completes.

## 2. Database Design & Query Inefficiencies
**Finding:** The system likely queries the database heavily on initial load to populate the "dashboard" with historical milestones, measurements, and resources.
**The Problem:** As the `Measurements` and `Milestones` collections grow, performing complex aggregations on every home screen load will tax MongoDB. Furthermore, the new UX requires "pre-calculating" the Next Best Action (e.g., knowing it's time for a 6-month check-in without the user asking).
**Production Solution:**
*   **Indexing:** Ensure compound indexes exist. For example, querying milestones requires `db.milestones.createIndex({ childId: 1, date: -1 })`.
*   **Materialized Views / Caching:** We must implement a Redis caching layer. When a user logs in, the API shouldn't hit MongoDB for static historical data. It should pull the "Child State Object" from Redis.
*   **Cron Jobs / Scheduled Tasks:** Implement a scheduler (e.g., node-cron) that runs nightly to evaluate all children's ages against the milestone database and flags accounts that are due for a "Check-in". This flag is saved to the User document so the frontend can immediately display the "Hero Card" upon login.

## 3. Security and Production Configurations
**Finding:** MVP configurations often lack necessary security middleware and logging.
**Production Solution:**
*   **Helmet:** Ensure `helmet` middleware is used to set standard HTTP security headers.
*   **Rate Limiting:** Implement `express-rate-limit`, especially on the endpoints that trigger AI generation (like `/api/stories`), to prevent abuse and API cost overruns.
*   **Secrets Management:** API keys must not be stored in standard `.env` files in production. The CI/CD pipeline must inject these via a secure manager (AWS Secrets Manager, GitHub Secrets).
*   **Structured Logging:** Replace any `console.log` statements with a robust logging framework like Winston or Pino, formatting logs as JSON so they can be ingested by DataDog or ELK stacks.

## 4. Supporting the New UX Workflows
To support the unified "Journey Feed" described by the Product Owner:
*   **New Endpoint:** `GET /api/v1/feed/:childId`. This endpoint will aggregate data from Milestones, AI Insights, and the Scheduled Tasks to return a structured JSON array representing the timeline feed.
*   **Contextual Linking:** When returning an AI Insight, the backend must tag it. If an insight mentions "sleep", the backend should append suggested Article IDs from the Resource Library, allowing the frontend to render contextual links without additional API calls.
