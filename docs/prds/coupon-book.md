# Product Requirements Document: Coupon Book Feature

## Second Brain App

### Executive Summary

This PRD defines the Coupon Book feature for the Second Brain app, providing users with a digital management system for their coupon codes. The feature implements a todo-like interface for tracking coupon usage with mobile-first design principles and seamless integration with the existing authentication system.

### Business Context

**Strategic Alignment:**

- Enhances personal productivity suite capabilities
- Leverages existing authentication and database infrastructure
- Maintains mobile-first responsive design philosophy
- Provides practical utility for everyday coupon management

**Success Criteria:**

- Intuitive coupon code management with todo-like interactions
- Mobile-optimized interface for on-the-go usage
- Secure, user-scoped coupon storage and retrieval
- Seamless integration with existing app architecture

---

## User Stories & Requirements

### Core User Stories

**US-1: Add Coupon Codes**

```
As a user
I want to add coupon codes with optional descriptions
So that I can digitally store and organize my physical and digital coupons
```

**US-2: View Coupon Collection**

```
As a user
I want to view all my coupons organized by status (All, Active, Used)
So that I can quickly find available coupons when shopping
```

**US-3: Mark Coupons as Used**

```
As a user
I want to mark coupons as used/unused with todo-like checkboxes
So that I can track which coupons I've already redeemed
```

**US-4: Copy Coupon Codes**

```
As a user
I want to copy coupon codes to my clipboard with one click
So that I can easily paste them during online checkout
```

**US-5: Delete Unwanted Coupons**

```
As a user
I want to delete coupons I no longer need
So that I can keep my collection clean and relevant
```

### Functional Requirements

**FR-1: Coupon Management**

- Add new coupons with code and optional description
- Edit existing coupon descriptions
- Delete coupons with confirmation dialog
- Toggle coupon status between used/unused
- Copy coupon codes to clipboard

**FR-2: Organization & Filtering**

- Display coupons in tabbed interface (All, Active, Used)
- Show count badges for each category
- Visual indicators for used vs active coupons
- Chronological ordering with newest first

**FR-3: Mobile-First Interface**

- Responsive design optimized for mobile devices
- Touch-friendly buttons and checkboxes
- Readable typography across screen sizes
- Efficient use of screen space

**FR-4: Data Persistence**

- Secure storage in user-scoped database
- Integration with existing authentication system
- RESTful API endpoints for CRUD operations
- Data validation and error handling

### Non-Functional Requirements

**NFR-1: Performance**

- Page load time under 1 second
- Coupon operations (add/edit/delete) under 500ms
- Smooth animations and transitions
- Efficient data fetching and caching

**NFR-2: Usability**

- Todo-like interface familiar to users
- Clear visual feedback for all actions
- Intuitive navigation and organization
- Accessibility compliance (WCAG 2.1)

**NFR-3: Security**

- User-scoped data access only
- Input validation on frontend and backend
- SQL injection prevention
- XSS protection for user-generated content

**NFR-4: Scalability**

- Support up to 1000 coupons per user
- Efficient database queries with proper indexing
- Paginated loading for large collections
- Minimal API payload sizes

---

## Technical Architecture

### System Components

**Frontend (React)**

- CouponForm: Form component for adding/editing coupons
- CouponItem: Individual coupon display with actions
- CouponList: Filtered list component with search
- CouponPage: Main page with tabbed interface and navigation

**API (Cloudflare Workers + Hono)**

- CRUD endpoints for coupon management
- Input validation with Zod schemas
- Authentication middleware integration
- Error handling and response formatting

**Database (Cloudflare D1)**

- Coupons table with user association
- Proper indexing for performance
- Created/updated timestamps
- Status tracking for used/unused state

### Database Schema

```sql
-- Coupons table
CREATE TABLE coupons (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    is_used BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for efficient user-scoped queries
CREATE INDEX idx_coupons_user_id ON coupons(user_id);
CREATE INDEX idx_coupons_user_status ON coupons(user_id, is_used);
```

### API Endpoints

**Coupon Management Endpoints**

