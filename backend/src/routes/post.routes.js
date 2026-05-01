import express from "express";
import { createPost, getPosts } from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { toggleLike } from "../controllers/post.controller.js";
import { addComment } from "../controllers/post.controller.js";
import { deletePost } from "../controllers/post.controller.js";
import { getUserPosts } from "../controllers/post.controller.js";
const router = express.Router();

router.post("/", protectRoute, createPost);
router.get("/", protectRoute, getPosts);
router.put("/:id/like", protectRoute, toggleLike);
router.post("/:id/comment", protectRoute, addComment);
router.delete("/:id", protectRoute, deletePost);
router.get("/user/:id", protectRoute, getUserPosts);

export default router;