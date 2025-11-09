# Product Requirements Document: Meal Tracker Feature

## Second Brain App

### Executive Summary

This PRD defines the Meal Tracker feature for the Second Brain app, providing users with a comprehensive nutrition tracking and meal planning system. The feature helps users achieve their health goals by tracking calories, logging meals, analyzing nutrition with AI, and maintaining streak-based engagement through gamification.

### Business Context

**Strategic Alignment:**

- Enhances personal productivity suite with health and wellness capabilities
- Leverages existing authentication and database infrastructure
- Integrates AI capabilities through OpenRouter for image-based nutrition estimation
- Provides practical utility for health-conscious users with goal-oriented tracking
- Maintains mobile-first responsive design philosophy

**Success Criteria:**

- Intuitive meal logging with manual entry and AI-assisted image recognition
- TDEE-based calorie goal calculation and tracking
- Streak system to encourage consistent logging and healthy habits
- Comprehensive nutrition analytics and progress visualization
- Quick food search for calorie checking without logging
- Mobile-optimized interface for on-the-go meal tracking

---

## User Stories & Requirements

### Core User Stories

**US-1: Calculate TDEE and Set Goals**

```
As a user
I want to input my personal information (age, weight, height, activity level, goal)
So that the system can calculate my TDEE and daily calorie target to achieve my health goal
```

**US-2: Log Meals with Nutrition**

```
As a user
I want to log meals with detailed nutrition information (calories, protein, carbs, fat)
So that I can track my daily intake and ensure I'm meeting my calorie and macronutrient targets
```

**US-3: AI-Powered Image Recognition**

```
As a user
I want to upload a photo of my meal and get automatic nutrition estimation
So that I can quickly log meals without manually entering all nutrition details
```

**US-4: Track Streak and Progress**

```
As a user
I want to see my logging streak and gamified achievements
So that I stay motivated to consistently track my meals and build healthy habits
```

**US-5: View Analytics and Insights**

```
As a user
I want to see daily, weekly, and monthly nutrition analytics with charts
So that I can understand my eating patterns and adjust my diet to meet my goals
```

**US-6: Save Favorite Foods**

```
As a user
I want to save frequently eaten foods as favorites
So that I can quickly log common meals without re-entering nutrition details
```

**US-7: Quick Food Search**

```
As a user
I want to search for food by name or image to check calories without logging
So that I can make informed decisions when ordering or shopping for food
```

**US-8: Set Meal Reminders (Future)**

```
As a user
I want to set reminders for logging meals at specific times
So that I don't forget to track my intake throughout the day
```

### Functional Requirements

**FR-1: TDEE Calculation and Goal Setting**

- Input form for personal metrics (age, weight, height, gender)
- Activity level selection (sedentary, lightly active, moderately active, very active, extremely active)
- Goal selection (lose weight, maintain weight, gain weight)
- Automatic TDEE calculation using Mifflin-St Jeor equation
- Daily calorie target adjustment based on goal (-500 cal for weight loss, +500 cal for gain)
- Macronutrient target calculation (protein: 2g/kg, fat: 25-35% of calories, carbs: remainder)
- Profile update capability to recalculate TDEE

**FR-2: Meal Logging**

- Manual meal entry with nutrition details (calories, protein, carbs, fat, serving size)
- Meal type categorization (breakfast, lunch, dinner, snack)
- Photo attachment for meal documentation
- Timestamp tracking (automatic or manual time selection)
- Edit and delete logged meals
- Copy previous meals for repeated entries
- Quick add from favorite foods list
- Meal notes for additional context

**FR-3: AI Nutrition Estimation**

- Image upload from camera or gallery
- Integration with OpenRouter API for vision models
- Automatic food identification and nutrition estimation
- Editable AI suggestions before saving
- Fallback to manual entry if AI fails
- Support for multiple foods in one image
- Confidence scoring for AI estimates

**FR-4: Streak System**

- Daily logging streak counter
- Visual streak calendar with logged days highlighted
- Streak achievements and milestones (7 days, 30 days, 100 days, etc.)
- Streak freeze mechanism (allow 1-2 missed days per month)
- Motivational messages and encouragement
- Streak recovery suggestions when broken

**FR-5: Analytics Dashboard**

