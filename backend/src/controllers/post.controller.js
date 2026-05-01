import Post from "../models/Post.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newPost = await Post.create({
      user: req.user._id,
      image,
      caption,
    });

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.log("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL POSTS
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.log("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LIKE / UNLIKE POST
export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.log("Error toggling like:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      text,
      user: req.user._id,
    });

    await post.save();

    res.status(201).json({
      message: "Comment added",
      comments: post.comments,
    });
  } catch (error) {
    console.log("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only owner can delete
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET POSTS BY USER
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id;

    const posts = await Post.find({ user: userId })
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    console.log("Error fetching user posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};