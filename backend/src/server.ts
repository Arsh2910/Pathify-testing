import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

// Handle Uncaught Exceptions
process.on("uncaughtException", (err: Error) => {
  console.log("UNCAUGHT EXCEPTION!  Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.MONGODB_URI;

if (!DB) {
  throw new Error("MONGODB_URI is not configured");
}

mongoose.connect(DB).then(() => {
  console.log("DB connection successful!");
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle Unhandled Rejections
process.on("unhandledRejection", (err: Error) => {
  console.log("UNHANDLED REJECTION!  Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
