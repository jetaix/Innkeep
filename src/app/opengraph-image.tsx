import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0f0f11",
        color: "#ededf0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 600 }}>
        <svg width="56" height="56" viewBox="0 0 24 24">
          <path
            fill="#ededf0"
            fillRule="evenodd"
            d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm3 20v-9a4 4 0 0 1 8 0v9H8Zm5.6-6.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          />
        </svg>
        {site.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02, maxWidth: 900 }}>
          One calendar for every place you rent.
        </div>
        <div style={{ fontSize: 32, color: "#9b9ba4" }}>Free, open source, self-hosted.</div>
      </div>
    </div>,
    size,
  );
}
