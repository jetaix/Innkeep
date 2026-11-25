import type { NavId } from "@/config/navigation";
import { useI18n } from "../i18n";
import { PageHeader } from "../ui/primitives";

/** Stands where a page of the menu will be, under its own title. */
export function Placeholder({ id }: { id: NavId }) {
  const { m } = useI18n();
  return <PageHeader title={m.common.nav[id]} />;
}
