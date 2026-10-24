
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

function serializePhrase(doc) {
  return {
    id: doc._id.toString(),
    english: doc.english,
    bulgarian: doc.bulgarian,
    createdAt: new Date(doc.createdAt).getTime(),
    updatedAt: new Date(doc.updatedAt).getTime(),
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const collection = client
      .db(process.env.MONGODB_DB_NAME || "chessclub")
      .collection("phrases");

    const docs = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(docs.map(serializePhrase));
  } catch (error) {
    console.error("GET /api/phrases:", error);

    return NextResponse.json(
      { error: "Failed to load phrases" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const english =
      typeof body.english === "string" ? body.english.trim() : "";

    const bulgarian =
      typeof body.bulgarian === "string" ? body.bulgarian.trim() : "";

    if (
      !english ||
      !bulgarian ||
      english.length > 1000 ||
      bulgarian.length > 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Both phrases are required and must be at most 1000 characters",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client
      .db(process.env.MONGODB_DB_NAME || "chessclub")
      .collection("phrases");

    const now = new Date();

    const doc = {
      english,
      bulgarian,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);

    return NextResponse.json(
      serializePhrase({
        ...doc,
        _id: result.insertedId,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "This English phrase already exists" },
        { status: 409 }
      );
    }

    console.error("POST /api/phrases:", error);

    return NextResponse.json(
      { error: "Failed to save phrase" },
      { status: 500 }
    );
  }
}
