import * as stylex from "@stylexjs/stylex";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
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
      <Outlet />
    </div>
  );
}
