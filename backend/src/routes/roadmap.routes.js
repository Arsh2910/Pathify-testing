const express = require("express");
const roadmapController = require("../controllers/roadmap.controller");
const { protect } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const { createRoadmapSchema } = require("../validators/roadmap.validator");
const { roadmapLimiter } = require("../middlewares/rateLimiter.middleware");

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
module.exports = router;
