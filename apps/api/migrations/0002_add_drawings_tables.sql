-- Migration: Add drawings tables
-- Second Brain App - Drawing Feature Support
-- Creates tables for storing tldraw drawings and associated assets

-- Drawings table for storing drawing projects and folders
CREATE TABLE IF NOT EXISTS drawings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    type TEXT NOT NULL DEFAULT 'drawing',
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES drawings(id) ON DELETE CASCADE,
    CHECK (type IN ('drawing', 'folder'))
);

-- Drawing assets table for storing uploaded files associated with drawings
CREATE TABLE IF NOT EXISTS drawing_assets (
    id TEXT PRIMARY KEY,
    drawing_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance on drawings table
CREATE INDEX IF NOT EXISTS idx_drawings_user_id ON drawings(user_id);
CREATE INDEX IF NOT EXISTS idx_drawings_parent_id ON drawings(parent_id);
CREATE INDEX IF NOT EXISTS idx_drawings_type ON drawings(type);
CREATE INDEX IF NOT EXISTS idx_drawings_created_at ON drawings(created_at);
CREATE INDEX IF NOT EXISTS idx_drawings_updated_at ON drawings(updated_at);

-- Indexes for better performance on drawing assets table
CREATE INDEX IF NOT EXISTS idx_drawing_assets_drawing_id ON drawing_assets(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_assets_user_id ON drawing_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_drawing_assets_file_type ON drawing_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_drawing_assets_created_at ON drawing_assets(created_at);