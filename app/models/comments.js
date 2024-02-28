const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
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
