// src/utils/mlcEngine.ts
import * as webllm from "@mlc-ai/web-llm";
import { appConfig } from "./config";

let enginePromise: Promise<webllm.MLCEngine> | null = null;

export async function initMLCEngine(): Promise<webllm.MLCEngine> {
  if (enginePromise) {
    return enginePromise;
  }

  const modelID = "gemma-2-2b-it-q4f16_1-MLC";
  
  console.log("Initializing MLC Engine with model:", modelID);
  
  enginePromise = webllm.CreateMLCEngine(modelID, {
    initProgressCallback: (report) => {
      console.log(`Loading: ${report.text} - ${report.progress ? Math.round(report.progress * 100) : 0}%`);
    },
    appConfig,
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