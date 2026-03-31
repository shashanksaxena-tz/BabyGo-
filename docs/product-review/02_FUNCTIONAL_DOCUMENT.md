# TinySteps AI - Functional Specification Document

**Document Version:** 1.0
**Date:** March 30, 2026
**Classification:** Internal Product Reference

---

## 1. Product Overview

### 1.1 What is TinySteps AI?

TinySteps AI is a smart parenting assistant that helps parents track, understand, and nurture their child's development from birth through early childhood. It combines WHO (World Health Organization) developmental standards with AI-powered analysis to give parents evidence-based insights about their child's growth, milestones, and developmental progress.

### 1.2 Target Users

| User Persona | Description | Primary Needs |
|---|---|---|
| **New Parents** | First-time parents (ages 25-40) | Guidance, milestone awareness, anxiety reduction |
| **Experienced Parents** | Multi-child families | Comparative tracking, efficiency |
| **Caregivers** | Grandparents, nannies, babysitters | Daily tracking, reporting to parents |
| **Healthcare Providers** | Pediatricians receiving shared reports | Structured developmental data |

### 1.3 Target Market

- **Primary**: Parents in India (10 Indian languages supported)
- **Secondary**: Global English-speaking parents
- **Child Age Range**: 0-60 months (0-5 years)

### 1.4 Platforms Supported

| Platform | Technology | Status |
|---|---|---|
| Web Browser | React + TypeScript | Active |
| Android/iOS | Flutter | Active |
| Desktop (Windows/Mac) | Electron + React | Active |

---

## 2. User Journey

### 2.1 Onboarding Flow

```
1. Register with email & password
         │
         ▼
2. Create first child profile
   (Name, DOB, Gender, Weight, Height, Head Circumference, Region)
         │
         ▼
3. Set preferences (Language, Notifications, Theme)
         │
         ▼
4. Land on Home Dashboard
```

### 2.2 Core User Loop

```
                    ┌──────────────────┐
                    │  HOME DASHBOARD  │
                    │                  │
                    │  Quick Stats     │
                    │  Latest Analysis │
                    │  Upcoming Miles. │
                    │  Quick Actions   │
                    └───────┬──────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
     │  TRACK    │   │  ANALYZE  │   │  DISCOVER  │
     │           │   │           │   │            │
     │ Milestones│   │ Upload    │   │ Stories    │
     │ Growth    │   │ media     │   │ Recipes    │
     │ Timeline  │   │ Get AI    │   │ Activities │
     │           │   │ insights  │   │ Tips       │
     └─────┬─────┘   └─────┬─────┘   └─────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                    ┌───────▼──────────┐
                    │  ACT ON INSIGHTS │
                    │                  │
                    │  Resources       │
                    │  Doctor Consult  │
                    │  Reports         │
                    │  Community       │
                    └──────────────────┘
```

---

## 3. Feature Modules - Functional Breakdown

### 3.1 Authentication & User Management

**Purpose**: Secure account creation and personalization.

| Function | Description | Business Value |
|---|---|---|
| Email Registration | Create account with email, password, name | User acquisition |
| Login/Logout | Email + password authentication | Security |
| Token Refresh | Seamless session continuity | UX quality |
| Language Selection | Choose from 11 languages (English + 10 Indian) | Market reach in India |
| Theme Preference | Light/Dark mode | User comfort |
| Personal API Key | User can provide own Gemini API key | Cost sharing, power users |

### 3.2 Child Profile Management

**Purpose**: Create and maintain detailed child profiles as the foundation for all tracking.

| Function | Description | Business Value |
|---|---|---|
| Create Profile | Name, DOB, gender, measurements, region | Core data foundation |
| Multiple Children | Support multiple child profiles per account | Family retention |
| Profile Photo | Upload child photo to MinIO | Personalization, story integration |
| Interests & Favorites | Track favorite toys, characters, colors | Content personalization |
| WHO Region | Select from 6 WHO regions | Accurate growth standards |
| Auto Age Calculation | Compute age in months/days from DOB | Milestone accuracy |

### 3.3 Developmental Milestone Tracking

**Purpose**: Track child's progress against WHO developmental milestones across 4 domains.

