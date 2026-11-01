import express from "express";
import * as milestoneController from "../controllers/milestone.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(protect);

router.patch("/:id", milestoneController.updateMilestone);
router.post("/:id/resources/refresh", milestoneController.refreshMilestoneResources);
router.post("/:id/breakdown", milestoneController.breakdownMilestone);
router.post("/phases/:phaseId", milestoneController.createMilestone);

export default router;
