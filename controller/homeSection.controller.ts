import { Request, Response } from "express";
import interviewModel from "../model/interview.model";
import photoGalleryModel from "../model/photoGallery.model";
import testimonyModel from "../model/testimony.model";
import { getErrorMessage, uploadImage, UploadedFile } from "../utils/imageUpload";

const parseBoolean = (value: unknown, fallback = true) => {
  if (value === undefined) {
    return fallback;
  }

  return value === true || value === "true" || value === "on";
};

const parseQa = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is { question: string; answer: string } =>
        typeof item?.question === "string" && typeof item?.answer === "string"
    );
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parseQa(parsed);
    } catch {
      return [];
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

const uploadSectionImages = async (folder: string, files: UploadedFile[], imageUrls: string[] = []) => {
  const fileUrls = (
    await Promise.all(files.map((file) => uploadImage(folder, file)))
  ).filter((image): image is string => Boolean(image));
  const sourceUrls = (
    await Promise.all(imageUrls.map((imageUrl) => uploadImage(folder, undefined, imageUrl)))
  ).filter((image): image is string => Boolean(image));

  return [...fileUrls, ...sourceUrls];
};

export const getTestimonies = async (_req: Request, res: Response) => {
  try {
    const testimonies = await testimonyModel.find().sort({ createdAt: -1 });
    res.status(200).json(testimonies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching testimonies", error: getErrorMessage(error) });
  }
};

export const createTestimony = async (req: Request, res: Response) => {
  try {
    const { name, message, imageUrl } = req.body;
    const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !message?.trim() || !images.length) {
      return res.status(400).json({ message: "Name, message, and image are required" });
    }

    const testimony = await testimonyModel.create({
      name: name.trim(),
      message: message.trim(),
      image: images[0],
      isActive: parseBoolean(req.body.isActive),
    });

    res.status(201).json(testimony);
  } catch (error) {
    res.status(500).json({ message: "Error creating testimony", error: getErrorMessage(error) });
  }
};

export const updateTestimony = async (req: Request, res: Response) => {
  try {
    const { name, message, imageUrl } = req.body;
    const images = await uploadSectionImages("reality_life_testimonies", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    const update: Record<string, unknown> = {
      name: name.trim(),
      message: message.trim(),
      isActive: parseBoolean(req.body.isActive),
    };

    if (images.length) {
      update.image = images[0];
    }

    const testimony = await testimonyModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    res.status(200).json(testimony);
  } catch (error) {
    res.status(500).json({ message: "Error updating testimony", error: getErrorMessage(error) });
  }
};

export const deleteTestimony = async (req: Request, res: Response) => {
  try {
    const testimony = await testimonyModel.findByIdAndDelete(req.params.id);

    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    res.status(200).json({ message: "Testimony deleted successfully", testimony });
  } catch (error) {
    res.status(500).json({ message: "Error deleting testimony", error: getErrorMessage(error) });
  }
};

export const getInterviews = async (_req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.find().sort({ createdAt: -1 });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching interviews", error: getErrorMessage(error) });
  }
};

export const createInterview = async (req: Request, res: Response) => {
  try {
    const { name, role, message, imageUrl } = req.body;
    const qa = parseQa(req.body.qa);
    const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !role?.trim() || !images.length || !qa.length) {
      return res.status(400).json({ message: "Name, role, image, and at least one Q&A are required" });
    }

    const interview = await interviewModel.create({
      name: name.trim(),
      role: role.trim(),
      message: typeof message === "string" ? message.trim() : "",
      qa,
      image: images[0],
      isActive: parseBoolean(req.body.isActive),
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: "Error creating interview", error: getErrorMessage(error) });
  }
};

export const updateInterview = async (req: Request, res: Response) => {
  try {
    const { name, role, message, imageUrl } = req.body;
    const qa = parseQa(req.body.qa);
    const images = await uploadSectionImages("reality_life_interviews", getUploadedFiles(req), imageUrl ? [imageUrl] : []);

    if (!name?.trim() || !role?.trim() || !qa.length) {
      return res.status(400).json({ message: "Name, role, and at least one Q&A are required" });
    }

    const update: Record<string, unknown> = {
      name: name.trim(),
      role: role.trim(),
      message: typeof message === "string" ? message.trim() : "",
      qa,
      isActive: parseBoolean(req.body.isActive),
    };

    if (images.length) {
      update.image = images[0];
    }

    const interview = await interviewModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json(interview);
  } catch (error) {
    res.status(500).json({ message: "Error updating interview", error: getErrorMessage(error) });
  }
};

export const deleteInterview = async (req: Request, res: Response) => {
  try {
    const interview = await interviewModel.findByIdAndDelete(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json({ message: "Interview deleted successfully", interview });
  } catch (error) {
    res.status(500).json({ message: "Error deleting interview", error: getErrorMessage(error) });
  }
};

export const getPhotoGallery = async (_req: Request, res: Response) => {
  try {
    const photos = await photoGalleryModel.find().sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo gallery", error: getErrorMessage(error) });
  }
};

export const createPhotoGallery = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const images = await uploadSectionImages("reality_life_photo_gallery", getUploadedFiles(req));

    if (!images.length) {
      return res.status(400).json({ message: "At least one gallery image is required" });
    }

    const photos = await photoGalleryModel.insertMany(
      images.map((image) => ({
        title: typeof title === "string" ? title.trim() : "",
        image,
        isActive: parseBoolean(req.body.isActive),
      }))
    );

    res.status(201).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error creating photo gallery images", error: getErrorMessage(error) });
  }
};

export const deletePhotoGallery = async (req: Request, res: Response) => {
  try {
    const photo = await photoGalleryModel.findByIdAndDelete(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo gallery image not found" });
    }

    res.status(200).json({ message: "Photo gallery image deleted successfully", photo });
  } catch (error) {
    res.status(500).json({ message: "Error deleting photo gallery image", error: getErrorMessage(error) });
  }
};
