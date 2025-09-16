// src/utils/mlcEngine.ts
import * as webllm from "@mlc-ai/web-llm";
import { appConfig } from "./config";

let enginePromise: Promise<webllm.MLCEngine> | null = null;

export async function initMLCEngine(): Promise<webllm.MLCEngine> {
  if (enginePromise) {
    return enginePromise;
  }

  const modelID = "gemma-2-2b-it-q4f16_1-MLC";
  enginePromise = webllm.CreateServiceWorkerMLCEngine(modelID, {
    initProgressCallback: (report) => console.log(report.text),
    appConfig,
  }) as Promise<any>;

  try {
    const engine = await enginePromise;
    console.log("Model loaded successfully!");
    return engine;
  } catch (error) {
    console.error("Error loading model:", error);
    throw error;
  }
}