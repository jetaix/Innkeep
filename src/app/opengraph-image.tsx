import { ImageResponse } from "next/og";
import { brand, site } from "@/config/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A slab of glass: an arch in one of the brand colours. */
function Arch({
  color,
  left,
  top,
  width,
  height,
  rotate,
  opacity = 0.86,
}: {
  color: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        opacity,
        transform: `rotate(${rotate}deg)`,
        borderRadius: `${width / 2}px ${width / 2}px 36px 36px`,
        backgroundImage: `linear-gradient(170deg, ${color}99 0%, ${color} 75%)`,
        boxShadow: `0 60px 90px -40px ${color}`,
      }}
    />
  );
}

/** The link preview: the mark, the name and the promise, between slabs of glass. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 76,
        background: brand.ground,
        color: brand.ink,
      }}
    >
      <Arch color={brand.green} left={690} top={250} width={250} height={520} rotate={-10} />
      <Arch color={brand.coral} left={850} top={110} width={270} height={620} rotate={8} />
      <Arch color={brand.blue} left={1010} top={-90} width={270} height={520} rotate={18} />

      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 600 }}>
        <div style={{ display: "flex", position: "relative", width: 62, height: 58 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 36,
              height: 58,
              borderRadius: "18px 18px 6px 6px",
              background: brand.coral,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 26,
              top: 0,
              width: 36,
              height: 58,
              borderRadius: "18px 18px 6px 6px",
              background: brand.blue,
              opacity: 0.88,
            }}
          />
        </div>
        {site.name}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ fontSize: 84, fontWeight: 500, letterSpacing: -3.5, lineHeight: 1.02, maxWidth: 620 }}>
          One calendar for every place you rent.
        </div>
        <div style={{ fontSize: 31, color: brand.muted, maxWidth: 560, lineHeight: 1.3 }}>
          Airbnb and Booking.com in step. Hosted in early access, or free and self-hosted.
        </div>
      </div>
    </div>,
    size,
  );
}
