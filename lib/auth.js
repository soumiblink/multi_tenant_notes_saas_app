// lib/auth.js
import jwt from "jsonwebtoken";
import 'dotenv/config'; // Must be first
const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null; // return null instead of throwing
  }
}

export function getUserFromRequest(req) {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return verifyToken(token); // returns { userId, tenantId, role, email }
}
