import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  password?: string; // optional: select: false means it's absent unless explicitly selected
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
}

export interface IUserMethods {
  comparePassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

export type UserDocument = mongoose.HydratedDocument<IUser, IUserMethods>;

type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
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

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
