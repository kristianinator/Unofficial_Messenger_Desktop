#!/usr/bin/env bash

set -euo pipefail

expected_arch="${1:-}"
product_name="Unofficial Messenger Desktop"

if [[ "$expected_arch" != "arm64" && "$expected_arch" != "x64" ]]; then
  echo "Usage: $0 <arm64|x64>" >&2
  exit 2
fi

mach_arch="$expected_arch"
if [[ "$expected_arch" == "x64" ]]; then
  mach_arch="x86_64"
fi

temporary_directory="$(mktemp -d)"
mount_directory="$temporary_directory/dmg"
mounted_dmg=""
smoke_test_pid=""

cleanup() {
  if [[ -n "$smoke_test_pid" ]]; then
    kill "$smoke_test_pid" 2>/dev/null || true
    wait "$smoke_test_pid" 2>/dev/null || true
  fi
  if [[ -n "$mounted_dmg" ]]; then
    hdiutil detach "$mount_directory" -quiet || true
  fi
  rm -rf "$temporary_directory"
}
trap cleanup EXIT

find_single() {
  local description="$1"
  shift
  local matches=()

  while IFS= read -r match; do
    matches+=("$match")
  done < <(find "$@" -print)

  if [[ "${#matches[@]}" -ne 1 ]]; then
    echo "Expected one $description, found ${#matches[@]}" >&2
    printf '%s\n' "${matches[@]}" >&2
    exit 1
  fi

  printf '%s\n' "${matches[0]}"
}

verify_app() {
  local app_path="$1"
  local source_label="$2"
  local executable="$app_path/Contents/MacOS/$product_name"
  local architectures
  local signature_details

  echo "Verifying $source_label: $app_path"
  test -x "$executable"
  test -f "$app_path/Contents/Resources/app.asar"
  plutil -lint "$app_path/Contents/Info.plist"

  architectures="$(lipo -archs "$executable")"
  echo "Architectures: $architectures"
  if [[ " $architectures " != *" $mach_arch "* ]]; then
    echo "Expected $mach_arch executable, found: $architectures" >&2
    exit 1
  fi

  codesign --verify --deep --strict --verbose=2 "$app_path"
  signature_details="$(codesign --display --verbose=4 "$app_path" 2>&1)"
  printf '%s\n' "$signature_details"

  if ! grep -q '^Signature=adhoc$' <<< "$signature_details"; then
    echo "Expected an ad-hoc signature on $source_label" >&2
    exit 1
  fi

  if grep -Eq '^CodeDirectory .*flags=.*runtime' <<< "$signature_details"; then
    echo "Ad-hoc package unexpectedly enables Hardened Runtime on $source_label" >&2
    exit 1
  fi
}

smoke_test_app() {
  local app_path="$1"
  local executable="$app_path/Contents/MacOS/$product_name"
  local log_file="$temporary_directory/launch.log"

  echo "Launching packaged app for smoke test: $app_path"
  ELECTRON_DISABLE_SECURITY_WARNINGS=true "$executable" --disable-gpu >"$log_file" 2>&1 &
  smoke_test_pid=$!
  sleep 8

  if ! kill -0 "$smoke_test_pid" 2>/dev/null; then
    wait "$smoke_test_pid" 2>/dev/null || true
    smoke_test_pid=""
    cat "$log_file" >&2
    echo "macOS app exited during the launch smoke test" >&2
    exit 1
  fi

  kill "$smoke_test_pid" 2>/dev/null || true
  wait "$smoke_test_pid" 2>/dev/null || true
  smoke_test_pid=""
  echo "Launch smoke test passed."
}

packaged_app="out/$product_name-darwin-$expected_arch/$product_name.app"
if [[ ! -d "$packaged_app" ]]; then
  echo "Packaged app was not found at: $packaged_app" >&2
  exit 1
fi
verify_app "$packaged_app" "packaged app"
smoke_test_app "$packaged_app"

zip_file="$(find_single 'macOS ZIP' out/make -type f -name '*.zip')"
zip_directory="$temporary_directory/zip"
mkdir -p "$zip_directory"
ditto -x -k "$zip_file" "$zip_directory"
zip_app="$(find_single '.app bundle extracted from ZIP' "$zip_directory" -type d -name "$product_name.app")"
verify_app "$zip_app" "ZIP app"

dmg_file="$(find_single 'macOS DMG' out/make -type f -name '*.dmg')"
mkdir -p "$mount_directory"
hdiutil attach "$dmg_file" -nobrowse -readonly -mountpoint "$mount_directory" -quiet
mounted_dmg="$dmg_file"
dmg_app="$(find_single '.app bundle mounted from DMG' "$mount_directory" -type d -name "$product_name.app")"
verify_app "$dmg_app" "DMG app"

echo "macOS $expected_arch package validation passed."
