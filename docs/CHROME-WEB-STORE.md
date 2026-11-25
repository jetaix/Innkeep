# Publishing the Innkeep extension on the Chrome Web Store (unlisted)

Unlisted means anyone with the link can install it and gets automatic
updates, but it does not appear in the store's search. It goes through the
same review as a public extension.

Everything to paste is below. Build the file to upload with:

```bash
bun run package:extension
```

It writes `dist/innkeep-extension-<version>.zip`.

## Before you start

1. **A public address for the privacy policy.** The store requires one, and
   it must open without signing in. [`docs/EXTENSION-PRIVACY.md`](EXTENSION-PRIVACY.md)
   works once this repository is public. While it is private, publish that
   file somewhere public first (a public GitHub Gist is enough).
2. **A Chrome Web Store developer account**, at
   <https://chrome.google.com/webstore/devconsole>. Google asks for a small
   one-time registration fee and for 2-step verification on the account. In
   the EU you also state whether you publish as a trader.
3. **The images**, all in [`docs/store/`](store/):
   - Store icon, 128 × 128: `extension/icons/icon-128.png`.
   - Screenshot, 1280 × 800: `screenshot-1.png`.
   - Small promotional image, 440 × 280: `promo-small.png`.
   - Extra-large promotional banner, 1400 × 560 (optional): `promo-marquee.png`.

   The screenshot and the two promotional images are drawn from
   `docs/store/images.html` by `node scripts/store-images.mjs` (needs Google
   Chrome).

## Steps

1. In the developer dashboard, click **New item** and upload the zip.
2. Fill in **Store listing**, **Privacy** and **Distribution** with the text
   below.
3. Under **Distribution → Visibility**, choose **Unlisted**.
4. Click **Submit for review**. Review of an extension that asks for access
   to websites usually takes from a few days to a few weeks.
5. Once approved, copy the item's store address and set it in Innkeep (see
   "After approval").

## Store listing

**Name** (from the manifest): Innkeep

**Summary** (from the manifest, 132 characters at most):

> Reads your own Airbnb and Booking.com host pages and sends what they show to your self-hosted Innkeep. Nothing goes anywhere else.

**Category:** Workflow & Planning

**Language:** English

**Description:**

```text
This extension is the browser side of Innkeep, a free, open-source dashboard for hosts with one or two places. You run Innkeep yourself, on your own computer or server. This extension is of no use without it.

Calendar links between platforms only carry dates. This extension reads the rest from pages of your own host accounts and sends it to your own Innkeep:

• Reservations: guest name, dates, confirmation code, status and payout
• Finished and cancelled stays, for revenue history
• Nightly prices from your calendars
• Your listing's details, and how guests see it
• Reviews of your listing, with your replies

HOW IT WORKS
• It reads a page when you open it, or during a run you start from its toolbar button. A run moves one visible tab through your own pages and shows a Stop button on each.
• It sends data to one address only: the Innkeep address you enter in its settings. Chrome asks your permission for that address.
• It has no server of its own. Its authors receive nothing: no data, no statistics.

WHAT IT DOES NOT DO
• It does not read passwords, cookies, payment details, guest phone numbers, messages, door codes or wifi details.
• It does not click, type or submit anything on Airbnb or Booking.com, and does not call their APIs.
• It does not read Airbnb or Booking.com in the background or on a schedule.

NOTIFICATIONS (OPTIONAL)
If you tick "Notify me" in its settings, the extension asks your own Innkeep every five minutes what happened to your reservations, and shows a notification for a new stay, a change of dates or a cancellation. It asks nothing of Airbnb or Booking.com for this.

SETUP
1. Install and start Innkeep: https://github.com/jetaix/Innkeep
2. Click the Innkeep icon, open Settings, and paste the address and token that Innkeep shows on its "Browser extension" page.
3. Sign in to Airbnb and Booking.com, then press "Refresh everything" in Innkeep.

Reservations and reviews contain your guests' personal data, and the platforms' terms restrict automated data collection. Using this extension on your account is your decision.

Innkeep is not affiliated with Airbnb or Booking.com. Source code: https://github.com/jetaix/Innkeep (MIT licence).
```

**Homepage URL:** `https://github.com/jetaix/Innkeep`

**Support URL:** `https://github.com/jetaix/Innkeep/issues`

## Privacy tab

**Single purpose:**

> Read the pages of the user's own Airbnb and Booking.com host accounts and send what they show (reservations, prices, listing details, reviews) to the user's own self-hosted Innkeep dashboard.

