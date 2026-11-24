import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient, router } from "./router";
import "./app.css";

// In development StyleX serves its CSS from a virtual file; a build writes it into the stylesheet.
if (import.meta.env.DEV) {
  const sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = "/virtual:stylex.css";
  document.head.append(sheet);
  void import("virtual:stylex:runtime");
}

const root = document.getElementById("app");
if (!root) throw new Error("The page has no #app element");
document.documentElement.dataset.renderer = __RENDERER__;

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
