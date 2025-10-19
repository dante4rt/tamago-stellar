import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add polyfills for browser compatibility
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window.globalThis;
  // @ts-ignore
  window.Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(<App />);
