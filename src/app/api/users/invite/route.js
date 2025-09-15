import 'dotenv/config';
import { dbConnect } from "../../../../../lib/db.js";
import User from "../../../../../models/user.js";
import Tenant from "../../../../../models/tenant.js";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../lib/auth.js";
import { withCors } from "../../../../../lib/cors.js";

export const POST = withCors(async (req) => {
  await dbConnect();

  const adminUser = getUserFromRequest(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (adminUser.role.toUpperCase() !== "ADMIN") return NextResponse.json({ error: "Forbidden: only admins can invite users" }, { status: 403 });

  const { email, role, password } = await req.json();
  if (!email || !role || !password) return NextResponse.json({ error: "Email, role, and password are required" }, { status: 400 });

  const validRoles = ["ADMIN", "MEMBER"];
  const roleUpper = role.toUpperCase();
  if (!validRoles.includes(roleUpper)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const tenant = await Tenant.findById(adminUser.tenantId);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await User.findOneAndUpdate(
    { email },
    { email, password: passwordHash, role: roleUpper, tenantId: tenant._id },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    message: `User ${email} invited to ${tenant.name} as ${roleUpper}`,
    user: { email: newUser.email, role: newUser.role, tenantId: tenant._id },
  });
});
