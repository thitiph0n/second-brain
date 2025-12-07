# Product Requirements Document: Trip Planner Feature

## Second Brain App

### Executive Summary

This PRD defines the Trip Planner feature for the Second Brain app, providing users with a comprehensive travel planning and itinerary management system. The feature enables users to create trips with date ranges, manage detailed day-by-day itineraries with locations, times, and notes, complete with Google Maps integration and rich media support.

### Business Context

**Strategic Alignment:**

- Enhances personal productivity suite with travel planning capabilities
- Leverages existing authentication and database infrastructure
- Maintains mobile-first responsive design philosophy
- Provides practical utility for trip organization and reference

**Success Criteria:**

- Intuitive trip creation and management interface
- Comprehensive itinerary planning with location support
- Mobile-optimized interface for on-the-go access during travel
- Rich notes support with text and image attachments
- Seamless Google Maps integration for navigation

---

## User Stories & Requirements

### Core User Stories

**US-1: Create and Manage Trips**

```
As a user
I want to create trips with name, description, and date range
So that I can organize my travel plans in one place
```

**US-2: Manage Trip Itineraries**

```
As a user
I want to add places to visit with time, location, and notes
So that I can plan my day-by-day activities during the trip
```

**US-3: Google Maps Integration**

```
As a user
I want each location to link to Google Maps
So that I can easily navigate to places during my trip
```

**US-4: Rich Notes Support**

```
As a user
I want to add notes with both text and images to each itinerary item
So that I can store relevant information like reservation confirmations, tips, or photos
```

**US-5: View Trip Timeline**

```
As a user
I want to view my trip as a chronological timeline
So that I can see my entire trip schedule at a glance
```

**US-6: Organize Itinerary by Day**

```
As a user
I want to organize itinerary items by day
So that I can plan each day of my trip separately
```

**US-7: Share Trip Publicly**

```
As a user
I want to share my trip via a public link (no authentication required)
So that friends, family, or fellow travelers can view my itinerary
```

**US-8: Access Trip Offline**

```
As a user
I want to access my trip details offline during travel
So that I can view my itinerary without internet connectivity
```

### Functional Requirements

**FR-1: Trip Management**

- Create new trips with name, description, start date, and end date
- Edit existing trip details
- Delete trips with confirmation dialog
- View list of all trips (upcoming, ongoing, past)
- Filter/sort trips by status or date

**FR-2: Itinerary Management**

- Add itinerary items with place name, time, location, and notes
- Assign itinerary items to specific days within the trip
- Edit existing itinerary items
- Delete itinerary items with confirmation
- Reorder itinerary items within a day (drag-and-drop)
- Copy/duplicate itinerary items

**FR-3: Location Features**

- Input location as address or coordinates
- Auto-generate Google Maps link from location
- Display mini map preview (optional enhancement)
- One-click open in Google Maps (mobile/desktop)
- Store location coordinates for map display

**FR-4: Notes & Media**

- Rich text notes per itinerary item
- Image upload and attachment support
- Image preview within the notes
- Multiple images per itinerary item
- Support for common image formats (JPEG, PNG, WebP)

**FR-5: Timeline View**

- Chronological view of all itinerary items
- Group items by day with day headers
- Visual time indicators
- Expand/collapse day sections
- Quick navigation between days

**FR-6: Public Sharing**

- Generate unique shareable link for each trip
- Public view accessible without authentication
- Read-only access for shared trips
- Owner can enable/disable sharing per trip
- Optional: Copy share link button
- Share link format: `/shared/trips/:shareToken`

**FR-7: PWA & Offline Support**

- Install as Progressive Web App on mobile/desktop
- Cache trip data for offline access
- "Save for Offline" action per trip
- Offline indicator showing sync status
- Background sync when connectivity restored
- Service Worker for asset caching

### Non-Functional Requirements

**NFR-1: Performance**

- Page load time under 2 seconds
- Trip operations (add/edit/delete) under 500ms
- Image upload with progress indication
- Smooth scrolling and animations
- Lazy loading for images and long itineraries

