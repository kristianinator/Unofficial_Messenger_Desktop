const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY = "kristianinator/Unofficial_Messenger_Desktop";

function parseVersion(value) {
  if (typeof value !== "string") return null;

  const match = value.trim().match(
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
  );

  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : []
  };
}

function comparePrereleaseIdentifiers(left, right) {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];

    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;
    if (leftIdentifier === rightIdentifier) continue;

    const leftIsNumber = /^\d+$/.test(leftIdentifier);
    const rightIsNumber = /^\d+$/.test(rightIdentifier);

    if (leftIsNumber && rightIsNumber) {
      return Number(leftIdentifier) > Number(rightIdentifier) ? 1 : -1;
    }

    if (leftIsNumber !== rightIsNumber) return leftIsNumber ? -1 : 1;

    return leftIdentifier > rightIdentifier ? 1 : -1;
  }

  return 0;
}

export function compareVersions(leftValue, rightValue) {
  const left = parseVersion(leftValue);
  const right = parseVersion(rightValue);

  if (!left || !right) return null;

  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;

  return comparePrereleaseIdentifiers(left.prerelease, right.prerelease);
}

export function isNewerVersion(candidateVersion, currentVersion) {
  return compareVersions(candidateVersion, currentVersion) === 1;
}

export function getReleasePageUrl(repository = DEFAULT_REPOSITORY) {
  return `https://github.com/${repository}/releases/latest`;
}

export async function fetchLatestRelease({
  fetchImpl = globalThis.fetch,
  repository = DEFAULT_REPOSITORY,
  signal
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required");
  }

  const response = await fetchImpl(
    `https://api.github.com/repos/${repository}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Unofficial-Messenger-Desktop",
        "X-GitHub-Api-Version": GITHUB_API_VERSION
      },
      signal
    }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`GitHub release check failed with HTTP ${response.status}`);
  }

  const release = await response.json();
  const version = parseVersion(release?.tag_name);

  if (!version || release.draft || release.prerelease) return null;

  return {
    name: typeof release.name === "string" ? release.name : release.tag_name,
    publishedAt:
      typeof release.published_at === "string" ? release.published_at : null,
    tag: release.tag_name,
    url: getReleasePageUrl(repository),
    version: `${version.major}.${version.minor}.${version.patch}`
  };
}

export async function findAvailableUpdate(currentVersion, options = {}) {
  const release = await fetchLatestRelease(options);

  if (!release || !isNewerVersion(release.version, currentVersion)) {
    return null;
  }

  return release;
}
