# Innkeep Companion

A small browser extension that fills in what calendar links leave out. It
shows a "Send to Innkeep" button on three pages of your own host accounts:

| Page                                                         | What it sends                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Airbnb → Reservations                                        | Guest name, party size, dates, confirmation code, listing name, payout, status, date booked                                                                                                |
| Booking.com extranet → Reservations                          | Guest name, party size, dates, reservation number, status, date booked, price, commission and fees, payout after them                                                                      |
| Airbnb → listing editor                                      | Title, description, address, capacity, bedrooms and bathrooms, arrival and departure times, house rules, and the cards for prices, discounts, minimum stay, amenities, safety and policies |
| Airbnb → listing calendar                                    | The nightly price of each free night you scroll past, and the holiday label on it                                                                                                          |
| Booking.com extranet → Calendar                              | Each rate plan's nightly rate for the dates on screen                                                                                                                                      |
| Your public Airbnb listing, opened from Innkeep with dates   | The total a guest is shown for that stay, and the price before any discount                                                                                                                |
| Your public Booking.com page, opened from Innkeep with dates | The cheapest offer's total for that stay, and the price before any discount                                                                                                                |
| Either public page, opened from Innkeep                      | The listing as guests see it: title, photos, rating and review count, description, highlights and the amenities shown up front. Not host details                                           |

Innkeep adds reservation details to stays it already imported from the
calendar link. It never creates an upcoming booking from the extension.
After updating Innkeep, reload the extension at `chrome://extensions`: Innkeep
tells you when the copy you loaded is older than it needs.
Finished stays are the exception: calendar links drop them, so the extension
adds them as history, which is what gives the Revenue page its past months.

## Read this first

Airbnb's Terms of Service restrict collecting data from the platform by
automated means, and Booking.com's extranet terms may do the same. This extension is built to stay as close to "you, reading
your own page" as software can:

- It reads a page when **you open it** (directly, or with a button in
  Innkeep), or during a **run you start** from its toolbar popup. By default it
  sends what it reads without a click; untick "Send automatically" in its
  settings to require one outside a run.
- A run takes **one visible tab** through your own pages, one every few
  seconds, shows a banner with a **Stop** button on each, and ends on Innkeep.
  Nothing runs in the background or on a schedule.
- It calls **none of the platforms' APIs**, takes no cookies or session
  tokens, and never clicks, types or fills a form. Outside a run, the one
  thing it does to a tab is close it, and only a tab that Innkeep opened.
- It reads what the table above lists. It does **not** read phone numbers,
  messages, or the listing editor's cards for directions, door codes, wifi,
  check-in method, host and co-hosts.
- It sends data to **one address**: the Innkeep URL you enter in its settings.

Even so, whether this is acceptable under each platform's terms is their call,
not ours. You use it on your own host account at your own risk. If that risk is
not acceptable to you, do not install it; Innkeep works without it.

It also depends on the layout of Airbnb's page. When Airbnb changes that page,
the extension will report rows as unreadable until it is updated. It refuses
to guess: a row it cannot read with certainty is skipped.

## Setup

Innkeep walks you through this at **/extension** (the button in the corner of
every page until the extension is connected), with the folder path, address
and token ready to copy. The same steps:

1. On the Innkeep server, set `EXTENSION_TOKEN` to a long random string and
   restart. Settings → Browser extension should show **On**.
2. In Chrome (or Edge, Brave, Arc), open `chrome://extensions`, turn on
   **Developer mode**, click **Load unpacked** and choose this `extension/`
   folder.
3. Click the extension's icon, enter your Innkeep address and the token, then
   **Save and test**. Chrome asks permission to reach that one address.
4. Make sure the property's Airbnb calendar link is connected in Innkeep and
   has synced.
5. Open Airbnb → Reservations, or the Booking.com extranet → Reservations,
   and click **Send to Innkeep**. On Airbnb, the **All** tab also lists
   finished stays. On Booking.com, widen the date filter first: only the rows
   on screen are sent.

### One click from Innkeep

Once connected, the Reservations page in Innkeep shows **Update reservations
from Airbnb / Booking.com**. Each button opens your reservations page in a new
tab; the extension sends what it shows and closes the tab, and Innkeep
refreshes when you are back on it. The Airbnb button opens the **All** tab.
The Booking.com button asks for arrivals from a year ago to 18 months ahead,
first page only.

Starting from nothing? Open your listing in Airbnb's listing editor first: it
creates the property from the real listing. Then paste the calendar links in
Innkeep.

### The toolbar popup

