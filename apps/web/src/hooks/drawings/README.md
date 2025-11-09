# Drawing Hooks

Comprehensive TanStack Query hooks for drawing operations with caching, optimistic updates, and advanced features.

## Features

- **Caching & Invalidation**: Automatic caching with proper invalidation strategies
- **Optimistic Updates**: Real-time UI updates with rollback on errors
- **Auto-save**: Automatic saving with debouncing and retry logic
- **File Upload**: Progress tracking and validation for asset uploads
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Full TypeScript support with proper type definitions
- **Authentication Integration**: Seamless integration with existing authentication system

## Installation

These hooks are part of the `@second-brain/web` package and can be imported directly:

```typescript
import { useDrawings, useDrawing, useCreateDrawing, useDeleteDrawing, useSaveDrawing, useUploadAsset } from "@/hooks/drawings";
```

## Core Hooks

### `useDrawings` - List all drawings

Fetch all drawings with caching and filtering support.

```typescript
const { data: drawings, isLoading, isError, error, refetch } = useDrawings({
  filters: {
    isArchived: false,
    searchQuery: "example"
  },
  enabled: true,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

### `useDrawing(id)` - Get single drawing

Fetch a single drawing with optimistic updates.

```typescript
const { data: drawing, isLoading, error, refetch } = useDrawing(drawingId);

const { updateDrawing, isPending } = useUpdateDrawing(drawingId, {
  onSuccess: (updatedDrawing) => {
    console.log('Drawing updated:', updatedDrawing);
  },
  onError: (error) => {
    console.error('Failed to update drawing:', error);
  }
});
```

### `useCreateDrawing` - Create new drawing

Create drawings with optimistic updates and form management.

```typescript
const { createDrawing, isPending, isSuccess, error } = useCreateDrawing({
  onSuccess: (newDrawing) => {
    console.log('Drawing created:', newDrawing);
  },
  onError: (error) => {
    console.error('Failed to create drawing:', error);
  }
});

// Create with form state management
const { values, errors, isDirty, handleSubmit } = useCreateDrawingForm({
  defaultValues: {
    title: "New Drawing",
    description: "",
    content: ""
  },
  onSuccess: (drawing) => {
    // Handle success
  }
});
```

### `useDeleteDrawing` - Delete drawing

Delete drawings with confirmation dialog support.

```typescript
const { deleteDrawing, isPending, error } = useDeleteDrawing({
  showConfirmation: true,
  confirmationMessage: "Are you sure you want to delete this drawing?",
  onSuccess: () => {
    console.log('Drawing deleted successfully');
  },
  onError: (error) => {
    console.error('Failed to delete drawing:', error);
  }
});

// With dialog state management
const { open, setOpen, handleDelete, isPending } = useDeleteDrawingDialog({
  onSuccess: (data) => {
    console.log('Drawing deleted:', data.message);
  }
});
```

### `useSaveDrawing` - Auto-save functionality

Automatic saving with debouncing and retry logic.

```typescript
const { save, isSaving, isSaved, autoSaveStatus, retrySave } = useSaveDrawing(drawingId, {
  autoSaveInterval: 5000, // 5 seconds
  debounceTime: 1000,    // 1 second
  maxRetries: 3,
  onSaving: () => {
    console.log('Saving...');
  },
  onSaved: (drawing) => {
    console.log('Saved:', drawing);
  },
  onSaveError: (error) => {
    console.error('Save failed:', error);
  }
});
```

### `useUploadAsset` - Upload assets

Upload files with progress tracking and validation.

```typescript
const { upload, uploadStatus, isUploading, error } = useUploadAsset({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
  onProgress: (progress) => {
    console.log('Upload progress:', progress + '%');
  },
  onSuccess: (data) => {
    console.log('Upload successful:', data);
  }
});

// With form state management
const { fileInputRef, selectedFile, uploadFile, canUpload } = useAssetUploadForm({
  showFileDialog: true,
  accept: "image/*,.pdf,.txt"
});
```

## Advanced Features

### Query Keys & Cache Management

The hooks use structured query keys for effective cache management:

```typescript
// Query keys for different operations
DRAWING_QUERY_KEYS.all // ["drawings"]
DRAWING_QUERY_KEYS.lists() // ["drawings", "list"]
DRAWING_QUERY_KEYS.list(filters) // ["drawings", "list", { filters }]
DRAWING_QUERY_KEYS.single(id) // ["drawings", id]
```

### Prefetching & Caching

```typescript
// Prefetch drawings for better performance
const { prefetch } = usePrefetchDrawings();
prefetch().then(() => {
  console.log('Drawings prefetched');
});

// Invalidate cache when data changes
const { invalidate } = useInvalidateDrawings();
invalidate(); // Invalidate all drawings
invalidateArchived(); // Invalidate only archived drawings
```

### Error Handling

All hooks use the `ApiError` class for consistent error handling:

```typescript
try {
  await createDrawing(formData);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Authentication Integration

All API calls automatically include authentication tokens from the local storage. The hooks handle token refresh and re-authentication seamlessly.

## Usage Examples

### Basic Drawing List

```typescript
function DrawingList() {
  const { data: drawings, isLoading, isError } = useDrawings({
    filters: { isArchived: false }
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading drawings</div>;

  return (
    <div>
      {drawings.map((drawing) => (
        <DrawingCard key={drawing.id} drawing={drawing} />
      ))}
    </div>
  );
}
```

### Drawing Editor with Auto-save

```typescript
function DrawingEditor({ drawingId }: { drawingId: string }) {
  const { data: drawing } = useDrawing(drawingId);
  const { save, autoSaveStatus, lastSavedAt } = useSaveDrawing(drawingId);
  const { updateDrawing } = useUpdateDrawing(drawingId);

  const handleContentChange = (content: string) => {
    // Content is automatically saved
  };

  const handleTitleChange = (title: string) => {
    updateDrawing({ id: drawingId, data: { title } });
  };

  return (
    <div>
      <h1>{drawing?.title}</h1>
      <p>Auto-save status: {autoSaveStatus}</p>
      <p>Last saved: {lastSavedAt?.toLocaleString()}</p>
      <textarea
        value={drawing?.content || ""}
        onChange={(e) => handleContentChange(e.target.value)}
      />
    </div>
  );
}
```

### File Upload Component

```typescript
function AssetUpload() {
  const { selectedFile, uploadFile, uploadStatus, canUpload } = useAssetUploadForm();

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadFile("image");
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleFileSelect(e)}
        accept="image/*,.pdf,.txt"
      />
      {selectedFile && (
        <button onClick={handleUpload} disabled={!canUpload}>
          Upload
        </button>
      )}
      {uploadStatus.status === "uploading" && (
        <div>Uploading... {uploadStatus.progress}%</div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use proper query keys** for effective cache management
2. **Handle errors gracefully** with try-catch blocks
3. **Optimize performance** with appropriate `staleTime` and `refetchInterval`
4. **Use optimistic updates** for better user experience
5. **Implement proper loading states** for better UX
6. **Use TypeScript types** for better type safety
7. **Follow authentication patterns** for secure API calls
8. **Use proper error boundaries** for error handling

## Integration with Existing Components

These hooks are designed to integrate seamlessly with existing components:

- **Authentication**: Uses the same auth store as existing coupon components
- **Error handling**: Consistent with existing error patterns
- **UI components**: Compatible with existing shadcn/ui components
- **Routing**: Works with existing TanStack Router setup
- **State management**: Complements existing Zustand patterns