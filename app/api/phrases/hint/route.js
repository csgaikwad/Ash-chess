import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "chessclub");

    const session = await db
      .collection("phraseSession")
      .findOne({ _id: "current" });

    if (!session) {
      return NextResponse.json(
        { error: "No active phrase. Get a random phrase first." },
        { status: 404 },
      );
    }

    const phrase = await db
      .collection("phrases")
      .findOne({ _id: session.phraseId }, { projection: { bulgarian: 1 } });

    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    return new NextResponse(phrase.bulgarian, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("GET /api/phrases/hint:", error);
    return NextResponse.json({ error: "Failed to get hint" }, { status: 500 });
  }
}
