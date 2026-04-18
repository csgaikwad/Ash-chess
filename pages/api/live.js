import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const userRes = await fetch(
    "https://lichess.org/api/users/status?ids=ashdeanna&withGameIds=true",
  );
  const users = await userRes.json();
  const user = users[0]; // Array of users, take first

  if (!user?.playing || !user.playingId) {
    return NextResponse.json({ ash: "-", opponent: "offline" });
  }

  const gameRes = await fetch(`https://lichess.org/api/game/${user.playingId}`);
  const game = await gameRes.json();

  const white = game.players?.white;
  const black = game.players?.black;

  if (!white || !black) {
    return NextResponse.json({ ash: "-", opponent: "no players" });
  }

  const ashPlayer = white.userId === "ashdeanna" ? white : black;
  const oppPlayer = white.userId !== "ashdeanna" ? white : black;

  return NextResponse.json({
    ash: ashPlayer.rating,
    opponent: `${oppPlayer.userId} ${oppPlayer.rating}` ,
  });
}

// import https from "https";

// function getJSON(url) {
//   return new Promise((resolve, reject) => {
//     https
//       .get(
//         url,
//         {
//           headers: {
//             Accept: "application/json",
//             "User-Agent": "lichess-clock-api",
//           },
//         },
//         (res) => {
//           let data = "";
//           res.on("data", (chunk) => (data += chunk));
//           res.on("end", () => {
//             try {
//               resolve(JSON.parse(data));
//             } catch (e) {
//               reject(e);
//             }
//           });
//         },
//       )
//       .on("error", reject);
//   });
// }

// export default async function handler(req, res) {
//   // We’ll use this to return ONE response
//   const firstResponse = new Promise((resolve) => {
//     function endEarly(json) {
//       if (!res.writableEnded) {
//         res.json(json);
//         resolve();
//       }
//     }

//     // 1. Get playingId
//     getJSON(
//       "https://lichess.org/api/users/status?ids=corazonero&withGameIds=true",
//     )
//       .then((users) => {
//         const user = users[0];
//         if (!user?.playingId) {
//           return endEarly({ whiteTime: "-", blackTime: "-" });
//         }

//         const gameId = user.playingId;

//         // 2. Open game stream, get first snapshot
//         const request = https.get(
//           `https://lichess.org/api/stream/game/${gameId}`,
//           { headers: { Accept: "application/x-ndjson" } },
//           (streamRes) => {
//             let buffer = "";

//             streamRes.on("data", (chunk) => {
//               if (res.writableEnded) return; // race‑guard

//               buffer += chunk.toString();
//               const lines = buffer.split("\n");
//               buffer = lines.pop();

//               for (let line of lines) {
//                 if (!line.trim()) continue;

//                 let data;
//                 try {
//                   data = JSON.parse(line);
//                 } catch (e) {
//                   continue;
//                 }

//                 // Use the first `gameState` you see (simplest)
//                   console.log(data);
//                   console.log(data.player.white);
//                 if (data.type === "gameState") {
//                   streamRes.destroy();
//                   request.destroy();

//                   const format = (ms) => {
//                     if (ms == null || ms < 0) return "0:00";
//                     const totalSec = Math.floor(ms / 1000);
//                     const m = Math.floor(totalSec / 60);
//                     const s = totalSec % 60;
//                     return `${m}:${s.toString().padStart(2, "0")}`;
//                   };

//                   return endEarly({
//                     whiteTime: format(data.wtime),
//                     blackTime: format(data.btime),
//                   });
//                 }
//               }
//             });

//             streamRes.on("end", () => {
//               if (!res.writableEnded) {
//                 endEarly({ whiteTime: "-", blackTime: "-" });
//               }
//             });

//             streamRes.on("error", () => {
//               if (!res.writableEnded) {
//                 endEarly({ whiteTime: "ERR", blackTime: "ERR" });
//               }
//             });
//           },
//         );

//         // 3. Time‑out fallback
//         setTimeout(() => {
//           if (!res.writableEnded) {
//             request.destroy();
//             endEarly({ whiteTime: "ERR", blackTime: "ERR" });
//           }
//         }, 5000);
//       })
//       .catch(() => {
//         endEarly({ whiteTime: "ERR", blackTime: "ERR" });
//       });
//   });

//   // Wait for that one snapshot
//   await firstResponse;
// }