- Daily summary (calories, macros, progress vs target)
- Weekly trend charts (calories, weight, macros over time)
- Monthly aggregated statistics
- Nutrient breakdown pie charts
- Meal timing analysis
- Goal achievement percentage
- Historical data visualization

**FR-6: Favorite Foods**

- Save frequently eaten foods to favorites list
- Store complete nutrition information for quick access
- Quick-add favorites directly to meal log
- Edit and update favorite food details
- Delete favorites when no longer needed
- Recent meals auto-suggest as favorites
- Category/tag organization for favorites (optional)
- Search within favorites list

**FR-7: Food Search**

- Text-based food search with nutrition database
- Image-based food search with AI recognition
- Display nutrition information without logging
- Quick-add to meal log from search results
- Save search results to favorites
- Recently searched foods history
- Popular foods suggestions

**FR-8: Data Management**

- Export meal history as CSV/JSON
- Import meals from external sources
- Backup and restore functionality
- Data privacy controls
- Account deletion with data removal

### Non-Functional Requirements

**NFR-1: Performance**

- Page load time under 1 second
- AI image processing under 5 seconds
- Meal CRUD operations under 500ms
- Analytics chart rendering under 1 second
- Efficient image upload and compression
- Responsive interactions without lag

**NFR-2: Usability**

- Intuitive meal logging flow (< 30 seconds per meal)
- Clear visual feedback for daily progress
- Accessible on mobile and desktop
- WCAG 2.1 AA compliance
- Offline capability for viewing logged meals
- Multi-language support (English, Thai)

**NFR-3: Security**

- User-scoped data access only
- Secure API key storage for OpenRouter
- Input validation and sanitization
- Rate limiting for AI API calls
- Secure image storage and handling
- GDPR compliance for user data

**NFR-4: Scalability**

- Support up to 10,000 meals per user
- Efficient database queries with indexing
- Paginated loading for meal history
- Image storage optimization (compression, CDN)
- API rate limiting and quota management
- Cost-effective AI API usage

**NFR-5: Reliability**

- 99.9% uptime for meal logging
- Graceful degradation when AI unavailable
- Data consistency and integrity
- Automatic error recovery
- Regular database backups
- Monitoring and alerting

---

## Technical Architecture

### System Components

**Frontend (React)**

- ProfileForm: User metrics and TDEE calculation
- MealForm: Manual meal entry with nutrition inputs
- ImageUpload: Photo upload with AI nutrition estimation
- MealList: Daily meal log with summary
- StreakWidget: Visual streak counter and calendar
- AnalyticsDashboard: Charts and statistics
- FoodSearch: Quick search without logging
- GoalProgress: Visual progress indicators

**API (Cloudflare Workers + Hono)**

- CRUD endpoints for meal management
- TDEE calculation service
- OpenRouter API integration for AI
- Analytics aggregation endpoints
- Food search endpoints
- Image upload and storage handling
- Rate limiting middleware
- Validation with Zod schemas

**Database (Cloudflare D1)**

- User profiles with TDEE data
- Meals table with nutrition details
- Streaks table for tracking consistency
- Food database for search functionality
- Achievements table for gamification
- Proper indexing for performance

**External Services**

- OpenRouter API (AI vision for food recognition)
- Cloudflare R2 (image storage)
- Nutrition database (USDA FoodData Central or Edamam API)

### Database Schema

