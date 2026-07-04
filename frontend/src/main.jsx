import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import OpenFile from "./OpenFile.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <OpenFile />
  </StrictMode>,
);
