import { Request, Response } from "express";
import upcomingEventModel from "../model/upcomingEvent.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

const getEditorMeta = (req: AuthenticatedRequest) => ({
  id: String(req.user?._id || ""),
  name: req.user?.name || "",
  email: req.user?.email || "",
  role: req.user?.role || "",
});

export const getUpcomingEvents = async (_: Request, res: Response) => {
  try {
    const events = await upcomingEventModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ message: "Error fetching upcoming events", error: getErrorMessage(error) });
  }
};

export const getUpcomingEventById = async (req: Request, res: Response) => {
  try {
    const event = await upcomingEventModel.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!event) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching upcoming event:", error);
    res.status(500).json({ message: "Error fetching upcoming event", error: getErrorMessage(error) });
  }
};

export const createUpcomingEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, isActive } = req.body;
    const files = ((req as Request & { files?: UploadedFile[] }).files || []) as UploadedFile[];

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (!files.length) {
      return res.status(400).json({
        message: "At least one image is required. Upload files named 'images'.",
      });
    }

    const images = await Promise.all(
      files.map((file) => uploadImage("reality_life_events", file))
    );
    const uploadedImages = images.filter((image): image is string => Boolean(image));

    const event = await upcomingEventModel.create({
      title: title.trim(),
      description: description.trim(),
      images: uploadedImages,
      isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating upcoming event:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating upcoming event", error: errorMessage });
  }
};

export const updateUpcomingEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingEvent = await upcomingEventModel.findById(req.params.id);

    if (!existingEvent) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }

    const { title, description, isActive, imageUrls, images: bodyImages } = req.body;
    const files = ((req as Request & { files?: UploadedFile[] }).files || []) as UploadedFile[];

    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (description !== undefined && !description?.trim()) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    const uploadedImages = (
      await Promise.all(files.map((file) => uploadImage("reality_life_events", file)))
    ).filter((image): image is string => Boolean(image));

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

    const existingImageUrls = parseImageList(imageUrls || bodyImages);
    const nextImages = [...existingImageUrls, ...uploadedImages];
    const shouldUpdateImages = files.length > 0 || existingImageUrls.length > 0;

    if (shouldUpdateImages && nextImages.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const previousVersion = {
      title: existingEvent.title,
      description: existingEvent.description,
      images: Array.isArray(existingEvent.images) ? existingEvent.images : [],
      isActive: existingEvent.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    existingEvent.set({
      title: title === undefined ? existingEvent.title : title.trim(),
      description: description === undefined ? existingEvent.description : description.trim(),
      images: shouldUpdateImages ? nextImages : existingEvent.images,
      isActive:
        isActive === undefined
          ? existingEvent.isActive
          : isActive === "true" || isActive === true,
      editHistory: [...(existingEvent.editHistory || []), previousVersion],
    });

    const updatedEvent = await existingEvent.save();
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating upcoming event:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error updating upcoming event", error: errorMessage });
  }
};

export const deleteUpcomingEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await upcomingEventModel.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }

    if (req.user?.role === "admin") {
      const deletedEvent = await upcomingEventModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Upcoming event deleted permanently", event: deletedEvent });
    }

    item.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await item.save();
    res.status(200).json({ message: "Upcoming event moved to deleted review.", event: item });
  } catch (error) {
    console.error("Error deleting upcoming event:", error);
    res.status(500).json({ message: "Error deleting upcoming event", error: getErrorMessage(error) });
  }
};

export const getDeletedUpcomingEvents = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await upcomingEventModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted upcoming events", error: getErrorMessage(error) });
  }
};

export const restoreUpcomingEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await upcomingEventModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }
    item.set({
      isDeleted: false,
      deletedAt: null,
      deletedBy: { id: "", name: "", email: "", role: "" },
    });
    const restored = await item.save();
    res.status(200).json({ message: "Upcoming event restored successfully", event: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring upcoming event", error: getErrorMessage(error) });
  }
};

export const permanentDeleteUpcomingEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await upcomingEventModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }
    res.status(200).json({ message: "Upcoming event permanently deleted", event: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting upcoming event", error: getErrorMessage(error) });
  }
};

export const undoLastUpcomingEventEdit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await upcomingEventModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }
    const history = Array.isArray(item.editHistory) ? item.editHistory : [];
    const lastVersion = history[history.length - 1];
    if (!lastVersion) {
      return res.status(400).json({ message: "No edit history to undo." });
    }

    const currentSnapshot = {
      title: item.title,
      description: item.description,
      images: Array.isArray(item.images) ? item.images : [],
      isActive: item.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    item.set({
      title: lastVersion.title,
      description: lastVersion.description,
      images: Array.isArray(lastVersion.images) ? lastVersion.images : [],
      isActive: Boolean(lastVersion.isActive),
      editHistory: [...history.slice(0, -1), currentSnapshot],
    });
    const updated = await item.save();
    res.status(200).json({ message: "Upcoming event reverted to previous version", event: updated });
  } catch (error) {
    res.status(500).json({ message: "Error undoing upcoming event edit", error: getErrorMessage(error) });
  }
};
