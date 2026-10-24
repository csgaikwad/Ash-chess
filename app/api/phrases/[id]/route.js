
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid phrase ID" },
        { status: 400 }
      );
    }

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

    const updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          english,
          bulgarian,
          updatedAt,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Phrase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializePhrase(result));
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "This English phrase already exists" },
        { status: 409 }
      );
    }

    console.error("PATCH /api/phrases/[id]:", error);

    return NextResponse.json(
      { error: "Failed to update phrase" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid phrase ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client
      .db(process.env.MONGODB_DB_NAME || "chessclub")
      .collection("phrases");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        { error: "Phrase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/phrases/[id]:", error);

    return NextResponse.json(
      { error: "Failed to delete phrase" },
      { status: 500 }
    );
  }
}
