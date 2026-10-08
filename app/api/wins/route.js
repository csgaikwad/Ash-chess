import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const USERNAME = "ashdeanna";

const DRAW_RESULTS = new Set([
  "agreed",
  "stalemate",
  "repetition",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - 24 * 60 * 60;

    const currentDate = new Date();
    const previousDate = new Date(currentDate);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);

    const getGames = async (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");

      const url =
        `https://api.chess.com/pub/player/${USERNAME}/games/${year}/${month}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Twitch Chess Stats Bot contact@example.com",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Chess.com player or games not found");
      }

      const data = await response.json();
      return data.games || [];
    };

    const [currentGames, previousGames] = await Promise.all([
      getGames(currentDate),
      getGames(previousDate),
    ]);

    const stats = {
      bullet: { wins: 0, losses: 0, draws: 0 },
      blitz: { wins: 0, losses: 0, draws: 0 },
      rapid: { wins: 0, losses: 0, draws: 0 },
    };

    for (const game of [...currentGames, ...previousGames]) {
      if (!game.end_time || game.end_time < cutoff) continue;

      const timeClass = game.time_class;

      if (!stats[timeClass]) continue;

      const whiteUsername = game.white?.username?.toLowerCase();
      const blackUsername = game.black?.username?.toLowerCase();

      let result;

      if (whiteUsername === USERNAME) {
        result = game.white.result;
      } else if (blackUsername === USERNAME) {
        result = game.black.result;
      } else {
        continue;
      }

      if (result === "win") {
        stats[timeClass].wins++;
      } else if (DRAW_RESULTS.has(result)) {
        stats[timeClass].draws++;
      } else {
        stats[timeClass].losses++;
      }
    }

    return NextResponse.json({
      username: USERNAME,
      period: "last 24 hours",
      bullet: stats.bullet,
      blitz: stats.blitz,
      rapid: stats.rapid,
    });
  } catch (error) {
    console.error("Chess.com API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}