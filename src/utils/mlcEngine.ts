// src/utils/mlcEngine.ts
import * as webllm from "@mlc-ai/web-llm";
import { appConfig } from "./config";

let enginePromise: Promise<webllm.MLCEngine> | null = null;

export async function initMLCEngine(): Promise<webllm.MLCEngine> {
  if (enginePromise) {
    return enginePromise;
  }

  // Use a simpler, well-supported model for better compatibility
  const modelID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
  
  console.log("Initializing MLC Engine with model:", modelID);
  
  enginePromise = webllm.CreateMLCEngine(modelID, {
    initProgressCallback: (report) => {
      console.log(`Loading model: ${report.text}`);
      if (report.progress) {
        console.log(`Progress: ${Math.round(report.progress * 100)}%`);
      }
    },
  });

  try {
    const engine = await enginePromise;
    console.log("MLC Engine loaded successfully!");
    return engine;
  } catch (error) {
    console.error("Error loading MLC Engine:", error);
    enginePromise = null; // Reset on error so we can retry
    throw error;
  }
}