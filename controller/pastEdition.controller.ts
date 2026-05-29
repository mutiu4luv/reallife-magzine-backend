import { Request, Response } from "express";
import pastEditionModel from "../model/pastEdition.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

const getEditorMeta = (req: AuthenticatedRequest) => ({
  id: String(req.user?._id || ""),
  name: req.user?.name || "",
  email: req.user?.email || "",
  role: req.user?.role || "",
});

export const getPastEditions = async (_: Request, res: Response) => {
  try {
    const pastEditions = await pastEditionModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(pastEditions);
  } catch (error) {
    console.error("Error fetching past editions:", error);
    res.status(500).json({ message: "Error fetching past editions", error: getErrorMessage(error) });
  }
};

export const createPastEditions = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const files = ((req as Request & { files?: UploadedFile[] }).files || []) as UploadedFile[];

    if (!files.length) {
      return res.status(400).json({
        message: "At least one image is required. Upload files named 'images'.",
      });
    }

    const images = await Promise.all(
      files.map((file) => uploadImage("reality_life_past_editions", file))
    );
    const uploadedImages = images.filter((image): image is string => Boolean(image));

    if (!uploadedImages.length) {
      return res.status(400).json({ message: "Unable to upload past edition images" });
    }

    const authReq = req as AuthenticatedRequest;
    const createdBy = getEditorMeta(authReq);
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const pastEditions = await pastEditionModel.insertMany(
      uploadedImages.map((image) => ({
        title: trimmedTitle,
        image,
        createdBy,
      }))
    );

    res.status(201).json(pastEditions);
  } catch (error) {
    console.error("Error creating past editions:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating past editions", error: errorMessage });
  }
};

export const deletePastEdition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await pastEditionModel.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Past edition not found" });
    }

    if (req.user?.role === "admin") {
      const deletedPastEdition = await pastEditionModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Past edition deleted permanently", pastEdition: deletedPastEdition });
    }

    item.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await item.save();
    res.status(200).json({ message: "Past edition moved to deleted review.", pastEdition: item });
  } catch (error) {
    console.error("Error deleting past edition:", error);
    res.status(500).json({ message: "Error deleting past edition", error: getErrorMessage(error) });
  }
};

export const getDeletedPastEditions = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await pastEditionModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deleted past editions", error: getErrorMessage(error) });
  }
};

export const restorePastEdition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await pastEditionModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Past edition not found" });
    }
    item.set({
      isDeleted: false,
      deletedAt: null,
      deletedBy: { id: "", name: "", email: "", role: "" },
    });
    const restored = await item.save();
    res.status(200).json({ message: "Past edition restored successfully", pastEdition: restored });
  } catch (error) {
    res.status(500).json({ message: "Error restoring past edition", error: getErrorMessage(error) });
  }
};

export const permanentDeletePastEdition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await pastEditionModel.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Past edition not found" });
    }
    res.status(200).json({ message: "Past edition permanently deleted", pastEdition: item });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting past edition", error: getErrorMessage(error) });
  }
};
