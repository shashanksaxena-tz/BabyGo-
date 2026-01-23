# GrowthTrack AI - Technical Requirements Document (TRD)

**Version:** 1.0
**Date:** January 23, 2026
**Document Owner:** Engineering Core
**Status:** Final Draft

---

## Executive Summary

This Technical Requirements Document provides comprehensive technical specifications for the GrowthTrack AI platform. It defines the system architecture, technology stack, technical requirements, data models, API specifications, security measures, and infrastructure needs required to build a scalable, secure, and compliant child development evaluation platform.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Technical Requirements](#3-technical-requirements)
4. [Data Architecture](#4-data-architecture)
5. [API Specifications](#5-api-specifications)
6. [AI/ML Model Specifications](#6-aiml-model-specifications)
7. [Security Architecture](#7-security-architecture)
8. [Infrastructure Requirements](#8-infrastructure-requirements)
9. [Integration Requirements](#9-integration-requirements)
10. [Testing Requirements](#10-testing-requirements)
11. [DevOps and Deployment](#11-devops-and-deployment)
12. [Monitoring and Observability](#12-monitoring-and-observability)

---

## 1. System Architecture

### 1.1 High-Level Architecture

GrowthTrack AI follows a **cloud-native, microservices architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   iOS App    │  │ Android App  │  │   Web App    │  │
│  │ React Native │  │ React Native │  │   React +    │  │
│  │              │  │              │  │   Next.js    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  API Gateway (Kong / AWS API Gateway)              │ │
│  │  - Rate Limiting  - Authentication  - Routing      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Application Services Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │   User   │  │  Child   │  │Assessment│  │Analytics││
│  │  Service │  │ Profile  │  │ Service  │  │ Service ││
│  │          │  │ Service  │  │          │  │         ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Growth   │  │Milestone │  │Notification│ │Provider││
│  │ Tracking │  │ Tracking │  │  Service   │ │Portal  ││
│  │          │  │          │  │            │ │        ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  AI/ML Services Layer                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Assessment Engine  │  Growth Prediction Model   │  │
│  │  Recommendation Eng │  Early Warning System      │  │
│  │  Demographic Adjust │  Speech/Video Analysis     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │   MongoDB    │  │   Redis      │  │
│  │ (Relational) │  │(Unstructured)│  │  (Cache)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   AWS S3     │  │  RabbitMQ    │                    │
│  │  (Storage)   │  │ (Queue)      │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

**Microservices Design:**
- Each service owns its data and business logic
- Services communicate via RESTful APIs and message queues
- Independent deployment and scaling per service
- Fault isolation and resilience

**Cloud-Native:**
- Containerized services (Docker)
- Orchestrated with Kubernetes
- Auto-scaling based on demand
- Multi-region deployment

**Security by Design:**
- Zero-trust architecture
- Encryption at rest and in transit
- Least privilege access
- Defense in depth

**Performance-Optimized:**
- CDN for static assets
- Caching at multiple layers
- Database read replicas
- Asynchronous processing for heavy tasks

### 1.3 System Components

**Frontend Components:**
- Mobile apps (iOS/Android) built with React Native
- Web application built with React and Next.js
- Progressive Web App (PWA) capabilities
- Responsive design across all devices

**Backend Components:**
- API Gateway for request routing and authentication
- Microservices for business logic (Node.js, Python)
- AI/ML services (Python with TensorFlow/PyTorch)
- Background job processors
- WebSocket server for real-time features

**Data Components:**
- PostgreSQL for transactional data
- MongoDB for unstructured assessment data
- Redis for caching and sessions
- S3 for media storage (photos, videos, audio)
- RabbitMQ for asynchronous messaging

**Infrastructure Components:**
- AWS ECS/EKS for container orchestration
- AWS Lambda for serverless functions
- CloudFront CDN for global delivery
- AWS RDS for managed databases
- Elasticsearch for search and analytics

---

## 2. Technology Stack

### 2.1 Frontend Technologies

**Mobile Applications:**
| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Framework | React Native | 0.72+ | Cross-platform code sharing, native performance, large ecosystem |
| State Management | Redux + Redux Toolkit | 1.9+ | Predictable state, DevTools, middleware support |
| Navigation | React Navigation | 6.x | Native navigation feel, deep linking support |
| UI Library | React Native Paper / NativeBase | Latest | Material Design, accessibility, customization |
| Language | TypeScript | 5.0+ | Type safety, better IDE support, maintainability |
| Build Tool | Expo (ejected) | 49+ | Faster development, OTA updates, managed workflow |
| Charts | Victory Native | 36+ | Declarative charts, cross-platform |
| Forms | React Hook Form | 7.x | Performance, validation, ease of use |
| HTTP Client | Axios | 1.x | Interceptors, request cancellation, TypeScript support |
| Offline Storage | AsyncStorage + Redux Persist | Latest | Offline capability, state persistence |
| Testing | Jest + React Native Testing Library | Latest | Unit and integration testing |

**Web Application:**
| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Framework | Next.js | 13+ | SSR, SEO, API routes, image optimization |
| UI Framework | React | 18+ | Component-based, virtual DOM, large ecosystem |
| State Management | Redux Toolkit | 1.9+ | Same as mobile for code consistency |
| UI Library | Material-UI (MUI) | 5.x | Comprehensive components, theming, accessibility |
| Language | TypeScript | 5.0+ | Type safety across frontend |
| Styling | Styled Components + Tailwind CSS | Latest | Component-scoped styles, utility-first CSS |
| Charts | Recharts | 2.x | Composable, declarative, responsive |
| Forms | React Hook Form | 7.x | Consistency with mobile |
| HTTP Client | Axios | 1.x | Same as mobile |
| Testing | Jest + React Testing Library | Latest | Unit and integration testing |

### 2.2 Backend Technologies

**Application Services:**
| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Runtime | Node.js | 18 LTS | Async I/O, JavaScript ecosystem, TypeScript support |
| Framework | Express.js | 4.x | Lightweight, middleware-based, mature |
| Language | TypeScript | 5.0+ | Type safety, maintainability, refactoring |
| API Documentation | Swagger/OpenAPI | 3.0 | Auto-generated docs, API testing |
| Validation | Joi / Zod | Latest | Schema validation, TypeScript integration |
| Authentication | Passport.js + JWT | Latest | Multiple strategies, JWT for stateless auth |
| ORM | TypeORM / Prisma | Latest | Type-safe database access, migrations |
| Testing | Jest + Supertest | Latest | Unit, integration, E2E testing |

**AI/ML Services:**
| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Runtime | Python | 3.11+ | ML ecosystem, scientific computing |
| Framework | FastAPI | 0.104+ | High performance, async, auto-docs, type hints |
| ML Framework | TensorFlow | 2.14+ | Production-ready, model serving, TensorFlow Lite |
| ML Framework | PyTorch | 2.1+ | Research flexibility, dynamic graphs |
| ML Tools | scikit-learn | 1.3+ | Classical ML algorithms, preprocessing |
| Data Processing | Pandas, NumPy | Latest | Data manipulation, numerical computing |
| Computer Vision | OpenCV | 4.8+ | Image/video processing |
| Speech Processing | librosa, pydub | Latest | Audio analysis, feature extraction |
| Model Serving | TensorFlow Serving / TorchServe | Latest | High-performance model inference |
| Experiment Tracking | MLflow | 2.x | Model versioning, experiment tracking |

### 2.3 Data Technologies

**Databases:**
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Relational DB | PostgreSQL | 14+ | User accounts, child profiles, structured data |
| Document DB | MongoDB | 6+ | Assessment responses, unstructured data |
| Cache | Redis | 7+ | Session storage, rate limiting, caching |
| Search Engine | Elasticsearch | 8.x | Full-text search, analytics, logging |

**Message Queue:**
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Message Broker | RabbitMQ | 3.11+ | Asynchronous task processing, event-driven architecture |
| Alternative | AWS SQS | - | Alternative for AWS-native messaging |

**Storage:**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Object Storage | AWS S3 | Photos, videos, audio files, reports |
| CDN | AWS CloudFront | Global content delivery, low latency |

### 2.4 Infrastructure Technologies

**Cloud Platform: AWS**
| Service | Purpose |
|---------|---------|
| EC2 | Compute instances for services |
| ECS/EKS | Container orchestration |
| Lambda | Serverless functions (webhooks, scheduled tasks) |
| RDS | Managed PostgreSQL |
| DocumentDB | MongoDB-compatible managed service |
| ElastiCache | Managed Redis |
| S3 | Object storage |
| CloudFront | CDN |
| Route 53 | DNS management |
| VPC | Network isolation |
| IAM | Identity and access management |
| KMS | Key management for encryption |
| CloudWatch | Monitoring and logging |
| SNS/SQS | Notifications and messaging |

**DevOps Tools:**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Service packaging |
| Orchestration | Kubernetes (EKS) | Container management, scaling |
| IaC | Terraform | Infrastructure as code |
| CI/CD | GitHub Actions + Jenkins | Automated testing, deployment |
| Version Control | Git + GitHub | Source code management |
| Artifact Registry | Docker Hub / AWS ECR | Container image storage |
| Secrets Management | AWS Secrets Manager + Vault | Secure credential storage |
| Monitoring | Prometheus + Grafana | Metrics collection, visualization |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) | Centralized logging |
| APM | New Relic / DataDog | Application performance monitoring |
| Error Tracking | Sentry | Error monitoring and alerting |

---

## 3. Technical Requirements

### 3.1 System Performance Requirements

**Response Time:**
- **TR-1.1**: API GET requests: < 200ms (p50), < 500ms (p95)
- **TR-1.2**: API POST/PUT requests: < 300ms (p50), < 800ms (p95)
- **TR-1.3**: Page load (web): < 1.5s (p50), < 3s (p95)
- **TR-1.4**: App screen transition: < 100ms
- **TR-1.5**: AI assessment inference: < 3s for complete analysis
- **TR-1.6**: Growth chart rendering: < 500ms
- **TR-1.7**: Report generation (PDF): < 10s

**Throughput:**
- **TR-2.1**: Support 100,000 concurrent users
- **TR-2.2**: Handle 10,000 requests per second (peak)
- **TR-2.3**: Process 500 assessments per minute
- **TR-2.4**: Generate 100 reports per minute

**Scalability:**
- **TR-3.1**: Horizontal scaling for all stateless services
- **TR-3.2**: Auto-scaling triggers at 70% CPU or memory
- **TR-3.3**: Database read replicas for read-heavy operations
- **TR-3.4**: Sharding capability for user data at 10M+ users

**Availability:**
- **TR-4.1**: 99.9% uptime SLA (8.76 hours downtime/year max)
- **TR-4.2**: Multi-AZ deployment for high availability
- **TR-4.3**: Database automatic failover < 60 seconds
- **TR-4.4**: Service auto-restart on failure < 30 seconds
- **TR-4.5**: Graceful degradation when services unavailable

### 3.2 Data Requirements

**Data Storage:**
- **TR-5.1**: User accounts: PostgreSQL with encrypted PII
- **TR-5.2**: Child profiles: PostgreSQL with foreign key relationships
- **TR-5.3**: Growth measurements: PostgreSQL with time-series indexing
- **TR-5.4**: Milestone data: PostgreSQL with JSON columns for flexible attributes
- **TR-5.5**: Assessment responses: MongoDB for schema flexibility
- **TR-5.6**: Media files: S3 with lifecycle policies (Standard → IA → Glacier)
- **TR-5.7**: Session data: Redis with 24-hour TTL
- **TR-5.8**: Audit logs: Elasticsearch with 7-year retention

**Data Volume Estimates:**
- Year 1: 50K users × 2 children × 50 measurements = 5M records
- Year 5: 1.8M users × 2 children × 200 measurements = 720M records
- Storage: ~5GB (Y1) → ~500GB (Y5) for structured data
- Media storage: ~50GB (Y1) → ~10TB (Y5)

**Data Retention:**
- **TR-6.1**: Active user data: Indefinite while account active
- **TR-6.2**: Deleted user data: 30 days soft delete, then permanent
- **TR-6.3**: Anonymized research data: Indefinite
- **TR-6.4**: Audit logs: 7 years (regulatory requirement)
- **TR-6.5**: Media files: User-controlled deletion, else indefinite
- **TR-6.6**: Backup retention: 30 days of daily backups

**Data Backup:**
- **TR-7.1**: Automated daily backups of all databases
- **TR-7.2**: Point-in-time recovery capability for PostgreSQL
- **TR-7.3**: Cross-region backup replication
- **TR-7.4**: Backup encryption with AWS KMS
- **TR-7.5**: Monthly backup restoration testing

### 3.3 Integration Requirements

**EMR/EHR Integration:**
- **TR-8.1**: HL7 FHIR R4 API implementation
- **TR-8.2**: Support for Epic FHIR API (OAuth 2.0 + SMART on FHIR)
- **TR-8.3**: Support for Cerner FHIR API
- **TR-8.4**: Support for Allscripts FHIR API
- **TR-8.5**: LOINC codes for growth measurements
- **TR-8.6**: SNOMED CT codes for developmental milestones
- **TR-8.7**: Bidirectional data sync (import demographics, export assessments)
- **TR-8.8**: Error handling and retry logic for failed syncs

**Third-Party Services:**
- **TR-9.1**: Stripe API for payment processing (PCI DSS compliance)
- **TR-9.2**: SendGrid API for transactional emails
- **TR-9.3**: Twilio API for SMS notifications
- **TR-9.4**: Firebase Cloud Messaging for push notifications (iOS/Android)
- **TR-9.5**: AWS Translate API for multi-language support
- **TR-9.6**: Withings API for smart scale integration (OAuth 2.0)
- **TR-9.7**: Fitbit API for smart scale integration (OAuth 2.0)

**Authentication Integrations:**
- **TR-10.1**: Google OAuth 2.0 for social login
- **TR-10.2**: Apple Sign-In for iOS/web
- **TR-10.3**: Facebook OAuth 2.0 (optional)
- **TR-10.4**: Email/password authentication with bcrypt hashing

### 3.4 Platform-Specific Requirements

**iOS Requirements:**
- **TR-11.1**: iOS 14.0+ support
- **TR-11.2**: iPhone (5.5" to 6.7" screens)
- **TR-11.3**: iPad support (responsive layouts)
- **TR-11.4**: Dark mode support
- **TR-11.5**: Haptic feedback for interactions
- **TR-11.6**: Face ID / Touch ID for app lock (optional)
- **TR-11.7**: Photo library and camera access
- **TR-11.8**: Push notification support
- **TR-11.9**: Background refresh for sync
- **TR-11.10**: HealthKit integration (export growth data)

**Android Requirements:**
- **TR-12.1**: Android 8.0 (API 26)+ support
- **TR-12.2**: Screen sizes: 4.5" to 7"+ (responsive)
- **TR-12.3**: Tablet support (7" to 12"+)
- **TR-12.4**: Material Design 3 theming
- **TR-12.5**: Dark theme support
- **TR-12.6**: Biometric authentication
- **TR-12.7**: Camera and storage permissions
- **TR-12.8**: Firebase Cloud Messaging
- **TR-12.9**: Background sync with WorkManager
- **TR-12.10**: Google Fit integration (export growth data)

**Web Requirements:**
- **TR-13.1**: Browser support: Chrome, Safari, Firefox, Edge (latest 2 versions)
- **TR-13.2**: Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- **TR-13.3**: PWA capabilities (service worker, offline mode)
- **TR-13.4**: Keyboard navigation support
- **TR-13.5**: Screen reader compatibility (NVDA, JAWS, VoiceOver)
- **TR-13.6**: SEO optimization (meta tags, structured data)
- **TR-13.7**: Page speed score > 90 (Lighthouse)

---

## 4. Data Architecture

### 4.1 PostgreSQL Schema

**Users Table:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for social login
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium, provider
    subscription_expires_at TIMESTAMP,
    stripe_customer_id VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'en',
    unit_preference VARCHAR(10) DEFAULT 'metric', -- metric, imperial
    notification_settings JSONB,
    privacy_settings JSONB,
    deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires_at);
```

**Children Table:**
```sql
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20), -- male, female, prefer_not_to_say
    birth_weight DECIMAL(5, 2), -- kg
    birth_length DECIMAL(5, 2), -- cm
    gestational_age_weeks INTEGER, -- NULL if full-term
    ethnicity VARCHAR(50)[],
    geographic_region VARCHAR(50),
    profile_photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_children_user ON children(user_id);
CREATE INDEX idx_children_dob ON children(date_of_birth);
```

**Growth Measurements Table:**
```sql
CREATE TABLE growth_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    measurement_date TIMESTAMP NOT NULL,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    head_circumference_cm DECIMAL(4, 1),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    source VARCHAR(20) DEFAULT 'manual', -- manual, device_sync, provider
    device_id VARCHAR(100) -- For smart scale tracking
);

CREATE INDEX idx_measurements_child ON growth_measurements(child_id, measurement_date DESC);
```

**Milestones Table:**
```sql
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(50) NOT NULL, -- motor_gross, motor_fine, cognitive, language, social_emotional, hearing_sensory
    milestone_key VARCHAR(100) NOT NULL UNIQUE,
    age_months_min INTEGER NOT NULL,
    age_months_max INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    examples TEXT,
    who_standard BOOLEAN DEFAULT FALSE,
    cdc_standard BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_milestones_domain ON milestones(domain);
CREATE INDEX idx_milestones_age ON milestones(age_months_min, age_months_max);
```

**Child Milestones (Achievement Tracking):**
```sql
CREATE TABLE child_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id),
    achieved BOOLEAN DEFAULT FALSE,
    achieved_date DATE,
    notes TEXT,
    photo_url TEXT,
    video_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(child_id, milestone_id)
);

CREATE INDEX idx_child_milestones_child ON child_milestones(child_id);
CREATE INDEX idx_child_milestones_achieved ON child_milestones(child_id, achieved, achieved_date);
```

**Assessments Table:**
```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL, -- basic, comprehensive_5domain
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    age_at_assessment_months INTEGER NOT NULL,
    created_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_assessments_child ON assessments(child_id, completed_at DESC);
```

**Providers Table:**
```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(50), -- pediatrician, specialist, therapist
    npi_number VARCHAR(20), -- US National Provider Identifier
    license_number VARCHAR(50),
    license_state VARCHAR(10),
    practice_name VARCHAR(200),
    practice_address TEXT,
    practice_phone VARCHAR(20),
    specialties VARCHAR(50)[],
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    subscription_tier VARCHAR(20) DEFAULT 'basic', -- basic, professional
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_providers_verified ON providers(verified);
```

**Provider Patient Connections:**
```sql
CREATE TABLE provider_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    invitation_code VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, revoked
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    consent_signed_at TIMESTAMP,
    UNIQUE(provider_id, child_id)
);

CREATE INDEX idx_provider_patients_provider ON provider_patients(provider_id, status);
CREATE INDEX idx_provider_patients_parent ON provider_patients(parent_user_id, status);
```

### 4.2 MongoDB Schema

**Assessment Responses Collection:**
```javascript
{
    _id: ObjectId,
    assessmentId: UUID, // References PostgreSQL assessments.id
    childId: UUID,
    assessmentType: String, // "basic", "comprehensive_5domain"
    responses: [
        {
            questionId: String,
            domain: String, // "motor_gross", "cognitive", etc.
            question: String,
            answerType: String, // "yes_no", "multiple_choice", "scale"
            answer: Mixed, // Boolean, String, Number
            timestamp: ISODate,
            skipped: Boolean
        }
    ],
    rawScores: {
        motor_gross: Number,
        motor_fine: Number,
        cognitive: Number,
        language: Number,
        hearing_sensory: Number,
        social_emotional: Number
    },
    aiAnalysis: {
        overallScore: Number,
        domainPercentiles: {
            motor_gross: Number,
            motor_fine: Number,
            cognitive: Number,
            language: Number,
            hearing_sensory: Number,
            social_emotional: Number
        },
        strengths: [String],
        areasForSupport: [String],
        earlyWarningFlags: [
            {
                domain: String,
                severity: String, // "monitor", "discuss", "urgent"
                reason: String,
                recommendation: String
            }
        ],
        demographicAdjustment: {
            applied: Boolean,
            adjustmentFactors: Object
        },
        confidenceScore: Number, // 0-1
        modelVersion: String
    },
    recommendations: [
        {
            type: String, // "activity", "resource", "referral"
            title: String,
            description: String,
            priority: String, // "high", "medium", "low"
        }
    ],
    createdAt: ISODate,
    updatedAt: ISODate
}
```

### 4.3 Redis Cache Structure

**Session Storage:**
```
Key: session:{sessionId}
Value: {userId, email, role, subscriptionTier, lastActivity}
TTL: 24 hours
```

**Rate Limiting:**
```
Key: ratelimit:{userId}:{endpoint}
Value: requestCount
TTL: 1 hour
```

**API Response Cache:**
```
Key: cache:growth_chart:{childId}:{dateRange}
Value: JSON serialized chart data
TTL: 1 hour
```

### 4.4 S3 Bucket Structure

```
growth-track-ai-media-{env}/
├── profiles/
│   ├── users/{userId}/avatar.{ext}
│   └── children/{childId}/photo.{ext}
├── measurements/
│   └── {childId}/{measurementId}/photo.{ext}
├── milestones/
│   ├── photos/{childId}/{milestoneId}/{timestamp}.{ext}
│   ├── videos/{childId}/{milestoneId}/{timestamp}.{ext}
│   └── audio/{childId}/{milestoneId}/{timestamp}.{ext}
├── reports/
│   └── {childId}/{reportId}.pdf
└── temp/
    └── {uploadId}/file.{ext} (lifecycle: delete after 24h)
```

**S3 Lifecycle Policies:**
- Standard storage for files < 30 days old
- Transition to Standard-IA after 30 days
- Transition to Glacier after 180 days
- Temp folder auto-delete after 24 hours

---

## 5. API Specifications

### 5.1 API Architecture

**RESTful API Design:**
- Base URL: `https://api.growthtrack.ai/v1`
- Authentication: Bearer JWT tokens
- Content-Type: `application/json`
- Pagination: Cursor-based for large datasets
- Error format: RFC 7807 Problem Details

**GraphQL API (Phase 2):**
- Endpoint: `https://api.growthtrack.ai/graphql`
- Use case: Complex nested queries for dashboard/analytics

### 5.2 Authentication APIs

**POST /auth/register**
```json
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "acceptedTerms": true
}

Response (201):
{
    "userId": "uuid",
    "email": "user@example.com",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
}
```

**POST /auth/login**
```json
Request:
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}

Response (200):
{
    "userId": "uuid",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600,
    "subscriptionTier": "premium"
}
```

**POST /auth/social/google**
**POST /auth/social/apple**
```json
Request:
{
    "token": "google_or_apple_id_token"
}

Response (200): Same as /auth/login
```

### 5.3 Child Profile APIs

**POST /children**
```json
Request:
{
    "name": "Emma Smith",
    "dateOfBirth": "2023-05-15",
    "gender": "female",
    "birthWeight": 3.4,
    "birthLength": 50.5,
    "gestationalAgeWeeks": 40,
    "ethnicity": ["caucasian", "asian"],
    "geographicRegion": "north_america"
}

Response (201):
{
    "childId": "uuid",
    "name": "Emma Smith",
    "dateOfBirth": "2023-05-15",
    "ageMonths": 32,
    ...
}
```

**GET /children/{childId}**
```json
Response (200):
{
    "childId": "uuid",
    "name": "Emma Smith",
    "dateOfBirth": "2023-05-15",
    "ageMonths": 32,
    "gender": "female",
    "birthWeight": 3.4,
    "birthLength": 50.5,
    ...
}
```

### 5.4 Growth Tracking APIs

**POST /children/{childId}/measurements**
```json
Request:
{
    "measurementDate": "2026-01-23T10:00:00Z",
    "weightKg": 14.5,
    "heightCm": 95.2,
    "headCircumferenceCm": 48.5,
    "notes": "Measured at pediatrician visit",
    "photoUrl": "optional_s3_url"
}

Response (201):
{
    "measurementId": "uuid",
    "childId": "uuid",
    "measurementDate": "2026-01-23T10:00:00Z",
    "weightKg": 14.5,
    "heightCm": 95.2,
    "headCircumferenceCm": 48.5,
    "percentiles": {
        "weightForAge": 65,
        "heightForAge": 58,
        "headCircumferenceForAge": 52,
        "weightForHeight": 72
    },
    "zScores": {
        "weightForAge": 0.4,
        "heightForAge": 0.2,
        ...
    }
}
```

**GET /children/{childId}/growth-chart**
```json
Query Parameters:
- metric: weight | height | head_circumference
- startDate: ISO date
- endDate: ISO date

Response (200):
{
    "childId": "uuid",
    "metric": "weight",
    "unit": "kg",
    "measurements": [
        {
            "date": "2025-01-15",
            "value": 13.2,
            "percentile": 60,
            "zScore": 0.25
        },
        ...
    ],
    "whoPercentileCurves": {
        "p3": [...],
        "p5": [...],
        "p25": [...],
        "p50": [...],
        "p75": [...],
        "p95": [...],
        "p97": [...]
    }
}
```

### 5.5 Assessment APIs

**POST /children/{childId}/assessments**
```json
Request:
{
    "assessmentType": "comprehensive_5domain"
}

Response (201):
{
    "assessmentId": "uuid",
    "childId": "uuid",
    "assessmentType": "comprehensive_5domain",
    "status": "in_progress",
    "ageAtAssessmentMonths": 32,
    "questions": [
        {
            "questionId": "q001",
            "domain": "motor_gross",
            "question": "Can your child walk up stairs alternating feet?",
            "answerType": "yes_no",
            "examples": "They can walk up stairs one foot per step, not two feet on each step."
        },
        ...
    ],
    "startedAt": "2026-01-23T10:00:00Z"
}
```

**PUT /assessments/{assessmentId}/responses**
```json
Request:
{
    "questionId": "q001",
    "answer": true,
    "skipped": false
}

Response (200):
{
    "message": "Response recorded",
    "progress": {
        "answered": 45,
        "total": 60,
        "percentComplete": 75
    }
}
```

**POST /assessments/{assessmentId}/complete**
```json
Response (200):
{
    "assessmentId": "uuid",
    "status": "completed",
    "completedAt": "2026-01-23T10:30:00Z",
    "results": {
        "overallScore": 85,
        "interpretation": "on_track",
        "domainScores": {
            "motor_gross": { "score": 88, "percentile": 75 },
            "motor_fine": { "score": 82, "percentile": 68 },
            "cognitive": { "score": 90, "percentile": 82 },
            "language": { "score": 85, "percentile": 72 },
            "hearing_sensory": { "score": 87, "percentile": 76 },
            "social_emotional": { "score": 80, "percentile": 65 }
        },
        "strengths": ["Cognitive development", "Gross motor skills"],
        "areasForSupport": ["Fine motor coordination"],
        "earlyWarnings": [],
        "recommendations": [
            {
                "type": "activity",
                "title": "Fine Motor Activities",
                "description": "Practice with playdough, beads, and puzzles...",
                "priority": "medium"
            }
        ],
        "confidenceScore": 0.92
    }
}
```

### 5.6 Provider Portal APIs

**POST /providers/invite-patient**
```json
Request:
{
    "parentEmail": "parent@example.com",
    "childId": "uuid",
    "message": "I'd like to monitor your child's development."
}

Response (201):
{
    "invitationId": "uuid",
    "invitationCode": "ABC123XYZ",
    "status": "pending",
    "expiresAt": "2026-02-23T00:00:00Z"
}
```

**GET /providers/patients**
```json
Query Parameters:
- status: all | on_track | monitor | concern
- sortBy: name | lastAssessment | ageMonths
- limit: 50
- cursor: pagination_cursor

Response (200):
{
    "patients": [
        {
            "childId": "uuid",
            "name": "Emma S.",
            "ageMonths": 32,
            "status": "on_track",
            "lastAssessmentDate": "2026-01-15",
            "latestPercentiles": {
                "weight": 65,
                "height": 58
            },
            "earlyWarnings": []
        },
        ...
    ],
    "pagination": {
        "nextCursor": "cursor_string",
        "hasMore": true
    }
}
```

### 5.7 Report Generation APIs

**POST /reports/generate**
```json
Request:
{
    "childId": "uuid",
    "reportType": "comprehensive", // growth | milestone | comprehensive
    "dateRange": {
        "start": "2025-01-01",
        "end": "2026-01-23"
    },
    "includePhotos": true,
    "format": "pdf"
}

Response (202):
{
    "reportId": "uuid",
    "status": "generating",
    "estimatedCompletionTime": 10
}

// Poll status:
GET /reports/{reportId}/status

Response (200):
{
    "reportId": "uuid",
    "status": "completed",
    "downloadUrl": "https://s3.../report.pdf",
    "expiresAt": "2026-01-24T00:00:00Z"
}
```

### 5.8 API Rate Limiting

**Rate Limits by Tier:**
| Endpoint Category | Free Tier | Premium Tier | Provider Tier |
|-------------------|-----------|--------------|---------------|
| Authentication | 20/hour | 100/hour | 100/hour |
| Read Operations | 100/hour | 1000/hour | 5000/hour |
| Write Operations | 50/hour | 500/hour | 2000/hour |
| Assessment | 2/day | Unlimited | Unlimited |
| Report Generation | 5/month | Unlimited | Unlimited |
| AI Analysis | 10/day | Unlimited | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1643040000
```

---

## 6. AI/ML Model Specifications

### 6.1 Growth Prediction Model

**Purpose:** Predict future growth trajectory and identify deviations from expected patterns.

**Architecture:**
- Ensemble model: Random Forest + Gradient Boosting + Neural Network
- Input features (15-20):
  - Current weight, height, head circumference
  - Birth weight, birth length
  - Gestational age
  - Age in months
  - Gender
  - Historical growth velocity
  - Parental heights (optional)
  - Ethnicity (optional)
  - Geographic region

**Output:**
- Predicted weight/height at future ages (3, 6, 12 months ahead)
- Confidence intervals (95%)
- Growth velocity (kg/month, cm/month)
- Percentile trajectory

**Training Data:**
- WHO growth standards (primary): ~20,000 children
- User data (anonymized): 500,000+ children
- Augmented with published datasets (CDC, UK-WHO)

**Performance Metrics:**
- Mean Absolute Error (MAE): < 200g for weight, < 1.5cm for height
- R² score: > 0.95
- Calibration: Predicted vs actual within 5%

**Model Serving:**
- TensorFlow Serving with REST API
- Inference time: < 500ms
- Batch prediction for efficiency

### 6.2 Developmental Assessment Model

**Purpose:** Assess developmental progress across five domains and provide percentile scores.

**Architecture:**
- Multi-task learning neural network
- Shared layers: 3 dense layers (256, 128, 64 units)
- Domain-specific heads: 5 output heads (one per domain)
- Activation: ReLU (hidden), Sigmoid (output)
- Dropout: 0.3 for regularization

**Input Features (per child):**
- Age in months
- Gender
- Assessment responses (52-64 questions)
- Historical milestone achievements
- Previous assessment scores
- Demographic factors (optional)

**Output (per domain):**
- Raw score (0-100)
- Percentile score (0-100)
- Confidence interval
- Risk level (low, moderate, elevated)

**Training Data:**
- WHO milestone standards
- CDC developmental milestones
- ASQ-3 validated dataset
- User assessment data: 100,000+ assessments
- Clinical validation cohort: 1,000+ children

**Performance Metrics:**
- Sensitivity for delay detection: > 85%
- Specificity: > 90%
- Positive Predictive Value: > 75%
- AUC-ROC: > 0.90 for each domain
- Inter-rater reliability: Cohen's Kappa > 0.85

**Model Versioning:**
- MLflow for experiment tracking
- Model registry for version control
- A/B testing for new model deployment
- Rollback capability

### 6.3 Demographic Adjustment Algorithm

**Purpose:** Adjust growth and developmental assessments based on demographic factors to improve accuracy.

**Approach:**
- Bayesian hierarchical models
- Group-level parameters for ethnicity, geographic region
- Individual-level adjustments

**Adjustment Factors:**
- Ethnicity (e.g., Asian children tend to be lighter/shorter at same age)
- Geographic region (altitude, socioeconomic factors)
- Adjustment magnitude: ±5% for growth, ±2 weeks for milestones

**Bias Mitigation:**
- Regular fairness audits across demographic groups
- Equal performance metrics (sensitivity, specificity) per group
- Transparent methodology documentation
- User control (can disable demographic adjustment)
- Clinical advisory board review

**Ethical Safeguards:**
- Adjustments based on biological/environmental factors only
- No stereotyping or discrimination
- Clear explanation when adjustment applied
- Ongoing bias monitoring

### 6.4 Early Warning System

**Purpose:** Identify children who may benefit from professional evaluation based on assessment patterns.

**Architecture:**
- Gradient Boosting Classifier (XGBoost)
- Calibrated probability outputs

**Input Features:**
- All assessment scores and historical trends
- Rate of milestone achievement
- Number of missed milestones
- Growth percentile changes
- Domain-specific red flags

**Output:**
- Risk level: Low, Monitor, Discuss with Doctor, Urgent
- Specific concerns per domain
- Recommended actions
- Confidence score

**Threshold Calibration:**
- Optimized for high sensitivity (minimize false negatives)
- Acceptable false positive rate: < 15%
- Tiered alerting to avoid unnecessary alarm

**Clinical Validation:**
- Outcomes study: Track predictions vs actual diagnoses
- Pediatrician review of flagged cases
- Continuous model refinement

### 6.5 Video-Based Motor Assessment (Phase 2)

**Purpose:** Analyze videos of child performing motor activities to assess motor development.

**Architecture:**
- Computer vision: OpenPose for pose estimation
- CNN: ResNet-50 backbone for action recognition
- LSTM: For temporal sequence modeling

**Input:**
- 10-30 second video clips
- Activities: walking, running, climbing, drawing, stacking blocks

**Output:**
- Motor skill scores
- Movement quality assessment
- Milestone achievement detection
- Comparison to age norms

**Privacy:**
- On-device processing where possible (TensorFlow Lite)
- Cloud processing with encrypted videos
- Automatic deletion after analysis (user consent)

### 6.6 Speech Analysis Model (Phase 2)

**Purpose:** Analyze audio recordings to assess language and speech development.

**Architecture:**
- Speech-to-text: Whisper or Google Speech API
- NLP analysis: BERT-based model
- Audio features: librosa for prosody, fluency

**Input:**
- Audio recordings (30-60 seconds)
- Prompted speech samples

**Output:**
- Vocabulary richness score
- Grammar/syntax score
- Pronunciation clarity
- Fluency metrics
- Language development percentile

**Privacy:**
- On-device processing preferred
- Encrypted audio storage
- User-controlled deletion

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Authentication Methods:**
- Email/password with bcrypt hashing (cost factor: 12)
- OAuth 2.0: Google, Apple, Facebook
- JWT tokens:
  - Access token: 1-hour expiry, HS256 signed
  - Refresh token: 30-day expiry, stored in database, revocable
- Optional MFA: TOTP (Google Authenticator, Authy)

**Authorization:**
- Role-Based Access Control (RBAC)
  - Roles: user, provider, admin
  - Permissions: read:own, write:own, read:connected_patients, admin:all
- Token validation on every API request
- Resource ownership verification

**Session Management:**
- Redis for session storage
- 24-hour idle timeout
- Concurrent session limit: 5 per user
- Logout invalidates tokens

### 7.2 Data Encryption

**Encryption at Rest:**
- Database: AWS RDS encryption (AES-256)
- S3: Server-side encryption with AWS KMS
- Application-level encryption for PII:
  - Child names, user names: AES-256-GCM
  - Emails: Searchable encryption (deterministic)
- Encryption keys: AWS KMS, rotated annually

**Encryption in Transit:**
- TLS 1.3 for all API communication
- Certificate: AWS Certificate Manager, auto-renewal
- HSTS header: max-age=31536000; includeSubDomains
- Forward secrecy: ECDHE ciphers

**End-to-End Encryption:**
- Provider-patient messaging: Signal Protocol
- Photo/video uploads: Client-side encryption before S3 upload

### 7.3 Network Security

**VPC Architecture:**
- Private subnets for application and database layers
- Public subnets for load balancers only
- NAT gateways for outbound traffic
- No direct internet access to services

**Firewall Rules:**
- Security groups: Whitelist-based
- Application services: Only accept traffic from load balancer
- Databases: Only accept traffic from application services
- Bastion host for SSH access (MFA required)

**DDoS Protection:**
- AWS Shield Standard (automatic)
- AWS Shield Advanced (enterprise)
- WAF rules:
  - Rate limiting (10,000 req/5min per IP)
  - SQL injection detection
  - XSS prevention
  - Geo-blocking (if needed)

### 7.4 Application Security

**Input Validation:**
- Schema validation: Joi/Zod for all API inputs
- Sanitization: DOMPurify for user-generated content
- SQL injection prevention: Parameterized queries (TypeORM/Prisma)
- File upload validation:
  - Allowed MIME types: image/*, video/*, audio/*
  - Max file size: 100MB
  - Virus scanning: ClamAV

**Output Encoding:**
- HTML escaping for user-generated content
- JSON encoding for API responses
- Content Security Policy (CSP) headers

**OWASP Top 10 Mitigation:**
- A01: Access control at every layer
- A02: Cryptographic failures: Strong encryption
- A03: Injection: Parameterized queries, input validation
- A04: Insecure design: Threat modeling, security reviews
- A05: Security misconfiguration: Automated scanning
- A06: Vulnerable components: Dependabot, Snyk
- A07: Authentication failures: MFA, strong password policy
- A08: Software integrity: Signed packages, SRI
- A09: Logging failures: Comprehensive logging
- A10: SSRF: Whitelist external URLs

### 7.5 Compliance & Auditing

**HIPAA Compliance:**
- Business Associate Agreement (BAA) with AWS
- Encryption at rest and in transit
- Access controls and audit logging
- Breach notification procedures
- Regular risk assessments

**GDPR Compliance:**
- Data minimization
- User consent management
- Right to access: API endpoint for data export
- Right to erasure: 30-day soft delete, then permanent
- Data portability: JSON/CSV export
- Privacy by design

**Audit Logging:**
- Log all access to PHI/PII
- Log authentication events (success/failure)
- Log authorization failures
- Log data modifications (CRUD)
- Retention: 7 years in Elasticsearch
- SIEM integration for real-time alerts

**Security Monitoring:**
- AWS GuardDuty for threat detection
- AWS Inspector for vulnerability scanning
- Automated security scanning:
  - SAST: SonarQube
  - DAST: OWASP ZAP
  - Dependency scanning: Snyk, Dependabot
- Penetration testing: Annual third-party audit
- Bug bounty program (Phase 3)

### 7.6 Incident Response

**Incident Response Plan:**
1. Detection: Automated alerts via CloudWatch, Sentry
2. Containment: Isolate affected services
3. Eradication: Patch vulnerabilities, rotate credentials
4. Recovery: Restore from backups, validate
5. Post-incident: Root cause analysis, update procedures

**Breach Notification:**
- User notification: Within 72 hours (GDPR), 60 days (HIPAA)
- Regulatory notification: As required
- Communication plan: Email, in-app notification, website
- Legal counsel involvement

**Security Training:**
- Annual security training for all employees
- Phishing simulations quarterly
- Secure coding training for developers
- HIPAA training for healthcare-facing teams

---

## 8. Infrastructure Requirements

### 8.1 Compute Resources

**Production Environment (AWS):**

**Application Servers (ECS/EKS):**
- Node.js services: t3.medium (2 vCPU, 4GB RAM)
- Auto-scaling: 5 min, 20 max instances per service
- Python ML services: c5.xlarge (4 vCPU, 8GB RAM, GPU optional)
- Auto-scaling: 3 min, 10 max instances

**Database Servers:**
- PostgreSQL RDS: db.r5.xlarge (4 vCPU, 32GB RAM)
- Multi-AZ deployment for high availability
- Read replicas: 2 instances (db.r5.large)
- MongoDB DocumentDB: r5.large cluster (2 vCPU, 16GB RAM)
- ElastiCache Redis: cache.r5.large (2 vCPU, 13.07GB RAM)

**Serverless Functions:**
- AWS Lambda for webhooks, scheduled tasks
- Memory: 512MB to 2GB depending on function
- Concurrent executions: 100

### 8.2 Storage Requirements

**Database Storage:**
- PostgreSQL: 500GB provisioned IOPS SSD (io1)
- IOPS: 10,000 (scalable)
- MongoDB: 1TB General Purpose SSD (gp3)
- Redis: 50GB

**Object Storage (S3):**
- Media files: 10TB (Year 1) → 50TB (Year 5)
- Storage classes: Standard, Standard-IA, Glacier
- Versioning enabled for critical buckets
- Cross-region replication for disaster recovery

**Backup Storage:**
- Database backups: 1TB (retained 30 days)
- Cross-region backup replication

### 8.3 Network Requirements

**Bandwidth:**
- Expected traffic: 5TB/month (Year 1) → 100TB/month (Year 5)
- CloudFront CDN: Reduce origin traffic by 70%
- Data transfer: Primarily outbound (reports, media)

**Load Balancers:**
- Application Load Balancer (ALB) for HTTP/HTTPS traffic
- SSL/TLS termination at load balancer
- Health checks every 30 seconds
- Connection draining: 300 seconds

**CDN:**
- CloudFront distributions:
  - Web app static assets
  - Media files (images, videos)
  - API endpoint (for global low latency)
- Cache TTL: 1 hour for dynamic, 1 year for static
- Edge locations: Global

### 8.4 Environment Strategy

**Environments:**
1. **Development:** Individual developer machines, Docker Compose
2. **Staging:** AWS infrastructure (scaled down), mirrors production
3. **Production:** Full AWS infrastructure, multi-region

**Infrastructure as Code:**
- Terraform for all infrastructure provisioning
- Version control: Git repository
- Automated deployment via CI/CD
- Environment-specific variables in Terraform workspaces

**Multi-Region Deployment (Phase 3):**
- Primary region: us-east-1 (Virginia)
- Secondary region: eu-west-1 (Ireland)
- Tertiary region: ap-southeast-1 (Singapore)
- Database replication: Cross-region async replication
- Failover: Route 53 health checks and automatic failover

---

## 9. Integration Requirements

### 9.1 EMR/EHR Integration via FHIR

**FHIR Implementation:**
- Standard: HL7 FHIR R4
- SMART on FHIR for authorization
- Resources to support:
  - Patient (import demographics)
  - Observation (export growth measurements)
  - DiagnosticReport (export assessment summaries)
  - Condition (developmental concerns)

**Epic Integration:**
- Endpoint: Epic FHIR API (OAuth 2.0)
- App registration: Epic App Orchard
- Scopes: patient/Patient.read, patient/Observation.write
- Rate limits: Respect Epic throttling

**Cerner Integration:**
- Endpoint: Cerner FHIR API
- Authorization: OAuth 2.0
- Sandbox testing before production

**Allscripts Integration:**
- FHIR API or HL7 v2 messages (fallback)
- VPN connection for some implementations

**Error Handling:**
- Retry logic: Exponential backoff (max 5 retries)
- Failed sync queue: Manual review
- User notification on sync failures

### 9.2 Payment Integration

**Stripe:**
- Payment methods: Card, Apple Pay, Google Pay
- Subscription management: Create, update, cancel
- Webhooks: subscription.created, payment_succeeded, payment_failed
- PCI DSS compliance: Stripe handles card data
- Fraud detection: Stripe Radar

**PayPal (Optional):**
- Alternative payment method
- Express Checkout for subscriptions

### 9.3 Communication Services

**Email (SendGrid):**
- Transactional emails: Account verification, password reset
- Marketing emails: Monthly newsletters (opt-in)
- Templates: Dynamic templating with Handlebars
- Deliverability: DKIM, SPF, DMARC configuration

**SMS (Twilio):**
- Phone verification: OTP for 2FA
- Notifications: High-priority alerts (opt-in)
- International support

**Push Notifications:**
- iOS: Apple Push Notification Service (APNs)
- Android: Firebase Cloud Messaging (FCM)
- Web: Web Push API (via service worker)
- Notification types: Milestones, assessments, provider messages

### 9.4 Analytics Integration

**Product Analytics (Mixpanel/Amplitude):**
- Event tracking: User actions, feature usage
- Funnels: Onboarding, subscription conversion
- Retention cohorts
- A/B testing results

**Error Tracking (Sentry):**
- Real-time error monitoring
- Source maps for stack traces
- Release tracking
- Performance monitoring (APM)

### 9.5 Smart Device Integration

**Withings API:**
- OAuth 2.0 for authorization
- Webhook for weight/height data
- Auto-sync on measurement

**Fitbit API:**
- OAuth 2.0 for authorization
- Weight, body fat percentage (Aria scale)
- Polling every 15 minutes for new data

---

## 10. Testing Requirements

### 10.1 Testing Strategy

**Test Pyramid:**
```
       /\
      /E2E\          (10% - Critical user flows)
     /------\
    /  API   \       (30% - Integration tests)
   /----------\
  /    Unit    \     (60% - Unit tests)
 /--------------\
```

### 10.2 Unit Testing

**Coverage Requirements:**
- Target: 90%+ code coverage
- Mandatory: All business logic, AI models
- Tools: Jest (Node.js), pytest (Python)

**Test Categories:**
- Business logic (services, utils)
- Data validation and transformation
- AI model inference (with mocked models)
- API endpoint logic (with mocked dependencies)

### 10.3 Integration Testing

**API Integration Tests:**
- Test all API endpoints with real database
- Tools: Supertest (Node.js), pytest (Python)
- Test scenarios:
  - Happy path
  - Error cases (400, 401, 403, 404, 500)
  - Edge cases (empty data, large payloads)
  - Rate limiting

**Database Integration Tests:**
- Test database queries and transactions
- Test data consistency (foreign keys, constraints)
- Test migrations (up and down)

**Third-Party Integration Tests:**
- Mock external services (Stripe, SendGrid, FHIR)
- Test error handling and retries

### 10.4 End-to-End Testing

**E2E Test Scenarios:**
1. User registration → child profile → first measurement
2. Complete assessment → view results → generate report
3. Provider invites patient → patient accepts → data sharing
4. Premium subscription → payment → access premium features
5. Multi-device sync (mobile + web)

**Tools:**
- Web: Playwright or Cypress
- Mobile: Detox (React Native)
- Frequency: Run on every release candidate

### 10.5 AI/ML Model Testing

**Model Validation:**
- Held-out test dataset (20% of data)
- Cross-validation (10-fold)
- Metrics: Sensitivity, specificity, AUC-ROC, calibration

**Bias and Fairness Testing:**
- Evaluate model performance across demographic groups
- Ensure equal sensitivity and specificity per group
- Test for disparate impact

**A/B Testing:**
- Deploy new models to 5% of users initially
- Monitor metrics for 2 weeks
- Gradual rollout if successful

### 10.6 Security Testing

**Automated Security Scanning:**
- SAST: SonarQube (every commit)
- Dependency scanning: Snyk, Dependabot (daily)
- Container scanning: Trivy (on build)

**Manual Security Testing:**
- Penetration testing: Annual third-party audit
- OWASP Top 10 testing
- Authentication and authorization testing
- Data leakage testing

### 10.7 Performance Testing

**Load Testing:**
- Tools: k6, JMeter
- Scenarios:
  - Baseline: 1,000 concurrent users
  - Peak: 10,000 concurrent users
  - Spike: Sudden 10x traffic increase
- Metrics: Response time, throughput, error rate

**Stress Testing:**
- Push system beyond limits to find breaking point
- Verify graceful degradation

**Endurance Testing:**
- Sustained load for 24+ hours
- Monitor for memory leaks, performance degradation

### 10.8 Usability Testing

**User Testing:**
- 5-10 parents per iteration
- Tasks: Onboarding, measurement entry, assessment
- Metrics: Task completion rate, time on task, satisfaction
- Tools: UserTesting.com, in-person sessions

**Accessibility Testing:**
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast validation
- Automated: axe, Lighthouse

---

## 11. DevOps and Deployment

### 11.1 CI/CD Pipeline

**Continuous Integration (GitHub Actions):**
```yaml
Trigger: Push to any branch

Steps:
1. Checkout code
2. Install dependencies
3. Lint (ESLint, Prettier)
4. Unit tests (Jest, pytest)
5. Build Docker images
6. Push to ECR (on main branch)
7. Security scan (Snyk, Trivy)
8. Notify team (Slack)
```

**Continuous Deployment:**
```yaml
Trigger: Tag (e.g., v1.2.3)

Stages:
1. Deploy to Staging
   - Apply Terraform
   - Deploy containers (ECS/EKS)
   - Run integration tests
   - Run E2E tests
2. Manual Approval (for production)
3. Deploy to Production
   - Blue-green deployment
   - Health checks
   - Rollback on failure
```

### 11.2 Deployment Strategy

**Blue-Green Deployment:**
- Two identical environments (blue, green)
- Deploy to inactive environment
- Run smoke tests
- Switch traffic via load balancer
- Keep old environment for quick rollback (30 minutes)

**Canary Deployment (for AI models):**
- Deploy new model to 5% of traffic
- Monitor metrics for 24-48 hours
- Gradually increase traffic (5% → 25% → 50% → 100%)
- Automatic rollback if error rate > threshold

**Database Migrations:**
- Backward-compatible migrations only
- Run before code deployment
- Avoid schema changes during code changes (separate PRs)
- Always test rollback

### 11.3 Rollback Procedures

**Application Rollback:**
- Keep previous 3 versions in container registry
- Rollback via ECS/EKS task definition update
- Time to rollback: < 5 minutes
- Trigger: High error rate, performance degradation

**Database Rollback:**
- Down migrations tested in staging
- Manual trigger only (requires approval)
- Data loss considerations

**AI Model Rollback:**
- Keep previous 3 model versions in MLflow
- Instant rollback via model serving config
- Automatic if error rate > 5% or latency > 10s

### 11.4 Environment Configuration

**Configuration Management:**
- Environment variables for secrets (AWS Secrets Manager)
- Config files for non-sensitive settings (Terraform variables)
- Feature flags for gradual rollout (LaunchDarkly or custom)

**Secrets Rotation:**
- Database passwords: Rotate every 90 days
- API keys: Rotate every 180 days
- JWT signing keys: Rotate every 365 days
- Automated rotation via AWS Secrets Manager

---

## 12. Monitoring and Observability

### 12.1 Application Monitoring

**Metrics (Prometheus + Grafana):**
- API metrics: Request rate, error rate, latency (p50, p95, p99)
- Business metrics: Sign-ups, assessments, subscriptions
- Infrastructure metrics: CPU, memory, disk, network
- Database metrics: Connections, query time, slow queries
- Custom dashboards per service

**Logging (ELK Stack):**
- Centralized logging: All services → Logstash → Elasticsearch
- Log levels: DEBUG, INFO, WARN, ERROR
- Structured logging: JSON format
- Log retention: 30 days in Elasticsearch, 1 year in S3
- Search and analysis via Kibana

**Tracing (AWS X-Ray or Jaeger):**
- Distributed tracing across microservices
- End-to-end request tracking
- Performance bottleneck identification

**Error Tracking (Sentry):**
- Real-time error alerts
- Stack traces with source maps
- User context (userId, childId)
- Release tracking

### 12.2 Infrastructure Monitoring

**AWS CloudWatch:**
- EC2/ECS metrics: CPU, memory, network
- RDS metrics: Connections, replication lag, IOPS
- S3 metrics: Request rate, data transfer
- Lambda metrics: Duration, errors, throttles
- Alarms: Email/SMS via SNS

**Health Checks:**
- Load balancer health checks: Every 30 seconds
- Endpoint: GET /health
- Response: 200 OK + {"status": "healthy"}
- Unhealthy threshold: 2 consecutive failures

### 12.3 Alerting

**Alert Channels:**
- PagerDuty for critical alerts (24/7 on-call)
- Slack for warning alerts
- Email for informational alerts

**Alert Severity Levels:**
- **Critical** (P1): Service down, data loss risk → PagerDuty
- **High** (P2): Elevated error rate, slow response → Slack + Email
- **Medium** (P3): Abnormal metrics, approaching limits → Slack
- **Low** (P4): Informational, planned maintenance → Email

**Key Alerts:**
- API error rate > 5% for 5 minutes → P1
- API p95 latency > 2s for 10 minutes → P2
- Database CPU > 80% for 15 minutes → P2
- Failed deployments → P1
- Security: Unauthorized access attempts → P1

### 12.4 Business Metrics Dashboards

**User Metrics:**
- Daily/Monthly Active Users (DAU/MAU)
- New sign-ups (daily, weekly, monthly)
- Retention cohorts (1-day, 7-day, 30-day)
- Churn rate

**Feature Usage:**
- Measurements logged per day
- Assessments completed per day
- Reports generated per day
- Provider connections per day

**Revenue Metrics:**
- New subscriptions (daily, monthly)
- Subscription cancellations
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn rate by tier

---

## 13. Compliance and Documentation

### 13.1 Regulatory Documentation

**FDA 510(k) Submission (Phase 2):**
- Device description
- Intended use statement
- Substantial equivalence comparison
- Software documentation (IEC 62304)
- Clinical validation studies
- Risk analysis (ISO 14971)
- Labeling and instructions for use

**ISO 13485 Quality Management:**
- Quality manual
- Standard operating procedures (SOPs)
- Design controls
- Risk management
- Verification and validation
- Post-market surveillance

### 13.2 Technical Documentation

**Architecture Documentation:**
- System architecture diagrams (C4 model)
- Data flow diagrams
- Sequence diagrams for key flows
- Infrastructure diagrams

**API Documentation:**
- OpenAPI 3.0 specifications
- Interactive API docs (Swagger UI)
- Code examples for each endpoint
- Changelog for API versions

**Database Documentation:**
- Entity-relationship diagrams (ERD)
- Schema documentation (auto-generated)
- Migration history

**AI/ML Model Documentation:**
- Model cards: Architecture, training data, performance
- Feature importance
- Limitations and biases
- Intended use cases

### 13.3 Developer Documentation

**Setup Guides:**
- Local development environment setup
- Docker Compose for local services
- IDE configuration (VSCode recommended)
- Pre-commit hooks (linting, formatting)

**Coding Standards:**
- TypeScript/JavaScript: Airbnb style guide
- Python: PEP 8
- Linting: ESLint, Pylint
- Formatting: Prettier, Black

**Git Workflow:**
- Branch naming: feature/, bugfix/, hotfix/
- Commit messages: Conventional Commits
- Pull request templates
- Code review checklist

**Onboarding Documentation:**
- New developer onboarding guide
- Architecture overview
- Codebase tour
- Key concepts and domain knowledge

---

## 14. Appendices

### Appendix A: Technology Decision Matrix

| Category | Option A | Option B | Choice | Justification |
|----------|----------|----------|--------|---------------|
| Mobile Framework | React Native | Flutter | React Native | JavaScript ecosystem, web code reuse, larger talent pool |
| Backend Language | Node.js (TS) | Python | Node.js | Async I/O for APIs, TypeScript for safety, JS ecosystem |
| ML Framework | TensorFlow | PyTorch | Both | TensorFlow for production serving, PyTorch for research |
| Database (SQL) | PostgreSQL | MySQL | PostgreSQL | JSON support, ACID compliance, extensions (PostGIS future) |
| Database (NoSQL) | MongoDB | DynamoDB | MongoDB | Flexible schema, familiar query language, DocumentDB compatibility |
| Cloud Provider | AWS | Google Cloud | AWS | Market leader, comprehensive services, HIPAA-compliant options |
| Container Orchestration | Kubernetes | ECS | Kubernetes | Portability, ecosystem, future multi-cloud |

### Appendix B: Third-Party Service Costs (Estimated)

| Service | Purpose | Estimated Monthly Cost (Y1) |
|---------|---------|------------------------------|
| AWS Infrastructure | Compute, storage, networking | $5,000 |
| Stripe | Payment processing (2.9% + $0.30) | $500 |
| SendGrid | Email delivery | $100 |
| Twilio | SMS | $50 |
| Sentry | Error tracking | $100 |
| DataDog/New Relic | APM | $500 |
| **Total** | | **$6,250/month** |

### Appendix C: Glossary

(Continued from BRD, technical terms)

- **API Gateway**: Entry point for all client requests, handles routing and authentication
- **CI/CD**: Continuous Integration / Continuous Deployment
- **ECS**: Elastic Container Service (AWS)
- **EKS**: Elastic Kubernetes Service (AWS)
- **FHIR**: Fast Healthcare Interoperability Resources
- **JWT**: JSON Web Token
- **LOINC**: Logical Observation Identifiers Names and Codes
- **ORM**: Object-Relational Mapping
- **RBAC**: Role-Based Access Control
- **RDS**: Relational Database Service (AWS)
- **REST**: Representational State Transfer
- **SNOMED CT**: Systematized Nomenclature of Medicine - Clinical Terms
- **TOTP**: Time-based One-Time Password
- **VPC**: Virtual Private Cloud

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 23, 2026 | Engineering Core | Initial comprehensive TRD |

**END OF DOCUMENT**
