const mongoose = require("mongoose");

const likesSchema = new mongoose.Schema(
  {
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (_doc, likes) => {
        delete likes.createdAt;
        return likes;
      },
    },
  }
);

module.exports = likesSchema;
