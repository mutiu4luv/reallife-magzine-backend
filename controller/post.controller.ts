import postModel from "../model/post.model";
import { Request, Response } from "express";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

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

const getUploadedPdfFile = (req: Request) => {
  const requestWithPdf = req as Request & { pdfFile?: UploadedFile };
  return requestWithPdf.pdfFile;
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

const getEditorMeta = (req: AuthenticatedRequest) => ({
  id: String(req.user?._id || ""),
  name: req.user?.name || "",
  email: req.user?.email || "",
  role: req.user?.role || "",
});

export const getPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await postModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts", error: getErrorMessage(error) });
  }
};

export const getMagazines = async (_req: Request, res: Response) => {
  try {
    const magazines = await postModel
      .find({ type: "Magazine", isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });

    res.status(200).json(
      magazines.map((magazine) => ({
        ...magazine.toObject(),
        coverImage: String((magazine as any).coverImage || magazine.image || "").trim(),
      }))
    );
  } catch (error) {
    console.error("Error fetching magazines:", error);
    res.status(500).json({ message: "Error fetching magazines", error: getErrorMessage(error) });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await postModel.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

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
    const { title, type, desc, imageUrl, image, imageUrls, images, downloadUrl } = req.body;
    const files = getUploadedFiles(req);
    const pdfFile = getUploadedPdfFile(req);
    const imageSources = [
      ...parseImageList(imageUrls || images),
      ...parseImageList(imageUrl || image),
    ];

    if (!title || !type || !desc) {
      return res.status(400).json({ message: "Title, type, and description are required" });
    }

    const uploadedImages = await uploadPostImages(files, imageSources);
    const uploadedPdfUrl = pdfFile ? await uploadImage("reality_life_posts", pdfFile) : "";
    if (!uploadedImages.length) {
      return res.status(400).json({
        message: "Image is required. Upload files named 'images' or provide imageUrls.",
      });
    }

    const authReq = req as AuthenticatedRequest;
    const post = await postModel.create({
      title,
      type,
      desc,
      coverImage: uploadedImages[0],
      image: uploadedImages[0],
      images: uploadedImages,
      downloadUrl:
        (typeof downloadUrl === "string" ? downloadUrl.trim() : "") || uploadedPdfUrl || "",
      createdBy: getEditorMeta(authReq),
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    const errorMessage = getErrorMessage(error);
    const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;

    res.status(statusCode).json({ message: "Error creating post", error: errorMessage });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingPost = await postModel.findById(req.params.id);

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (req.user?.role === "blogger") {
      const ownerId = String((existingPost as any).createdBy?.id || "");
      if (!ownerId || ownerId !== String(req.user?._id || "")) {
        return res.status(403).json({ message: "You can only edit blogs you created." });
      }
    }

    const { title, type, desc, imageUrl, image, imageUrls, images, downloadUrl } = req.body;
    const files = getUploadedFiles(req);
    const pdfFile = getUploadedPdfFile(req);
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
    const uploadedPdfUrl = pdfFile ? await uploadImage("reality_life_posts", pdfFile) : "";
    const shouldUpdateImages = uploadedImages.length > 0;
    const currentImages = Array.isArray(existingPost.images) && existingPost.images.length
      ? existingPost.images
      : existingPost.image
        ? [existingPost.image]
        : [];
    const nextImages = shouldUpdateImages ? uploadedImages : currentImages;

    const previousVersion = {
      title: existingPost.title,
      type: existingPost.type,
      desc: existingPost.desc,
      image: existingPost.image,
      images: Array.isArray(existingPost.images) ? existingPost.images : [],
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    existingPost.set({
      title: title === undefined ? existingPost.title : title.trim(),
      type: type === undefined ? existingPost.type : type,
      desc: desc === undefined ? existingPost.desc : desc.trim(),
      coverImage: shouldUpdateImages ? nextImages[0] || existingPost.coverImage || existingPost.image : existingPost.coverImage || existingPost.image,
      image: nextImages[0] || existingPost.image,
      images: nextImages,
      downloadUrl:
        downloadUrl === undefined
          ? uploadedPdfUrl || existingPost.downloadUrl || ""
          : String(downloadUrl).trim() || uploadedPdfUrl || existingPost.downloadUrl || "",
      editHistory: [...(existingPost.editHistory || []), previousVersion],
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

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (req.user?.role === "admin") {
      const deletedPost = await postModel.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Post deleted permanently", post: deletedPost });
    }

    post.set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: getEditorMeta(req),
    });
    await post.save();
    res.status(200).json({ message: "Post moved to deleted review.", post });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post", error: getErrorMessage(error) });
  }
};

export const getDeletedPosts = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await postModel.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching deleted posts:", error);
    res.status(500).json({ message: "Error fetching deleted posts", error: getErrorMessage(error) });
  }
};

export const restorePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.set({
      isDeleted: false,
      deletedAt: null,
      deletedBy: { id: "", name: "", email: "", role: "" },
    });
    const restoredPost = await post.save();
    res.status(200).json({ message: "Post restored successfully", post: restoredPost });
  } catch (error) {
    console.error("Error restoring post:", error);
    res.status(500).json({ message: "Error restoring post", error: getErrorMessage(error) });
  }
};

export const permanentDeletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deletedPost = await postModel.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted permanently", post: deletedPost });
  } catch (error) {
    console.error("Error permanently deleting post:", error);
    res.status(500).json({ message: "Error permanently deleting post", error: getErrorMessage(error) });
  }
};

export const getPostDownload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await postModel.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.type !== "Magazine") {
      return res.status(400).json({ message: "Only magazines can be downloaded from this endpoint." });
    }

    const canDownload = req.user?.role === "admin" || req.user?.magazineAccessStatus === "approved";
    if (!canDownload) {
      return res.status(403).json({ message: "Payment approval is required before downloading this magazine." });
    }

    const downloadUrl = String((post as any).downloadUrl || "").trim() || post.image;
    if (!downloadUrl) {
      return res.status(404).json({ message: "This magazine does not have a download file yet." });
    }

    res.status(200).json({ downloadUrl });
  } catch (error) {
    console.error("Error unlocking magazine download:", error);
    res.status(500).json({ message: "Unable to unlock magazine download", error: getErrorMessage(error) });
  }
};

export const undoLastPostEdit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const history = Array.isArray(post.editHistory) ? post.editHistory : [];
    const lastVersion = history[history.length - 1];

    if (!lastVersion) {
      return res.status(400).json({ message: "No edit history to undo." });
    }

    const currentSnapshot = {
      title: post.title,
      type: post.type,
      desc: post.desc,
      image: post.image,
      images: Array.isArray(post.images) ? post.images : [],
      editedAt: new Date(),
      editedBy: getEditorMeta(req),
    };

    post.set({
      title: lastVersion.title,
      type: lastVersion.type,
      desc: lastVersion.desc,
      image: lastVersion.image,
      images: Array.isArray(lastVersion.images) ? lastVersion.images : [],
      editHistory: [...history.slice(0, -1), currentSnapshot],
    });

    const updatedPost = await post.save();
    res.status(200).json({ message: "Post reverted to previous version", post: updatedPost });
  } catch (error) {
    console.error("Error undoing post edit:", error);
    res.status(500).json({ message: "Error undoing post edit", error: getErrorMessage(error) });
  }
};
