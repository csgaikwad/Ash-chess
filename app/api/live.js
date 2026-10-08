// import { NextResponse } from "next/server";

// export const config = {
//   runtime: "edge",
// };

// export default async function handler(req) {
//   const usersRes = await fetch(
//     "https://lichess.org/api/users/status?ids=ashdeanna&withGameIds=true",
//   );
//   const users = await usersRes.json();
//   const user = users[0];

//   if (!user?.playing || !user.playingId) {
//     return NextResponse.json({ ash: "-", opponent: "offline" });
//   }

//   const gameRes = await fetch(`https://lichess.org/api/game/${user.playingId}`);
//   const game = await gameRes.json();
//   console.log(game);

//   const white = game.players?.white;
//   const black = game.players?.black;

//   if (!white || !black) {
//     return NextResponse.json({ ash: "-", opponent: "no players" });
//   }

//   const ashPlayer = white.userId === "ashdeanna" ? white : black;
//   const oppPlayer = white.userId !== "ashdeanna" ? white : black;

//   // Opening (after first moves, ~5-10 turns)
//   const opening = game.opening
//     ? `${game.opening.name} (${game.opening.eco})`
//     : "Early game";

//   return NextResponse.json({
//     ash: ashPlayer.rating,
//     opponent: `${oppPlayer.userId} ${oppPlayer.rating}`,
//     opening: opening,
//     perf: game.perf,
//   });
// }
