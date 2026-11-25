# Sourced by the store build, never run on its own: imports the distribution
# certificate into a keychain that lives for this step, and names it for Exact.
# Needs CI_IOS_P12 and EXACT_PROFILE (secret files) and CI_IOS_P12_PASSWORD
# (secret text) in the project's production environment on expo.dev.
# From Exact's guide, docs/reference.md "Import an iOS signing identity on a CI
# worker". Leave shell tracing off around it.
set -eu
CI_SIGN_DIR=$(mktemp -d)
CI_KEYCHAIN="$CI_SIGN_DIR/build.keychain-db"
CI_KEYCHAIN_PASSWORD=$(openssl rand -hex 24)
trap 'security delete-keychain "$CI_KEYCHAIN"; rm -rf "$CI_SIGN_DIR"' EXIT
security create-keychain -p "$CI_KEYCHAIN_PASSWORD" "$CI_KEYCHAIN"
security set-keychain-settings -lut 21600 "$CI_KEYCHAIN"
security unlock-keychain -p "$CI_KEYCHAIN_PASSWORD" "$CI_KEYCHAIN"
security import "$CI_IOS_P12" -k "$CI_KEYCHAIN" -P "$CI_IOS_P12_PASSWORD" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -s -k "$CI_KEYCHAIN_PASSWORD" "$CI_KEYCHAIN"
security list-keychains -d user -s "$CI_KEYCHAIN"
EXACT_IDENTITY=$(security find-identity -v -p codesigning "$CI_KEYCHAIN" | awk '/[0-9A-F]{40}/ {print $2}')
test "$(printf '%s\n' "$EXACT_IDENTITY" | wc -l | tr -d ' ')" = 1
test -n "$EXACT_IDENTITY"
export EXACT_IDENTITY
