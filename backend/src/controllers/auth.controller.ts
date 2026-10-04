import User from "../models/User.model";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import type { NextFunction, Request, Response } from "express";
import type { UserDocument } from "../models/User.model";

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

    const googleUser = (await googleRes.json()) as { email?: string };

    if (!googleUser.email) {
      return next(new AppError("Could not retrieve email from Google", 401));
    }

    const { email } = googleUser;

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