```sql
-- User profiles with TDEE calculation
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY,
    age INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    height_cm REAL NOT NULL,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL,
    activity_level TEXT CHECK(activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')) NOT NULL,
    goal TEXT CHECK(goal IN ('lose_weight', 'maintain_weight', 'gain_weight')) NOT NULL,
    tdee REAL NOT NULL,
    target_calories REAL NOT NULL,
    target_protein_g REAL NOT NULL,
    target_carbs_g REAL NOT NULL,
    target_fat_g REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meals table
CREATE TABLE meals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
    food_name TEXT NOT NULL,
    calories REAL NOT NULL,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    serving_size TEXT,
    serving_unit TEXT,
    image_url TEXT,
    notes TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Streaks table
CREATE TABLE meal_streaks (
    user_id TEXT PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_logged_date DATE,
    freeze_credits INTEGER DEFAULT 2,
    total_logged_days INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily summaries for analytics
CREATE TABLE daily_summaries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_calories REAL DEFAULT 0,
    total_protein_g REAL DEFAULT 0,
    total_carbs_g REAL DEFAULT 0,
    total_fat_g REAL DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    target_calories REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Favorite foods for quick logging
CREATE TABLE favorite_foods (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    calories REAL NOT NULL,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    serving_size TEXT,
    serving_unit TEXT,
    category TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food database for search
CREATE TABLE foods (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    brand TEXT,
    calories_per_100g REAL NOT NULL,
    protein_per_100g REAL DEFAULT 0,
    carbs_per_100g REAL DEFAULT 0,
    fat_per_100g REAL DEFAULT 0,
    serving_size_g REAL,
    serving_description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_meals_user_date ON meals(user_id, date(logged_at) DESC);
CREATE INDEX idx_meals_user_logged_at ON meals(user_id, logged_at DESC);
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);
CREATE INDEX idx_favorite_foods_user ON favorite_foods(user_id, usage_count DESC);
CREATE INDEX idx_favorite_foods_last_used ON favorite_foods(user_id, last_used_at DESC);
CREATE INDEX idx_foods_name ON foods(name COLLATE NOCASE);

-- Full-text search for foods
CREATE VIRTUAL TABLE foods_fts USING fts5(name, brand, content=foods, content_rowid=rowid);
```

### API Endpoints

**User Profile & TDEE**

```typescript
// Get user profile
GET /api/v1/meal-tracker/profile

// Create or update profile with TDEE calculation
POST /api/v1/meal-tracker/profile
PUT /api/v1/meal-tracker/profile
Body: {
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goal: 'lose_weight' | 'maintain_weight' | 'gain_weight';
}
Response: {
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}
```

**Meal Management**

```typescript
// Get meals for a date range
GET /api/v1/meal-tracker/meals?start_date=2025-01-01&end_date=2025-01-31

// Get daily summary
GET /api/v1/meal-tracker/meals/daily?date=2025-01-09

// Create meal (manual entry)
POST /api/v1/meal-tracker/meals
Body: {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: string;
  serving_unit?: string;
  notes?: string;
  logged_at?: string; // ISO datetime
}

// Create meal from AI image analysis
POST /api/v1/meal-tracker/meals/from-image
Body: FormData {
  image: File;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at?: string;
}
Response: {
  suggestions: Array<{
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    confidence: number;
  }>;
  meal_id: string; // Auto-saved with best suggestion
}

// Update meal
PUT /api/v1/meal-tracker/meals/:id
Body: Partial<MealData>

// Delete meal
DELETE /api/v1/meal-tracker/meals/:id
```

**Streak Management**

```typescript
// Get current streak
GET /api/v1/meal-tracker/streak

// Get streak calendar (month view)
GET /api/v1/meal-tracker/streak/calendar?year=2025&month=1

// Use freeze credit
POST /api/v1/meal-tracker/streak/freeze
```

**Analytics**

```typescript
// Get daily summary
GET /api/v1/meal-tracker/analytics/daily?date=2025-01-09

// Get weekly summary
GET /api/v1/meal-tracker/analytics/weekly?start_date=2025-01-03

// Get monthly summary
GET /api/v1/meal-tracker/analytics/monthly?year=2025&month=1

// Get nutrition trends
GET /api/v1/meal-tracker/analytics/trends?period=7d|30d|90d
```

**Favorite Foods**

```typescript
// Get user's favorite foods
GET /api/v1/meal-tracker/favorites
Response: {
  favorites: Array<{
    id: string;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size: string;
    serving_unit: string;
    category?: string;
    usage_count: number;
    last_used_at: string;
  }>;
}

// Create favorite food
POST /api/v1/meal-tracker/favorites
Body: {
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: string;
  serving_unit?: string;
  category?: string;
}

// Quick-add favorite to meal log
POST /api/v1/meal-tracker/favorites/:id/log
Body: {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at?: string;
}
Response: {
  meal: MealData;
  favorite: { usage_count: number };
}

// Update favorite
PUT /api/v1/meal-tracker/favorites/:id
Body: Partial<FavoriteFood>

// Delete favorite
DELETE /api/v1/meal-tracker/favorites/:id
```

**Food Search**

```typescript
// Search food by text
GET /api/v1/meal-tracker/foods/search?q=chicken+breast&limit=20

// Analyze food from image (no logging)
POST /api/v1/meal-tracker/foods/analyze-image
Body: FormData { image: File }
Response: {
  foods: Array<{
    name: string;
    calories: number;
    nutrition: {...};
    confidence: number;
  }>;
}
```

