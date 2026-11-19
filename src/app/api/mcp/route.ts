import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/features/mcp/server";
import { hasBearerToken } from "@/lib/auth";

/**
 * Model Context Protocol endpoint (Streamable HTTP, stateless).
 *
 *   POST /api/mcp
 *   Authorization: Bearer $MCP_TOKEN
 *
 * Disabled until MCP_TOKEN is set, because it exposes the calendar and revenue.
 */
async function handle(request: Request) {
  const token = process.env.MCP_TOKEN;
  if (!token) return Response.json({ error: "Set MCP_TOKEN to enable the MCP server" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await createMcpServer().connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