**Permission justifications:**

| Permission                                                 | Justification                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                  | Keeps the settings on the device: the address of the user's Innkeep, its access token, whether to send automatically, whether to notify, and the number of the last event notified.                                                                                                                                                                         |
| Host permission (optional, `http://*/*` and `https://*/*`) | Innkeep is self-hosted, so every user has a different address (often `http://localhost:3000`). The extension requests access at run time to the single address the user enters in its settings, and uses it only to send data to that Innkeep. It never requests any other site. A fixed list of hosts is impossible because the address is the user's own. |
| `notifications` (optional)                                 | Requested only when the user ticks "Notify me about new, changed and cancelled reservations" in the settings. Shows a notification when the user's own Innkeep reports a new stay, a change of dates or a cancellation.                                                                                                                                     |
| `alarms` (optional)                                        | Requested together with `notifications`. Wakes the extension every five minutes to ask the user's own Innkeep for those events. No other site is contacted.                                                                                                                                                                                                 |
| Content scripts on `airbnb.*` and `booking.com`            | Read the reservations, prices, listing details and reviews shown on the user's own host pages and public listing, and show the "Send to Innkeep" control. Nothing is modified or submitted on those pages.                                                                                                                                                  |

**Remote code:** No, I am not using remote code. (All code is in the package.)

**Data usage: what the extension collects**

Tick:

- **Personally identifiable information** (guest names on the user's reservations, reviewer names).
- **Financial and payment information** (payout amounts and prices of the user's own reservations; no card or bank details).
- **Website content** (text and photo addresses of the user's own listing pages).

Leave unticked: health, authentication information, personal communications,
location, web history, user activity.

Tick the three certifications: data is not sold or transferred to third
parties outside the approved use cases; not used for purposes unrelated to
the single purpose; not used for creditworthiness or lending.

**Privacy policy URL:** the public address of `docs/EXTENSION-PRIVACY.md`.

## Notes for the reviewer

Paste under **Test instructions**. Reviewers cannot see anything without an
Innkeep to send to, which is the most common reason for a rejection:

```text
This extension only works together with Innkeep, an open-source dashboard the user hosts themselves (https://github.com/jetaix/Innkeep). It has no account system and no server operated by us.

To test:
1. Install Node.js 22+, then: git clone https://github.com/jetaix/Innkeep && cd Innkeep && npm run app
   This starts Innkeep at http://localhost:3000 and creates an access token.
2. Open http://localhost:3000/extension. It shows the address and a "Copy token" button.
3. Click the extension icon > Settings, paste the address and token, click "Save and test". Chrome asks permission for http://localhost:3000. The page shows "Connected".
4. Reading data needs an Airbnb or Booking.com host account. On a host reservations page the extension shows a "Send to Innkeep" control and posts the visible rows to http://localhost:3000/api/ingest/reservations.

5. Optional: in Settings, tick "Notify me about new, changed and cancelled reservations". Chrome asks for the notifications permission and a first notification confirms it. From then on the extension asks http://localhost:3000/api/extension/events every five minutes.

The only network requests the extension makes go to the address saved in step 3 (see background.js, the only file that calls fetch). The optional host permission is requested for that single origin (see options.js).
```

## After approval

- Set the store link in Innkeep's settings file (`.env.local`, or the
  environment variables of your server), then restart Innkeep:

  ```bash
  EXTENSION_STORE_URL=https://chromewebstore.google.com/detail/<your item id>
  ```

  The "Browser extension" page and the "Add a property" guide then show an
  **Install from the Chrome Web Store** button in place of the "Load
  unpacked" steps. Hosts still open **Settings** in the extension to paste
  their Innkeep address and token.
- To publish an update: raise `version` in `extension/manifest.json`, run
  `bun run package:extension`, upload the new zip under **Package**, and
  submit. Installed copies update by themselves within a day or so.
- If the review asks for changes, answer in the dashboard; rejections name
  the policy concerned.

## What can still go wrong

- **Review may refuse the broad optional host permission.** The justification
  above is the honest reason. If it is refused, the fallback is to limit the
  extension to `http://localhost/*` and `http://127.0.0.1/*`, which covers an
  Innkeep on the user's own computer but not one on a server.
- **A platform can ask Google to remove the extension** (terms of service or
  trademark). Staying unlisted, describing rather than branding, and using no
  platform logo reduce that risk; nothing removes it.
