
import { GoogleGenAI, Type } from "@google/genai";
import { EVMMetrics, EVMResults, AnalysisResponse, ManagementConstraints } from "../types";

export const getPMAnalysis = async (
  metrics: EVMMetrics,
  results: EVMResults,
  constraints?: ManagementConstraints
): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const constraintContext = constraints ? `
    MANAGEMENT CONSTRAINTS:
    - Fixed Deadline: ${constraints.deadlineFixed ? 'YES' : 'NO'}
    - Max Budget Increase: ${constraints.maxBudgetIncreasePercent}% (Total allowed: $${(metrics.bac * (1 + constraints.maxBudgetIncreasePercent / 100)).toLocaleString()})
  ` : '';

  const prompt = `
    Act as a World-Class Senior Project Control Analyst expert in PMBOK® Guide 8th Edition.
    Analyze the following Earned Value Management (EVM) data for a project:

    INPUT METRICS:
    - Planned Value (PV): ${metrics.pv}
    - Earned Value (EV): ${metrics.ev}
    - Actual Cost (AC): ${metrics.ac}
    - Budget at Completion (BAC): ${metrics.bac}
    - Total Duration: ${metrics.totalDurationDays} days
    - Elapsed Time: ${metrics.elapsedDays} days

    CALCULATED RESULTS:
    - Schedule Performance Index (SPI): ${results.spi.toFixed(2)}
    - Cost Performance Index (CPI): ${results.cpi.toFixed(2)}
    - Estimate at Completion (EAC): ${results.eac.toFixed(2)}
    - Variance at Completion (VAC): ${results.vac.toFixed(2)}
    - TCPI: ${results.tcpi.toFixed(2)}
    - Forecasted Duration: ${results.estimatedCompletionDays.toFixed(1)} days

    ${constraintContext}

    Please provide a structured analysis in JSON format based on PMBOK 8th Edition Principles.
    Evaluate the FEASIBILITY of meeting the constraints given the current SPI/CPI trends.
    Include:
    1. Executive Summary: High-level status.
    2. Variance Analysis: Why these variances exist.
    3. Risk Identification: Specific risks created by corrective actions (e.g. quality risks from crashing).
    4. Recommendations: Specific corrective/preventive actions.
    5. PMBOK Reference: Citation of relevant processes.
    6. Feasibility Score: 0-100 (probability of meeting all constraints).
    7. Management Verdict: A one-sentence recommendation for the Steering Committee.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            varianceAnalysis: { type: Type.STRING },
            riskIdentification: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            pmbokReference: { type: Type.STRING },
            feasibilityScore: { type: Type.NUMBER },
            managementVerdict: { type: Type.STRING }
          },
          required: ["executiveSummary", "varianceAnalysis", "riskIdentification", "recommendations", "pmbokReference", "feasibilityScore", "managementVerdict"]
        },
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
