import postModel from "../model/post.model";
import { Request, Response } from "express";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

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

const getUploadedFiles = (req: Request) => {
  const requestWithFiles = req as Request & { file?: UploadedFile; files?: UploadedFile[] };
  return requestWithFiles.files?.length
    ? requestWithFiles.files
    : requestWithFiles.file
      ? [requestWithFiles.file]
      : [];
};

const uploadPostImages = async (files: UploadedFile[], imageSources: string[]) => {
  const fileUrls = (
    await Promise.all(files.map((file) => uploadImage("reality_life_posts", file)))
  ).filter((image): image is string => Boolean(image));
  const sourceUrls = (
    await Promise.all(imageSources.map((imageSource) => uploadImage("reality_life_posts", undefined, imageSource)))
  ).filter((image): image is string => Boolean(image));

  return [...fileUrls, ...sourceUrls];
};

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
    const { title, type, desc, imageUrl, image, imageUrls, images } = req.body;
    const files = getUploadedFiles(req);
    const imageSources = [
      ...parseImageList(imageUrls || images),
      ...parseImageList(imageUrl || image),
    ];

    if (!title || !type || !desc) {
      return res.status(400).json({ message: "Title, type, and description are required" });
    }

    const uploadedImages = await uploadPostImages(files, imageSources);
    if (!uploadedImages.length) {
      return res.status(400).json({
        message: "Image is required. Upload files named 'images' or provide imageUrls.",
      });
    }

    const post = await postModel.create({
      title,
      type,
      desc,
      image: uploadedImages[0],
      images: uploadedImages,
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

    const { title, type, desc, imageUrl, image, imageUrls, images } = req.body;
    const files = getUploadedFiles(req);
    const imageSources = [
      ...parseImageList(imageUrls || images),
      ...parseImageList(imageUrl || image),
    ];

    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (desc !== undefined && !desc?.trim()) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    if (type !== undefined && !["Magazine", "Book"].includes(type)) {
      return res.status(400).json({ message: "Type must be Magazine or Book" });
    }

    const uploadedImages = await uploadPostImages(files, imageSources);
    const shouldUpdateImages = uploadedImages.length > 0;
    const currentImages = Array.isArray(existingPost.images) && existingPost.images.length
      ? existingPost.images
      : existingPost.image
        ? [existingPost.image]
        : [];
    const nextImages = shouldUpdateImages ? uploadedImages : currentImages;

    existingPost.set({
      title: title === undefined ? existingPost.title : title.trim(),
      type: type === undefined ? existingPost.type : type,
      desc: desc === undefined ? existingPost.desc : desc.trim(),
      image: nextImages[0] || existingPost.image,
      images: nextImages,
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
