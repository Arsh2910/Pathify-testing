import express from "express";
import * as roadmapController from "../controllers/roadmap.controller";
import { protect } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { createRoadmapSchema } from "../validators/roadmap.validator";
import { roadmapLimiter } from "../middlewares/rateLimiter.middleware";

const router = express.Router();

// Protect all roadmap routes
router.use(protect);

router
  .route("/")
  .get(roadmapController.getRoadmaps)
  .post(
    roadmapLimiter,
    validateRequest(createRoadmapSchema),
    roadmapController.createRoadmap,
  );

router.route("/:id").get(roadmapController.getRoadmapDetails);
router.patch(
  "/:id/phases/:phaseId/regenerate",
  roadmapLimiter,
  roadmapController.regeneratePhase,
);
router.get("/:id/next", roadmapController.getNextTask);
router.patch("/:id/abandon", roadmapController.abandonRoadmap);
router.delete("/:id", roadmapController.deleteRoadmap);
export default router;
