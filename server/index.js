const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));

// Replace <CONNECTION_STRING> with your actual MongoDB connection URI.
mongoose.connect("mongodb+srv://Llamayondu:ZwRjJf9sHwLkmlmS@cluster0.11qns.mongodb.net/mydatabase?retryWrites=true&w=majority")
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Register route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      images: [] // Initialize with empty array
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, "JWT_SECRET", { expiresIn: "1d" });
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, "JWT_SECRET", { expiresIn: "1d" });
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// New endpoint to upload image
app.post("/api/upload-image", async (req, res) => {
  try {
    console.log("Upload image endpoint called");
    const { imageData } = req.body;
    
    // Get userId from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, "JWT_SECRET");
    const userId = decoded.userId;
    
    console.log("Uploading image for user:", userId);
    
    // Use findByIdAndUpdate for atomic operation
    const result = await User.findByIdAndUpdate(
      userId,
      { $set: { images: [imageData] } },
      { new: true }
    );
    
    if (!result) {
      console.error("User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log("Image saved successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(400).json({ error: error.message });
  }
});

// New endpoint to fetch user's images
app.get("/api/images/:userId", async (req, res) => {
  try {
    // Get userId from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, "JWT_SECRET");
    const tokenUserId = decoded.userId;
    
    // The requested userId should match the token userId
    if (req.params.userId !== tokenUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user = await User.findById(tokenUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ images: user.images || [] });
  } catch (error) {
    console.error("Get images error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Add the missing protected endpoint
app.get("/api/protected", (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, "JWT_SECRET");
    res.json({ message: "This is protected data", user: decoded.userId });
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});