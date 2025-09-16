import { AppConfig } from "@mlc-ai/web-llm";

export const appConfig: AppConfig = {
  model_list: [
    {
      model: "/models/gemma-2-2b-it-q4f16_1-MLC",
      model_id: "gemma-2-2b-it-q4f16_1-MLC",
      model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/gemma-2-2b-it/gemma-2-2b-it-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      vram_required_MB: 1895.3,
      low_resource_required: false,
      required_features: ["shader-f16"],
      overrides: { context_window_size: 2048 },
    },
  ],
  useIndexedDBCache: true,
};