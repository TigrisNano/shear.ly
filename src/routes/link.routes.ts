import { Router } from "express";
import {
  createLinkController,
  redirectLinkController,
  getLinkByIdController,
  getAllLinksController,
  updateLinkController,
  deleteLinkController,
} from "../controllers/link.controller";

const router = Router();
router.post("/", createLinkController);
router.get("/r/:shortCode", redirectLinkController);
router.get("/:id", getLinkByIdController);
router.get("/", getAllLinksController);
router.put("/:id", updateLinkController);
router.delete("/:id", deleteLinkController);

export default router;
