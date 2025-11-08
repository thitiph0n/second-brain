#!/usr/bin/env node

/**
 * Create a new database migration file
 *
 * Usage:
 *   bun migrate:create
 *   (You will be prompted for a migration name)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function getNextMigrationNumber() {
	const migrationsDir = path.join(__dirname, "../migrations");

	if (!fs.existsSync(migrationsDir)) {
		fs.mkdirSync(migrationsDir, { recursive: true });
		return "0001";
	}

	const files = fs
		.readdirSync(migrationsDir)
		.filter((file) => file.endsWith(".sql"));

	if (files.length === 0) {
		return "0001";
	}

	const numbers = files.map((file) => Number.parseInt(file.split("_")[0]));
	const maxNumber = Math.max(...numbers);

	return String(maxNumber + 1).padStart(4, "0");
}

function createMigrationFile(name) {
	const number = getNextMigrationNumber();
	const sanitizedName = name
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_]/g, "");
	const filename = `${number}_${sanitizedName}.sql`;
	const filepath = path.join(__dirname, "../migrations", filename);

	const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );
`;

	fs.writeFileSync(filepath, template);
	console.log(`\n✅ Created migration file: ${filename}`);
	console.log(`   Path: ${filepath}`);
	console.log(
		"\n💡 Edit the file to add your migration SQL, then run:",
	);
	console.log("   bun --filter @second-brain/api migrate:local");
}

rl.question("\n📝 Enter migration name (e.g., 'add users table'): ", (name) => {
	if (!name || name.trim().length === 0) {
		console.error("❌ Migration name is required");
		rl.close();
		process.exit(1);
	}

	createMigrationFile(name.trim());
	rl.close();
});
