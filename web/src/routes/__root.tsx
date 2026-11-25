import * as stylex from "@stylexjs/stylex";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { useTheme } from "../theme";
import { dark, darkShadow, light, lightShadow } from "../themes";
import { color, font, text } from "../tokens.stylex";

const styles = stylex.create({
  page: {
    // Read by the focus ring and the selection colour in `app.css`.
    "--focus": color.focus,
    minHeight: "100dvh",
    backgroundColor: color.bg,
    color: color.ink,
    // The parts of the page the browser draws follow the palette too.
    accentColor: color.overlap,
    caretColor: color.overlap,
    scrollbarColor: `${color.lineStrong} transparent`,
    fontFamily: font.sans,
    fontSize: text.md,
    lineHeight: 1.5,
  },
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: Page });

/** The ground every page stands on, in the host's choice of light or dark. */
function Page() {
  const theme = useTheme();
  return (
    <div
      {...stylex.props(
        theme === "light" && [light, lightShadow],
        theme === "dark" && [dark, darkShadow],
        styles.page,
      )}
    >
      {/*
       * The title and the other head tags of the page on screen, kept current as it changes.
       * In the browser only: the static pages get the same tags written into their head.
       */}
      {typeof document !== "undefined" && <HeadContent />}
      <Outlet />
    </div>
  );
}
