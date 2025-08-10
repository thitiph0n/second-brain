-- Migration: Add meal tracker tables and functionality
-- This migration adds all tables required for the meal tracking system

-- Food entries table (enhanced for meal tracking)
CREATE TABLE IF NOT EXISTS food_entries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) DEFAULT 'snack',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT CHECK(source IN ('ai', 'manual')) DEFAULT 'manual',
    ai_confidence REAL CHECK(ai_confidence BETWEEN 0.0 AND 1.0),
    original_description TEXT, -- Store original AI input for reference
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    height_cm INTEGER NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
    activity_level TEXT CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) DEFAULT 'moderate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profile tracking table for historical data
CREATE TABLE IF NOT EXISTS profile_tracking (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    weight_kg REAL,
    muscle_mass_kg REAL,
    body_fat_percentage REAL,
    bmr_calories INTEGER,
    tdee_calories INTEGER,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MCP API keys table for remote server authentication
CREATE TABLE IF NOT EXISTS mcp_api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
    key_prefix TEXT NOT NULL, -- First 8 chars for user identification
    name TEXT, -- User-friendly name for the key
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Favorite foods table for quick logging
CREATE TABLE IF NOT EXISTS favorite_foods (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g REAL DEFAULT 0,
    carbs_g REAL DEFAULT 0,
    fat_g REAL DEFAULT 0,
    serving_size TEXT, -- e.g., "1 cup", "100g", "1 medium"
    category TEXT, -- e.g., "breakfast", "snacks", "protein", "vegetables"
    usage_count INTEGER DEFAULT 0, -- Track how often it's used
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_food_entries_created_at ON food_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_food_entries_meal_type ON food_entries(meal_type);
CREATE INDEX IF NOT EXISTS idx_food_entries_source ON food_entries(source);
CREATE INDEX IF NOT EXISTS idx_profile_tracking_user_date ON profile_tracking(user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_user_category ON favorite_foods(user_id, category);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_usage ON favorite_foods(user_id, usage_count DESC, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_user ON mcp_api_keys(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_hash ON mcp_api_keys(key_hash) WHERE revoked_at IS NULL;