import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { makeRouter, queryClient } from "./router";
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

const router = makeRouter();

/*
 * A public page arrives as static HTML, already readable. Leave it on screen
 * until this page's code and words are here, then take over in one step, so
 * nothing blinks. Any other page starts from an empty shell and draws at once.
 */
if (root.hasChildNodes()) {
  await router.load();
  // The head tags the static page came with: the app writes its own from here on.
  for (const tag of document.head.querySelectorAll("[data-static]")) tag.remove();
  root.replaceChildren();
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
