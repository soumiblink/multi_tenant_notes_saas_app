// models/tenant.js
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // e.g. "acme", "globex"
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    // optional metadata
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);
