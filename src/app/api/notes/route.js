// app/api/notes/route.js
import { dbConnect } from "../../../../lib/db.js";
import Note from "../../../../models/note.js";
import Tenant from "../../../../models/tenant.js"; // add this
import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/auth.js";
import { withCors } from "../../../../lib/cors.js";

// POST - Create note (with subscription gating)
export async function POST(req) {
  await dbConnect();

  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // fetch tenant
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // enforce free plan limit
    const FREE_NOTE_LIMIT = 3;
    if (tenant.plan === "free") {
      const count = await Note.countDocuments({ tenantId: user.tenantId });
      if (count >= FREE_NOTE_LIMIT) {
        return NextResponse.json(
          { error: `Free plan limit reached (${FREE_NOTE_LIMIT}). Please upgrade to Pro.` },
          { status: 402 } // Payment Required (or 403/409 if you prefer)
        );
      }
    }

    const { title, content } = await req.json();

    const note = await Note.create({
      title,
      content,
      tenantId: user.tenantId,
      userId: user.userId,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET - List notes
export async function GET(req) {
  await dbConnect();

  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notes = await Note.find({ tenantId: user.tenantId }).sort({ createdAt: -1 });

    return NextResponse.json(notes, { status: 200 }); // ✅ return array directly
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

