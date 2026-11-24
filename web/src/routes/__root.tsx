import * as stylex from "@stylexjs/stylex";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { color, font } from "../tokens.stylex";

const styles = stylex.create({
  page: {
    minHeight: "100dvh",
    backgroundColor: color.bg,
    color: color.ink,
    fontFamily: font.sans,
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <div {...stylex.props(styles.page)}>
      <Outlet />
    </div>
  ),
});
