const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  images: [{ type: String }] // New field to store image data
});

module.exports = mongoose.model("User", userSchema);