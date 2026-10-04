import User from "../models/User.model";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import { OAuth2Client } from "google-auth-library";
import type { NextFunction, Request, Response } from "express";
import type { UserDocument } from "../models/User.model";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  // Remove the password from the response without mutating the document.
  const safeUser = user.toObject();
  delete safeUser.password;

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
    const { email, password } = req.body as { email: string; password: string };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    const newUser = await User.create({
      email,
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

// Google OAuth — frontend sends the Google ID token, we verify + find/create user
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      return next(new AppError("Google ID token is required", 400));
    }

    // Verify the token with Google
    const clientId = process.env.GOOGLE_CLIENT_ID as string;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return next(new AppError("Invalid Google token", 401));
    }

    const { email } = payload;

    // Find existing user or create a new one (no password for OAuth users)
    let user = (await User.findOne({ email })) as UserDocument | null;

    if (!user) {
      user = (await User.create({ email })) as UserDocument;
    }

    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
