const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

// Replace <CONNECTION_STRING> with your actual MongoDB connection URI.
mongoose.connect("mongodb+srv://Llamayondu:ZwRjJf9sHwLkmlmS@cluster0.11qns.mongodb.net/mydatabase?retryWrites=true&w=majority")
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Register route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});