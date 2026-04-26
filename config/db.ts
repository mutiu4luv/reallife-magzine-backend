import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  mongoose.set("bufferCommands", false);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
};