### Component Architecture

**ProfileForm Component**

```typescript
interface ProfileFormProps {
  initialData?: UserProfile;
  onSubmit: (data: ProfileData) => Promise<void>;
  loading?: boolean;
}

interface ProfileData {
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | 'other';
  activity_level: ActivityLevel;
  goal: Goal;
}
```

**MealForm Component**

```typescript
interface MealFormProps {
  mealType?: MealType;
  initialData?: Partial<MealData>;
  onSubmit: (data: MealData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: string;
  serving_unit?: string;
  notes?: string;
  logged_at?: Date;
}
```

**ImageUpload Component**

```typescript
interface ImageUploadProps {
  mealType: MealType;
  onAnalysisComplete: (suggestions: NutritionSuggestion[]) => void;
  onError: (error: string) => void;
  loading?: boolean;
}
```

**StreakWidget Component**

```typescript
interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: Date;
  freezeCredits: number;
  compact?: boolean;
}
```

**AnalyticsDashboard Component**

```typescript
interface AnalyticsDashboardProps {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  targetCalories: number;
  targetMacros: MacroTargets;
}
```

**FavoritesList Component**

```typescript
interface FavoritesListProps {
  favorites: FavoriteFood[];
  onQuickAdd: (favoriteId: string, mealType: MealType) => Promise<void>;
  onEdit: (favorite: FavoriteFood) => void;
  onDelete: (favoriteId: string) => Promise<void>;
  loading?: boolean;
}

interface FavoriteFood {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  serving_unit?: string;
  category?: string;
  usage_count: number;
  last_used_at?: Date;
}
```

---

## User Experience Design

### Interface Layout

**Dashboard / Home**

- Daily calorie progress ring (consumed / target)
- Macro breakdown (protein, carbs, fat) with progress bars
- Streak widget with current and longest streak
- Quick action buttons (Log Meal, Take Photo, Search Food, Favorites)
- Favorite foods quick-add section (top 3-5 most used)
- Recent meals list with edit/delete actions
- Daily summary card

**Profile & Goal Setting**

- Step-by-step form for initial setup
- Visual TDEE calculation result
- Editable profile with recalculation
- Goal adjustment with calorie impact preview
- Activity level descriptions and examples

**Meal Logging Flow**

1. Select meal type (breakfast, lunch, dinner, snack)
2. Choose input method (manual, photo, search)
3. Enter/edit nutrition details
4. Preview before saving
5. Success confirmation with updated daily total

**AI Image Analysis Flow**

1. Upload image from camera/gallery
2. Loading state with progress indicator
3. AI suggestions with confidence scores
4. Edit suggestions before saving
5. Manual fallback if AI fails

**Streak Calendar**

- Month view with logged days highlighted
- Streak counter with visual indicators
- Achievement badges for milestones
- Freeze credits display and usage
- Motivational messages

**Analytics Dashboard**

- Time period selector (day, week, month)
- Calorie trend line chart
- Macro distribution pie chart
- Meal timing histogram
- Goal achievement percentage
- Weight trend (if tracked)

**Food Search**

- Search input with text and camera icons
- Recent searches list
- Search results with nutrition info
- Quick-add to log button
- Save to favorites button
- View details modal

**Favorites Management**

- Grid or list view of saved favorite foods
- Sort by usage count or last used
- Category filters (optional)
- Quick-add button with meal type selector
- Edit and delete actions
- Star icon to mark super-favorites
- Empty state with suggestions to add favorites

### Mobile Optimization

**Touch-Friendly Design**

- Large tap targets for meal type selection
- Swipe gestures for date navigation
- Bottom sheet modals for forms
- Floating action button for quick meal log
- Pull-to-refresh for meal list

**Performance Optimizations**

- Image compression before upload
- Lazy loading for meal history
- Optimistic UI updates
- Cached analytics data
- Progressive image loading
- Service worker for offline support

### Visual Design

**Progress Visualization**

- Color-coded progress rings (green = on track, yellow = close, red = over)
- Animated progress bars for macros
- Streak flames/fire icon with growing intensity
- Achievement badges with celebrations
- Trend arrows for analytics (up/down indicators)

