import { Request, Response } from "express";
import interviewModel from "../model/interview.model";
import photoGalleryModel from "../model/photoGallery.model";
import testimonyModel from "../model/testimony.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

const parseBoolean = (value: unknown, fallback = true) => {
  if (value === undefined) {
    return fallback;
  }

  return value === true || value === "true" || value === "on";
};

const parseQa = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is { question: string; answer: string } =>
        typeof item?.question === "string" && typeof item?.answer === "string"
    );
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parseQa(parsed);
    } catch {
      return [];
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

const uploadSectionImages = async (folder: string, files: UploadedFile[], imageUrls: string[] = []) => {
  const fileUrls = (
    await Promise.all(files.map((file) => uploadImage(folder, file)))
  ).filter((image): image is string => Boolean(image));
  const sourceUrls = (
    await Promise.all(imageUrls.map((imageUrl) => uploadImage(folder, undefined, imageUrl)))
  ).filter((image): image is string => Boolean(image));

  return [...fileUrls, ...sourceUrls];
};

const getEditorMeta = (req: AuthenticatedRequest) => ({
  id: String(req.user?._id || ""),
  name: req.user?.name || "",
  email: req.user?.email || "",
  role: req.user?.role || "",
});

export const getTestimonies = async (_req: Request, res: Response) => {
  try {
    const testimonies = await testimonyModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(testimonies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching testimonies", error: getErrorMessage(error) });
  }
};

export const createTestimony = async (req: Request, res: Response) => {
  try {
    const { name, message, imageUrl } = req.body;
    const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !message?.trim() || !images.length) {
      return res.status(400).json({ message: "Name, message, and image are required" });
    }

    const testimony = await testimonyModel.create({
      name: name.trim(),
      message: message.trim(),
      image: images[0],
      isActive: parseBoolean(req.body.isActive),
    });

    res.status(201).json(testimony);
  } catch (error) {
    res.status(500).json({ message: "Error creating testimony", error: getErrorMessage(error) });
  }
};

export const updateTestimony = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, message, imageUrl } = req.body;
    const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    const testimony = await testimonyModel.findById(req.params.id);
    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    const previousVersion = {
      name: testimony.name,
      message: testimony.message,
      image: testimony.image,
      isActive: testimony.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    const update: Record<string, unknown> = {
      name: name.trim(),
      message: message.trim(),
      isActive: parseBoolean(req.body.isActive),
      editHistory: [...((testimony as any).editHistory || []), previousVersion],
    };

    if (images.length) {
      update.image = images[0];
    }

    testimony.set(update);
    const updated = await testimony.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating testimony", error: getErrorMessage(error) });
  }
};

export const deleteTestimony = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const testimony = await testimonyModel.findById(req.params.id);

    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    if (req.user?.role === "admin") {
      const deleted = await testimonyModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Testimony deleted permanently", testimony: deleted });
    }

    testimony.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await testimony.save();

    res.status(200).json({ message: "Testimony moved to deleted review.", testimony });
  } catch (error) {
    res.status(500).json({ message: "Error deleting testimony", error: getErrorMessage(error) });
  }
};

export const getInterviews = async (_req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching interviews", error: getErrorMessage(error) });
  }
};

export const createInterview = async (req: Request, res: Response) => {
  try {
    const { name, role, message, imageUrl } = req.body;
    const qa = parseQa(req.body.qa);
    const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !role?.trim() || !images.length || !qa.length) {
      return res.status(400).json({ message: "Name, role, image, and at least one Q&A are required" });
    }

    const interview = await interviewModel.create({
      name: name.trim(),
      role: role.trim(),
      message: typeof message === "string" ? message.trim() : "",
      qa,
      image: images[0],
      isActive: parseBoolean(req.body.isActive),
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: "Error creating interview", error: getErrorMessage(error) });
  }
};

export const updateInterview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, message, imageUrl } = req.body;
    const qa = parseQa(req.body.qa);
    const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !role?.trim() || !qa.length) {
      return res.status(400).json({ message: "Name, role, and at least one Q&A are required" });
    }

    const interview = await interviewModel.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const previousVersion = {
      name: interview.name,
      role: interview.role,
      message: interview.message,
      qa: interview.qa,
      image: interview.image,
      isActive: interview.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    const update: Record<string, unknown> = {
      name: name.trim(),
      role: role.trim(),
      message: typeof message === "string" ? message.trim() : "",
      qa,
      isActive: parseBoolean(req.body.isActive),
      editHistory: [...((interview as any).editHistory || []), previousVersion],
    };

    if (images.length) {
      update.image = images[0];
    }

    interview.set(update);
    const updated = await interview.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating interview", error: getErrorMessage(error) });
  }
};

export const deleteInterview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interview = await interviewModel.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (req.user?.role === "admin") {
      const deleted = await interviewModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Interview deleted permanently", interview: deleted });
    }

    interview.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await interview.save();

    res.status(200).json({ message: "Interview moved to deleted review.", interview });
  } catch (error) {
    res.status(500).json({ message: "Error deleting interview", error: getErrorMessage(error) });
  }
};