**Domains Tracked:**
- **Motor**: Physical movements - crawling, walking, grasping
- **Language**: Communication - babbling, first words, sentences
- **Cognitive**: Thinking - problem-solving, object permanence, sorting
- **Social**: Interaction - eye contact, sharing, pretend play

| Function | Description | Business Value |
|---|---|---|
| View Age-Appropriate Milestones | Show milestones expected for child's current age | Awareness |
| Mark as Achieved | Record when child reaches a milestone (with date) | Progress tracking |
| Watch List | Flag milestones parent wants to monitor | Proactive monitoring |
| Progress Visualization | Percentage completion by domain | Motivation & clarity |
| Upcoming Milestones | Show what's next in each domain | Preparedness |

### 3.4 AI-Powered Development Analysis

**Purpose**: The flagship feature - upload media of your child and receive AI-powered developmental assessment.

**Analysis Workflow:**
1. Parent uploads photos/videos of child in play/activity
2. Optionally records audio (baby sounds, parent narration)
3. AI analyzes media against WHO standards for child's age
4. Returns comprehensive assessment across all 4 domains

| Function | Description | Business Value |
|---|---|---|
| Media Upload | Upload photos and videos of child | Data capture |
| Audio Analysis | Record and analyze baby sounds/vocalizations | Language development insight |
| Overall Score | 0-100 developmental score | Quick health check |
| Domain Scores | Individual scores for Motor, Language, Cognitive, Social | Specific insights |
| Status Assignment | Ahead / On Track / Monitoring / Emerging / Needs Support | Clear actionable status |
| Personalized Tips | AI-generated parenting tips based on analysis | Actionable guidance |
| Structured Tips | Tips categorized by: sleep, feeding, behavior, safety, development, health, bonding | Organized help |
| Activity Profile | Analysis of child's play patterns, engagement, focus | Behavioral insight |
| Warnings | Flag developmental concerns that need attention | Early intervention |
| WHO Sources | Link findings to WHO evidence and guidelines | Trust & credibility |
| History | View all past analyses with trend | Progress over time |
| Regenerate | Re-run analysis on latest data | Updated insights |

### 3.5 Growth Tracking & WHO Charts

**Purpose**: Track physical growth measurements and compare against WHO growth curves.

| Function | Description | Business Value |
|---|---|---|
| Log Measurements | Record weight, height, head circumference with date | Growth data |
| WHO Percentiles | Calculate percentile position vs. WHO standards | Medical-grade tracking |
| Growth Curves | Interactive charts showing growth trajectory | Visual understanding |
| Gender-Specific | Separate male/female growth standards | Accuracy |
| Regional Standards | Growth norms for 6 WHO regions | Cultural accuracy |
| Percentile Alerts | Flag when measurements fall outside normal range | Early warning |
| Growth Velocity | Track rate of growth over time | Trend detection |

### 3.6 Bedtime Stories

**Purpose**: AI-generated personalized bedtime stories featuring the child.

| Function | Description | Business Value |
|---|---|---|
| Theme Selection | Choose from 8 themes: Adventure, Animals, Space, Ocean, Magic, Dinosaurs, Dreams, Friendship | Variety |
| Custom Story Builder | Define characters, setting, action, or write own prompt | Creativity |
| AI Story Generation | Gemini creates multi-page story with moral | Engagement |
| AI Illustrations | Each page gets a generated illustration | Visual appeal |
| Child Photo Integration | Child's face can appear in illustrations | Personalization |
| Reading Time | Estimated reading time per page and total | Planning |
| Favorites | Mark stories as favorites | Re-reading |
| Read Count | Track how many times a story has been read | Engagement data |
| Story Library | Browse all generated stories | Content library |

### 3.7 Recommendations Engine

**Purpose**: AI-powered personalized suggestions across multiple categories.

#### 3.7.1 Activity Recommendations
| Function | Description |
|---|---|
| Age-Appropriate Activities | Suggest development-boosting activities for child's age |
| Domain-Specific | Activities targeting weak domains from analysis |
| Materials List | What parents need for each activity |
| Step-by-Step | Instructions for each activity |
| Difficulty Rating | Easy/Medium/Hard classification |
| Duration Estimate | Expected time for activity |

