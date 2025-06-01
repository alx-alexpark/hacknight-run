import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

// Global cache for the object detector
let cachedDetector: ObjectDetector | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedFileset: any | null = null;
let isLoading = false;
let loadingPromise: Promise<ObjectDetector> | null = null;

/**
 * Get a cached ObjectDetector instance, loading it only once
 * @returns Promise<ObjectDetector>
 */
export async function getObjectDetector(): Promise<ObjectDetector> {
    // If we already have a cached detector, return it
    if (cachedDetector) {
        console.log("🎯 Using cached ObjectDetector");
        return cachedDetector;
    }

    // If we're already loading, return the same promise
    if (isLoading && loadingPromise) {
        console.log("⏳ ObjectDetector already loading, waiting...");
        return loadingPromise;
    }

    // Start loading the detector
    isLoading = true;
    console.log("🤖 Loading ObjectDetector for the first time...");

    loadingPromise = (async () => {
        try {
            // Load MediaPipe vision tasks if not already loaded
            if (!cachedFileset) {
                console.log("📦 Loading MediaPipe vision tasks...");
                cachedFileset = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
                );
            }

            // Create the object detector
            console.log("🔧 Creating ObjectDetector instance...");
            cachedDetector = await ObjectDetector.createFromOptions(cachedFileset, {
                baseOptions: {
                    modelAssetPath: "/efficientdet_lite0.tflite",
                    delegate: "GPU",
                },
                scoreThreshold: 0.3,
            });

            console.log("✅ ObjectDetector loaded and cached successfully!");
            return cachedDetector;
        } catch (error) {
            console.error("❌ Failed to load ObjectDetector:", error);
            isLoading = false;
            loadingPromise = null;
            throw error;
        } finally {
            isLoading = false;
        }
    })();

    return loadingPromise;
}

/**
 * Clear the cached detector (useful for cleanup or forced reload)
 */
export function clearDetectorCache(): void {
    console.log("🗑️ Clearing ObjectDetector cache");
    cachedDetector = null;
    cachedFileset = null;
    isLoading = false;
    loadingPromise = null;
}

/**
 * Check if detector is already cached
 */
export function isDetectorCached(): boolean {
    return cachedDetector !== null;
}