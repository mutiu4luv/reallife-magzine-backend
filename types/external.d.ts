declare module "cors" {
  import { RequestHandler } from "express";

  type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

  interface CorsOptions {
    origin?: (origin: string | undefined, callback: CorsOriginCallback) => void;
    credentials?: boolean;
  }

  function cors(): RequestHandler;
  function cors(options: CorsOptions): RequestHandler;

  export = cors;
}
