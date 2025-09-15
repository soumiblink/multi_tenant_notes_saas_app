// scripts/seedUsers.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/usermodel"; // adjust path if your model is elsewhere

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not defined in .env.local");
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedUsers() {
  try {
    const hashedPassword = await bcrypt.hash("password", 10);

    const users = [
      { email: "admin@acme.test", password: hashedPassword, role: "admin", tenant: "Acme" },
      { email: "user@acme.test", password: hashedPassword, role: "member", tenant: "Acme" },
      { email: "admin@globex.test", password: hashedPassword, role: "admin", tenant: "Globex" },
      { email: "user@globex.test", password: hashedPassword, role: "member", tenant: "Globex" },
    ];

    // Optional: Remove existing users before seeding
    await User.deleteMany({});
    await User.insertMany(users);

    console.log("✅ Test users seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding users:", err);
  } finally {
    mongoose.disconnect();
  }
}

seedUsers();