export const getPhotoGallery = async (_req: Request, res: Response) => {
  try {
    const photos = await photoGalleryModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo gallery", error: getErrorMessage(error) });
  }
};

export const createPhotoGallery = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const images = await uploadSectionImages("reality_life_photo_gallery", getUploadedFiles(req));

    if (!images.length) {
      return res.status(400).json({ message: "At least one gallery image is required" });
    }

    const photos = await photoGalleryModel.insertMany(
      images.map((image) => ({
        title: typeof title === "string" ? title.trim() : "",
        image,
        isActive: parseBoolean(req.body.isActive),
      }))
    );

    res.status(201).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error creating photo gallery images", error: getErrorMessage(error) });
  }
};

export const deletePhotoGallery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const photo = await photoGalleryModel.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo gallery image not found" });
    }

    if (req.user?.role === "admin") {
      const deleted = await photoGalleryModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Photo gallery image deleted permanently", photo: deleted });
    }

    photo.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await photo.save();

    res.status(200).json({ message: "Photo gallery image moved to deleted review.", photo });
  } catch (error) {
    res.status(500).json({ message: "Error deleting photo gallery image", error: getErrorMessage(error) });
  }
};

export const getDeletedTestimonies = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await testimonyModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted testimonies", error: getErrorMessage(error) });
  }
};

export const restoreTestimony = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await testimonyModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Testimony not found" });
    }
    item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
    const restored = await item.save();
    res.status(200).json({ message: "Testimony restored successfully", testimony: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring testimony", error: getErrorMessage(error) });
  }
};

export const permanentDeleteTestimony = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await testimonyModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Testimony not found" });
    }
    res.status(200).json({ message: "Testimony permanently deleted", testimony: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting testimony", error: getErrorMessage(error) });
  }
};

export const undoLastTestimonyEdit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await testimonyModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Testimony not found" });
    }
    const history = Array.isArray((item as any).editHistory) ? (item as any).editHistory : [];
    const lastVersion = history[history.length - 1];
    if (!lastVersion) {
      return res.status(400).json({ message: "No edit history to undo." });
    }
    const currentSnapshot = {
      name: item.name,
      message: item.message,
      image: item.image,
      isActive: item.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };
    item.set({
      name: lastVersion.name,
      message: lastVersion.message,
      image: lastVersion.image,
      isActive: Boolean(lastVersion.isActive),
      editHistory: [...history.slice(0, -1), currentSnapshot],
    });
    const updated = await item.save();
    res.status(200).json({ message: "Testimony reverted to previous version", testimony: updated });
  } catch (error) {
    res.status(500).json({ message: "Error undoing testimony edit", error: getErrorMessage(error) });
  }
};

export const getDeletedInterviews = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await interviewModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted interviews", error: getErrorMessage(error) });
  }
};

export const restoreInterview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await interviewModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Interview not found" });
    }
    item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
    const restored = await item.save();
    res.status(200).json({ message: "Interview restored successfully", interview: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring interview", error: getErrorMessage(error) });
  }
};

export const permanentDeleteInterview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await interviewModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Interview not found" });
    }
    res.status(200).json({ message: "Interview permanently deleted", interview: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting interview", error: getErrorMessage(error) });
  }
};

export const undoLastInterviewEdit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await interviewModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Interview not found" });
    }
    const history = Array.isArray((item as any).editHistory) ? (item as any).editHistory : [];
    const lastVersion = history[history.length - 1];
    if (!lastVersion) {
      return res.status(400).json({ message: "No edit history to undo." });
    }
    const currentSnapshot = {
      name: item.name,
      role: item.role,
      message: item.message,
      qa: item.qa,
      image: item.image,
      isActive: item.isActive,
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };
    item.set({
      name: lastVersion.name,
      role: lastVersion.role,
      message: lastVersion.message,
      qa: Array.isArray(lastVersion.qa) ? lastVersion.qa : [],
      image: lastVersion.image,
      isActive: Boolean(lastVersion.isActive),
      editHistory: [...history.slice(0, -1), currentSnapshot],
    });
    const updated = await item.save();
    res.status(200).json({ message: "Interview reverted to previous version", interview: updated });
  } catch (error) {
    res.status(500).json({ message: "Error undoing interview edit", error: getErrorMessage(error) });
  }
};

export const getDeletedPhotoGallery = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await photoGalleryModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted photo gallery", error: getErrorMessage(error) });
  }
};

export const restorePhotoGallery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await photoGalleryModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Photo gallery image not found" });
    }
    item.set({ isDeleted: false, deletedAt: null, deletedBy: { id: "", name: "", email: "", role: "" } });
    const restored = await item.save();
    res.status(200).json({ message: "Photo gallery image restored successfully", photo: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring photo gallery image", error: getErrorMessage(error) });
  }
};

export const permanentDeletePhotoGallery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await photoGalleryModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Photo gallery image not found" });
    }
    res.status(200).json({ message: "Photo gallery image permanently deleted", photo: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting photo gallery image", error: getErrorMessage(error) });
  }
};
