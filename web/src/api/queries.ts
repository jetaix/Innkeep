import { queryOptions } from "@tanstack/react-query";
import type { OverviewData, SessionData } from "../../server/app";
import { api } from "./client";

/** One definition per resource: the route loader and the component read the same one. */
export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => api<SessionData>("/session"),
});

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => api<OverviewData>("/overview"),
});
