import { describe, expect, it } from "vitest";
import { reservationEvent, type Snapshot } from "./compute";

const stay = (over: Partial<Snapshot> = {}): Snapshot => ({
  kind: "reservation",
  status: "confirmed",
  checkIn: "2026-03-12",
  checkOut: "2026-03-15",
  ...over,
});
const TODAY = "2026-03-01";

describe("reservationEvent", () => {
  it("announces a stay that was not there before", () => {
    expect(reservationEvent("airbnb", null, stay(), TODAY)).toEqual({ kind: "new", detail: "" });
  });

  it("stays quiet about a stay that is already over", () => {
    expect(reservationEvent("airbnb", null, stay({ checkOut: "2026-02-20" }), TODAY)).toBeNull();
    expect(reservationEvent("airbnb", null, stay({ checkOut: TODAY }), TODAY)).toBeNull();
  });

  it("announces a cancellation once", () => {
    const cancelled = stay({ status: "cancelled" });
    expect(reservationEvent("airbnb", stay(), cancelled, TODAY)?.kind).toBe("cancelled");
    expect(reservationEvent("airbnb", cancelled, cancelled, TODAY)).toBeNull();
    expect(reservationEvent("airbnb", null, cancelled, TODAY)).toBeNull();
  });

  it("gives the old dates when a stay moves", () => {
    expect(reservationEvent("airbnb", stay(), stay({ checkOut: "2026-03-16" }), TODAY)).toEqual({
      kind: "changed",
      detail: "2026-03-12/2026-03-15",
    });
    expect(reservationEvent("airbnb", stay(), stay(), TODAY)).toBeNull();
  });

  it("announces a stay that is booked again after a cancellation", () => {
    expect(reservationEvent("airbnb", stay({ status: "cancelled" }), stay(), TODAY)?.kind).toBe("new");
  });

  it("ignores dates the host closed on Airbnb, but not closed dates on Booking.com", () => {
    const closed = stay({ kind: "block" });
    expect(reservationEvent("airbnb", null, closed, TODAY)).toBeNull();
    expect(reservationEvent("booking", null, closed, TODAY)?.kind).toBe("new");
  });

  it("never announces what the host entered themselves", () => {
    expect(reservationEvent("direct", null, stay(), TODAY)).toBeNull();
  });
});
