const TRUSTED_WEB_HOSTS = ["facebook.com", "messenger.com"];
const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isTrustedHost(hostname) {
  const normalizedHostname = hostname.toLowerCase();

  return TRUSTED_WEB_HOSTS.some(
    (trustedHost) =>
      normalizedHostname === trustedHost ||
      normalizedHostname.endsWith(`.${trustedHost}`)
  );
}

export function isTrustedNavigationUrl(value) {
  const url = parseUrl(value);
  return Boolean(
    url && url.protocol === "https:" && isTrustedHost(url.hostname)
  );
}

export function isSafeExternalUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && SAFE_EXTERNAL_PROTOCOLS.has(url.protocol));
}
