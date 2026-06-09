import { Schema, model } from "mongoose";

const responseSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const compendiumSubmissionSchema = new Schema(
  {
    messageType: {
      type: String,
      enum: ["interview", "tribute", "goodwill", "congratulatory"],
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    organization: { type: String, default: "", trim: true, maxlength: 160 },
    headline: { type: String, default: "", trim: true, maxlength: 220 },
    message: { type: String, default: "", trim: true, maxlength: 10000 },
    advertRate: { type: String, default: "", trim: true, maxlength: 120 },
    responses: { type: [responseSchema], default: [] },
  },
  { timestamps: true }
);

export default model("CompendiumSubmission", compendiumSubmissionSchema);
