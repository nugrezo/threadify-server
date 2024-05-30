const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    image: String,
    contentType: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now },
  },
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  }
);

module.exports = mongoose.model("Image", imageSchema);
