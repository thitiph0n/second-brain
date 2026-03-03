// Shared type constants
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = typeof MEAL_TYPES[number];
export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export interface ParseMealResult {
	foodName: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	servingSize?: string;
	servingUnit?: string;
	mealType?: MealType;
	notes?: string;
	confidence: ConfidenceLevel;
	reasoning?: string;
}

export interface ParseMealRequest {
	text: string;
	imageDataUrl?: string; // base64 data URL
}

export interface MacroEstimation {
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	confidence: ConfidenceLevel;
	reasoning?: string;
}

export interface EstimateMacrosRequest {
	foodName: string;
	servingSize?: string;
	servingUnit?: string;
	notes?: string;
}

export class OpenRouterService {
	private apiKey: string;
	private baseUrl = "https://openrouter.ai/api/v1";
	private model = "google/gemini-flash-3-preview";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async estimateMacros(
		request: EstimateMacrosRequest,
	): Promise<MacroEstimation> {
		const prompt = this.buildPrompt(request);

		try {
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "https://2b.thitiphon.me",
					"X-Title": "Second Brain - Meal Tracker",
				},
				body: JSON.stringify({
					model: this.model,
					messages: [
						{
							role: "system",
							content:
								"You are a nutrition expert. Estimate the macronutrients for food items accurately. Always respond with valid JSON only, no additional text or markdown. The response must be a JSON object with these exact fields: calories (number), proteinG (number), carbsG (number), fatG (number), confidence (string: high/medium/low), reasoning (string).",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.3,
					max_tokens: 500,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`OpenRouter API error: ${response.status} - ${errorText}`,
				);
			}

			const data = (await response.json()) as {
				choices?: Array<{
					message?: {
						content?: string;
					};
				}>;
			};

			if (!data.choices?.[0]?.message?.content) {
				throw new Error("Invalid response from OpenRouter API");
			}

			const content = data.choices[0].message.content.trim();
			const parsed = this.extractJSON(content) as MacroEstimation;

			return this.validateAndNormalize(parsed);
		} catch (error) {
			console.error("OpenRouter macro estimation error:", error);
			throw error;
		}
	}

	private buildPrompt(request: EstimateMacrosRequest): string {
		let prompt = `Estimate the macronutrients for: ${request.foodName}`;

		if (request.servingSize && request.servingUnit) {
			prompt += `\nServing size: ${request.servingSize} ${request.servingUnit}`;
		} else if (request.servingSize) {
			prompt += `\nAmount: ${request.servingSize}`;
		}

		if (request.notes) {
			prompt += `\nAdditional notes: ${request.notes}`;
		}

		prompt += `\n\nProvide your estimate in the following JSON format (respond with ONLY the JSON, no markdown formatting or additional text):
{
  "calories": <number>,
  "proteinG": <number>,
  "carbsG": <number>,
  "fatG": <number>,
  "confidence": "<high|medium|low>",
  "reasoning": "<brief explanation of your estimate>"
}`;

		return prompt;
	}

	async parseMeal(request: ParseMealRequest): Promise<ParseMealResult> {
		const systemPrompt =
			"You are a nutrition expert and AI meal logger. The user will describe a meal in natural language (and may provide a photo). Extract all meal details and return ONLY valid JSON with no additional text or markdown.";

		const userPrompt = `From the following meal description${request.imageDataUrl ? " and attached photo" : ""}, extract the meal details and estimate nutritional information.

Meal description: "${request.text}"

Return ONLY a valid JSON object with exactly these fields:
{
  "foodName": "name of the food (Thai if Thai food, English otherwise)",
  "calories": <number>,
  "proteinG": <number>,
  "carbsG": <number>,
  "fatG": <number>,
  "servingSize": "<optional: quantity string, e.g. '200', '1'>",
  "servingUnit": "<optional: unit string, e.g. 'g', 'ml', 'plate', 'piece'>",
  "mealType": "<breakfast|lunch|dinner|snack — guess from context/time if unclear, default to 'snack'>",
  "notes": "<optional: any extra info from the description>",
  "confidence": "<high|medium|low>",
  "reasoning": "<brief explanation of your estimates>"
}`;

		const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
			{ type: "text", text: userPrompt },
		];

		if (request.imageDataUrl) {
			content.push({
				type: "image_url",
				image_url: { url: request.imageDataUrl },
			});
		}

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://2b.thitiphon.me",
				"X-Title": "Second Brain - Meal Tracker",
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content },
				],
				temperature: 0.3,
				max_tokens: 600,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};

		if (!data.choices?.[0]?.message?.content) {
			throw new Error("Invalid response from OpenRouter API");
		}

		const parsed = this.extractJSON(data.choices[0].message.content) as ParseMealResult;
		return this.validateAndNormalizeParseMealResult(parsed);
	}

	/**
	 * Extract JSON from AI response, handling markdown code blocks
	 */
	private extractJSON(content: string): unknown {
		const trimmedContent = content.trim();
		const jsonMatch = trimmedContent.match(/\{[\s\S]*\}/);
		const jsonStr = jsonMatch ? jsonMatch[0] : trimmedContent;
		return JSON.parse(jsonStr);
	}

	/**
	 * Validate and normalize ParseMealResult from AI
	 */
	private validateAndNormalizeParseMealResult(data: ParseMealResult): ParseMealResult {
		return {
			foodName: String(data.foodName || "Unknown Food"),
			calories: Math.round(Number(data.calories) || 0),
			proteinG: Math.round((Number(data.proteinG) || 0) * 10) / 10,
			carbsG: Math.round((Number(data.carbsG) || 0) * 10) / 10,
			fatG: Math.round((Number(data.fatG) || 0) * 10) / 10,
			servingSize: data.servingSize ? String(data.servingSize) : undefined,
			servingUnit: data.servingUnit ? String(data.servingUnit) : undefined,
			mealType: MEAL_TYPES.includes(data.mealType as MealType) ? (data.mealType as MealType) : "snack",
			notes: data.notes ? String(data.notes) : undefined,
			confidence: CONFIDENCE_LEVELS.includes(data.confidence) ? data.confidence : "medium",
			reasoning: data.reasoning ? String(data.reasoning) : undefined,
		};
	}

	private validateAndNormalize(data: MacroEstimation): MacroEstimation {
		if (typeof data.calories !== "number" || data.calories < 0) {
			throw new Error("Invalid calories value in AI response");
		}
		if (typeof data.proteinG !== "number" || data.proteinG < 0) {
			throw new Error("Invalid protein value in AI response");
		}
		if (typeof data.carbsG !== "number" || data.carbsG < 0) {
			throw new Error("Invalid carbs value in AI response");
		}
		if (typeof data.fatG !== "number" || data.fatG < 0) {
			throw new Error("Invalid fat value in AI response");
		}
		if (!CONFIDENCE_LEVELS.includes(data.confidence)) {
			data.confidence = "medium";
		}

		return {
			calories: Math.round(data.calories),
			proteinG: Math.round(data.proteinG * 10) / 10,
			carbsG: Math.round(data.carbsG * 10) / 10,
			fatG: Math.round(data.fatG * 10) / 10,
			confidence: data.confidence,
			reasoning: data.reasoning,
		};
	}
}
