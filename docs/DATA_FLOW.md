# BabyGo / TinySteps AI Data Flow Documentation

## Overview
This document outlines how data moves through the TinySteps AI system, from user inputs to storage and AI processing.

---

## High-Level Data Flow

```mermaid
flowchart TB
    subgraph "Input Sources"
        PARENT[Parent User]
        SENSORS[Device Sensors (Mobile)]
    end

    subgraph "Processing Layer"
        VALID[Express Validator]
        CONTROLLER[API Controllers]
        AI_HANDLER[AI Service Handler]
    end

    subgraph "Storage Layer"
        MONGO[(MongoDB)]
    end

    subgraph "Output Layer"
        JSON[JSON Response]
        UI[UI Update]
    end
    
    PARENT --> VALID
    VALID --> CONTROLLER
    CONTROLLER --> AI_HANDLER
    AI_HANDLER --> MONGO
    CONTROLLER --> MONGO
    MONGO --> JSON
    JSON --> UI
    AI_HANDLER --> JSON
```

---

## Core Data Flow Scenarios

### 1. Milestone Logging Flow

```mermaid
flowchart LR
    User[Parent] -- 1. Selects Milestone --> UI[App Interface]
    UI -- 2. POST /api/milestones --> API[Backend API]
    API -- 3. Validate Token --> Auth[Auth Middleware]
    Auth -- 4. Valid --> Controller[Milestone Controller]
    Controller -- 5. Save --> DB[(MongoDB)]
    DB -- 6. Confirm --> Controller
    Controller -- 7. 201 Created --> UI
    UI -- 8. Update Progress --> User
```

### 2. AI Insight Generation Flow

```mermaid
flowchart LR
    User[Parent] -- 1. Request Insight --> API[Backend API]
    API -- 2. Fetch Child Data --> DB[(MongoDB)]
    DB -- 3. Return Growth/Milestones --> API
    API -- 4. Construct Prompt --> Gemini[Gemini Service]
    Gemini -- 5. Send Prompt --> Google[Google AI API]
    Google -- 6. Return Analysis --> Gemini
    Gemini -- 7. Save Insight (optional) --> DB
    Gemini -- 8. Returns Text --> User
```

### 3. User Authentication Flow

```mermaid
flowchart TD
    User -- Login/Register --> API
    API -- Hash Password --> Util[Bcrypt]
    Util -- Compare/Hash --> API
    API -- Generate Token --> PWM[JWT Service]
    PWM -- Token --> API
    API -- Response (User + Token) --> User
```

---

## Data Transformation Pipeline

1.  **Input**: JSON payloads from React/Flutter clients.
2.  **Sanitization**: `express-validator` cleans inputs (email normalization, trimming).
3.  **Normalization**: Dates converted to ISO strings.
4.  **AI specific**: Child data (age, weight, milestones) formatted into a prompt string for Gemini.

## Integration Data Flows

### Google Gemini API
-   **Direction**: Outbound (Request) / Inbound (Response)
-   **Data**: Prompt text (Anonymized child metrics) -> Generative Text Response.
-   **Security**: API Key authentication (Server-side).
