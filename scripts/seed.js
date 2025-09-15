import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import User from "../models/user.js";
import Tenant from "../models/tenant.js";
import bcrypt from "bcryptjs";

async function seed() {
  await dbConnect();

  // Ensure tenants (with plan field and upsert)
  const acme = await Tenant.findOneAndUpdate(
    { slug: "acme" },
    { name: "Acme", slug: "acme", plan: "free" },
    { upsert: true, new: true }
  ).exec();

  const globex = await Tenant.findOneAndUpdate(
    { slug: "globex" },
    { name: "Globex", slug: "globex", plan: "free" },
    { upsert: true, new: true }
  ).exec();

  // Password hash (shared for all test accounts)
  const passwordHash = await bcrypt.hash("password", 10);

  // Users (roles lowercase for consistency with auth.js checks)
  const users = [
    { email: "admin@acme.test", password: passwordHash, role: "admin", tenantId: acme._id },
    { email: "user@acme.test", password: passwordHash, role: "member", tenantId: acme._id },
    { email: "admin@globex.test", password: passwordHash, role: "admin", tenantId: globex._id },
    { email: "user@globex.test", password: passwordHash, role: "member", tenantId: globex._id }
  ];

  for (const user of users) {
    await User.findOneAndUpdate(
      { email: user.email }, // uniqueness based on email
      user,
      { upsert: true, new: true }
    );
  }

  console.log("✅ Seed done without duplicates, tenants start as free plan");
  process.exit();
}

seed();
