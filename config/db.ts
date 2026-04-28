import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;
let hasRegisteredConnectionListeners = false;
let lastConnectionError: string | null = null;

const registerConnectionListeners = () => {
  if (hasRegisteredConnectionListeners) {
    return;
  }

  hasRegisteredConnectionListeners = true;

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", error);
  });
};

export const getDatabaseStatus = () => ({
  configured: Boolean(process.env.MONGO_URI?.trim()),
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  lastError: lastConnectionError,
});

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  const databaseName = process.env.MONGO_DB_NAME?.trim();

  if (!databaseName) {
    return mongoUri;
  }

  const parsedUri = new URL(mongoUri);

  if (parsedUri.pathname && parsedUri.pathname !== "/") {
    return mongoUri;
  }

  parsedUri.pathname = `/${databaseName}`;
  return parsedUri.toString();
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = getMongoUri();

  registerConnectionListeners();
  mongoose.set("bufferCommands", true);

  connectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 30000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_FREQUENCY_MS || 10000),
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 1),
    })
    .then((mongooseInstance) => {
      connectionPromise = null;
      lastConnectionError = null;
      return mongooseInstance;
    })
    .catch((error) => {
      connectionPromise = null;
      lastConnectionError = error instanceof Error ? error.message : "Unknown MongoDB connection error";
      throw error;
    });

  return connectionPromise;
};