**NFR-2: Usability**

- Intuitive trip creation flow
- Clear visual feedback for all actions
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)
- Touch-friendly interactions for mobile use

**NFR-3: Security**

- User-scoped trip and itinerary data
- Secure image upload and storage
- Input validation on frontend and backend
- SQL injection prevention
- XSS protection for user-generated content
- Secure share tokens (unguessable, revocable)
- Rate limiting on public endpoints

**NFR-5: Offline Reliability**

- Offline data available within 5 seconds of save
- Clear offline/online status indication
- Graceful degradation when offline
- Data integrity during sync conflicts
- Storage quota management (warn at 80% usage)

**NFR-4: Scalability**

- Support up to 100 trips per user
- Support up to 50 itinerary items per trip
- Support up to 10 images per itinerary item
- Efficient database queries with proper indexing
- Image compression and optimization

---

## Technical Architecture

### System Components

**Frontend (React)**

- TripForm: Form component for creating/editing trips
- TripCard: Trip preview card with summary info
- TripList: List of all user trips with filtering
- TripDetailPage: Main trip view with itinerary
- ItineraryForm: Form for adding/editing itinerary items
- ItineraryItem: Individual itinerary item display
- ItineraryTimeline: Day-by-day timeline view
- LocationPicker: Location input with search
- NotesEditor: Rich text editor for notes
- ImageUploader: Image upload component with preview
- ShareTripDialog: Modal for sharing trip publicly
- SharedTripPage: Public read-only trip view
- OfflineIndicator: Network status and sync indicator
- InstallPWAPrompt: PWA installation prompt

**API (Cloudflare Workers + Hono)**

- CRUD endpoints for trips
- CRUD endpoints for itinerary items
- Image upload endpoint with R2 storage
- Input validation with Zod schemas
- Authentication middleware integration
- Public trip endpoint (no auth required)
- Rate limiting for public endpoints

**PWA Infrastructure**

- Service Worker for offline caching
- Web App Manifest for installation
- IndexedDB for offline trip storage
- Background Sync API for data synchronization

**Database (Cloudflare D1)**

- Trips table with user association
- Itinerary items table with trip association
- Itinerary images table for media attachments
- Proper indexing for performance

**Storage (Cloudflare R2)**

- Image storage for itinerary attachments
- Signed URLs for secure access
- Image optimization on upload

### Database Schema

```sql
-- Trips table
CREATE TABLE trips (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image_url TEXT,
    -- Public sharing fields
    is_public BOOLEAN NOT NULL DEFAULT 0,
    share_token TEXT UNIQUE,
    shared_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for efficient user-scoped queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_user_dates ON trips(user_id, start_date, end_date);
CREATE INDEX idx_trips_share_token ON trips(share_token);

-- Itinerary items table
CREATE TABLE itinerary_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    trip_id TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    time TEXT,
    place_name TEXT NOT NULL,
    location_address TEXT,
    location_lat REAL,
    location_lng REAL,
    google_maps_url TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Index for efficient trip-scoped queries
CREATE INDEX idx_itinerary_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_trip_day ON itinerary_items(trip_id, day_number);

-- Itinerary images table
CREATE TABLE itinerary_images (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    itinerary_item_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_key TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (itinerary_item_id) REFERENCES itinerary_items(id) ON DELETE CASCADE
);

-- Index for efficient itinerary-scoped queries
CREATE INDEX idx_itinerary_images_item_id ON itinerary_images(itinerary_item_id);
```

### API Endpoints

**Trip Management Endpoints**

