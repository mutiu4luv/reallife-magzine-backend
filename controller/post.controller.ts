import postModel from "../model/post.model";
import { Request, Response } from "express";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

export const getPosts = async (_: Request, res: Response) => {
  try {
    const posts = await postModel.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts", error: getErrorMessage(error) });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Error fetching post", error: getErrorMessage(error) });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
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

export const updatePost = async (req: Request, res: Response) => {
  try {
    const existingPost = await postModel.findById(req.params.id);

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    const { title, type, desc, imageUrl, image } = req.body;
    const file = (req as Request & { file?: UploadedFile }).file;
    const imageSource = imageUrl || image;

    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (desc !== undefined && !desc?.trim()) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    if (type !== undefined && !["Magazine", "Book"].includes(type)) {
      return res.status(400).json({ message: "Type must be Magazine or Book" });
    }

    const uploadedImageUrl = await uploadImage("reality_life_posts", file, imageSource);

    existingPost.set({
      title: title === undefined ? existingPost.title : title.trim(),
      type: type === undefined ? existingPost.type : type,
      desc: desc === undefined ? existingPost.desc : desc.trim(),
      image: uploadedImageUrl || existingPost.image,
    });

    const updatedPost = await existingPost.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error updating post", error: errorMessage });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
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
