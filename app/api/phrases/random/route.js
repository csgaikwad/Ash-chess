import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "chessclub");

    const [phrase] = await db
      .collection("phrases")
      .aggregate([{ $sample: { size: 1 } }, { $project: { english: 1 } }])
      .toArray();

    if (!phrase) {
      return NextResponse.json({ error: "No phrases found" }, { status: 404 });
    }

    await db.collection("phraseSession").updateOne(
      { _id: "current" },
      {
        $set: {
          phraseId: phrase._id,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return new NextResponse(phrase.english, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("GET /api/phrases/random:", error);
    return NextResponse.json(
      { error: "Failed to get random phrase" },
      { status: 500 },
    );
  }
}