```typescript
// Get all trips for authenticated user
GET /api/v1/trips
// - Returns user's trips ordered by start_date DESC
// - Supports filtering by status (?status=upcoming|ongoing|past)

// Get single trip with itinerary
GET /api/v1/trips/:id
// - Returns trip details with all itinerary items
// - Includes nested images for each itinerary item

// Create new trip
POST /api/v1/trips
// - Validates input (name, startDate, endDate required)
// - Associates with authenticated user
// - Returns created trip with ID

// Update existing trip
PUT /api/v1/trips/:id
// - Validates ownership by authenticated user
// - Supports updating name, description, dates
// - Returns updated trip

// Delete trip
DELETE /api/v1/trips/:id
// - Validates ownership by authenticated user
// - Cascades delete to itinerary items and images
// - Returns success confirmation

// Enable/disable public sharing
PATCH /api/v1/trips/:id/sharing
// - Validates ownership by authenticated user
// - Generates unique share_token if enabling
// - Returns share URL or confirmation
```

**Public Trip Endpoints (No Authentication)**

```typescript
// Get shared trip by token (public, no auth)
GET /api/v1/shared/trips/:shareToken
// - Returns trip details with itinerary (read-only)
// - Returns 404 if share_token invalid or sharing disabled
// - Rate limited to prevent abuse
```

**Itinerary Management Endpoints**

```typescript
// Get itinerary items for a trip
GET /api/v1/trips/:tripId/itinerary
// - Returns itinerary items ordered by day_number, sort_order
// - Includes nested images for each item

// Create new itinerary item
POST /api/v1/trips/:tripId/itinerary
// - Validates trip ownership
// - Auto-generates Google Maps URL from location
// - Returns created item with ID

// Update itinerary item
PUT /api/v1/trips/:tripId/itinerary/:itemId
// - Validates trip ownership
// - Updates location and regenerates Maps URL if changed
// - Returns updated item

// Delete itinerary item
DELETE /api/v1/trips/:tripId/itinerary/:itemId
// - Validates trip ownership
// - Cascades delete to images
// - Returns success confirmation

// Reorder itinerary items
PATCH /api/v1/trips/:tripId/itinerary/reorder
// - Accepts array of item IDs with new sort_order
// - Validates all items belong to the trip
// - Returns updated items
```

**Image Upload Endpoints**

```typescript
// Upload image to itinerary item
POST /api/v1/trips/:tripId/itinerary/:itemId/images
// - Accepts multipart form data
// - Uploads to Cloudflare R2
// - Returns image metadata with URL

// Delete image
DELETE /api/v1/trips/:tripId/itinerary/:itemId/images/:imageId
// - Validates ownership
// - Removes from R2 storage
// - Returns success confirmation
```

### Component Architecture

**TripForm Component**

```typescript
interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  loading?: boolean;
  initialData?: Partial<TripFormData>;
}

interface TripFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}
```

**TripCard Component**

```typescript
interface TripCardProps {
  trip: Trip;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
}
```

**ItineraryItem Component**

```typescript
interface ItineraryItemProps {
  item: ItineraryItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenMaps: (url: string) => void;
}
```

**ItineraryForm Component**

```typescript
interface ItineraryFormProps {
  tripId: string;
  dayNumber: number;
  onSubmit: (data: ItineraryFormData) => void;
  loading?: boolean;
  initialData?: Partial<ItineraryFormData>;
}

interface ItineraryFormData {
  placeName: string;
  time?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
  images?: File[];
}
```

---

## User Experience Design

### Interface Layout

**Trip List Page**

- Header with "My Trips" title and "New Trip" button
- Tabbed navigation (Upcoming, Ongoing, Past, All)
- Trip cards with cover image, name, dates, and item count
- Empty state with encouraging create trip message
- Search/filter functionality for many trips

**Trip Detail Page**

- Trip header with name, dates, and edit/delete actions
- Trip description section (collapsible)
- Day-by-day itinerary timeline
- Day headers showing date and day number (Day 1, Day 2, etc.)
- "Add Item" button for each day
- Floating action button for quick add

**Itinerary Item Display**

- Time badge with scheduled time
- Place name as primary text
- Location with Google Maps link/button
- Notes preview (expandable for full view)
- Image thumbnails (expandable gallery)
- Action buttons (edit, delete)

**Itinerary Form Modal**

