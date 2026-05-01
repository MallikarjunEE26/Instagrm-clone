import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user in recommendation list
        { _id: { $nin: currentUser.friends } }, // exclude current User's Friends from the list.
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.log(
      "Error in getting Recommended Users controller!!",
      error.message
    );
    res.status(500).json({
      message: "Internal Error in Recommended User's Section",
    });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.log(
      "Error in getting User's Friends from Users controller!!",
      error.message
    );
    res.status(500).json({
      message: "Internal Error in getMyFriends Section",
    });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    //prevent sending request to Our selfs..

    if (myId === recipientId) {
      return res.status(404).json({
        message: "You can not send Request to Yourself!!",
      });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(401).json({
        message: "Recipient not found",
      });
    }
    //     if already friend
    if (recipient.friends.includes(myId)) {
      return res
        .status(404)
        .json({ message: "You are already Friend with this User" });
    }
    //     check existing request:
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "Friend request already Exists between you and this User",
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.log(
      "Error in sendFriendRequest Section-controller!!",
      error.message
    );
    res.status(500).json({
      message: "Internal Error in sendFriendRequest Section",
    });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        message: "Request not Found",
      });
    }
    //verify the current user is recipent
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not Authorised to accept this request!!",
      });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");
    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function outgoingFriendRequest(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// FOLLOW / UNFOLLOW USER
export const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      // follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing ? "Unfollowed" : "Followed",
    });
  } catch (error) {
    console.log("Follow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET USER PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "fullName profilePic")
      .populate("following", "fullName profilePic");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.log("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET SUGGESTED USERS TO FOLLOW
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    const users = await User.find({
      _id: { $ne: currentUser._id, $nin: currentUser.following },
    })
      .select("-password")
      .limit(5);

    res.status(200).json({ users });
  } catch (error) {
    console.log("Error fetching suggested users:", error);
    res.status(500).json({ message: "Server error" });
  }
};