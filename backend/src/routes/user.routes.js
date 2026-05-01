import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getRecommendedUsers,
  outgoingFriendRequest,
  sendFriendRequest,
  toggleFollow,
  getUserProfile,
  getSuggestedUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.put("/:id/follow", toggleFollow);

// 🔴 FIX: put BEFORE ":id"
router.get("/suggested", getSuggestedUsers);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", outgoingFriendRequest);

// keep this LAST
router.get("/:id", getUserProfile);

export default router;