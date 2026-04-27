import { Request, Response } from "express";
import upcomingEventModel from "../model/upcomingEvent.model";
import {
  isDatabaseConnected,
  sendDatabaseUnavailable,
  sendEmptyListWhenDatabaseUnavailable,
} from "../utils/databaseStatus";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

export const getUpcomingEvents = async (_: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendEmptyListWhenDatabaseUnavailable(res);
      return;
    }

    const events = await upcomingEventModel.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ message: "Error fetching upcoming events", error: getErrorMessage(error) });
  }
};

export const createUpcomingEvent = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendDatabaseUnavailable(res);
      return;
    }

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

export const deleteUpcomingEvent = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendDatabaseUnavailable(res);
      return;
    }

    const deletedEvent = await upcomingEventModel.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Upcoming event not found" });
    }

    res.status(200).json({ message: "Upcoming event deleted successfully", event: deletedEvent });
  } catch (error) {
    console.error("Error deleting upcoming event:", error);
    res.status(500).json({ message: "Error deleting upcoming event", error: getErrorMessage(error) });
  }
};
