# Drawing Canvas Components

This directory contains the tldraw-based drawing canvas implementation with full functionality including auto-save, keyboard shortcuts, and asset management.

## Components

### DrawingCanvas

The main tldraw canvas component with:

- Full tldraw integration
- Auto-save every 30 seconds
- Manual save with Cmd/Ctrl+S
- Asset upload/download functionality
- Save status indicators
- Error handling and retry logic

**Usage:**

```tsx
import { DrawingCanvas } from './DrawingCanvas'

function MyDrawingApp() {
  return (
    <div className="w-full h-full">
      <DrawingCanvas drawingId="unique-drawing-id" />
    </div>
  )
}
```

### ResponsiveDrawingCanvas

A full-featured drawing interface with:

- Responsive design
- Fullscreen mode
- Title/description editing
- Export functionality
- Header controls

**Usage:**

```tsx
import { ResponsiveDrawingCanvas } from './ResponsiveDrawingCanvas'

function MyDrawingApp() {
  return (
    <ResponsiveDrawingCanvas
      drawingId="unique-drawing-id"
      onExit={() => console.log('Exit drawing')}
    />
  )
}
```

### TldrawWrapper

Low-level wrapper for tldraw with custom asset store.

## Hooks

### useDrawingCanvas

Provides data fetching and mutation for drawings:

```tsx
const { drawing, isLoading, isError, saveDrawing, isSaving } = useDrawingCanvas(drawingId)
```

### useAutoSave

Handles auto-save functionality:

```tsx
const { saveStatus, lastSaved, formatLastSaved } = useAutoSave({
  drawingId,
  content,
  shouldAutoSave: true
})
```

### useKeyboardShortcuts

Manages keyboard shortcuts:

```tsx
useKeyboardShortcuts({
  shortcut: 'Cmd+S',
  callback: handleSave,
  condition: () => !isSaving
})
```

### useAssetStore

Handles asset upload/download with progress tracking:

```tsx
const assetStore = useAssetStore()
```

## API Integration

The components integrate with the drawing API endpoints:

- `GET /api/v1/drawing/:id` - Fetch drawing data
- `PUT /api/v1/drawing/:id/content` - Save drawing content
- `POST /api/v1/drawing/upload` - Upload assets
- `GET /api/v1/drawing/download/:key` - Download assets

## Features

### Auto-save

- Automatically saves every 30 seconds
- Prevents duplicate saves
- Shows save status in real-time
- Respects saving state to prevent conflicts

### Keyboard Shortcuts

- `Cmd/Ctrl+S` - Manual save
- `Escape` - Exit fullscreen mode

### Asset Management

- Upload images and other files
- Progress tracking for uploads
- Cache management for performance
- Fallback to base64 storage if R2 unavailable

### Error Handling

- Comprehensive error states
- Retry mechanisms
- User-friendly error messages
- Toast notifications for feedback

### Responsive Design

- Mobile-friendly interface
- Fullscreen support
- Adaptive controls
- Touch-friendly interactions

## TypeScript Support

All components are fully typed with TypeScript interfaces for:

- Drawing data structure
- Asset metadata
- Error states
- Callback functions
- API responses

## Performance Optimizations

- Component memoization
- Efficient asset caching
- Debounced auto-save
- Cleanup on unmount
- Lazy loading where appropriate