```typescript
// Get all coupons for authenticated user
GET /api/v1/coupons
// - Returns user's coupons ordered by created_at DESC
// - Supports filtering by status (?status=active|used)

// Create new coupon
POST /api/v1/coupons
// - Validates input (code required, description optional)
// - Associates with authenticated user
// - Returns created coupon with ID

// Update existing coupon
PUT /api/v1/coupons/:id
// - Validates ownership by authenticated user
// - Supports updating code, description, is_used status
// - Returns updated coupon

// Delete coupon
DELETE /api/v1/coupons/:id
// - Validates ownership by authenticated user
// - Permanently removes coupon from database
// - Returns success confirmation
```

### Component Architecture

**CouponForm Component**

```typescript
interface CouponFormProps {
  onSubmit: (data: CouponFormData) => void;
  loading?: boolean;
  initialData?: Partial<CouponFormData>;
}

interface CouponFormData {
  code: string;
  description?: string;
}
```

**CouponItem Component**

```typescript
interface CouponItemProps {
  coupon: Coupon;
  onToggleUsed: (id: string, isUsed: boolean) => void;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
}
```

**CouponList Component**

```typescript
interface CouponListProps {
  coupons: Coupon[];
  loading?: boolean;
  onToggleUsed: (id: string, isUsed: boolean) => void;
  onDelete: (id: string) => void;
}
```

---

## User Experience Design

### Interface Layout

**Main Coupon Page**

- Header with "Coupons" title and add button
- Tabbed navigation (All, Active, Used) with count badges
- Search/filter input for large collections
- Coupon list with todo-like checkboxes
- Empty state with encouraging add coupon message

**Coupon Form Modal**

- Clean, focused form with code and description fields
- Input validation with real-time feedback
- Submit and cancel buttons
- Loading state during submission

**Coupon Item Display**

- Checkbox for used/unused status with visual feedback
- Coupon code in monospace font for clarity
- Optional description in secondary text
- Action buttons (copy, delete) with appropriate icons
- Strike-through styling for used coupons

### Mobile Optimization

**Touch-Friendly Design**

- Minimum 44px touch targets
- Generous spacing between interactive elements
- Swipe gestures for common actions
- Responsive font sizes and layouts

**Performance Optimizations**

- Lazy loading for large coupon collections
- Optimistic UI updates for instant feedback
- Efficient re-rendering with React keys
- Minimal API calls with smart caching

### Visual Design

**Todo-Like Interface**

- Familiar checkbox patterns for status toggling
- Clear visual hierarchy with proper contrast
- Consistent color scheme with app branding
- Smooth transitions and micro-interactions

**Status Indicators**

- Active coupons: Normal styling with clear text
- Used coupons: Strike-through text with muted colors
- Visual feedback for all user actions
- Loading states and skeleton screens

---

## Implementation Plan

### Phase 1: Backend Infrastructure (Week 1)

**Tasks:**

1. **Database Schema** (4 hours)
   - Create coupons table migration
   - Add appropriate indexes for performance
   - Test data insertion and retrieval

2. **API Endpoints** (8 hours)
   - Implement CRUD endpoints for coupons
   - Add input validation with Zod schemas
   - Integrate authentication middleware
   - Test endpoints with Postman/curl

3. **Service Layer** (4 hours)
   - Create coupon service functions
   - Implement business logic for CRUD operations
   - Add error handling and logging

**Deliverables:**

- Working API endpoints with authentication
- Database schema with proper indexing
- Service layer with business logic
- Basic error handling and validation

### Phase 2: Frontend Components (Week 1-2)

**Tasks:**

1. **Core Components** (8 hours)
   - Build CouponForm component with validation
   - Create CouponItem component with actions
   - Implement CouponList with filtering
   - Design CouponPage with tabbed interface

2. **State Management** (4 hours)
   - API service layer for coupon operations
   - React Query integration for data fetching
   - Optimistic updates for better UX

3. **UI Components** (4 hours)
   - Add shadcn/ui components (tabs, checkbox, input)
   - Style components with Tailwind CSS
   - Implement responsive design patterns

**Deliverables:**

