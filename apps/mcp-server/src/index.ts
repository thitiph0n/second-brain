import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MealTrackerService } from "@second-brain/meal-tracker";

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;
  MCP_BASE_URL: string;
}

interface AuthContext extends Record<string, unknown> {
  user_id?: string;
  access_token?: string;
  claims?: {
    sub?: string;
    email?: string;
    name?: string;
  };
}

export class MealTrackerMCP extends McpAgent<Env, unknown, AuthContext> {
  server = new McpServer({ 
    name: "Second Brain Meal Tracker", 
    version: "1.0.0" 
  });

  async init() {
    // Initialize meal tracking tools
    await this.setupMealTrackingTools();
    await this.setupProfileTools();
    await this.setupFavoriteTools();
    await this.setupNutritionTools();
  }

  private async setupMealTrackingTools() {
    // Add food entry tool
    this.server.tool(
      "add_food_entry",
      {
        food_name: z.string().describe("Name of the food item"),
        calories: z.number().describe("Calories in the food item"),
        protein_g: z.number().optional().describe("Protein content in grams"),
        carbs_g: z.number().optional().describe("Carbohydrate content in grams"),  
        fat_g: z.number().optional().describe("Fat content in grams"),
        meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Type of meal"),
        entry_date: z.string().optional().describe("Date in YYYY-MM-DD format (defaults to today)"),
        source: z.enum(["ai", "manual"]).optional().default("ai").describe("Source of the entry"),
        ai_confidence: z.number().min(0).max(1).optional().describe("AI confidence level (0-1)"),
        original_description: z.string().optional().describe("Original description from user")
      },
      async ({ food_name, calories, protein_g, carbs_g, fat_g, meal_type, entry_date, source, ai_confidence, original_description }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const entry = await mealService.createFoodEntry(userId, {
            foodName: food_name,
            calories,
            proteinG: protein_g || 0,
            carbsG: carbs_g || 0,
            fatG: fat_g || 0,
            mealType: meal_type,
            entryDate: entry_date,
            source,
            aiConfidence: ai_confidence,
            originalDescription: original_description
          });

          return {
            content: [{
              type: "text",
              text: `Successfully added "${food_name}" (${calories} calories) to ${meal_type}. Entry ID: ${entry.id}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text", 
              text: `Error adding food entry: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Get daily nutrition summary tool
    this.server.tool(
      "get_daily_nutrition",
      {
        date: z.string().optional().describe("Date in YYYY-MM-DD format (defaults to today)")
      },
      async ({ date }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const targetDate = date || new Date().toISOString().split('T')[0];
          const summary = await mealService.getDailyNutritionSummary(userId, targetDate);

          const { totalCalories, totalProteinG, totalCarbsG, totalFatG } = summary;

          let response = `📊 Daily Nutrition Summary for ${targetDate}:\n\n`;
          response += `🔥 Calories: ${totalCalories}\n`;
          response += `🥩 Protein: ${totalProteinG}g\n`;
          response += `🍞 Carbs: ${totalCarbsG}g\n`;
          response += `🧈 Fat: ${totalFatG}g\n`;

          response += `\n\n📋 Total Entries: ${summary.entryCount}`;
          
          response += `\n\nMeal Breakdown:`;
          const meals = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
          for (const meal of meals) {
            const mealData = summary.mealBreakdown[meal];
            if (mealData.calories > 0) {
              response += `\n\n${meal.toUpperCase()} (${mealData.calories} cal):`;
              response += `\n  P: ${mealData.proteinG}g | C: ${mealData.carbsG}g | F: ${mealData.fatG}g`;
              response += `\n  Entries: ${mealData.entryCount}`;
            }
          }

          return {
            content: [{
              type: "text",
              text: response
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting daily nutrition: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Get food entries tool
    this.server.tool(
      "get_food_entries",
      {
        date: z.string().optional().describe("Filter by date (YYYY-MM-DD)"),
        meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional().describe("Filter by meal type"),
        limit: z.number().optional().default(50).describe("Maximum number of entries to return"),
        offset: z.number().optional().default(0).describe("Number of entries to skip")
      },
      async ({ date, meal_type, limit, offset }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const entries = await mealService.getFoodEntries(userId, {
            startDate: date,
            endDate: date,
            mealType: meal_type,
            limit: limit || 50,
            offset: offset || 0
          });

          let response = `📝 Food Entries (${entries.length} found):\n\n`;
          
          if (entries.length === 0) {
            response += "No food entries found for the specified criteria.";
          } else {
            for (const entry of entries) {
              response += `• ${entry.foodName} (${entry.mealType})\n`;
              response += `  📅 ${entry.entryDate} | 🔥 ${entry.calories} cal`;
              if (entry.proteinG > 0 || entry.carbsG > 0 || entry.fatG > 0) {
                response += ` | P:${entry.proteinG}g C:${entry.carbsG}g F:${entry.fatG}g`;
              }
              if (entry.source === 'ai') response += ' 🤖';
              response += `\n  ID: ${entry.id}\n\n`;
            }
          }

          return {
            content: [{
              type: "text",
              text: response
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting food entries: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private async setupProfileTools() {
    // Create user profile tool
    this.server.tool(
      "create_profile",
      {
        height_cm: z.number().describe("Height in centimeters"),
        age: z.number().describe("Age in years"),
        gender: z.enum(["male", "female"]).describe("Gender"),
        activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).describe("Activity level")
      },
      async ({ height_cm, age, gender, activity_level }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          await mealService.createUserProfile(userId, {
            heightCm: height_cm,
            age,
            gender,
            activityLevel: activity_level
          });

          return {
            content: [{
              type: "text",
              text: `✅ Profile created successfully!\n\n👤 Profile Details:\n• Height: ${height_cm}cm\n• Age: ${age} years\n• Gender: ${gender}\n• Activity Level: ${activity_level}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error creating profile: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Get user profile tool
    this.server.tool(
      "get_profile",
      {},
      async () => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const profile = await mealService.getUserProfile(userId);
          
          if (!profile) {
            return {
              content: [{
                type: "text",
                text: "❌ No profile found. Please create a profile first using the create_profile tool."
              }]
            };
          }

          let response = `👤 User Profile:\n\n`;
          response += `• Height: ${profile.heightCm}cm\n`;
          response += `• Age: ${profile.age} years\n`;
          response += `• Gender: ${profile.gender}\n`;
          response += `• Activity Level: ${profile.activityLevel}\n`;

          if (profile.currentWeight) {
            response += `• Latest Weight: ${profile.currentWeight}kg\n`;
            response += `• BMR: ${profile.currentBmr} calories/day\n`;
            response += `• TDEE: ${profile.currentTdee} calories/day\n`;
          }

          return {
            content: [{
              type: "text",
              text: response
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting profile: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Add weight tracking tool
    this.server.tool(
      "add_weight_tracking",
      {
        weight_kg: z.number().describe("Weight in kilograms"),
        muscle_mass_kg: z.number().optional().describe("Muscle mass in kilograms"),
        body_fat_percentage: z.number().optional().describe("Body fat percentage"),
        recorded_date: z.string().optional().describe("Date recorded (YYYY-MM-DD, defaults to today)")
      },
      async ({ weight_kg, muscle_mass_kg, body_fat_percentage, recorded_date }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const tracking = await mealService.createProfileTracking(userId, {
            weightKg: weight_kg,
            muscleMassKg: muscle_mass_kg,
            bodyFatPercentage: body_fat_percentage,
            recordedDate: recorded_date
          });

          let response = `✅ Weight tracking added successfully!\n\n📊 Recorded:\n`;
          response += `• Weight: ${weight_kg}kg\n`;
          if (muscle_mass_kg) response += `• Muscle Mass: ${muscle_mass_kg}kg\n`;
          if (body_fat_percentage) response += `• Body Fat: ${body_fat_percentage}%\n`;
          response += `• Date: ${tracking.recordedDate}\n`;
          if (tracking.bmrCalories) response += `• Updated BMR: ${tracking.bmrCalories} cal/day\n`;
          if (tracking.tdeeCalories) response += `• Updated TDEE: ${tracking.tdeeCalories} cal/day`;

          return {
            content: [{
              type: "text",
              text: response
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error adding weight tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private async setupFavoriteTools() {
    // Add favorite food tool
    this.server.tool(
      "add_favorite_food",
      {
        name: z.string().describe("Name of the favorite food"),
        calories: z.number().describe("Calories per serving"),
        protein_g: z.number().optional().describe("Protein per serving in grams"),
        carbs_g: z.number().optional().describe("Carbs per serving in grams"),
        fat_g: z.number().optional().describe("Fat per serving in grams"),
        serving_size: z.string().optional().describe("Serving size description"),
        category: z.string().optional().describe("Food category")
      },
      async ({ name, calories, protein_g, carbs_g, fat_g, serving_size, category }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          await mealService.createFavoriteFood(userId, {
            name,
            calories,
            proteinG: protein_g || 0,
            carbsG: carbs_g || 0,
            fatG: fat_g || 0,
            servingSize: serving_size,
            category
          });

          return {
            content: [{
              type: "text",
              text: `⭐ Added "${name}" to favorites!\n\n📋 Details:\n• Calories: ${calories}\n• Protein: ${protein_g || 0}g\n• Carbs: ${carbs_g || 0}g\n• Fat: ${fat_g || 0}g${serving_size ? `\n• Serving Size: ${serving_size}` : ''}${category ? `\n• Category: ${category}` : ''}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error adding favorite food: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Get favorite foods tool
    this.server.tool(
      "get_favorite_foods",
      {
        category: z.string().optional().describe("Filter by category"),
        limit: z.number().optional().default(20).describe("Maximum number to return")
      },
      async ({ category, limit }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const favorites = await mealService.getFavoriteFoods(userId, {
            category,
            limit: limit || 20,
            offset: 0
          });

          let response = `⭐ Favorite Foods (${favorites.length} found):\n\n`;
          
          if (favorites.length === 0) {
            response += "No favorite foods found. Add some using the add_favorite_food tool!";
          } else {
            for (const fav of favorites) {
              response += `• ${fav.name}\n`;
              response += `  🔥 ${fav.calories} cal | P:${fav.proteinG}g C:${fav.carbsG}g F:${fav.fatG}g\n`;
              if (fav.servingSize) response += `  📏 ${fav.servingSize}\n`;
              if (fav.category) response += `  📂 ${fav.category}\n`;
              response += `  📊 Used ${fav.usageCount} times | ID: ${fav.id}\n\n`;
            }
          }

          return {
            content: [{
              type: "text",
              text: response
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting favorite foods: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Quick add from favorites tool
    this.server.tool(
      "quick_add_favorite",
      {
        favorite_id: z.string().describe("ID of the favorite food to add"),
        meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Meal type to add to"),
        entry_date: z.string().optional().describe("Date to add entry (YYYY-MM-DD, defaults to today)")
      },
      async ({ favorite_id, meal_type }) => {
        try {
          const userId = this.getUserId();
          const mealService = new MealTrackerService(this.env.DB);
          
          const entry = await mealService.addFavoriteFoodToLog(favorite_id, userId, meal_type);

          return {
            content: [{
              type: "text",
              text: `✅ Quick added "${entry.foodName}" (${entry.calories} cal) to ${meal_type}!`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error quick adding favorite: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private async setupNutritionTools() {
    // Calculate BMR tool
    this.server.tool(
      "calculate_bmr",
      {
        weight_kg: z.number().describe("Weight in kilograms"),
        height_cm: z.number().describe("Height in centimeters"),
        age: z.number().describe("Age in years"),
        gender: z.enum(["male", "female"]).describe("Gender")
      },
      async ({ weight_kg, height_cm, age, gender }) => {
        try {
          const mealService = new MealTrackerService(this.env.DB);
          const bmr = mealService.calculateBMR(weight_kg, height_cm, age, gender);

          return {
            content: [{
              type: "text",
              text: `🧮 BMR Calculation:\n\n📊 Your Basal Metabolic Rate is ${bmr} calories per day.\n\nThis is the number of calories your body burns at rest to maintain basic physiological functions like breathing, circulation, and cell production.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error calculating BMR: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Calculate TDEE tool
    this.server.tool(
      "calculate_tdee",
      {
        bmr: z.number().describe("Basal Metabolic Rate"),
        activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).describe("Activity level")
      },
      async ({ bmr, activity_level }) => {
        try {
          const mealService = new MealTrackerService(this.env.DB);
          const tdee = mealService.calculateTDEE(bmr, activity_level);

          const activityDescriptions = {
            sedentary: "little or no exercise",
            light: "light exercise 1-3 days/week",
            moderate: "moderate exercise 3-5 days/week", 
            active: "hard exercise 6-7 days/week",
            very_active: "very hard exercise, physical job"
          };

          return {
            content: [{
              type: "text",
              text: `🎯 TDEE Calculation:\n\n📊 Your Total Daily Energy Expenditure is ${tdee} calories per day.\n\nBased on ${activity_level} activity level (${activityDescriptions[activity_level]}).\n\nThis is the total number of calories you burn in a day, including exercise and daily activities.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error calculating TDEE: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private getUserId(): string {
    // For development, use a static user ID
    // In production, this should come from authentication context
    if (this.props?.claims?.sub) {
      return this.props.claims.sub;
    }
    
    // Fallback to a default user for development
    return "dev-user-123";
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    
    if (pathname.startsWith('/sse')) {
      return MealTrackerMCP.serveSSE('/sse').fetch(request, env, ctx);
    }
    
    if (pathname.startsWith('/mcp')) {
      return MealTrackerMCP.serve('/mcp').fetch(request, env, ctx);
    }
    
    return new Response('MCP Server - Use /sse for Server-Sent Events or /mcp for standard MCP transport', { status: 200 });
  },
};