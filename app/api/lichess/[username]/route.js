import { NextResponse } from "next/server";

const MODES = {
  ultraBullet: "UltraBullet",
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
};

const LICHESS = "https://lichess.org/api/user";

class LichessError extends Error {
  constructor(status, url) {
    super(`Lichess API error ${status} for ${url}`);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalize = (v) =>
  String(v)
    .replace(/[^a-z]/gi, "")
    .toLowerCase();

async function fetchLichess(url, { revalidate = 0, retries = 2 } = {}) {
  const headers = {
    Accept: "application/json",
    "User-Agent": "AshChess/1.0",
  };

  const token = process.env.LICHESS_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" }),
    });

    if (response.ok) return response.json();

    if (response.status === 429 && attempt < retries) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 4000)
          : 1500 * (attempt + 1);
      await sleep(wait);
      continue;
    }

    throw new LichessError(response.status, url);
  }
}

function getCurrentRatings(perfs = {}) {
  return Object.fromEntries(
    Object.keys(MODES).map((key) => [
      key,
      typeof perfs[key]?.rating === "number" ? perfs[key].rating : null,
    ]),
  );
}

// History points are [year, month (0-based), day, rating]
function getHistoryPeaks(history) {
  const peaks = {};

  for (const [key, mode] of Object.entries(MODES)) {
    const entry = history.find(
      (item) => normalize(item?.name) === normalize(mode),
    );

    let highest = null;
    for (const point of entry?.points ?? []) {
      const rating = Number(point?.[3]);
      if (Number.isFinite(rating) && rating > 0) {
        highest = highest === null ? rating : Math.max(highest, rating);
      }
    }
    peaks[key] = highest;
  }

  return peaks;
}

export async function GET(request, { params }) {
  try {
    const { username } = await params;

    if (!username || !/^[a-zA-Z0-9_-]{2,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid Lichess username." },
        { status: 400 },
      );
    }

    const encoded = encodeURIComponent(username);

    // 1) Current ratings: always live
    const user = await fetchLichess(`${LICHESS}/${encoded}`);
    const current = getCurrentRatings(user.perfs);

    // 2) Peaks: from rating history (sequential, after the profile call)
    let historyPeaks = null;
    let historyError = null;

    try {
      const history = await fetchLichess(
        `${LICHESS}/${encoded}/rating-history`,
        {
          revalidate: 1800,
        },
      );

      if (Array.isArray(history)) {
        historyPeaks = getHistoryPeaks(history);
      } else {
        historyError = "Unexpected history format";
      }
    } catch (error) {
      historyError = error.message;
      console.error("Lichess rating-history failed:", error);
    }

    // 3) Combine: peak is the highest ever seen, never below current
    const ratings = Object.fromEntries(
      Object.keys(MODES).map((key) => {
        const c = current[key];
        const h = historyPeaks?.[key] ?? null;
        const peak = Math.max(h ?? 0, c ?? 0);
        return [key, { current: c, peak: peak > 0 ? peak : null }];
      }),
    );

    return NextResponse.json({
      username: user.username,
      ratings,
      // false means peaks are only "current" because history was unavailable
      peaksFromHistory: historyPeaks !== null,
      ...(historyError ? { historyError } : {}),
    });
  } catch (error) {
    console.error("Lichess ratings error:", error);

    const status = error instanceof LichessError ? error.status : 500;

    if (status === 404) {
      return NextResponse.json(
        { error: "Lichess user not found." },
        { status: 404 },
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "Lichess rate limit hit, try again in a minute." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Unable to fetch Lichess ratings." },
      { status: 500 },
    );
  }
}
