const mongoose = require("mongoose");

const likesSchema = new mongoose.Schema(
  {
    likeNumber: {
      type: Number,
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
