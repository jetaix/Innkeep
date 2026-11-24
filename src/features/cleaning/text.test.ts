import { describe, expect, it } from "vitest";
import type { Property } from "@/db/schema";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import type { Cleaning } from "./compute";
import { cleaningMessages, cleaningRequest } from "./text";

const place = { name: "Bastia", checkInTime: "16:00", checkOutTime: "10:00" } as Property;
const entry = (extra: Partial<Cleaning> = {}): Cleaning => ({
  propertyId: 1,
  date: "2027-01-23",
  kind: "checkout",
  after: null,
  next: null,
  from: "10:00",
  sameDay: true,
  hours: 6,
  status: "pending",
  notes: "",
  cleaner: { id: 1, name: "Sandrine", phone: "", createdAt: 0 },
  reassigned: false,
  clash: false,
  backup: null,
  ...extra,
});

describe("cleaningRequest", () => {
  it("asks for a same-day cleaning between the two times, in French", () => {
    expect(cleaningRequest(entry(), place, MESSAGES.fr, createFormat("fr"))).toBe(
      [
        "Bonjour Sandrine,",
        "",
        "Pouvez-vous me confirmer qu’il vous est possible de faire le ménage le samedi 23 janvier, entre 10 h et 16 h, dans le logement ?",
        "",
        "Merci !",
      ].join("\n"),
    );
  });

  it("gives only the start when nobody arrives that day, and passes the note on", () => {
    const text = cleaningRequest(
      entry({ sameDay: false, from: "10:30", cleaner: null, notes: "Linge dans le placard" }),
      place,
      MESSAGES.fr,
      createFormat("fr"),
      true,
    );
    expect(text).toContain("Bonjour,\n");
    expect(text).toContain("à partir de 10 h 30, dans le logement Bastia");
    expect(text).toContain("Note : Linge dans le placard");
  });

  it("is written in English for an English interface", () => {
    expect(cleaningRequest(entry(), place, MESSAGES.en, createFormat("en"))).toContain(
      "Could you confirm that you can clean the place on Saturday 23 January, between 10:00 and 16:00?",
    );
  });
});

describe("cleaningMessages", () => {
  const places = new Map([[1, { ...place, id: 1, address: "" } as Property]]);
  const fr = { m: MESSAGES.fr, fmt: createFormat("fr") };

  it("sends a summary, then one request for each cleaning to arrange", () => {
    const { summary, requests } = cleaningMessages({
      needed: [entry(), entry({ date: "2027-01-31", sameDay: false })],
      cancelled: [],
      places,
      ...fr,
    });
    expect(summary).toContain("2 ménages à demander");
    expect(summary).toContain("un par ménage, prêts à transférer");
    expect(requests).toHaveLength(2);
    // The request is the cleaner's message and nothing else.
    expect(requests[0].startsWith("Bonjour Sandrine,")).toBe(true);
    expect(requests[1]).toContain("le dimanche 31 janvier, à partir de 10 h");
  });

  it("only names what fell away when nothing new is to arrange", () => {
    const { summary, requests } = cleaningMessages({
      needed: [],
      cancelled: [{ propertyId: 1, date: "2027-02-03" }],
      places,
      ...fr,
    });
    expect(summary).toContain("Ménage qui n’est plus nécessaire");
    expect(summary).not.toContain("transférer");
    expect(requests).toEqual([]);
  });
});
