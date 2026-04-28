import { Request, Response } from "express";
import pastEditionModel from "../model/pastEdition.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

export const getPastEditions = async (_: Request, res: Response) => {
  try {
    const pastEditions = await pastEditionModel.find().sort({ createdAt: -1 });
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

    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const pastEditions = await pastEditionModel.insertMany(
      uploadedImages.map((image) => ({
        title: trimmedTitle,
        image,
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

export const deletePastEdition = async (req: Request, res: Response) => {
  try {
    const deletedPastEdition = await pastEditionModel.findByIdAndDelete(req.params.id);

    if (!deletedPastEdition) {
      return res.status(404).json({ message: "Past edition not found" });
    }

    res.status(200).json({ message: "Past edition deleted successfully", pastEdition: deletedPastEdition });
  } catch (error) {
    console.error("Error deleting past edition:", error);
    res.status(500).json({ message: "Error deleting past edition", error: getErrorMessage(error) });
  }
};
