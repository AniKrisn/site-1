import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import About from "./About.tsx";
import Specificity from "./Specificity.tsx";
import Primitives from "./Primitives.tsx";
import Descriptions from "./Descriptions.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="/primitives" element={<Primitives />} />
        <Route path="/specificity" element={<Specificity />} />
        <Route path="/descriptions" element={<Descriptions />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