**Meal Cards**

- Photo thumbnails when available
- Clear meal type icons (  breakfast, < lunch, < dinner, <N snack)
- Nutrition summary in compact format
- Time ago display (2h ago, Today, Yesterday)
- Edit/delete actions with confirmation

**Empty States**

- Encouraging messages for first meal log
- Visual guide for using AI feature
- Streak motivation when broken
- Analytics placeholder when insufficient data

---

## Implementation Plan

### Phase 1: Foundation & TDEE (Week 1-2)

**Tasks:**

1. **Database Schema** (6 hours)
   - Create user_profiles, meals, meal_streaks tables
   - Add indexes for performance
   - Create migration scripts
   - Test data insertion and retrieval

2. **TDEE Calculation Service** (6 hours)
   - Implement Mifflin-St Jeor equation
   - Activity level multipliers
   - Goal-based calorie adjustment
   - Macro target calculations
   - Unit tests for calculations

3. **Profile API Endpoints** (8 hours)
   - GET/POST/PUT profile endpoints
   - Validation with Zod schemas
   - Authentication middleware integration
   - Error handling and logging
   - API testing

4. **Profile UI Components** (10 hours)
   - ProfileForm with step-by-step flow
   - TDEE calculation display
   - Activity level selector with descriptions
   - Goal selector with calorie preview
   - Responsive design and validation

**Deliverables:**

- Working TDEE calculation system
- User profile management
- Complete profile setup flow
- Tested API endpoints

### Phase 2: Meal Logging (Week 3-4)

**Tasks:**

1. **Meal Database & API** (10 hours)
   - Meals table and indexes
   - CRUD endpoints for meals
   - Daily summary calculation
   - Pagination for meal history
   - Service layer for business logic

2. **Meal Logging UI** (12 hours)
   - MealForm component with validation
   - Meal type selector
   - Nutrition input fields
   - Date/time picker
   - Edit and delete functionality

3. **Daily Dashboard** (10 hours)
   - Calorie progress ring
   - Macro progress bars
   - Recent meals list
   - Daily summary card
   - Real-time updates

4. **Testing** (6 hours)
   - Unit tests for components
   - Integration tests for API
   - E2E tests for meal logging flow

**Deliverables:**

- Complete meal logging system
- Daily tracking dashboard
- Responsive mobile interface
- Test coverage > 80%

### Phase 3: AI Integration (Week 5-6)

**Tasks:**

1. **OpenRouter Integration** (8 hours)
   - API client for OpenRouter
   - Vision model integration
   - Prompt engineering for nutrition estimation
   - Error handling and retries
   - Rate limiting

2. **Image Upload & Processing** (10 hours)
   - Image upload endpoint
   - Cloudflare R2 integration
   - Image compression and optimization
   - Upload progress indicators
   - Error handling

3. **AI Nutrition Estimation UI** (12 hours)
   - ImageUpload component
   - Camera/gallery access
   - Loading states with progress
   - AI suggestions display
   - Edit before save functionality
   - Manual fallback

4. **Testing & Optimization** (8 hours)
   - Test with various food images
   - Accuracy validation
   - Cost optimization
   - Performance testing
   - Error scenario handling

**Deliverables:**

- Working AI nutrition estimation
- Image upload and processing
- User-friendly AI flow
- Cost-effective API usage

### Phase 4: Favorite Foods (Week 7)

**Tasks:**

1. **Favorites Database & API** (8 hours)
   - favorite_foods table setup
   - CRUD endpoints for favorites
   - Quick-add to log endpoint
   - Usage count tracking
   - Service layer for favorites

2. **Favorites UI Components** (10 hours)
   - FavoritesList component
   - Quick-add with meal type selector
   - Edit and delete functionality
   - Sort and filter options
   - Empty state and onboarding

3. **Dashboard Integration** (6 hours)
   - Top favorites widget on dashboard
   - Save to favorites from meal log
   - Auto-suggest frequently logged meals
   - Recent meals → favorites conversion

4. **Testing** (4 hours)
   - Unit tests for components
   - Integration tests for API
   - Usage count accuracy validation

**Deliverables:**

- Complete favorites system
- Quick-add functionality
- Dashboard integration
- Usage tracking

### Phase 5: Streak System (Week 8)

**Tasks:**

