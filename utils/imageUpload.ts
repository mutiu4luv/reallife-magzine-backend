import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export type UploadedFile = {
  buffer?: Buffer;
  path?: string;
  mimetype?: string;
  originalname?: string;
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const nestedError = (error as { error?: unknown }).error;
    const message = (error as { message?: unknown }).message;

    if (nestedError instanceof Error) {
      return nestedError.message;
    }

    if (typeof nestedError === "string") {
      return nestedError;
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unknown server error";
};

const isProduction = process.env.NODE_ENV === "production";

const getFileExtension = (file: UploadedFile) => {
  const originalExtension = file.originalname ? path.extname(file.originalname) : "";

  if (originalExtension) {
    return originalExtension;
  }

  if (file.mimetype === "image/png") {
    return ".png";
  }

  if (file.mimetype === "image/webp") {
    return ".webp";
  }

  return ".jpg";
};

const saveImageLocally = async (file: UploadedFile) => {
  if (!file.buffer) {
    return null;
  }

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${randomUUID()}${getFileExtension(file)}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, file.buffer);

  const publicBaseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${publicBaseUrl}/uploads/${filename}`;
};

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
};

const uploadBufferToCloudinary = (buffer: Buffer, folder: string) => {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

const uploadImageToCloudinary = async (folder: string, file?: UploadedFile, imageUrl?: string) => {
  configureCloudinary();

  if (file?.buffer) {
    return uploadBufferToCloudinary(file.buffer, folder);
  }

  if (file?.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
    });
    return result.secure_url;
  }

  if (imageUrl) {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
    });
    return result.secure_url;
  }

  return null;
};

export const uploadImage = async (folder: string, file?: UploadedFile, imageUrl?: string) => {
  try {
    return await uploadImageToCloudinary(folder, file, imageUrl);
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    console.warn("Cloudinary upload failed. Using local development fallback:", getErrorMessage(error));

    if (file?.buffer) {
      return saveImageLocally(file);
    }

    if (imageUrl) {
      return imageUrl;
    }

    throw error;
  }
};
