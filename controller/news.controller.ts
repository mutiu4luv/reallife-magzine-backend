import { Request, Response } from "express";
import newsModel from "../model/news.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

export const getNews = async (_: Request, res: Response) => {
  try {
    const news = await newsModel.find().sort({ createdAt: -1 });
    res.status(200).json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: "Error fetching news", error: getErrorMessage(error) });
  }
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const news = await newsModel.findById(req.params.id);

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
    const { title, description, imageUrl, image } = req.body;
    const file = (req as Request & { file?: UploadedFile }).file;
    const imageSource = imageUrl || image;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const uploadedImageUrl = await uploadImage("reality_life_news", file, imageSource);
    if (!uploadedImageUrl) {
      return res.status(400).json({
        message: "Image is required. Upload a file named 'image' or provide an imageUrl.",
      });
    }

    const news = await newsModel.create({
      title: title.trim(),
      description: description.trim(),
      image: uploadedImageUrl,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error("Error creating news:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating news", error: errorMessage });
  }
};

export const deleteNews = async (req: Request, res: Response) => {
  try {
    const deletedNews = await newsModel.findByIdAndDelete(req.params.id);

    if (!deletedNews) {
      return res.status(404).json({ message: "News item not found" });
    }

    res.status(200).json({ message: "News deleted successfully", news: deletedNews });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ message: "Error deleting news", error: getErrorMessage(error) });
  }
};
