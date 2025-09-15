// test.js
import 'dotenv/config'; // Must be first
import { signToken, verifyToken } from "./lib/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Set JWT_SECRET in environment");

const user = {
  _id: "650f3e2a5b1c2d0012345678",
  tenantId: "650f3e2a5b1c2d0012345679",
  role: "admin",
  email: "user@example.com"
};

// Generate token
const token = signToken(user);
console.log("Generated JWT:", token);

// Verify token
const decoded = verifyToken(token);
console.log("Decoded token:", decoded);
