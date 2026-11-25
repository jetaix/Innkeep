import { createFileRoute } from "@tanstack/react-router";
import { LandingFeatures } from "../../features/marketing/landing-features";
import { LandingHero } from "../../features/marketing/landing-hero";
import {
  LandingClose,
  LandingInstall,
  LandingLimits,
  LandingTrust,
  LandingWays,
} from "../../features/marketing/landing-more";
import { loadMessages, readMessages } from "../../i18n";
import { pageHead, site, siteUrl } from "../../site";

export const Route = createFileRoute("/_site/")({
  // The cleaning example on the page is written with the cleaning page's own words.
  loader: () => loadMessages("cleaning"),
  head: () => {
    const t = readMessages("marketing").marketing;
    return pageHead({
      title: `${site.name} · ${t.tagline}`,
      absolute: true,
      description: t.description,
      path: "/",
      structured: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: site.name,
        description: t.description,
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "macOS, Windows, Linux",
        license: `${site.repo}/blob/main/LICENSE`,
        codeRepository: site.repo,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      },
    });
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingTrust />
      <LandingLimits />
      <LandingWays />
      <LandingInstall />
      <LandingClose />
    </main>
  );
}
