# System Architecture

## 📐 Conceptual Diagram

```mermaid
graph TD
    subgraph Clients
        Web[Web App (React)]
        Mobile[Mobile App (Flutter)]
    end

    subgraph Infrastructure
        LB[Nginx / Docker Proxy]
    end

    subgraph Backend Services
        API[Backend API (Node.js/Express)]
    end

    subgraph Data & AI
        DB[(MongoDB)]
        Gemini[Google Gemini AI]
    end

    Web -->|HTTP/REST| API
    Mobile -->|HTTP/REST| API
    
    API -->|Mongoose| DB
    API -->|API Call| Gemini
```

## 🔄 Data Flows

### 1. Milestone Tracking
1. **User Action**: Parent marks a milestone as "Achieved" on Mobile or Web.
2. **Request**: Client sends `POST /api/milestones` to Backend.
3. **Processing**: Backend validates data, saves to MongoDB.
4. **AI Insight**: (Optional) Backend triggers a background job to ask Gemini for advice based on potential delays or achievements.

### 2. AI Consultation
1. **User Question**: Parent asks "Is it normal for my 6-month-old to not sit up?"
2. **Request**: `POST /api/chat` sent to Backend.
3. **Context Retrieval**: Backend fetches child's robust profile and recent milestones from DB.
4. **Prompt Engineering**: Backend constructs a prompt with context + user question.
5. **AI Inference**: Request sent to Google Gemini API.
6. **Response**: Cleaned response returned to client.

## 🛡 Security Design
- **Authentication**: JWT (JSON Web Tokens) for stateless auth across Web and Mobile.
- **Environment**: API Keys (Gemini) are kept on the Backend, never exposed to clients.
- **Database**: MongoDB allows limited access (internal network in Docker).
