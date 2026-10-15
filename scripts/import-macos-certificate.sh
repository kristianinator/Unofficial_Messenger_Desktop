#!/usr/bin/env bash

set -euo pipefail

: "${MACOS_CERTIFICATE:?MACOS_CERTIFICATE is required}"
: "${MACOS_CERTIFICATE_PASSWORD:?MACOS_CERTIFICATE_PASSWORD is required}"

certificate_path="$RUNNER_TEMP/macos-signing-certificate.p12"
keychain_path="$RUNNER_TEMP/macos-signing.keychain-db"
keychain_password="$(uuidgen)"

printf '%s' "$MACOS_CERTIFICATE" | base64 --decode > "$certificate_path"
security create-keychain -p "$keychain_password" "$keychain_path"
security set-keychain-settings -lut 21600 "$keychain_path"
security unlock-keychain -p "$keychain_password" "$keychain_path"
security import "$certificate_path" \
  -P "$MACOS_CERTIFICATE_PASSWORD" \
  -A \
  -t cert \
  -f pkcs12 \
  -k "$keychain_path"
security set-key-partition-list \
  -S apple-tool:,apple: \
  -s \
  -k "$keychain_password" \
  "$keychain_path"
security list-keychains -d user -s "$keychain_path"

rm -f "$certificate_path"
