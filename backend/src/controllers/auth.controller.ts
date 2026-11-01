import crypto from "crypto";
import User from "../models/User.model";
import Roadmap from "../models/Roadmap.model";
import Phase from "../models/Phase.model";
import Milestone from "../models/Milestone.model";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import type { NextFunction, Request, Response } from "express";
import type { UserDocument } from "../models/User.model";
import { sendPasswordResetEmail } from "../services/email.service";
import { validatePassword } from "../utils/passwordValidator";

const signToken = (id: string): string => {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "30d") as NonNullable<
      jwt.SignOptions["expiresIn"]
    >,
  };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, options);
};

const createSendToken = (
  user: UserDocument,
  statusCode: number,
  res: Response,
) => {
  const token = signToken(user._id.toString());

  // Remove the password and reset fields from the response without mutating the document.
  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.passwordResetToken;
  delete safeUser.passwordResetExpires;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: safeUser,
    },
  });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email: string;
      password: string;
    };

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return next(new AppError(pwCheck.message!, 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    const newUser = await User.create({
      ...(name?.trim() ? { name: name.trim() } : {}),
      email: email.toLowerCase().trim(),
      password,
    });

    createSendToken(newUser as UserDocument, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }

    const user = (await User.findOne({ email }).select(
      "+password",
    )) as UserDocument | null;

    if (!user || !(await user.comparePassword(password, user.password!))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Google OAuth — frontend sends Google access_token, we verify via userinfo endpoint
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { access_token, idToken } = req.body as {
      access_token?: string;
      idToken?: string;
    };
    const token = access_token || idToken;

    if (!token) {
      return next(new AppError("Google access token is required", 400));
    }

    // Fetch the user's profile from Google using the access token
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
    );

    if (!googleRes.ok) {
      return next(new AppError("Failed to verify Google token", 401));
    }

    const googleUser = (await googleRes.json()) as {
      email?: string;
      name?: string;
    };

    if (!googleUser.email) {
      return next(new AppError("Could not retrieve email from Google", 401));
    }

    const { email, name } = googleUser;

    // Find existing user or create a new one (no password for OAuth users)
    let user = (await User.findOne({ email })) as UserDocument | null;

    if (!user) {
      user = (await User.create({
        email,
        ...(name ? { name } : {}),
      })) as UserDocument;
    } else if (name && !user.name) {
      user.name = name;
      await user.save({ validateBeforeSave: false });
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Forgot Password — Generates 6-digit reset code, valid for 15 minutes
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      return next(new AppError("Please provide your email address", 400));
    }

    const user = (await User.findOne({
      email: email.toLowerCase().trim(),
    })) as UserDocument | null;

    if (!user) {
      // Security best practice: don't reveal email non-existence, but confirm attempt
      return res.status(200).json({
        status: "success",
        message:
          "If an account with that email exists, a 6-digit reset code has been generated.",
      });
    }

    // Generate reset code and save expiry
    const resetCode = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send real email via Nodemailer (or dev console fallback if SMTP is not configured)
    const emailResult = await sendPasswordResetEmail(user.email, resetCode, user.name);

    if (emailResult.sent) {
      return res.status(200).json({
        status: "success",
        message: `A 6-digit password reset code and direct link have been sent to ${user.email}. Please check your inbox.`,
        emailSent: true,
      });
    }

    // Dev mode fallback: credentials missing or send failed
    res.status(200).json({
      status: "success",
      message: emailResult.error
        ? `Could not deliver email (${emailResult.error}). Falling back to dev mode.`
        : "Password reset code generated (Dev Mode: SMTP not configured in .env).",
      resetCode, // exposed only in dev fallback
      emailSent: false,
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password — Verifies 6-digit reset code and sets new password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, token, password } = req.body as {
      email?: string;
      token?: string;
      password?: string;
    };

    if (!email || !token || !password) {
      return next(
        new AppError("Email, reset code, and new password are required", 400),
      );
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return next(new AppError(pwCheck.message!, 400));
    }

    // Hash the token entered by the user
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // Find user with matching token and valid expiry
    const user = (await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })) as UserDocument | null;

    if (!user) {
      return next(
        new AppError(
          "Reset code is invalid or has expired. Please request a new one.",
          400,
        ),
      );
    }

    // Set new password
    user.password = password;
    user.set("passwordResetToken", undefined);
    user.set("passwordResetExpires", undefined);
    await user.save();

    // Log the user in directly with new token
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Get Current User Profile (e.g. for session restoration / verification)
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const user = (await User.findById(req.user._id)) as UserDocument | null;
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.passwordResetToken;
    delete safeUser.passwordResetExpires;

    res.status(200).json({
      status: "success",
      data: {
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update Password (for authenticated users)
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return next(
        new AppError("Please provide current and new password", 400),
      );
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      return next(new AppError(pwCheck.message!, 400));
    }

    if (currentPassword === newPassword) {
      return next(
        new AppError("New password must be different from current password", 400),
      );
    }

    const user = (await User.findById(req.user._id).select(
      "+password",
    )) as UserDocument | null;

    if (!user || !(await user.comparePassword(currentPassword, user.password!))) {
      return next(new AppError("Your current password is incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Permanently Delete Account & Associated Data
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    const userId = req.user._id;

    // Cascade delete roadmaps, phases, and milestones
    const roadmaps = await Roadmap.find({ user: userId }).select("_id");
    const roadmapIds = roadmaps.map((r) => r._id);

    const phases = await Phase.find({ roadmap: { $in: roadmapIds } }).select(
      "_id",
    );
    const phaseIds = phases.map((p) => p._id);

    await Milestone.deleteMany({ phase: { $in: phaseIds } });
    await Phase.deleteMany({ roadmap: { $in: roadmapIds } });
    await Roadmap.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: "success",
      message: "Account and all associated roadmaps permanently deleted.",
    });
  } catch (err) {
    next(err);
  }
};
