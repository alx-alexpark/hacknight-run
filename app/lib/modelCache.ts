// Global model cache to prevent re-downloading the 7MB AI model on every render
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

interface ModelCache {
  detector: ObjectDetector | null;
  vision: any | null;
  isLoading: boolean;
  error: string | null;
}

// Global cache instance
const modelCache: ModelCache = {
  detector: null,
  vision: null,
  isLoading: false,
  error: null,
};

// Promise to track ongoing initialization
let initializationPromise: Promise<ObjectDetector> | null = null;

export async function getObjectDetector(): Promise<ObjectDetector> {
  // If we already have a detector, return it immediately
  if (modelCache.detector) {
    console.log("✅ Using cached AI model - no download needed");
    return modelCache.detector;
  }

  // If there's an ongoing initialization, wait for it
  if (initializationPromise) {
    console.log("⏳ Waiting for ongoing model initialization...");
    return initializationPromise;
  }

  // If there was a previous error, throw it
  if (modelCache.error) {
    throw new Error(modelCache.error);
  }

  // Start initialization
  console.log("🔄 Initializing AI model (downloading 7MB model - this will only happen once)...");
  modelCache.isLoading = true;

  initializationPromise = (async () => {
    try {
      // Load MediaPipe vision tasks (this downloads the WASM files)
      if (!modelCache.vision) {
        console.log("📥 Downloading MediaPipe vision tasks...");
        modelCache.vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
      }

      // Create object detector (this downloads the 7MB model file)
      if (!modelCache.detector) {
        console.log("🤖 Creating object detector with cached model...");
        modelCache.detector = await ObjectDetector.createFromOptions(modelCache.vision, {
          baseOptions: {
            modelAssetPath: "/efficientdet_lite0.tflite", // Local path in public/
            delegate: "GPU",
          },
          scoreThreshold: 0.3,
        });
      }

      modelCache.isLoading = false;
      console.log("✅ AI model loaded and cached successfully!");
      
      return modelCache.detector;
    } catch (error) {
      modelCache.isLoading = false;
      modelCache.error = error instanceof Error ? error.message : "Failed to load AI model";
      initializationPromise = null; // Reset so we can retry
      
      console.error("❌ Failed to load AI model:", modelCache.error);
      throw new Error(modelCache.error);
    }
  })();

  return initializationPromise;
}

export function isModelLoading(): boolean {
  return modelCache.isLoading;
}

export function getModelError(): string | null {
  return modelCache.error;
}

export function clearModelCache(): void {
  console.log("🗑️ Clearing AI model cache");
  modelCache.detector = null;
  modelCache.vision = null;
  modelCache.isLoading = false;
  modelCache.error = null;
  initializationPromise = null;
}

// Optional: Preload the model when the module loads
export function preloadModel(): void {
  if (!modelCache.detector && !modelCache.isLoading) {
    console.log("🚀 Preloading AI model...");
    getObjectDetector().catch(() => {
      // Silently handle preload errors - they'll be handled when actually needed
    });
  }
}
