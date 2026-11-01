import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validatePassword } from "../utils/passwordValidator";

export interface IUser {
  name?: string | undefined;
  email: string;
  password?: string | undefined; // optional: select: false means it's absent unless explicitly selected
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date | undefined;
}

export interface IUserMethods {
  comparePassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
  createPasswordResetToken(): string;
}

export type UserDocument = mongoose.HydratedDocument<IUser, IUserMethods>;

type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // not required for Google OAuth users
      select: false,
      validate: {
        validator: function (val: string) {
          if (!val) return true;
          return validatePassword(val).isValid;
        },
        message: function (props: { value: string }) {
          return validatePassword(props.value).message || "Invalid password";
        },
      },
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password!, 12);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function (): string {
  // Generate a secure 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Code expires in 15 minutes
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return resetCode;
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