Click the Innkeep Companion icon. It has two buttons, which Innkeep also
offers on its Data page and when you open it with data more than a day old:

- **Update reservations** opens your Airbnb and Booking.com reservations
  pages in one tab, one after the other, reads them and ends on Innkeep's
  Reservations page. Under a minute.
- **Read everything** also goes through your calendars, each section of
  Airbnb's listing editor, the Booking.com extranet's property pages (photos,
  facilities, policies and the like, found from the extranet's own menu), your
  public listings and their reviews. A few minutes; keep the tab open.

Sign in to both platforms first: a page that asks you to sign in gives
nothing and is passed. The popup says afterwards how many pages gave data and
which did not. Pages that need scrolling or paging (the Airbnb calendar,
Booking.com reviews) are read as far as they show on arrival; open them
yourself to cover the rest.

A run is the part of this extension most likely to be noticed by a platform:
it loads a few dozen of your own pages in a row. It goes at a human pace and
only when you ask, but that judgement is theirs. Use the single buttons in
Innkeep instead if you prefer to stay closer to ordinary browsing.

Extranet pages are kept only when they describe the property. Pages about
money, invoices, bank details, the account, its users, guests or messages are
never read, whatever they are called.

### Nightly prices

The **Pricing** page in Innkeep has a button for each calendar. On Airbnb,
scroll through the months you want: the calendar only keeps a few in the page,
and the extension remembers the prices as they pass. On Booking.com, move the
calendar forward; each screen holds about a month. These tabs are never closed
for you. Nights already booked show no price on Airbnb and are skipped.

### What a guest pays

The Pricing page lists a few sample stays with a **Check Airbnb** and a
**Check Booking.com** button. Each opens your public listing for those dates;
the extension reads the total and closes the tab. Booking.com needs your
public page address in the property's listing page URL field. It only does this on a tab Innkeep
opened, and Innkeep refuses a price for a listing that is not yours. Innkeep
never loads these pages by itself: one click, one page.

### Reviews

The **Reviews** page in Innkeep has a button per platform. It opens your
public listing on its reviews: each review's publicly shown name, rating,
date, text and your reply are read. Airbnb's reviews window loads more as you
scroll; Booking.com shows ten per page. The extension remembers reviews as
they appear and closes the tab once it has seen as many as the page says
there are. Reviewer names stay in your Innkeep and are not part of what is
sent to Claude.

### Listing details

The editor spreads its cards over two tabs, **Your space** and **Arrival
guide**; open each once and Innkeep keeps both. For a property Innkeep
already has, the extension only fills in what you have not set (an empty
field, or one still at its starting value) and never overwrites your edits.
Prices, discounts, minimum stay, amenities and policies are kept as the editor
words them, in your language, under **Set on Airbnb** on the property page.
The same page has a **Read again** link that opens the editor for you.

The result tells you how many stays were updated and how many are "not in your
Innkeep calendar yet": those are rows the calendar link has not delivered
(sync first) or that Airbnb no longer lists as booked.

## How matching works

The calendar link decides which current and upcoming stays exist and on which
dates; the extension only adds details to them. A row is matched by its
confirmation code (present in Airbnb's calendar link), or failing that by
identical check-in and check-out dates, using the listing name or the
Booking.com property id to tell two properties apart. A name you typed
yourself is kept.

A finished stay with no match is added as history, on the property its
listing name or Booking.com property id points to. If that is in doubt (for
example a listing you no longer have), it is reported and left out.

Cancelled rows are kept as cancelled stays: they block no dates and count for
no revenue, but the record is there. A Booking.com payout is the
price minus the "commission and fees" column, so if you send Booking.com
payouts, do not also keep a Booking.com commission charge on the Revenue page:
it would be counted twice.

## Not supported yet

- Guest messages on either platform.
- The payout breakdown on a reservation's own page (cleaning fee, taxes).
- Photos, and the parts of a listing the editor only shows after a click: the
  full amenities list, every house rule, per-night prices.
- Booking.com listing details.
- All-numeric dates. Airbnb writes the month as a word in the languages
  tested (French on the live page; English, German and Spanish in unit tests).
- Firefox and Safari.

## Files

| File                         | Role                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `manifest.json`              | Permissions: storage, plus the one Innkeep address you approve |
| `parse.js`                   | Pure text parsing, unit tested in `parse.test.ts`              |
| `airbnb.js`, `booking.js`    | Say which page elements to read                                |
| `ui.js`                      | The "Send to Innkeep" control and automatic sending            |
| `background.js`              | The only code that uses the network, and only to reach Innkeep |
| `options.html`, `options.js` | Connection settings                                            |
