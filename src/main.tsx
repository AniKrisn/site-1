import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import About from "./About.tsx";
import Specificity from "./posts/Specificity.tsx";
import Primitives from "./posts/Primitives.tsx";
import Descriptions from "./posts/Descriptions.tsx";
import Artefacts from "./posts/Artefacts.tsx";
import Love from "./posts/Love.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="/primitives" element={<Primitives />} />
        <Route path="/specificity" element={<Specificity />} />
        <Route path="/descriptions" element={<Descriptions />} />
        <Route path="/artefacts" element={<Artefacts />} />
        <Route path="/love" element={<Love />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
