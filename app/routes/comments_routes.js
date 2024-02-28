// Express docs: http://expressjs.com/en/api.html
const express = require("express");
// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");

// pull in Mongoose model for examples
const Thread = require("../models/thread");
const User = require("../models/user");

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require("../../lib/custom_errors");

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404;
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership;

// this is middleware that will remove blank fields from `req.body`, e.g.
// { threadify: { title: '', text: 'foo' } } -> { threadify: { text: 'foo' } }
const removeBlanks = require("../../lib/remove_blank_fields");
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate("bearer", { session: false });

// instantiate a router (mini app that only handles routes)
const router = express.Router();

// CREATE
// POST /threads/:id/comment
router.post("/threads/:id/comment", async (req, res, next) => {
  const { id } = req.params; // Extract the thread ID from the request parameters
  const { text } = req.body.comment; // Extract the comment text from the request body

  try {
    // Assuming you have a user token in the headers
    const userToken = req.headers.authorization.split(" ")[1];
    const user = await User.findOne({ token: userToken });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the thread by ID
    const thread = await Thread.findById(id);

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Create the comment
    const comment = {
      text,
    };

    thread.comments.push(comment);
    await thread.save();

    // Respond with the newly created comment
    res.status(201).json({ comment: comment });
  } catch (error) {
    next(error);
  }
});

// DELETE
// DELETE /threads/:id/comment
// DELETE /threads/:threadId/comments/:commentId
router.delete(
  "/threads/:threadId/comments/:commentId",
  async (req, res, next) => {
    const { threadId, commentId } = req.params;

    try {
      // Assuming you have a user token in the headers
      const userToken = req.headers.authorization.split(" ")[1];
      const user = await User.findOne({ token: userToken });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the thread by ID
      const thread = await Thread.findById(threadId);

      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      // Find the comment in the thread
      const comment = thread.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Check if the user is the author of the comment
      if (comment.author !== user._id.toString()) {
        return res
          .status(403)
          .json({
            error: "Permission denied. You are not the author of this comment.",
          });
      }

      // Remove the comment from the thread
      comment.remove();
      await thread.save();

      // Respond with a success message or any desired response
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
