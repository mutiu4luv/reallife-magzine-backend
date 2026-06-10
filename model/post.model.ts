import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["Magazine", "Book"], required: true },
    desc: { type: String, required: true },
    coverImage: { type: String, default: "" },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    downloadUrl: { type: String, default: "" },
    createdBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
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
          title: { type: String, required: true },
          type: { type: String, enum: ["Magazine", "Book"], required: true },
          desc: { type: String, required: true },
          coverImage: { type: String, default: "" },
          image: { type: String, required: true },
          images: { type: [String], default: [] },
          downloadUrl: { type: String, default: "" },
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

export default model("Post", postSchema);
