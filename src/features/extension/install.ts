import path from "node:path";
import manifest from "../../../extension/manifest.json";

/** How the extension reaches a browser from this Innkeep. */

/** On a server there is no folder on the host's computer to point at: the extension is downloaded. */
export const isHosted = () => Boolean(process.env.VERCEL);

/**
 * Where the extension is on the Chrome Web Store, once it has been published
 * there and `EXTENSION_STORE_URL` says so. Any other address is ignored.
 */
export function storeUrl(): string | null {
  const url = process.env.EXTENSION_STORE_URL?.trim();
  return url && /^https:\/\/chromewebstore\.google\.com\/detail\/[\w./-]+$/.test(url) ? url : null;
}

/**
 * What the setup guide shows that only the server knows: the version it
 * ships, where it is published, and, when Innkeep runs from its folder on
 * the host's computer, the folders to point a browser or Xcode at. `root` is
 * the folder Innkeep itself is in.
 */
export function installFacts(root: string) {
  const hosted = isHosted();
  return {
    version: manifest.version,
    hosted,
    store: storeUrl(),
    paths: hosted
      ? null
      : {
          root,
          extension: path.join(root, "extension"),
          safariBuild: path.join(root, "safari/build/Build/Products/Release"),
          safariProject: path.join(root, "safari/Innkeep"),
        },
  };
}
