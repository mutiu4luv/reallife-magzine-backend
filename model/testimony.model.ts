import { Schema, model } from "mongoose";

const testimonySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    editHistory: {
      type: [
        {
          name: { type: String, required: true },
          message: { type: String, required: true },
          image: { type: String, required: true },
          isActive: { type: Boolean, default: true },
          editedAt: { type: Date, default: Date.now },
          editedBy: {
            id: { type: String, default: "" },
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            role: { type: String, default: "" },
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default model("Testimony", testimonySchema);
