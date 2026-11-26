#!/bin/sh
# Puts Exact on a build worker: the commit eas.json names (EXACT_REF), its
# packages, the pinned Rust with one platform's target, and the Hermes bundle
# that bakes app.ts. From Exact's guide, docs/reference.md "Native CI
# preparation". Run as `sh .ci/prepare-native.sh ios|ios-simulator|android|web`.
set -eu
export EXACT="$PWD/../exact"
git clone https://github.com/expo/exact.git "$EXACT"
git -C "$EXACT" checkout --detach "$EXACT_REF"
bun install --frozen-lockfile --cwd "$EXACT"
# The app's packages are named through .exact/checkout: the launcher makes that link to this clone.
bun exact.mjs --help >/dev/null
if ! command -v rustup >/dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/exact-rustup.sh
  sh /tmp/exact-rustup.sh -y --profile minimal --default-toolchain none --no-modify-path
fi
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
pin=$(bun -e 'console.log(Bun.TOML.parse(await Bun.file(process.env.EXACT + "/rust-toolchain.toml").text()).toolchain.channel)')
case "$1" in
  ios) triple=aarch64-apple-ios ;;
  ios-simulator) triple=aarch64-apple-ios-sim ;;
  android) triple=aarch64-linux-android ;;
  # The checks run the app in a browser: Exact's own setup installs what that takes.
  web)
    rustup toolchain install "$pin" --profile minimal
    bun "$EXACT/scripts/exact.mjs" setup
    set-env EXACT "$EXACT"
    set-env PATH "$PATH"
    exit 0
    ;;
  *) exit 2 ;;
esac
rustup toolchain install "$pin" --profile minimal --target "$triple"
cargo +"$pin" run --locked --manifest-path "$EXACT/vendor/ibex/crates/hermes-lean-sys-installer/Cargo.toml" -- --target "$triple"
cargo +"$pin" fetch --locked --manifest-path "$EXACT/Cargo.toml"
set-env EXACT "$EXACT"
set-env PATH "$PATH"
