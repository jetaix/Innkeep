import { getI18n } from "@/i18n/server";

/** Placeholder while a section reads its data. Server components only. */
export async function Loading() {
  const { m } = await getI18n();
  return (
    <p role="status" className="py-10 text-[13px] text-muted">
      {m.common.loading}
    </p>
  );
}
