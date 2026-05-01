import User from "../models/User.js";
import { upsertStreamUser } from "../database/stream.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  try {
    const { fullName, email, password } = req.body;
    // check that email , name , password is given or not?
    if (!email || !fullName || !password) {
      return res.status(400).json({
        message: "All of these fields are required to be full",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password Must be atleast of length 6",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    //check the email is already registered or not..
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this email already exist in our Database please try with unique Id.. ",
      });
    }
    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://api.dicebear.com/7.x/adventurer/png?seed=${idx}`;
    const newUser = await User.create({
      // Added await
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });
    // creating a user in Stream-chat
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic,
      });
      console.log(`New Stream user created with ${newUser.fullName}`);
    } catch (error) {
      console.log("Error in creating new Stream User", error);
    }
    //lets create a jwt token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

const userWithoutPassword = newUser.toObject();
delete userWithoutPassword.password;

res.status(201).json({
  message: "User created successfully",
  token,
  user: userWithoutPassword,
});
    console.log("SIGNUP BODY =>", req.body);
    console.log("JWT_SECRET =>", process.env.JWT_SECRET_KEY);
  } catch (error) {
    console.log("Error in Signup Controller:", error);
    return res.status(500).json({
      message: "Internal Error, Please try again",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter all fields, as all fields are required to fill",
      });
    }
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        message: "User with this id is not fount please enter a correct one.",
      });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect)
      return res.status(401).json({
        message: "Invalid Password",
      });

    //lets create a jwt token for login
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: false, 
      sameSite: "None",
    });
    
const userWithoutPassword = user.toObject();
delete userWithoutPassword.password;
    res.status(201).json({
      message: "User is Loged In successfully",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.log("Error in Signup Controller:", error);
    return res.status(500).json({
      message: "Internal Server Error, Please try again",
    });
  }
}

export function logout(req, res) {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "User is Loged Out Successfully!",
  });
}
export async function onBoard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;
    const missingFields = [];

    if (!fullName) missingFields.push("fullName");
    if (!bio) missingFields.push("bio");
    if (!nativeLanguage) missingFields.push("nativeLanguage");
    if (!learningLanguage) missingFields.push("learningLanguage");
    if (!location) missingFields.push("location");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required... Please enter this properly",
        missingFields,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true },
    );
    //TODO: Update User info in Stream.

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || " ",
      });
      console.log(
        `Stream User is Updated after on-Boarding ${updatedUser.fullName}`,
      );
    } catch (streamError) {
      console.log(
        "Error updating Stream User during On-Boarding!! ",
        streamError.message,
      );
    }

    if (!updatedUser)
      return res.status(401).json({
        message: "User not found",
      });
    res.status(200).json({
      success: true,
      message: "User updated Successfully!!",
      user: updatedUser,
    });
  } catch (error) {
    (console.log("On - Boarding Error!!", error),
      res.status(500).json({
        message: "Internal Server Error!!",
      }));
  }
}
