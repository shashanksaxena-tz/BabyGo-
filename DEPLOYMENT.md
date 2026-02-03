# TinySteps AI - Deployment Guide

Complete deployment guide for the TinySteps AI platform consisting of:
- **Backend API** (Node.js/Express)
- **Web Application** (React/TypeScript)
- **Mobile Applications** (Flutter for Android/iOS)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TinySteps AI Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Web App    │  │ Android App  │  │     iOS App      │   │
│  │   (React)    │  │  (Flutter)   │  │    (Flutter)     │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                    │             │
│         └────────────────┼────────────────────┘             │
│                          │                                   │
│                          ▼                                   │
│              ┌───────────────────────┐                      │
│              │    Backend API        │                      │
│              │  (Express + MongoDB)  │                      │
│              └───────────┬───────────┘                      │
│                          │                                   │
│              ┌───────────▼───────────┐                      │
│              │     Gemini AI API     │                      │
│              │   (Google AI Studio)  │                      │
│              └───────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Flutter SDK 3.2+
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Google AI Studio API Key (Gemini)

## Quick Start with Docker

The fastest way to run the backend and web app:

```bash
# Clone the repository
git clone <repository-url>
cd BabyGo-

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Gemini API key

# Start all services
docker-compose up -d

# Services will be available at:
# - Web App: http://localhost:3000
# - Backend API: http://localhost:3001
# - MongoDB: localhost:27017
```

## Manual Deployment

### 1. Backend API

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string
# - GEMINI_API_KEY: Your Google AI Studio API key

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### 2. Web Application

```bash
cd tinysteps-ai

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start development server
npm run dev

# Build for production
npm run build
```

### 3. Flutter Mobile Apps

```bash
cd tinysteps_flutter

# Get dependencies
flutter pub get

# Configure API URL
# Edit lib/config/api_config.dart
# Set your production backend URL

# Run on Android
flutter run -d android

# Run on iOS
flutter run -d ios

# Build Android APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

## Environment Configuration

### Backend (.env)

```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/tinysteps
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key
```

### Web App (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

### Flutter (api_config.dart)

```dart
class ApiConfig {
  static const String productionUrl = 'https://your-backend-url.com/api';
  static const Environment currentEnvironment = Environment.production;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/api-key` - Update Gemini API key

### Children
- `GET /api/children` - List all children
- `POST /api/children` - Create child profile
- `GET /api/children/:id` - Get child
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child

### Analysis
- `POST /api/analysis` - Create analysis (multipart/form-data)
- `GET /api/analysis/:childId` - List analyses
- `GET /api/analysis/:childId/:id` - Get analysis
- `GET /api/analysis/milestones/:ageMonths` - Get WHO milestones
- `POST /api/analysis/growth-percentiles` - Calculate growth percentiles

### Stories
- `GET /api/stories/themes` - Get story themes
- `GET /api/stories/:childId` - List stories
- `POST /api/stories` - Generate story
- `PATCH /api/stories/:childId/:id/favorite` - Toggle favorite

### Timeline
- `GET /api/timeline/:childId` - Get timeline
- `POST /api/timeline` - Add entry
- `POST /api/timeline/measurement` - Add measurement
- `GET /api/timeline/measurements/:childId` - Get measurements

### Recommendations
- `GET /api/recommendations/products/:childId` - Product recommendations
- `GET /api/recommendations/activities/:childId` - Activity recommendations
- `GET /api/recommendations/recipes/:childId` - Recipe recommendations
- `GET /api/recommendations/tips/:childId` - Parenting tips
- `GET /api/recommendations/sources` - WHO sources

## Production Deployment

### Docker Compose (Recommended)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/tinysteps
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - mongo

  web:
    build: ./tinysteps-ai
    ports:
      - "80:3000"
    environment:
      - VITE_API_URL=/api

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Cloud Deployment Options

1. **AWS**: Use ECS/EKS for containers, DocumentDB for MongoDB
2. **Google Cloud**: Cloud Run for containers, MongoDB Atlas
3. **Azure**: Container Apps, Azure Cosmos DB
4. **Railway/Render**: Easy container deployment

### Mobile App Distribution

**Android:**
- Build signed APK/AAB: `flutter build appbundle --release`
- Upload to Google Play Console

**iOS:**
- Build in Xcode with distribution certificate
- Upload via App Store Connect

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Already implemented (100 requests/15 min)
4. **API Keys**: Store securely, never commit to git
5. **HTTPS**: Always use HTTPS in production
6. **MongoDB**: Enable authentication, use SSL

## Monitoring & Logging

- Health check endpoint: `GET /health`
- Request logging enabled by default
- Consider adding APM tools (New Relic, Datadog, etc.)

## Troubleshooting

### Backend won't start
- Check MongoDB connection
- Verify environment variables
- Check port availability

### Mobile app can't connect
- Verify API URL in config
- Check network permissions (Android)
- For emulator: use 10.0.2.2 instead of localhost

### Analysis not working
- Verify Gemini API key
- Check file size limits (10MB default)
- Ensure media format is supported
