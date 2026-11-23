# Innkeep Companion: privacy policy

_Last updated: 19 November 2026_

Innkeep Companion is a browser extension for hosts who use
[Innkeep](https://github.com/jetaix/Innkeep), a free, open-source dashboard
they run on their own computer or server. This page says what the extension
reads, where it sends it, and what it never does.

## In one sentence

The extension reads pages of **your own** Airbnb and Booking.com host accounts
in your browser and sends what they show to **your own** Innkeep, at the
address you typed in its settings. It sends nothing to the extension's
authors, and nothing to anyone else.

## What it reads

Only from pages you open, or that it opens during a run you start yourself:

- **Reservations:** guest name, number of guests, dates, confirmation code,
  status, date booked, payout; on Booking.com also the price and commission.
- **Nightly prices** shown in your calendars, and the total a guest is shown
  on your public listing for given dates.
- **Your listing:** title, description, address, check-in and check-out
  times, house rules, amenities, photos' addresses, rating.
- **Reviews** of your listing as shown on its public page: the reviewer's
  public name, rating, date, text, and your reply.
- **Property pages of your host admin** (for example photos, facilities,
  policies), kept as text.

## What it never reads

- Passwords, cookies, session tokens or payment card details.
- Guest phone numbers.
- Guest messages, unless you tick "Also keep my Airbnb conversations" in
  its settings. It is off by default. When on, the messages of an Airbnb
  conversation you open yourself, and of those your inbox lists during a
  run you start, are sent to your own Innkeep and nowhere else; nothing is ever written or sent on Airbnb.
- Door codes, directions, wifi details and check-in instructions.
- Pages about payouts to your bank, invoices, bank details, taxes or your
  account's users.
- Any website other than Airbnb and Booking.com.

## Where the data goes

- To **one address**: the Innkeep address you saved in the extension's
  settings, over the connection you chose. Chrome asks your permission for
  that address when you save it.
- The extension has no server of its own. Its authors receive **no data**:
  no reservations, no usage statistics, no error reports.
- It does not sell data, show advertising, or share data with third parties.

Your Innkeep stores what it receives in a database file on your own machine.
What happens to it there is under your control and outside this extension.

## What it keeps in your browser

Three settings, in Chrome's local extension storage on your device: your
Innkeep address, the access token of your Innkeep, and whether to send
automatically. Removing the extension deletes them.

## What it does to pages

It adds a small "Send to Innkeep" control on supported pages. It does not
change the content of Airbnb or Booking.com, does not click, type or submit
anything there, and does not call their APIs. During a run you start from its
popup, it moves one visible tab through a fixed list of your own pages and
shows a Stop button on each.

## Your choices

- Turn off automatic sending in the settings, so nothing is sent without a
  click.
- Stop a run at any time with its Stop button.
- Remove the extension at any time from `chrome://extensions`. Data already
  in your Innkeep stays there until you delete it in Innkeep.

## Other people's data

Reservations and reviews contain personal data of your guests. You are
responsible for holding it lawfully, as you already are when you read it on
the platforms. Airbnb's and Booking.com's terms restrict automated collection
of data; using this extension on your account is your decision.

## Changes and contact

Changes to this policy are published in this file, with the date above.
Questions: open an issue at <https://github.com/jetaix/Innkeep/issues>.

The extension's full source code is in the
[`extension/`](../extension/) folder of this repository.
