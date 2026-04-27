declare module "multer" {
  import { Request, RequestHandler } from "express";

  interface Multer {
    single(fieldName: string): RequestHandler;
    array(fieldName: string, maxCount?: number): RequestHandler;
  }

  interface StorageEngine {}

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }

  type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fileSize?: number;
    };
    fileFilter?: (req: Request, file: File, callback: FileFilterCallback) => void;
  }

  class MulterError extends Error {
    code: string;
    field?: string;
    constructor(code: string, field?: string);
  }

  function memoryStorage(): StorageEngine;

  function multer(options?: Options): Multer;

  namespace multer {
    export { MulterError };
    export { memoryStorage };
  }

  export = multer;
}
