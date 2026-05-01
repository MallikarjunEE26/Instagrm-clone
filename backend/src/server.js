import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import cors from "cors";
import { connectToDB } from "./database/db.js";
import cookieParser from "cookie-parser";
import path from "path";
import postRoutes from "./routes/post.routes.js";

dotenv.config();
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();

const PORT = process.env.PORT || 5002;
const __dirname = path.resolve();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/posts", postRoutes);

if (process.env.NODE_ENV === "production") {
  try {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
  } catch (err) {
    console.log("Frontend not found, skipping...");
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
  connectToDB();
});
