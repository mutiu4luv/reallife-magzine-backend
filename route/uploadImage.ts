import { NextFunction, Request, Response } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image files are allowed"));
  },
});

export const uploadImageField = (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "Image must be 5MB or smaller" });
      return;
    }

    res.status(400).json({
      message: error instanceof Error ? error.message : "Invalid image upload",
    });
  });
};

export const uploadImagesField = (req: Request, res: Response, next: NextFunction) => {
  upload.array("images", 10)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "Each image must be 5MB or smaller" });
      return;
    }

    res.status(400).json({
      message: error instanceof Error ? error.message : "Invalid image upload",
    });
  });
};
