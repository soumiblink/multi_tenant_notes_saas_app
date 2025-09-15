import { dbConnect } from "../../../../../lib/db.js";
import Note from "../../../../../models/note.js";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../lib/auth.js";

// GET /api/notes/:id
export async function GET(req, context) {
  await dbConnect();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params; // ✅ await here

  const note = await Note.findOne({ _id: id, tenantId: user.tenantId });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json(note);
}

// PUT /api/notes/:id
export async function PUT(req, { params }) {
  await dbConnect();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ❌ Block unsafe fields
  if (body.userId || body.tenantId) {
    return NextResponse.json(
      { error: "You cannot update userId or tenantId" },
      { status: 400 }
    );
  }

  //  Only pick safe fields
  const { title, content } = body;

  const updated = await Note.findOneAndUpdate(
    { _id: params.id, tenantId: user.tenantId }, // tenant check
    { title, content },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}


// DELETE /api/notes/:id
export async function DELETE(req, context) {
  await dbConnect();
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params; // 

  const deleted = await Note.findOneAndDelete({ _id: id, tenantId: user.tenantId });
  if (!deleted) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json({ message: "Note deleted" });
}
