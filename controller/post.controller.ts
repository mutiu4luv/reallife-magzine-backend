import postModel from "../model/post.model";
import { Request, Response } from "express";
import {
  isDatabaseConnected,
  sendDatabaseUnavailable,
  sendEmptyListWhenDatabaseUnavailable,
} from "../utils/databaseStatus";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

export const getPosts = async (_: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendEmptyListWhenDatabaseUnavailable(res);
      return;
    }

    const posts = await postModel.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts", error: getErrorMessage(error) });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendDatabaseUnavailable(res);
      return;
    }

    const { title, type, desc, imageUrl, image } = req.body;
    const file = (req as Request & { file?: UploadedFile }).file;
    const imageSource = imageUrl || image;

    if (!title || !type || !desc) {
      return res.status(400).json({ message: "Title, type, and description are required" });
    }

    const uploadedImageUrl = await uploadImage("reality_life_posts", file, imageSource);
    if (!uploadedImageUrl) {
      return res.status(400).json({
        message: "Image is required. Upload a file named 'image' or provide an imageUrl.",
      });
    }

    const post = await postModel.create({
      title,
      type,
      desc,
      image: uploadedImageUrl,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating post", error: errorMessage });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      sendDatabaseUnavailable(res);
      return;
    }

    const deletedPost = await postModel.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully", post: deletedPost });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post", error: getErrorMessage(error) });
  }
};
