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
