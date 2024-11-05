const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema(
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
      required: false,
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (_doc, comments) => {
        delete comments.createdAt;
        return comments;
      },
    },
  }
);

module.exports = commentsSchema;
