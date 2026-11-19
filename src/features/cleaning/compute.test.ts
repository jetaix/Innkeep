import { describe, expect, it } from "vitest";
import type { Cleaner, CleanerAssignment, CleaningRecord } from "@/db/schema";
import { buildSchedule, unassigned } from "./compute";

const place = (id: number, extra = {}) => ({
  id,
  name: `Place ${id}`,
  checkInTime: "16:00",
  checkOutTime: "10:00",
  cleaningEnabled: true,
  ...extra,
});

let nextId = 1;
const stay = (propertyId: number, checkIn: string, checkOut: string, extra = {}) => ({
  id: nextId++,
  propertyId,
  kind: "reservation" as const,
  status: "confirmed" as const,
  checkIn,
  checkOut,
  guestName: "Guest",
  guests: 2,
  source: "airbnb" as const,
  ...extra,
});

const cleaner = (id: number, name: string): Cleaner => ({ id, name, phone: "", createdAt: 0 });
const assign = (propertyId: number, cleanerId: number, priority = 0): CleanerAssignment => ({
  id: nextId++,
  propertyId,
  cleanerId,
  priority,
});
const record = (propertyId: number, date: string, extra: Partial<CleaningRecord> = {}): CleaningRecord => ({
  id: nextId++,
  propertyId,
  date,
  status: "pending",
  cleanerId: null,
  notes: "",
  manual: false,
  doneAt: null,
  ...extra,
});

const schedule = (input: Partial<Parameters<typeof buildSchedule>[0]>) =>
  buildSchedule({
    from: "2027-03-01",
    days: 30,
    properties: [place(1)],
    stays: [],
    records: [],
    cleaners: [],
    assignments: [],
    ...input,
  });

describe("buildSchedule", () => {
  it("plans a cleaning on every check-out day, with the time until the next arrival", () => {
    const result = schedule({
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(1, "2027-03-07", "2027-03-09")],
    });
    expect(result.map((entry) => entry.date)).toEqual(["2027-03-05", "2027-03-09"]);
    // Free from 10:00 on the 5th to 16:00 on the 7th: two days and six hours.
    expect(result[0]).toMatchObject({ kind: "checkout", from: "10:00", sameDay: false, hours: 54 });
    expect(result[0].next?.checkIn).toBe("2027-03-07");
    expect(result[1]).toMatchObject({ next: null, hours: null });
  });

  it("marks a same-day turnover and its few hours", () => {
    const [first] = schedule({
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(1, "2027-03-05", "2027-03-08")],
    });
    expect(first).toMatchObject({ sameDay: true, hours: 6 });
  });

  it("ignores cancelled stays, blocked dates, days outside the window and places switched off", () => {
    const result = schedule({
      properties: [place(1), place(2, { cleaningEnabled: false })],
      stays: [
        stay(1, "2027-03-02", "2027-03-05", { status: "cancelled" }),
        stay(1, "2027-03-10", "2027-03-12", { kind: "block" }),
        stay(1, "2027-02-20", "2027-02-27"),
        stay(1, "2027-04-20", "2027-04-27"),
        stay(2, "2027-03-02", "2027-03-05"),
      ],
    });
    expect(result).toEqual([]);
  });

  it("uses the property's usual cleaner, or the one picked for the day", () => {
    const result = schedule({
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(1, "2027-03-07", "2027-03-09")],
      cleaners: [cleaner(1, "Usual"), cleaner(2, "Other")],
      assignments: [assign(1, 1)],
      records: [record(1, "2027-03-09", { cleanerId: 2, status: "done", notes: "Deep clean" })],
    });
    expect(result[0]).toMatchObject({ reassigned: false, status: "pending" });
    expect(result[0].cleaner?.name).toBe("Usual");
    expect(result[1]).toMatchObject({ reassigned: true, status: "done", notes: "Deep clean" });
    expect(result[1].cleaner?.name).toBe("Other");
  });

  it("adds a cleaning the host planned by hand, unless a guest already leaves that day", () => {
    const result = schedule({
      stays: [stay(1, "2027-03-02", "2027-03-05")],
      records: [record(1, "2027-03-05", { manual: true }), record(1, "2027-03-20", { manual: true })],
    });
    expect(result.map((entry) => [entry.date, entry.kind])).toEqual([
      ["2027-03-05", "checkout"],
      ["2027-03-20", "manual"],
    ]);
  });

  it("flags one cleaner booked for two places on the same day and names a free backup", () => {
    const result = schedule({
      properties: [place(1), place(2)],
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(2, "2027-03-03", "2027-03-05")],
      cleaners: [cleaner(1, "Usual"), cleaner(2, "Backup")],
      assignments: [assign(1, 1), assign(2, 1), assign(2, 2, 1)],
    });
    expect(result.map((entry) => entry.clash)).toEqual([true, true]);
    expect(result[0].backup).toBeNull();
    expect(result[1].backup?.name).toBe("Backup");
  });

  it("does not flag a clash once one of the two is done", () => {
    const result = schedule({
      properties: [place(1), place(2)],
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(2, "2027-03-03", "2027-03-05")],
      cleaners: [cleaner(1, "Usual")],
      assignments: [assign(1, 1), assign(2, 1)],
      records: [record(1, "2027-03-05", { status: "done" })],
    });
    expect(result.some((entry) => entry.clash)).toBe(false);
  });
});

describe("unassigned", () => {
  it("lists pending cleanings nobody is assigned to", () => {
    const result = schedule({
      stays: [stay(1, "2027-03-02", "2027-03-05"), stay(1, "2027-03-07", "2027-03-09")],
      records: [record(1, "2027-03-05", { status: "skipped" })],
    });
    expect(unassigned(result).map((entry) => entry.date)).toEqual(["2027-03-09"]);
  });
});
