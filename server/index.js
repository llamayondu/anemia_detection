const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const { execSync } = require('child_process');
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));

// Replace <CONNECTION_STRING> with your actual MongoDB connection URI.
mongoose.connect("mongodb+srv://Mehul:Mehul293645@anemia.1mntp.mongodb.net/?retryWrites=true&w=majority&appName=Anemia")
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

app.post("/api/process-image", async (req, res) => {
  try {
    console.log("Process image endpoint called");
    const { imageData } = req.body;

    // Get userId from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, "JWT_SECRET");
    const userId = decoded.userId;

    console.log("Processing image for user:", userId);

    // Extract the base64 data (remove the data:image/jpeg;base64, part)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

    // Create a temporary directory for processing if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Create a user-specific directory
    const userDir = path.join(tempDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir);
    }

    // Save the image to a file
    const imagePath = path.join(userDir, 'image.jpg');
    fs.writeFileSync(imagePath, base64Data, 'base64');

    // Create a Python script that processes a single image
    const pythonScriptPath = path.join(userDir, 'process_image.py');
    const pythonScript = `
import cv2
import numpy as np
import json
import sys

def is_blurry(image_path, threshold=18):
    """Check if an image is blurry using the variance of the Laplacian."""
    image = cv2.imread(image_path)
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    return laplacian_var < threshold, laplacian_var

# Process the image
image_path = "${imagePath.replace(/\\/g, '\\\\')}"
is_blur, variance = is_blurry(image_path)

# Output as JSON
result = {
    "isBlurry": bool(is_blur),
    "variance": float(variance),
    "threshold": 18
}

print(json.dumps(result))
`;

    fs.writeFileSync(pythonScriptPath, pythonScript);

    // Execute the Python script
    const pythonResult = execSync(`python ${pythonScriptPath}`).toString();
    console.log("Python script output:", pythonResult);

    // Parse the output
    const results = JSON.parse(pythonResult);

    // Clean up - remove the temporary files
    fs.unlinkSync(imagePath);
    fs.unlinkSync(pythonScriptPath);

    // Send the results back to the client
    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error("Process image error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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