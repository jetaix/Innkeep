# Submitting Innkeep to the App Store

Everything Apple asks for, in the order you meet it. What is text is already
written: the listing is in [store.config.json](../store.config.json) (English
and French) and the privacy policy in [PRIVACY.md](PRIVACY.md). What only you
can supply is marked **You**.

## Before anything: three things that block a submission

1. **A demo Apple's reviewer can open.** The app is useless without an
   Innkeep to connect to, and a reviewer has none. Deploy an Innkeep that
   includes the app's API (`/api/app`, with `/api/app/session/native`) with
   `APP_PASSWORD` and `PUBLIC_DEMO=1` set: the app then opens its sample data
   when the password is left empty. On 25 November 2026 the public site
   (innkeep-seven.vercel.app) did not serve that API yet. Without a working
   demo, expect a rejection under guideline 2.1.
2. **Screenshots from the real iPhone app.** See [Screenshots](#screenshots).
3. **A signed build.** See [The build](#the-build).

## 1. Apple Developer and the app record (**You**)

- An Apple Developer Program membership.
- In Certificates, Identifiers & Profiles: an App ID for
  `io.github.jetaix.innkeep.mobile` (no capabilities needed), an Apple
  Distribution certificate, and an App Store provisioning profile for that
  App ID.
- In App Store Connect: a new app, platform iOS, primary language English
  (U.S.), that bundle ID, SKU `innkeep-ios`. Check the name "Innkeep" is free;
  if not, the title in `store.config.json` needs a suffix (30 characters at
  most), for example "Innkeep: Host Companion".

## 2. The listing

Push the text, categories, age rating and release settings:

```bash
bunx eas metadata:push
```

It reads `store.config.json`. What it sets:

| Field              | English                                    | French                       |
| ------------------ | ------------------------------------------ | ---------------------------- |
| Name               | Innkeep                                    | Innkeep                      |
| Subtitle           | Bookings and cleanings, to go              | Séjours et ménages, en poche |
| Categories         | Business, then Productivity                | same                         |
| Age rating         | 4+ (every answer "none")                   | same                         |
| Release            | Manual, after approval; phased for updates | same                         |
| Support URL        | github.com/jetaix/Innkeep/issues           | same                         |
| Privacy policy URL | mobile/docs/PRIVACY.md on GitHub           | same, French section         |

Keywords name no other company's product: Apple rejects trademarks there
(guideline 2.3.7). The description names Airbnb and Booking.com once, to say
what Innkeep works with, and states that it is not affiliated with them.

Price: free, all countries. No in-app purchases.

## 3. App privacy (**You**, in App Store Connect, App Privacy)

Answer **"No, we do not collect data from this app"**. The label then reads
"Data Not Collected". This is accurate as long as the app sends data only to
the host's own Innkeep and includes no analytics or crash reporting; change
the answer before adding either.

- Tracking: none. No App Tracking Transparency prompt.
- Privacy manifest: the app calls no "required reason" API of its own. Check
  the archive Exact produces contains a `PrivacyInfo.xcprivacy`
  (docs/reference.md, "Apple privacy manifests", in the Exact checkout).

## 4. Export compliance

The app uses only HTTPS and the system's keychain. The build sets
`ITSAppUsesNonExemptEncryption` to `false` (`EXACT_NON_EXEMPT_ENCRYPTION` in
`eas.json`), so App Store Connect does not ask at each upload.

## 5. Other declarations (**You**)

- Content rights: the app shows no third-party content. Answer "No".
- Advertising identifier: not used.
- Sign-in: the app has no account of its own, so Sign in with Apple does not
  apply (guideline 4.8) and there is no account to delete (5.1.1(v)).
- EU Digital Services Act: declare whether you are a trader. A free app with
  no revenue published by an individual is usually "not a trader"; that is
  your call.

## 6. Review information (**You**)

Contact name, phone and email are yours to type in App Store Connect; they
are not kept in this public repository. Sign-in required: **No** (the demo
needs no password). Paste these notes, with the demo's address filled in:

```text
Innkeep is the companion app to Innkeep, a free, open-source, self-hosted
channel manager for people who rent out one or two places
(https://github.com/jetaix/Innkeep). Each host runs their own Innkeep server;
the app connects to that server at the address the host types. There is no
account with us and no purchase.

To review the app with sample data:
1. Open the app. On the welcome screen, type this address:
   <DEMO ADDRESS, for example demo.innkeep.example>
2. Leave the password empty and tap Connect.
3. The Today, Stays and Cleaning tabs show sample bookings. The demo is
   read-only: ticking a cleaning shows "This is a demo: changes are not saved."
4. Settings > Disconnect returns to the welcome screen.

The animated background of the welcome screen is a GPU shader drawn by the
app; it loads no web content. The app collects no data and contains no
third-party SDK.
```

## Screenshots

Apple needs at least one set for the 6.9-inch iPhone (1320 × 2868 px,
portrait); every other iPhone size is scaled from it. The app is iPhone-only
(`host.ios.deviceFamily` in `app.json`), so no iPad set is needed. Up to ten
per language; five is plenty:

1. Welcome ("Your places, wherever you are.")
2. Today
3. Stays
4. A stay's detail
5. Cleaning

They must come from the iPhone app itself, not the browser preview. On a Mac
with Xcode 27.1 or later, connect the simulator to the demo and capture each
screen at the device's own scale:

```bash
EXACT_SIM="iPhone 17 Pro Max" bun exact.mjs agent ios --scale 3 "screenshot docs/store/en/1-welcome.png"
```

Repeat with the simulator's language set to French for the French set.
Upload them in App Store Connect under each language.

## The build

Add the three signing secrets to the project's production environment on
expo.dev ([README](../README.md#builds-on-expo)), then:

```bash
bunx eas workflow:run release.yml
```

When the iPhone archive is built, send it to App Store Connect:

```bash
bunx eas submit --platform ios --profile production --latest
```

`eas submit` asks once for your Apple ID, team and the app; to skip the
questions later, add `ascAppId` and `appleTeamId` under
`submit.production.ios` in `eas.json`. Then, in App Store Connect: wait for
processing, try the build in TestFlight on a real iPhone, select it for the
version, and submit for review.

## Check before you press Submit

- [ ] The demo address in the review notes opens in the build you are submitting
- [ ] The build was tried on a real iPhone: welcome screen, connect, all four tabs, disconnect
- [ ] VoiceOver reads the welcome screen and the tabs; the largest text size does not clip
- [ ] Screenshots uploaded for English and French
- [ ] App Privacy answered; privacy policy URL opens
- [ ] Version in `eas.json` (`EXACT_VERSION`) matches the version in App Store Connect

## Not covered here

Google Play has its own listing, data-safety form and content rating. The
texts in `store.config.json` can be reused there; Expo's metadata tool only
talks to Apple.
