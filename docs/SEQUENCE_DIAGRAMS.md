# BabyGo / TinySteps AI Sequence Diagrams

## Overview
Detailed sequence diagrams for critical system interactions.

---

## 1. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Client as Web/Mobile App
    participant API as Backend API
    participant DB as MongoDB

    User->>Client: Enter Email/Password
    Client->>API: POST /api/auth/login
    API->>DB: Find User by Email
    DB-->>API: User Document (Hashed Pwd)
    API->>API: Compare Password (Bcrypt)
    
    alt Password Valid
        API->>API: Generate JWT Token
        API-->>Client: 200 OK {token, user}
        Client->>Client: Store Token
        Client-->>User: Show Dashboard
    else Password Invalid
        API-->>Client: 401 Unauthorized
        Client-->>User: Show Error
    end
```

## 2. Milestone Tracking

```mermaid
sequenceDiagram
    autonumber
    participant Parent
    participant Client
    participant API
    participant DB

    Parent->>Client: Check "First Step"
    Client->>API: POST /api/milestones/log {id, status, date}
    API->>API: Validate Token
    
    API->>DB: Update Child Record
    DB-->>API: Success
    
    opt Check for Next Milestone Recommendation
        API->>DB: Get Next Milestones
        DB-->>API: List
    end
    
    API-->>Client: 200 OK {updatedRecord}
    Client-->>Parent: Visual Confirmation (Confetti)
```

## 3. AI Growth Analysis

```mermaid
sequenceDiagram
    autonumber
    participant Parent
    participant Client
    participant API
    participant AI as Gemini Wrapper
    participant Google as Google API

    Parent->>Client: Click "Analyze Growth"
    Client->>API: POST /api/analysis/growth
    API->>DB: Fetch Weight/Height Logs
    DB-->>API: Logs Array
    
    API->>AI: Generate Growth Prompt(logs)
    AI->>Google: GenerateContent(prompt)
    Google-->>AI: "The child is in the 85th percentile..."
    
    AI-->>API: Analysis Text
    API-->>Client: 200 OK {analysis}
    Client-->>Parent: Display AI Insights
```

## 4. Background Data Sync (Mobile)

```mermaid
sequenceDiagram
    autonumber
    participant Mobile
    participant API
    participant DB

    Mobile->>Mobile: Network Available?
    Mobile->>API: POST /api/sync/batch
    API->>DB: Bulk Write Operations
    DB-->>API: Result Stats
    API-->>Mobile: 200 OK {synced: 5, failed: 0}
    Mobile->>Mobile: Clear Local Queue
```

## 5. Error Handling

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant API
    
    Client->>API: GET /api/sensitive-data
    API->>API: Check Auth Header
    
    alt Missing Header
        API-->>Client: 401 Unauthorized
    else Invalid Token
        API-->>Client: 403 Forbidden
    else Server Error
        API->>API: Log Error
        API-->>Client: 500 Internal Server Error
    end
```
