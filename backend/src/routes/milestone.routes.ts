import express from "express";
import * as milestoneController from "../controllers/milestone.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(protect);

router.patch("/:id", milestoneController.updateMilestone);

export default router;