#### 3.7.2 Recipe Recommendations
| Function | Description |
|---|---|
| Age-Appropriate Recipes | Meals suitable for child's age and texture needs |
| Meal Type Filter | Breakfast, lunch, dinner, snack, puree, finger food |
| Allergen Awareness | Flag and filter by common allergens |
| Nutrition Info | Calories, protein, fiber, iron per recipe |
| Regional Cuisine | Recipes mapped to child's region (Indian regional cuisine) |
| Favorites | Save favorite recipes |
| Regenerate | Get fresh recipes based on updated child data |

#### 3.7.3 Product/Toy Recommendations
| Function | Description |
|---|---|
| Age-Appropriate Products | Toys, books, educational items for child's age |
| Category Filter | Toys, books, educational, outdoor, sensory, feeding, safety |
| Development Areas | Which domains each product supports |
| Price Range | Budget-friendly to premium options |
| Why Recommended | Explanation of developmental benefit |

#### 3.7.4 Parenting Tips
| Function | Description |
|---|---|
| Categorized Tips | Sleep, feeding, behavior, safety, development, health, bonding |
| Action Steps | Concrete steps parents can take |
| Priority Levels | Urgent vs. informational |
| Source Attribution | WHO and expert sources |

### 3.8 Timeline / Journal

**Purpose**: Chronological record of the child's development journey.

| Function | Description | Business Value |
|---|---|---|
| Auto-Entries | Analyses, milestones, measurements auto-logged | Effortless journaling |
| Manual Entries | Add notes, photos, custom events | Personal touch |
| Entry Types | Analysis, milestone, measurement, photo, note, story, recipe, voice | Comprehensive |
| Media Attachments | Attach photos/audio to entries | Rich memories |
| Tag System | Tags for categorization and search | Organization |
| Time Filtering | Filter by time period | Quick access |

### 3.9 Pediatrician Reports

**Purpose**: Generate professional, shareable reports for healthcare providers.

| Function | Description | Business Value |
|---|---|---|
| Auto-Generation | Create report from latest analysis data | Convenience |
| Report Number | Unique identifier (RPT-YYYY-MMDD) | Professional standard |
| Patient Info | Child demographics and measurements | Clinical data |
| Domain Assessments | Each domain with alert level (none/watch/concern) | Clinical relevance |
| Growth Percentiles | WHO-based growth data | Medical standard |
| Recommendations | AI-generated care recommendations | Actionable plan |
| PDF Export | Downloadable PDF format | Printable |
| Sharing | Share via email or link | Doctor collaboration |
| WHO Sources | Evidence citations | Credibility |

### 3.10 Resources Library

**Purpose**: Curated learning resources matched to child's development needs.

| Function | Description | Business Value |
|---|---|---|
| Analysis-Based | Resources generated from latest analysis results | Relevance |
| Resource Types | Activities, books, videos, toys, apps | Variety |
| Domain Filtering | Filter by Motor, Language, Cognitive, Social | Focus |
| Difficulty Levels | Matched to child's current ability | Appropriateness |
| Priority Ranking | Most important resources highlighted | Actionability |
| Regenerate | Refresh based on latest analysis | Currency |

### 3.11 Health Hub & Doctor Directory

**Purpose**: Connect parents with relevant healthcare professionals.

| Function | Description | Business Value |
|---|---|---|
| Doctor Directory | List of pediatricians and specialists | Access to care |
| Domain Matching | Recommend doctors based on flagged developmental areas | Targeted care |
| Doctor Profiles | Specialty, experience, rating, fees, qualifications | Informed decisions |
| Location Info | Clinic address, city | Proximity |
| Availability | Available days per doctor | Scheduling |

### 3.12 Community Forum

**Purpose**: Parent-to-parent peer support and knowledge sharing.

| Function | Description | Business Value |
|---|---|---|
| Create Posts | Share experiences, questions, tips | User engagement |
| Categories | General, motor-skills, language, cognitive, social, sleep, nutrition, milestones | Organization |
| Like System | Like posts and comments | Social validation |
| Comments | Reply to posts | Discussion |
| Search | Find posts by keyword | Discovery |
| Trending Topics | Popular categories and discussions | Content discovery |
| Featured Posts | Highlighted quality content | Community curation |
| Sort Options | Recent or popular | Navigation |

