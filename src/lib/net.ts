/**
 * Whether an address can only be reached from this computer or its local
 * network. Airbnb and Booking.com fetch calendar links from their own
 * servers, so a link on such an address is one they can never open.
 */
export function isPrivateAddress(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return true;
  }
  if (host === "localhost" || host === "::1" || host.endsWith(".localhost") || host.endsWith(".local"))
    return true;
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  );
}
