# Alternatives

The comparison of Innkeep with Hospitable, Guesty, Lodgify, Smoobu and other
channel managers now lives on the site itself, in English and French:

- **/alternatives**: the overview, the open-source options and where Innkeep
  fits.
- **/alternatives/<product>**: one page per product, for example
  `/alternatives/hospitable`.

Run Innkeep and open `http://localhost:3000/alternatives`.

To update a price or a claim, edit:

- [`src/i18n/messages/alternatives.ts`](../src/i18n/messages/alternatives.ts)
  for the wording, in both languages;
- [`src/features/marketing/alternatives.ts`](../src/features/marketing/alternatives.ts)
  for the product list, the sources and the date they were checked.

Every figure must come from the vendor's own pages. Say "not public" or
"unverified" rather than guess.
