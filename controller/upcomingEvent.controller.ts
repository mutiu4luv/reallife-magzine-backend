import { Request, Response } from "express";
import upcomingEventModel from "../model/upcomingEvent.model";
import { getErrorMessage } from "../utils/imageUpload";

export const getUpcomingEvents = async (_: Request, res: Response) => {
  try {
    const events = await upcomingEventModel.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ message: "Error fetching upcoming events", error: getErrorMessage(error) });
  }
};

export const createUpcomingEvent = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const event = await upcomingEventModel.create({
      title,
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
