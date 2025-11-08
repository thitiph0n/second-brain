#!/usr/bin/env node

/**
 * Database Migration CLI Tool for Second Brain App
 *
 * Usage:
 *   node scripts/migrate.js --env development
 *   node scripts/migrate.js --env production
 *
 * This is the SAFE way to run database migrations.
 * Never expose migrations through API endpoints!
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(environment = "development") {
	console.log(`🔄 Running database migration for ${environment}...`);

	try {
		// Read the schema file
		const schemaPath = path.join(__dirname, "../src/db/schema.sql");

		if (!fs.existsSync(schemaPath)) {
			throw new Error("Schema file not found at src/db/schema.sql");
		}

		const schema = fs.readFileSync(schemaPath, "utf8");

		// Determine which wrangler config to use
		const configFile = "wrangler.toml";

		console.log(`📋 Using configuration: ${configFile}`);

		// Split schema into individual statements, filtering out comments and empty lines
		const statements = schema
			.split(";")
			.map((stmt) => stmt.trim())
			.filter((stmt) => {
				// Filter out empty statements and comment-only statements
				if (stmt.length === 0) return false;

				// Remove comments and check if there's any actual SQL left
				const cleanedStmt = stmt
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line.length > 0 && !line.startsWith("--"))
					.join("\n");

				return cleanedStmt.length > 0;
			})
			.map((stmt) => {
				// Clean up the statement by removing comments
				return stmt
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line.length > 0 && !line.startsWith("--"))
					.join("\n");
			});

		console.log(`📊 Found ${statements.length} SQL statements to execute`);

		// Execute each statement using wrangler d1 execute
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

			await new Promise((resolve, reject) => {
				const wrangler = spawn(
					"npx",
					[
						"wrangler",
						"d1",
						"execute",
						"second-brain-db", // Use same DB for both environments, different env vars control behavior
						"--command",
						statement,
						"--config",
						configFile,
						...(environment === "production" ? [] : ["--local"]), // Use --local for development
					],
					{
						stdio: "inherit",
						cwd: path.join(__dirname, ".."),
					},
				);

				wrangler.on("close", (code) => {
					if (code === 0) {
						resolve();
					} else {
						reject(new Error(`Migration failed with exit code ${code}`));
					}
				});

				wrangler.on("error", reject);
			});
		}

		console.log("✅ Database migration completed successfully!");

		// List tables to verify
		console.log("📋 Listing tables...");
		await new Promise((resolve, reject) => {
			const wrangler = spawn(
				"npx",
				[
					"wrangler",
					"d1",
					"execute",
					"second-brain-db", // Use same DB for both environments
					"--command",
					"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
					"--config",
					configFile,
					...(environment === "production" ? [] : ["--local"]), // Use --local for development
				],
				{
					stdio: "inherit",
					cwd: path.join(__dirname, ".."),
				},
			);

			wrangler.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Table listing failed with exit code ${code}`));
				}
			});

			wrangler.on("error", reject);
		});
	} catch (error) {
		console.error("❌ Migration failed:", error.message);
		process.exit(1);
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const envIndex = args.indexOf("--env");
const environment = envIndex !== -1 && args[envIndex + 1] ? args[envIndex + 1] : "development";

if (!["development", "production"].includes(environment)) {
	console.error("❌ Invalid environment. Use --env development or --env production");
	process.exit(1);
}

// Confirm production migrations
if (environment === "production") {
	console.log("⚠️  WARNING: You are about to run migrations on PRODUCTION database!");
	console.log("   Make sure you have tested these migrations in development first.");
	console.log('   Type "yes" to continue or anything else to cancel:');

	process.stdin.setEncoding("utf8");
	process.stdin.on("readable", () => {
		const chunk = process.stdin.read();
		if (chunk !== null) {
			const input = chunk.trim().toLowerCase();
			if (input === "yes") {
				runMigration(environment);
			} else {
				console.log("🛑 Migration cancelled.");
				process.exit(0);
			}
		}
	});
} else {
	runMigration(environment);
}
