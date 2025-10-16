import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AwsResource, Recommendation } from "@shared/schema";

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash for optimal speed
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-latest" });
  }

  async analyzeResourcesForOptimization(resources: AwsResource[], historicalMetrics?: any): Promise<any[]> {
    const prompt = this.buildAnalysisPrompt(resources, historicalMetrics);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response into structured recommendations
      return this.parseRecommendations(text, resources);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      throw error;
    }
  }

  private buildAnalysisPrompt(resources: AwsResource[], historicalMetrics?: any): string {
    const resourceSummary = resources.map(r => ({
      id: r.resourceId,
      type: r.resourceType,
      config: r.currentConfig,
      cost: r.monthlyCost || 0,
      utilization: r.utilizationMetrics
    }));

    return `You are an expert AWS FinOps consultant analyzing cloud infrastructure for cost optimization opportunities.

RESOURCES TO ANALYZE:
${JSON.stringify(resourceSummary, null, 2)}

TASK:
Analyze these AWS resources and identify cost optimization opportunities. For each recommendation:
1. Consider actual utilization patterns, not just static thresholds
2. Assess business impact and risk level
3. Provide contextual reasoning for why this optimization makes sense
4. Consider resource relationships and dependencies
5. Calculate realistic savings projections

RESPONSE FORMAT (JSON array):
[
  {
    "resourceId": "resource-id",
    "type": "resize|storage-class|reserved-instance|terminate|schedule",
    "priority": "critical|high|medium|low",
    "title": "Brief recommendation title",
    "description": "Detailed explanation with contextual reasoning",
    "currentConfig": {...},
    "recommendedConfig": {...},
    "projectedMonthlySavings": 0,
    "projectedAnnualSavings": 0,
    "riskLevel": "0-100",
    "reasoning": "Why this optimization makes sense for this specific resource"
  }
]

IMPORTANT RULES:
- Only recommend optimizations with clear cost savings (> $10/month)
- Risk levels: 0-5 (very safe), 5-15 (low risk), 15-30 (moderate), 30+ (high risk)
- Consider business context from tags (production vs development)
- Savings must be realistic based on AWS pricing
- All monetary values should be integers (multiply by 1000, no decimal places)
- Provide specific, actionable recommendations

Generate recommendations now:`;
  }

  private parseRecommendations(aiResponse: string, resources: AwsResource[]): any[] {
    try {
      // Extract JSON from the response (AI might wrap it in markdown)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("No JSON array found in AI response");
        return [];
      }

      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize recommendations
      return recommendations.map((rec: any) => ({
        resourceId: rec.resourceId,
        type: rec.type || 'resize',
        priority: rec.priority || 'medium',
        title: rec.title || 'AI-Generated Optimization',
        description: rec.description || rec.reasoning || '',
        currentConfig: typeof rec.currentConfig === 'string' 
          ? rec.currentConfig 
          : JSON.stringify(rec.currentConfig),
        recommendedConfig: typeof rec.recommendedConfig === 'string'
          ? rec.recommendedConfig
          : JSON.stringify(rec.recommendedConfig),
        projectedMonthlySavings: Math.round(rec.projectedMonthlySavings * 1000), // Convert to integer * 1000
        projectedAnnualSavings: Math.round(rec.projectedAnnualSavings * 1000), // Convert to integer * 1000
        riskLevel: rec.riskLevel?.toString() || '10',
        status: 'pending'
      }));
    } catch (error) {
      console.error("Error parsing AI recommendations:", error);
      console.error("AI Response:", aiResponse);
      return [];
    }
  }

  async explainRecommendation(recommendation: any, resource: AwsResource): Promise<string> {
    const prompt = `As an AWS FinOps expert, provide a clear, concise explanation for this optimization recommendation:

RESOURCE:
- ID: ${resource.resourceId}
- Type: ${resource.resourceType}
- Current Config: ${JSON.stringify(resource.currentConfig)}
- Monthly Cost: $${(resource.monthlyCost || 0) / 1000}
- Utilization: ${JSON.stringify(resource.utilizationMetrics)}

RECOMMENDATION:
- Type: ${recommendation.type}
- Current: ${recommendation.currentConfig}
- Recommended: ${recommendation.recommendedConfig}
- Projected Savings: $${recommendation.projectedMonthlySavings / 1000}/month
- Risk Level: ${recommendation.riskLevel}%

Explain in 2-3 sentences why this optimization is recommended and what the business impact would be.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating explanation:", error);
      return "Unable to generate explanation at this time.";
    }
  }

  async assessRisk(recommendation: any, resource: AwsResource): Promise<{
    riskScore: number;
    riskFactors: string[];
    mitigationSteps: string[];
  }> {
    const prompt = `Assess the risk of implementing this AWS optimization:

RESOURCE: ${resource.resourceType} (${resource.resourceId})
OPTIMIZATION: ${recommendation.type}
FROM: ${recommendation.currentConfig}
TO: ${recommendation.recommendedConfig}

Provide a JSON response:
{
  "riskScore": 0-100,
  "riskFactors": ["factor1", "factor2"],
  "mitigationSteps": ["step1", "step2"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Error assessing risk:", error);
    }

    return {
      riskScore: 50,
      riskFactors: ["Unable to assess risk automatically"],
      mitigationSteps: ["Review change manually before implementing"]
    };
  }
}

export const geminiAI = new GeminiAIService();