- Complete component library for coupons
- Responsive mobile-first design
- Integration with existing app architecture
- Working CRUD operations in UI

### Phase 3: User Experience Polish (Week 2)

**Tasks:**

1. **Interactions & Feedback** (6 hours)
   - Implement clipboard copy functionality
   - Add confirmation dialogs for destructive actions
   - Smooth animations and transitions
   - Loading states and error handling

2. **Mobile Optimization** (4 hours)
   - Test across different screen sizes
   - Optimize touch interactions
   - Performance testing on mobile devices

3. **Testing & Quality Assurance** (6 hours)
   - Unit tests for components
   - Integration tests for API endpoints
   - End-to-end testing of complete flow
   - Accessibility testing and fixes

**Deliverables:**

- Production-ready coupon feature
- Comprehensive test coverage
- Mobile-optimized experience
- Accessibility compliance

---

## Success Metrics

### Technical Metrics

**Performance Targets:**

- Page load time: < 1 second
- Coupon CRUD operations: < 500ms
- API response time: < 200ms
- Mobile performance score: > 90

**Quality Metrics:**

- Code coverage: > 80%
- Zero critical accessibility violations
- Cross-browser compatibility: Latest 2 versions
- Mobile responsiveness: All major screen sizes

### User Experience Metrics

**Usability Targets:**

- Time to add first coupon: < 30 seconds
- Coupon management task completion: > 95%
- User satisfaction with todo-like interface: > 4.5/5
- Mobile usability score: > 90

**Engagement Metrics:**

- Daily active coupon users: Track after launch
- Average coupons per user: Track usage patterns
- Feature retention rate: Track weekly usage
- Cross-device usage: Monitor session continuity

---

## Risk Assessment

### Technical Risks

**High Priority:**

- **Database Performance**: Mitigation through proper indexing and query optimization
- **Mobile Performance**: Mitigation through lazy loading and performance monitoring
- **Data Loss**: Mitigation through proper error handling and backup strategies

**Medium Priority:**

- **User Input Validation**: Mitigation through client and server-side validation
- **Clipboard API Support**: Mitigation through fallback mechanisms
- **Screen Size Variations**: Mitigation through comprehensive responsive testing

**Low Priority:**

- **Browser Compatibility**: Mitigation through progressive enhancement
- **Network Connectivity**: Mitigation through offline-first caching
- **User Adoption**: Mitigation through intuitive design and onboarding

### Business Risks

**Feature Adoption:**

- User discovery: Integrate into main dashboard and navigation
- Learning curve: Leverage familiar todo-like patterns
- Value proposition: Focus on practical utility for everyday use

**Maintenance Overhead:**

- Code complexity: Keep components simple and focused
- Testing burden: Implement automated testing pipeline
- Documentation: Maintain clear technical documentation

---

## Future Enhancements

### Phase 2 Features

**Advanced Organization**

- Categories and tags for coupon organization
- Search functionality with full-text search
- Bulk operations (select multiple, bulk delete)
- Import/export capabilities for coupon data

**Enhanced Metadata**

- Expiration date tracking with notifications
- Store/brand association for better organization  
- Usage tracking and analytics
- Photo attachment for physical coupons

### Integration Features

**External Services**

- Integration with popular coupon sites
- Browser extension for automatic coupon detection
- Email parsing for coupon extraction
- Mobile app with barcode scanning

**Social Features**

- Coupon sharing with other users
- Community coupon database
- Deal alerts and notifications
- Social proof and ratings

### Advanced Analytics

**Usage Insights**

- Savings tracking and reporting
- Popular coupon categories
- Usage patterns and trends
- ROI analysis for coupon effectiveness

---

## Conclusion

The Coupon Book feature provides practical utility for users' everyday coupon management needs while seamlessly integrating with the Second Brain app's existing architecture. The todo-like interface leverages familiar interaction patterns, and the mobile-first design ensures accessibility across all devices.

The phased implementation approach ensures rapid delivery of core functionality while building toward advanced features that can enhance user engagement and provide deeper value over time. The feature maintains the app's high standards for performance, security, and user experience.