import { Request, Response } from "express";
import commentModel from "../model/comment.model";
import readerCounterModel from "../model/readerCounter.model";

const normalizeContentType = (value: unknown) => {
  const contentType = String(value || "").trim().toLowerCase();
  return contentType === "post" || contentType === "news" || contentType === "event" ? contentType : "";
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const contentType = normalizeContentType(req.query.contentType);
    const contentId = String(req.query.contentId || "").trim();

    if (!contentType || !contentId) {
      return res.status(400).json({ message: "contentType and contentId are required." });
    }

    const comments = await commentModel
      .find({ contentType, contentId })
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const contentType = normalizeContentType(req.body.contentType);
    const contentId = String(req.body.contentId || "").trim();
    const name = String(req.body.name || "").trim();
    const message = String(req.body.message || "").trim();

    if (!contentType || !contentId || !name || !message) {
      return res.status(400).json({ message: "contentType, contentId, name, and message are required." });
    }

    const comment = await commentModel.create({
      contentType,
      contentId,
      name,
      message,
      likes: 0,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Error creating comment" });
  }
};

export const likeComment = async (req: Request, res: Response) => {
  try {
    const updated = await commentModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ message: "Error updating comment like" });
  }
};

export const getReaders = async (req: Request, res: Response) => {
  try {
    const contentType = normalizeContentType(req.params.contentType);
    const contentId = String(req.params.contentId || "").trim();

    if (!contentType || !contentId) {
      return res.status(400).json({ message: "Valid content type and content id are required." });
    }

    const readerCounter = await readerCounterModel.findOne({ contentType, contentId });

    res.status(200).json({
      contentType,
      contentId,
      readers: Number(readerCounter?.readers || 0),
    });
  } catch (error) {
    console.error("Error fetching readers:", error);
    res.status(500).json({ message: "Error fetching reader count" });
  }
};

export const incrementReaders = async (req: Request, res: Response) => {
  try {
    const contentType = normalizeContentType(req.params.contentType);
    const contentId = String(req.params.contentId || "").trim();

    if (!contentType || !contentId) {
      return res.status(400).json({ message: "Valid content type and content id are required." });
    }

    const updated = await readerCounterModel.findOneAndUpdate(
      { contentType, contentId },
      { $inc: { readers: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      contentType,
      contentId,
      readers: Number(updated?.readers || 0),
    });
  } catch (error) {
    console.error("Error incrementing readers:", error);
    res.status(500).json({ message: "Error updating reader count" });
  }
};
