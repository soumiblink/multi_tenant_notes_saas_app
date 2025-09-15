import 'dotenv/config'; // Must be first
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../../../lib/db.js";
import User from "../../../../../models/user.js";


const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      });
    }

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return new Response(
    JSON.stringify({
      token,
      user: {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
