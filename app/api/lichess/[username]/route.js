import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const CACHED_USERNAME = "lenachess02";

const MODES = {
  ultraBullet: "UltraBullet",
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
};

async function fetchLichess(url) {
  const headers = {
    Accept: "application/json",
    "User-Agent": "AshChess/1.0",
  };

  // Optional token only for higher rate limits – never required
  const token = process.env.LICHESS_API_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Lichess API error: ${response.status}`);
  }

  return response.json();
}

function getPeaks(history) {
  const peaks = {};

  for (const [key, mode] of Object.entries(MODES)) {
    const normalize = (value) =>
      String(value)
        .replace(/[^a-z]/gi, "")
        .toLowerCase();

    const entry = history.find(
      (item) => normalize(item.name) === normalize(mode),
    );

    const ratings = (entry?.points || [])
      .map((point) => Number(point[3]))
      .filter(Number.isFinite);

    peaks[key] = ratings.length
      ? ratings.reduce((highest, rating) => Math.max(highest, rating), 0)
      : null;
  }

  return peaks;
}

function getCurrentRatings(perfs = {}) {
  return Object.fromEntries(
    Object.keys(MODES).map((key) => [
      key,
      typeof perfs[key]?.rating === "number" ? perfs[key].rating : null,
    ]),
  );
}

function mergePeaks(peaks, current) {
  return Object.fromEntries(
    Object.keys(MODES).map((key) => [
      key,
      Math.max(peaks?.[key] || 0, current[key] || 0) || null,
    ]),
  );
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

    const encodedUsername = encodeURIComponent(username);
    const isCachedUser =
      username.toLowerCase() === CACHED_USERNAME.toLowerCase();

    // Always fetch live profile (current ratings)
    const user = await fetchLichess(
      `https://lichess.org/api/user/${encodedUsername}`,
    );

    const current = getCurrentRatings(user.perfs);

    let peaks;
    let cached = false;

    if (isCachedUser) {
      const client = await clientPromise;
      const db = process.env.MONGODB_DB
        ? client.db(process.env.MONGODB_DB)
        : client.db();

      const collection = db.collection("lichess_peak_cache");

      let record = await collection.findOne({ _id: CACHED_USERNAME });

      if (!record) {
        // First time – pull full history
        const history = await fetchLichess(
          `https://lichess.org/api/user/${encodedUsername}/rating-history`,
        );
        peaks = mergePeaks(getPeaks(history), current);
      } else {
        // Use previously stored peaks + live current
        peaks = mergePeaks(record.peaks, current);
      }

      // Persist with $max so peaks can never go down
      const peakUpdates = {};
      for (const key of Object.keys(MODES)) {
        if (peaks[key] !== null) {
          peakUpdates[`peaks.${key}`] = peaks[key];
        }
      }

      await collection.updateOne(
        { _id: CACHED_USERNAME },
        {
          $setOnInsert: {
            username: user.username, // keep the real casing
            createdAt: new Date(),
          },
          ...(Object.keys(peakUpdates).length > 0
            ? { $max: peakUpdates }
            : {}),
        },
        { upsert: true },
      );

      // Re-read the final values after $max
      record = await collection.findOne({ _id: CACHED_USERNAME });
      peaks = record?.peaks || peaks;
      cached = true;
    } else {
      // Everyone else – fetch history every time
      const history = await fetchLichess(
        `https://lichess.org/api/user/${encodedUsername}/rating-history`,
      );
      peaks = mergePeaks(getPeaks(history), current);
    }

    const ratings = Object.fromEntries(
      Object.keys(MODES).map((key) => [
        key,
        {
          current: current[key],
          peak: peaks[key] ?? null,
        },
      ]),
    );

    return NextResponse.json({
      username: user.username,
      ratings,
      cached,
    });
  } catch (error) {
    console.error("Lichess ratings error:", error);

    return NextResponse.json(
      { error: "Unable to fetch Lichess ratings." },
      { status: 500 },
    );
  }
}