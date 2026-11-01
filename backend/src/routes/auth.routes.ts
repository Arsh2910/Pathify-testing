import express from "express";
import * as authController from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "../validators/auth.validator";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/google", authController.googleAuth);

router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword,
);

// Protected routes
router.get("/me", protect, authController.getMe);
router.patch(
  "/update-password",
  protect,
  validateRequest(updatePasswordSchema),
  authController.updatePassword,
);
router.delete("/account", protect, authController.deleteAccount);

export default router;
