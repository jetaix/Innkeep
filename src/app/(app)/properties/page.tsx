import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { publishState } from "@/channels/content";
import { SubmitButton } from "@/components/ui/actions";
import { Field, Input } from "@/components/ui/form";
import { Badge, Card, PageHeader, SourceDot } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { getDb, listings, OTA_CHANNELS } from "@/db";
import { createProperty } from "@/features/properties/actions";
import { getProperties } from "@/features/reservations/queries";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.properties.title };
}

export default async function PropertiesPage() {
  const { m } = await getI18n();
  const t = m.properties;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <PropertyList />
      </Suspense>
    </>
  );
}

async function PropertyList() {
  await connection();
  const { m } = await getI18n();
  const t = m.properties;
  const properties = getProperties();
  const allListings = getDb().select().from(listings).all();

  return (
    <div className="max-w-3xl space-y-3">
      {properties.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/properties/${property.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-subtle"
                >
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{property.name}</h2>
                    <p className="truncate text-xs text-muted">
                      {t.list.summary(
                        property.address || t.list.noAddress,
                        property.maxGuests,
                        property.basePrice,
                        property.currency,
                      )}
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {OTA_CHANNELS.map((channel) => {
                      const listing = allListings.find(
                        (l) => l.propertyId === property.id && l.channel === channel,
                      );
                      const status = !listing?.icalUrl
                        ? ({ text: t.list.status.notConnected, tone: "neutral" } as const)
                        : listing.lastSyncError
                          ? ({ text: t.list.status.notSyncing, tone: "critical" } as const)
                          : publishState(property, listing) === "outdated"
                            ? ({ text: t.list.status.detailsChanged, tone: "warn" } as const)
                            : ({ text: t.list.status.connected, tone: "neutral" } as const);
                      return (
                        <li key={channel}>
                          <Badge tone={status.tone}>
                            <SourceDot
                              source={channel}
                              className={listing?.icalUrl ? undefined : "bg-line-strong"}
                            />
                            {t.list.badge(CHANNELS[channel].label, status.text)}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <form action={createProperty} className="flex flex-wrap items-end gap-2">
          <Field label={t.create.label} htmlFor="name" className="min-w-48 flex-1">
            <Input id="name" name="name" required placeholder={t.create.placeholder} />
          </Field>
          <SubmitButton variant="primary" pendingLabel={t.create.pending}>
            {t.create.submit}
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