1. **Streak Logic** (8 hours)
   - Streak calculation algorithm
   - Daily logging detection
   - Streak freeze mechanism
   - Achievement triggers
   - Historical data migration

2. **Streak API** (6 hours)
   - GET streak endpoint
   - Calendar view endpoint
   - Freeze credit usage
   - Streak history

3. **Streak UI Components** (10 hours)
   - StreakWidget component
   - Calendar view with highlights
   - Achievement badges
   - Motivational messages
   - Visual celebrations

**Deliverables:**

- Functional streak tracking
- Gamified engagement system
- Calendar visualization
- Achievement system

### Phase 6: Analytics (Week 9-10)

**Tasks:**

1. **Analytics Database** (6 hours)
   - daily_summaries table
   - Aggregation queries
   - Trend calculations
   - Performance optimization

2. **Analytics API** (10 hours)
   - Daily/weekly/monthly endpoints
   - Trend analysis
   - Data aggregation
   - Caching strategy

3. **Analytics Dashboard** (14 hours)
   - Chart library integration (Recharts)
   - Calorie trend chart
   - Macro pie charts
   - Meal timing analysis
   - Period selector
   - Export functionality

4. **Testing** (6 hours)
   - Data accuracy validation
   - Chart rendering tests
   - Performance testing
   - Cross-browser testing

**Deliverables:**

- Complete analytics system
- Visual data representations
- Historical trend analysis
- Export capabilities

### Phase 7: Food Search (Week 11)

**Tasks:**

1. **Food Database** (8 hours)
   - Foods table schema
   - FTS5 full-text search
   - Import USDA FoodData Central
   - Seed database with common foods
   - Search optimization

2. **Food Search API** (8 hours)
   - Text search endpoint
   - Image search endpoint (AI)
   - Pagination and filtering
   - Recently searched foods
   - Popular foods suggestions

3. **Food Search UI** (10 hours)
   - Search component with filters
   - Recent searches list
   - Search results display
   - Quick-add to log
   - Nutrition details modal

**Deliverables:**

- Food search functionality
- Database of common foods
- Text and image search
- Quick-add integration

### Phase 8: Polish & Launch (Week 12-13)

**Tasks:**

1. **Performance Optimization** (8 hours)
   - Database query optimization
   - Image loading optimization
   - API response caching
   - Bundle size reduction
   - Lazy loading implementation

2. **Accessibility** (6 hours)
   - WCAG 2.1 AA compliance
   - Screen reader testing
   - Keyboard navigation
   - Color contrast verification
   - ARIA labels

3. **Mobile Polish** (8 hours)
   - Touch interaction refinement
   - Responsive design fixes
   - Offline capability
   - PWA features
   - Push notification setup

4. **Testing & QA** (10 hours)
   - Comprehensive E2E testing
   - Cross-browser testing
   - Mobile device testing
   - Performance testing
   - Security audit

5. **Documentation** (6 hours)
   - User guide
   - API documentation
   - Developer documentation
   - Deployment guide

**Deliverables:**

- Production-ready feature
- Comprehensive documentation
- Accessibility compliance
- Performance optimized

---

## Success Metrics

### Technical Metrics

**Performance Targets:**

- Page load time: < 1 second
- Meal CRUD operations: < 500ms
- AI image processing: < 5 seconds
- Analytics chart rendering: < 1 second
- Image upload: < 3 seconds
- Mobile performance score: > 90

**Quality Metrics:**

- Code coverage: > 80%
- Zero critical accessibility violations
- Cross-browser compatibility: Latest 2 versions
- Mobile responsiveness: All major screen sizes
- AI accuracy: > 70% for common foods
- API uptime: > 99.9%

### User Experience Metrics

**Usability Targets:**

- Time to complete profile setup: < 2 minutes
- Time to log first meal: < 30 seconds
- Time to log meal with AI: < 45 seconds
- User satisfaction: > 4.5/5
- Mobile usability score: > 90
- Feature completion rate: > 95%

**Engagement Metrics:**

- Daily active users: Track after launch
- Average meals logged per day: Target 3+
- AI feature usage rate: > 40% of logs
- Favorite foods usage rate: > 50% of logs
- Streak retention (7+ days): > 60%
- Streak retention (30+ days): > 30%
- Feature retention rate: Track weekly usage

**Health Outcome Metrics:**

