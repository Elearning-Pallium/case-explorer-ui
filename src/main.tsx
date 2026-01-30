import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { scormAPI } from "@/lib/scorm-api";

// Initialize SCORM before rendering (will gracefully degrade if no LMS detected)
scormAPI.initialize().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
