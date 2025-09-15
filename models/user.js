import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // enforce unique email
  password: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "MEMBER"], required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
