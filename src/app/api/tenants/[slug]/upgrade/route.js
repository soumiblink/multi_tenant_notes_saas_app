import { dbConnect } from "../../../../../../lib/db.js";
import Tenant from "../../../../../../models/tenant.js";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../../lib/auth.js";
import { withCors } from "../../../../../../lib/cors.js";

export const POST = withCors(async (req, context) => {
  await dbConnect();

  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = context.params;

  if (user.role.toUpperCase() !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const tenant = await Tenant.findOne({ slug });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  if (tenant._id.toString() !== user.tenantId) return NextResponse.json({ error: "Forbidden: cannot upgrade other tenant" }, { status: 403 });

  if (tenant.plan === "pro") return NextResponse.json({ message: "Already upgraded to pro", tenant });

  tenant.plan = "pro";
  await tenant.save();

  return NextResponse.json({ message: `Tenant ${tenant.slug} upgraded to pro`, tenant });
});
