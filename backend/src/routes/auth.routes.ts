import express from "express";
import * as authController from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/google", authController.googleAuth);

export default router;
