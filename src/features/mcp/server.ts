import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb, reservations } from "@/db";
import { getSuggestions } from "@/features/insights/queries";
import { findConflicts, getProperties, getStays } from "@/features/reservations/queries";
import { addMonths, monthOf, monthStart, stayValue, summariseMonth } from "@/features/revenue/compute";
import { getCharges } from "@/features/revenue/queries";
import { addDays, rangesOverlap, today } from "@/lib/dates";

/**
 * Model Context Protocol server: lets an AI assistant (Claude, Cursor, …)
 * read the host's calendar, revenue and suggestions, and block dates.
 * A new instance is built per request; all state lives in the database.
 */

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});
const isoDate = z.iso.date();

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "innkeep", version: "0.2.0" });

  server.registerTool(
    "list_properties",
    {
      title: "List properties",
      description: "The host's rental properties with capacity and nightly rate.",
      annotations: { readOnlyHint: true },
    },
    async () =>
      json(
        getProperties().map((property) => ({
          id: property.id,
          name: property.name,
          address: property.address,
          sleeps: property.maxGuests,
          nightlyRate: property.basePrice,
          currency: property.currency,
          checkInFrom: property.checkInTime,
          checkOutBy: property.checkOutTime,
        })),
      ),
  );

  server.registerTool(
    "list_reservations",
    {
      title: "List reservations",
      description:
        "Confirmed stays and blocked dates that overlap a date range, across Airbnb, Booking.com and direct bookings. Check-out dates are exclusive. Amounts are in minor units (cents); 'estimated' means the payout was derived from the nightly rate.",
      inputSchema: {
        from: isoDate.optional().describe("First day, YYYY-MM-DD. Defaults to today."),
        to: isoDate
          .optional()
          .describe("Last day (exclusive), YYYY-MM-DD. Defaults to 90 days after `from`."),
        propertyId: z.number().int().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ from, to, propertyId }) => {
      const start = from ?? today();
      const properties = getProperties();
      const stays = getStays(start, to ?? addDays(start, 90));
      const conflicts = findConflicts(stays);
      return json(
        stays
          .filter((stay) => propertyId == null || stay.propertyId === propertyId)
          .map((stay) => {
            const value = stayValue(stay, properties);
            return {
              id: stay.id,
              property: properties.find((p) => p.id === stay.propertyId)?.name,
              source: stay.source,
              kind: stay.kind,
              guestName: stay.guestName || null,
              checkIn: stay.checkIn,
              checkOut: stay.checkOut,
              notes: stay.notes || null,
              payout:
                stay.kind === "reservation" ? { amount: value.total, estimated: value.estimated } : null,
              doubleBooked: conflicts.has(stay.id),
            };
          }),
      );
    },
  );

  server.registerTool(
    "get_revenue",
    {
      title: "Get revenue estimate",
      description:
        "Revenue, costs, net and occupancy per calendar month. Amounts are in minor units (cents) of the account currency.",
      inputSchema: {
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe("First month, YYYY-MM. Defaults to the current month."),
        months: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe("How many months to return. Defaults to 3."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ month, months }) => {
      const properties = getProperties();
      const first = month ?? monthOf(today());
      const stays = getStays(monthStart(first)).filter((stay) => stay.kind === "reservation");
      const charges = getCharges();
      return json({
        currency: properties[0]?.currency ?? "EUR",
        months: Array.from({ length: months ?? 3 }, (_, index) => {
          const summary = summariseMonth(addMonths(first, index), stays, charges, properties);
          return {
            month: summary.month,
            revenue: summary.gross,
            ofWhichEstimated: summary.estimated,
            costs: summary.charges,
            net: summary.net,
            bookedNights: summary.bookedNights,
            occupancy: Math.round(summary.occupancy * 100) / 100,
          };
        }),
      });
    },
  );

  server.registerTool(
    "list_suggestions",
    {
      title: "List suggestions",
      description:
        "Open issues and ideas Innkeep found: double bookings, calendars that stopped syncing, unanswered guests, pricing signals.",
      annotations: { readOnlyHint: true },
    },
    async () =>
      json(
        getSuggestions().active.map(({ severity, area, title, body }) => ({
          severity,
          area,
          title,
          detail: body,
        })),
      ),
  );

  server.registerTool(
    "block_dates",
    {
      title: "Block dates",
      description:
        "Blocks nights on a property so they cannot be booked. Airbnb and Booking.com close the dates the next time they read the export link (not instantly). Refuses if the dates overlap an existing stay.",
      inputSchema: {
        propertyId: z.number().int(),
        checkIn: isoDate.describe("First blocked night, YYYY-MM-DD."),
        checkOut: isoDate.describe("Day the block ends (exclusive), YYYY-MM-DD."),
        reason: z.string().max(200).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ propertyId, checkIn, checkOut, reason }) => {
      const fail = (text: string) => ({ isError: true, content: [{ type: "text" as const, text }] });
      if (checkOut <= checkIn) return fail("checkOut must be after checkIn.");
      if (!getProperties().some((property) => property.id === propertyId)) return fail("Unknown propertyId.");

      const clash = getStays(checkIn, checkOut).find(
        (stay) => stay.propertyId === propertyId && rangesOverlap(stay, { checkIn, checkOut }),
      );
      if (clash) {
        return fail(
          `Those dates overlap an existing ${clash.kind} from ${clash.checkIn} to ${clash.checkOut}.`,
        );
      }

      const row = getDb()
        .insert(reservations)
        .values({
          propertyId,
          source: "direct",
          kind: "block",
          checkIn,
          checkOut,
          notes: reason ?? "",
          createdAt: Date.now(),
        })
        .returning({ id: reservations.id })
        .get();
      return json({ id: row.id, propertyId, checkIn, checkOut, status: "blocked" });
    },
  );

  return server;
}
