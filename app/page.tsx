
import CameraObjectDetection from "./CameraObjectDetection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div>
        <h1>Welcome to Hacknight Run!</h1>
        <p>This is your Next.js app.</p>
        <CameraObjectDetection />
      </div>
    </main>
  );
}