### 3.13 Multi-Language Support

**Purpose**: Make the platform accessible to diverse Indian families.

| Language | Code |
|---|---|
| English | en |
| Hindi | hi |
| Bengali | bn |
| Gujarati | gu |
| Kannada | kn |
| Malayalam | ml |
| Marathi | mr |
| Odia | or |
| Punjabi | pa |
| Tamil | ta |
| Telugu | te |

**Implementation**: Translation caching with 30-day TTL, user-level language preference.

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target |
|---|---|
| API Response Time | < 500ms (non-AI routes) |
| AI Analysis Time | < 30 seconds |
| Story Generation | < 60 seconds (with illustrations) |
| Page Load (Web) | < 3 seconds |
| Offline Capability | Mobile: read cached data offline |

### 4.2 Reliability

| Metric | Target |
|---|---|
| API Uptime | 99.5% |
| Data Durability | MongoDB persistence + backup |
| Graceful Degradation | App usable without AI features if Gemini is down |

### 4.3 Security

| Requirement | Implementation |
|---|---|
| Data Encryption | HTTPS in transit, bcrypt for passwords |
| Authentication | JWT with expiry |
| Authorization | User can only access own data and children |
| Rate Limiting | Prevent abuse (100 req/15 min) |
| Input Sanitization | All API inputs validated |
| File Safety | Upload type and size restrictions |

### 4.4 Accessibility

| Requirement | Status |
|---|---|
| Multi-Language | 11 languages supported |
| Mobile-Responsive | Flutter native + responsive web |
| Offline Support | Mobile app via Hive local DB |

---

## 5. Business Rules

### 5.1 Scoring Rules

| Score Range | Status | Action Level |
|---|---|---|
| 80-100 | Ahead | Celebrate, maintain |
| 65-79 | On Track | Continue current activities |
| 50-64 | On Track with Monitoring | Watch closely, gentle intervention |
| 35-49 | Emerging | Active support recommended |
| 0-34 | Needs Support | Professional consultation advised |

### 5.2 Growth Percentile Rules

| Percentile | Interpretation |
|---|---|
| < 3rd | Significantly below average - medical review recommended |
| 3rd - 15th | Below average - monitor closely |
| 15th - 85th | Normal range |
| 85th - 97th | Above average - typically healthy |
| > 97th | Significantly above average - medical review recommended |

### 5.3 Milestone Rules

- Milestones sourced from WHO developmental milestone database
- Each milestone has a typical age and an acceptable age range
- "Current" = within child's age range and typical age has passed
- "Upcoming" = typical age still ahead of child's current age
- "Achieved" = explicitly marked by parent or detected in analysis

### 5.4 Content Generation Rules

- All AI-generated content is age-appropriate (filtered by child's age in months)
- Recipes respect declared allergens
- Stories include a moral/lesson
- Tips reference WHO sources where applicable
- Products include developmental justification

---

## 6. Integration Points

| System | Direction | Purpose |
|---|---|---|
| Google Gemini API | Backend -> External | AI analysis, content generation |
| MinIO Storage | Backend <-> MinIO | File storage and retrieval |
| Sarvam API (optional) | Backend -> External | Audio transcription (Indian languages) |
| WHO Data (embedded) | Backend internal | Growth standards, milestones |

---

## 7. Future Functional Considerations

| Area | Potential Enhancement |
|---|---|
| Vaccination Tracker | Schedule and track immunizations |
| Sleep Tracking | Log sleep patterns and quality |
| Feeding Log | Track breastfeeding, bottle, solids |
| Appointment Booking | Book doctor visits directly |
| Video Consultations | In-app telemedicine |
| Partner/Co-Parent Access | Shared child profiles |
| Daycare Integration | Share reports with childcare providers |
| Wearable Integration | Smart baby monitors, scales |
| Push Notifications | Milestone reminders, analysis prompts |
| Export Data | Full data export (GDPR compliance) |

---

*End of Functional Document*
