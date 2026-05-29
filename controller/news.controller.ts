import { Request, Response } from "express";
import newsModel from "../model/news.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

const parseImageList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return [value.trim()];
    }
  }

  return [];
};

const getUploadedFiles = (req: Request) => {
  const requestWithFiles = req as Request & { file?: UploadedFile; files?: UploadedFile[] };
  return requestWithFiles.files?.length
    ? requestWithFiles.files
    : requestWithFiles.file
      ? [requestWithFiles.file]
      : [];
};

const uploadNewsImages = async (files: UploadedFile[], imageSources: string[]) => {
  const fileUrls = (
    await Promise.all(files.map((file) => uploadImage("reality_life_news", file)))
  ).filter((image): image is string => Boolean(image));
  const sourceUrls = (
    await Promise.all(imageSources.map((imageSource) => uploadImage("reality_life_news", undefined, imageSource)))
  ).filter((image): image is string => Boolean(image));

  return [...fileUrls, ...sourceUrls];
};

const getEditorMeta = (req: AuthenticatedRequest) => ({
  id: String(req.user?._id || ""),
  name: req.user?.name || "",
  email: req.user?.email || "",
  role: req.user?.role || "",
});

export const getNews = async (_: Request, res: Response) => {
  try {
    const news = await newsModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: "Error fetching news", error: getErrorMessage(error) });
  }
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const news = await newsModel.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    res.status(200).json(news);
  } catch (error) {
    console.error("Error fetching news item:", error);
    res.status(500).json({ message: "Error fetching news item", error: getErrorMessage(error) });
  }
};

export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl, image, imageUrls, images } = req.body;
    const files = getUploadedFiles(req);
    const imageSources = [
      ...parseImageList(imageUrls || images),
      ...parseImageList(imageUrl || image),
    ];

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const uploadedImages = await uploadNewsImages(files, imageSources);
    if (!uploadedImages.length) {
      return res.status(400).json({
        message: "Image is required. Upload files named 'images' or provide imageUrls.",
      });
    }

    const news = await newsModel.create({
      title: title.trim(),
      description: description.trim(),
      image: uploadedImages[0],
      images: uploadedImages,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error("Error creating news:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating news", error: errorMessage });
  }
};

export const updateNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingNews = await newsModel.findById(req.params.id);

    if (!existingNews) {
      return res.status(404).json({ message: "News item not found" });
    }

    const { title, description, imageUrl, image, imageUrls, images } = req.body;
    const files = getUploadedFiles(req);
    const imageSources = [
      ...parseImageList(imageUrls || images),
      ...parseImageList(imageUrl || image),
    ];

    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (description !== undefined && !description?.trim()) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    const uploadedImages = await uploadNewsImages(files, imageSources);
    const shouldUpdateImages = uploadedImages.length > 0;
    const currentImages = Array.isArray(existingNews.images) && existingNews.images.length
      ? existingNews.images
      : existingNews.image
        ? [existingNews.image]
        : [];
    const nextImages = shouldUpdateImages ? uploadedImages : currentImages;

    const previousVersion = {
      title: existingNews.title,
      description: existingNews.description,
      image: existingNews.image,
      images: Array.isArray(existingNews.images) ? existingNews.images : [],
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    existingNews.set({
      title: title === undefined ? existingNews.title : title.trim(),
      description: description === undefined ? existingNews.description : description.trim(),
      image: nextImages[0] || existingNews.image,
      images: nextImages,
      editHistory: [...(existingNews.editHistory || []), previousVersion],
    });

    const updatedNews = await existingNews.save();
    res.status(200).json(updatedNews);
  } catch (error) {
    console.error("Error updating news:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error updating news", error: errorMessage });
  }
};

export const deleteNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const news = await newsModel.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    if (req.user?.role === "admin") {
      const deletedNews = await newsModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "News deleted permanently", news: deletedNews });
    }

    news.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await news.save();
    res.status(200).json({ message: "News moved to deleted review.", news });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ message: "Error deleting news", error: getErrorMessage(error) });
  }
};

export const getDeletedNews = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await newsModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted news", error: getErrorMessage(error) });
  }
};

export const restoreNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await newsModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "News item not found" });
    }
    item.set({
      isDeleted: false,
      deletedAt: null,
      deletedBy: { id: "", name: "", email: "", role: "" },
    });
    const restored = await item.save();
    res.status(200).json({ message: "News restored successfully", news: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring news", error: getErrorMessage(error) });
  }
};

export const permanentDeleteNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await newsModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "News item not found" });
    }
    res.status(200).json({ message: "News permanently deleted", news: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting news", error: getErrorMessage(error) });
  }
};

export const undoLastNewsEdit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await newsModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "News item not found" });
    }
    const history = Array.isArray(item.editHistory) ? item.editHistory : [];
    const lastVersion = history[history.length - 1];
    if (!lastVersion) {
      return res.status(400).json({ message: "No edit history to undo." });
    }

    const currentSnapshot = {
      title: item.title,
      description: item.description,
      image: item.image,
      images: Array.isArray(item.images) ? item.images : [],
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    item.set({
      title: lastVersion.title,
      description: lastVersion.description,
      image: lastVersion.image,
      images: Array.isArray(lastVersion.images) ? lastVersion.images : [],
      editHistory: [...history.slice(0, -1), currentSnapshot],
    });
    const updated = await item.save();
    res.status(200).json({ message: "News reverted to previous version", news: updated });
  } catch (error) {
    res.status(500).json({ message: "Error undoing news edit", error: getErrorMessage(error) });
  }
};