- Clean, focused form with all fields
- Place name input (required)
- Time picker for scheduling
- Location input with address search
- Notes textarea with character count
- Image upload area with drag-and-drop
- Submit and cancel buttons

### Mobile Optimization

**Touch-Friendly Design**

- Minimum 44px touch targets
- Generous spacing between interactive elements
- Swipe gestures for common actions
- Pull-to-refresh for trip list

**Travel-Ready Features**

- Offline viewing of trip details with PWA
- One-tap Google Maps navigation
- Large, readable text for outdoor use
- High contrast for sunlight visibility
- Install to home screen prompt
- Push notifications for trip reminders (future)

### Public Shared View

**Read-Only Experience**

- Clean, focused view without edit controls
- Same timeline layout as owner view
- Google Maps links still functional
- Image gallery viewable
- "Get the App" call-to-action for viewers

**Sharing Controls (Owner View)**

- Share toggle in trip settings
- Copy link button with confirmation
- QR code generation for easy sharing
- View count/analytics (optional)
- Revoke access by disabling share

### Visual Design

**Trip Cards**

- Cover image or gradient background
- Clear date range display
- Status indicator (upcoming/ongoing/past)
- Item count badge
- Hover/tap effects

**Timeline View**

- Vertical timeline with day markers
- Time-based item positioning
- Visual connecting lines between items
- Color coding by item type (optional)
- Smooth scroll with snap points

**Map Integration**

- Google Maps icon/button for each location
- Interactive mini-map (optional enhancement)
- Consistent map link styling
- Open in native maps app on mobile

---

## Implementation Plan

### Phase 1: Backend Infrastructure (Week 1)

**Tasks:**

1. **Database Schema** (4 hours)
   - Create trips table migration
   - Create itinerary_items table migration
   - Create itinerary_images table migration
   - Add appropriate indexes

2. **Trip API Endpoints** (8 hours)
   - Implement CRUD endpoints for trips
   - Add input validation with Zod schemas
   - Integrate authentication middleware
   - Test endpoints

3. **Itinerary API Endpoints** (8 hours)
   - Implement CRUD endpoints for itinerary items
   - Implement reorder functionality
   - Auto-generate Google Maps URLs
   - Test endpoints

**Deliverables:**

- Working API endpoints with authentication
- Database schema with proper indexing
- Service layer with business logic

### Phase 2: Frontend - Trip Management (Week 2)

**Tasks:**

1. **Trip Components** (8 hours)
   - Build TripForm component
   - Create TripCard component
   - Implement TripList with filtering
   - Create TripDetailPage layout

2. **Routing & Navigation** (4 hours)
   - Add trip routes to TanStack Router
   - Implement trip navigation
   - Add trip link to main navigation

3. **State & API Integration** (6 hours)
   - API service layer for trips
   - React Query integration
   - Optimistic updates

**Deliverables:**

- Complete trip CRUD in UI
- Trip list with filtering
- Basic trip detail view

### Phase 3: Frontend - Itinerary Management (Week 3)

**Tasks:**

1. **Itinerary Components** (10 hours)
   - Build ItineraryForm component
   - Create ItineraryItem component
   - Implement ItineraryTimeline view
   - Add day grouping logic

2. **Location Features** (6 hours)
   - Location input component
   - Google Maps URL generation
   - Maps link/button integration

3. **Drag-and-Drop Reordering** (4 hours)
   - Implement item reordering
   - API integration for order updates
   - Optimistic UI updates

**Deliverables:**

- Complete itinerary CRUD in UI
- Timeline view with day grouping
- Google Maps integration

### Phase 4: Image Upload & Polish (Week 4)

**Tasks:**

1. **Image Upload System** (10 hours)
   - R2 bucket setup and configuration
   - Image upload API endpoint
   - ImageUploader component
   - Image gallery view

2. **Notes Enhancement** (4 hours)
   - Notes textarea with formatting hints
   - Image inline display in notes
   - Character count and validation

3. **UX Polish & Testing** (8 hours)
   - Responsive design testing
   - Mobile optimization
   - Error handling and loading states
   - Unit and integration tests

