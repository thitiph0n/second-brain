export interface MacroEstimation {
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	confidence: "high" | "medium" | "low";
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
	private model = "google/gemini-2.5-flash";

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

			let parsed: MacroEstimation;
			try {
				const jsonMatch = content.match(/\{[\s\S]*\}/);
				const jsonStr = jsonMatch ? jsonMatch[0] : content;
				parsed = JSON.parse(jsonStr);
			} catch (parseError) {
				throw new Error(
					`Failed to parse AI response as JSON: ${content}. Parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}

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
		if (!["high", "medium", "low"].includes(data.confidence)) {
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
