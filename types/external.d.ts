declare module "cors" {
  import { RequestHandler } from "express";

  function cors(): RequestHandler;

  export = cors;
}
