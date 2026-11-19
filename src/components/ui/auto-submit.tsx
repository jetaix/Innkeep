"use client";

import type { ComponentProps } from "react";
import { Select } from "./form";

/** A select that saves as soon as a choice is made, for one-field settings. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <Select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}

/** Opens the browser's print dialog for the current page. */
export function PrintButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