- Average days to first goal achievement
- Goal achievement rate: > 50%
- User weight trend correlation with goal
- Calorie target adherence: > 75%
- Macro target adherence: > 60%

---

## Risk Assessment

### Technical Risks

**High Priority:**

- **AI Accuracy**: Mitigation through fallback to manual entry, user editing, and prompt refinement
- **API Cost Management**: Mitigation through rate limiting, caching, and user quota limits
- **Database Performance**: Mitigation through proper indexing, query optimization, and data archival
- **Image Storage Costs**: Mitigation through compression, resolution limits, and user storage quotas

**Medium Priority:**

- **Third-party API Reliability**: Mitigation through timeout handling, retry logic, and degraded modes
- **Mobile Performance**: Mitigation through lazy loading, image optimization, and progressive enhancement
- **Data Synchronization**: Mitigation through optimistic updates and conflict resolution
- **Privacy Concerns**: Mitigation through clear privacy policy and data handling transparency

**Low Priority:**

- **Browser Compatibility**: Mitigation through progressive enhancement and polyfills
- **Network Connectivity**: Mitigation through offline support and queued uploads
- **User Input Validation**: Mitigation through client and server-side validation

### Business Risks

**Feature Adoption:**

- User discovery: Integrate into main dashboard and onboarding flow
- Learning curve: Provide interactive tutorial and tooltips
- Value proposition: Focus on ease of use and AI automation
- Competition: Differentiate with AI features and seamless integration

**Maintenance Overhead:**

- Code complexity: Modular architecture with clear separation of concerns
- Testing burden: Automated testing pipeline with CI/CD
- Documentation: Maintain up-to-date technical and user documentation
- Support: FAQ and troubleshooting guides

**Cost Management:**

- OpenRouter API costs: Monitor usage, set quotas, optimize prompts
- Cloudflare R2 storage: Implement retention policies, compression
- Database growth: Archive old data, implement pagination
- Infrastructure: Monitor and optimize resource usage

---

## Future Enhancements

### Phase 2 Features

**Advanced Tracking**

- Water intake tracking
- Weight tracking with trend analysis
- Body measurements (body fat %, muscle mass)
- Micronutrient tracking (vitamins, minerals)
- Recipe builder with nutrition calculation
- Meal templates with multiple ingredients

**Enhanced AI**

- Multi-food recognition in single image
- Portion size estimation from images
- Recipe extraction from photos
- Voice-to-text meal logging
- Barcode scanning for packaged foods
- Integration with smart scales

**Social & Community**

- Meal sharing with friends
- Recipe sharing and discovery
- Community challenges and competitions
- Nutritionist/trainer integration
- Group goals and accountability
- Social feeds with meal photos

### Integration Features

**External Services**

- Apple Health / Google Fit integration
- Fitness tracker sync (steps, exercise)
- Restaurant menu integration
- Grocery list generation
- Meal planning service integration
- Delivery app calorie tracking

**Automation**

- Meal reminders and notifications
- Weekly meal prep planning
- Shopping list generation
- Smart suggestions based on history
- Auto-detection of repeated meals
- Predictive meal suggestions

### Advanced Analytics

**Machine Learning Insights**

- Personalized nutrition recommendations
- Eating pattern analysis
- Correlation between meals and energy levels
- Optimal meal timing suggestions
- Macro ratio optimization
- Predictive goal achievement timeline

**Health Insights**

- Nutrient deficiency warnings
- Eating disorder detection and support
- Hydration optimization
- Sleep quality correlation
- Mood and food correlation analysis
- Long-term health trend predictions

---

## Conclusion

The Meal Tracker feature provides comprehensive nutrition tracking and meal planning capabilities while maintaining ease of use through AI-powered automation and favorite foods quick-add functionality. The gamified streak system encourages consistent healthy habits, and the TDEE-based goal setting ensures personalized nutrition targets.

The phased implementation approach delivers core functionality quickly while building toward advanced features that enhance user engagement and health outcomes. The feature maintains the app's high standards for performance, security, and user experience while providing significant value for health-conscious users.

The integration of AI for image-based nutrition estimation combined with the favorite foods system sets this feature apart from competitors and reduces friction in the logging process. Users can quickly log common meals with a single tap while still having the flexibility to use AI for new foods, making it more likely that users will maintain consistent tracking and achieve their health goals.
