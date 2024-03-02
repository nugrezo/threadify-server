const mongoose = require("mongoose");
const likesSchema = require("./likes");
const commentsSchema = require("./comments");

const threadSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [likesSchema],
    comments: [commentsSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Thread", threadSchema);
