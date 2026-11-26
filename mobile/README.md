# Innkeep for iPhone and Android

What a host checks away from the desk: today's figures, the stays, and the
cleanings to tick off. It connects to the host's own Innkeep by its address
and password, and keeps the session in the phone's keychain.

Built with [Exact](https://github.com/expo/exact), Expo's framework that
draws each platform's own controls from one source. Exact is pre-1.0 and has
no packaged release: the app builds against a checkout of it, pinned to one
commit (`EXACT_REF` in [eas.json](eas.json)).

| File                                       | What it is                                      |
| ------------------------------------------ | ----------------------------------------------- |
| [app.contract](app.contract)               | The screens, in Exact's Contract language       |
| [assets/welcome.wgsl](assets/welcome.wgsl) | The welcome screen's light, a GPU shader        |
| [app.ts](app.ts)                           | Every request to the Innkeep API (`web/server`) |
| [strings/](strings)                        | Every word, in English and French               |
| [app.test.contract](app.test.contract)     | The tests, run against canned answers           |
| [app.json](app.json)                       | The app's name, identifier, icon and platforms  |

## Work on it

Once: install [Rust](https://rustup.rs) and Bun 1.4.2, clone Exact next to
this repository, and let it set itself up.

```bash
git clone https://github.com/expo/exact.git ../../exact
```

```bash
bun ../../exact/scripts/exact.mjs setup
```

Then, from this folder:

```bash
bun install
```

```bash
bun exact.mjs web
```

That serves the app in a browser and reloads on save. To see it against real
data, run the API (`bun run dev:api` in `web/`) and connect to
`http://127.0.0.1:3001`.

Before you finish:

```bash
bun exact.mjs verify web
```

It compiles, runs the tests, and checks each screen in light and dark, at
two widths and at the largest text size. The last lines about a relaunch
failing to fetch are expected: the tests' Innkeep, `inn.test`, does not exist.

On a phone: `bun exact.mjs android --run` needs the Android SDK platform
37.2 and NDK 27.1; `bun exact.mjs ios --run` needs Xcode 27.1 or later.
`bun ../../exact/scripts/exact.mjs setup --check --platform android` (or
`ios`) names what is missing.

## Builds, on Expo

[.eas/workflows/mobile.yml](.eas/workflows/mobile.yml) runs on every pull
request and push to `main` that touches this folder: it compiles and tests,
then builds an Android APK and an unsigned iPhone archive. It needs no Apple
or Google account. Link the repository to the Expo project (expo.dev, Project
settings, GitHub) with `mobile` as the base directory, and set
`EAS_PROJECT_ID` in [app.config.js](app.config.js).

To try the iPhone app without an Apple account, build it for the Simulator:

```bash
bunx eas build --profile development --platform ios
```

Unpack the archive it produces and drag `Innkeep.app` onto a running
simulator. It runs on Xcode 26's simulators too.

[.eas/workflows/release.yml](.eas/workflows/release.yml) builds the signed
apps for the stores, when asked:

```bash
bunx eas workflow:run release.yml
```

It reads these from the project's production environment on expo.dev:

| Name                                                               | Kind        | What                                                   |
| ------------------------------------------------------------------ | ----------- | ------------------------------------------------------ |
| `CI_IOS_P12`                                                       | secret file | Apple distribution certificate with its key            |
| `CI_IOS_P12_PASSWORD`                                              | secret      | That file's password                                   |
| `EXACT_PROFILE`                                                    | secret file | App Store provisioning profile for `club.innkeep.main` |
| `EXACT_KEYSTORE`                                                   | secret file | Android upload keystore                                |
| `EXACT_KEYSTORE_PASSWORD`, `EXACT_KEY_ALIAS`, `EXACT_KEY_PASSWORD` | secrets     | That keystore's                                        |

To move to a newer Exact, change `EXACT_REF` in `eas.json`, pull the same
commit locally, then run `bun exact.mjs update` and the checks above.

## The App Store

[docs/APP-STORE.md](docs/APP-STORE.md) walks through a submission. The listing
is [store.config.json](store.config.json), in English and French; the privacy
policy is [docs/PRIVACY.md](docs/PRIVACY.md).

## What it does not do yet

No push notifications, no adding or editing stays, no revenue or pricing
screens. A release build has been configured from Exact's guide but not yet
run; the first one will tell.