**Deliverables:**

- Complete image upload functionality
- Polished user experience
- Test coverage

### Phase 5: Public Sharing (Week 5)

**Tasks:**

1. **Backend Sharing** (6 hours)
   - Add sharing fields to trips table
   - Create share token generation logic
   - Implement public trip endpoint
   - Add rate limiting

2. **Frontend Sharing** (8 hours)
   - ShareTripDialog component
   - SharedTripPage (public view)
   - Copy link functionality
   - QR code generation

3. **Testing & Security** (4 hours)
   - Security audit for public endpoints
   - Rate limiting verification
   - Cross-browser testing

**Deliverables:**

- Working public trip sharing
- Secure, unguessable share tokens
- Read-only public view

### Phase 6: PWA & Offline Support (Week 6)

**Tasks:**

1. **PWA Setup** (6 hours)
   - Web App Manifest configuration
   - Service Worker registration
   - Install prompt component
   - App icons and splash screens

2. **Offline Storage** (10 hours)
   - IndexedDB schema design
   - Trip data caching logic
   - Image caching strategy
   - "Save for Offline" functionality

3. **Sync & Status** (8 hours)
   - Background sync implementation
   - Offline indicator component
   - Conflict resolution strategy
   - Storage quota management

**Deliverables:**

- Installable PWA
- Offline trip viewing
- Automatic sync when online

---

## Success Metrics

### Technical Metrics

**Performance Targets:**

- Page load time: < 2 seconds
- Trip CRUD operations: < 500ms
- Image upload: < 3 seconds for 5MB image
- API response time: < 300ms

**Quality Metrics:**

- Code coverage: > 80%
- Zero critical accessibility violations
- Cross-browser compatibility: Latest 2 versions
- Mobile responsiveness: All major screen sizes

### User Experience Metrics

**Usability Targets:**

- Time to create first trip: < 1 minute
- Time to add itinerary item: < 30 seconds
- Task completion rate: > 95%
- User satisfaction: > 4.5/5

---

## Risk Assessment

### Technical Risks

**High Priority:**

- **Image Storage Costs**: Mitigation through image compression and size limits
- **Location Data Accuracy**: Mitigation through Google Places API integration (future)
- **Public Link Abuse**: Mitigation through rate limiting and monitoring
- **Offline Storage Limits**: Mitigation through selective caching and quota warnings

**Medium Priority:**

- **Database Performance**: Mitigation through proper indexing and query optimization
- **Image Upload Failures**: Mitigation through retry logic and progress indication
- **Mobile Performance**: Mitigation through lazy loading and image optimization
- **Service Worker Complexity**: Mitigation through workbox library usage
- **Sync Conflicts**: Mitigation through last-write-wins with user notification

**Low Priority:**

- **Browser Compatibility**: Mitigation through progressive enhancement
- **PWA Install Adoption**: Mitigation through clear install prompts

---

## Future Enhancements

### Phase 2 Features

**Advanced Location Features**

- Google Places autocomplete for location search
- Embedded map view within trip detail
- Route planning between locations
- Distance and travel time estimates

**Collaboration Features**

- Share trips with specific users (authenticated)
- Collaborative trip editing with permissions
- Comments on itinerary items
- Trip templates for common destinations
- Real-time collaboration with presence indicators

**Travel Utilities**

- Packing list integration
- Budget tracking per trip
- Flight/hotel booking links
- Weather forecast integration

**Export & Backup**

- Export trip as PDF
- Export to calendar (iCal)
- Backup/restore trip data
- Print-friendly itinerary view

---

## Conclusion

The Trip Planner feature provides comprehensive travel planning capabilities while integrating seamlessly with the Second Brain app's existing architecture. The focus on Google Maps integration and rich notes support addresses core user needs for trip organization and on-the-go reference during travel.

The mobile-first design ensures the feature remains useful during actual trips, not just in the planning phase. The phased implementation approach enables rapid delivery of core functionality while building toward advanced features that enhance the overall travel planning experience.
