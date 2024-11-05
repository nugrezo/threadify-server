// Express docs: http://expressjs.com/en/api.html
const express = require("express");
// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");

// pull in Mongoose model for examples
const Thread = require("../models/thread");
const User = require("../models/user");
// const Comments = require("../models/comments")

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

router.post("/threads/:id/comment", requireToken, async (req, res, next) => {
  req.body.comment.username = req.user.username;
  req.body.comment.owner = req.user.id; // Set owner to current user ID
  const { id } = req.params;
  const { text, username, owner } = req.body.comment;

  try {
    // Find the thread by ID
    const thread = await Thread.findById(id);

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Create the comment
    const comment = {
      text,
      username,
      owner, // Ensure owner is set in the comment object
    };

    thread.comments.push(comment);
    await thread.save();

    // Respond with the newly created comment
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// DELETE
// DELETE a comment from a thread
router.delete(
  "/threads/:threadId/comments/:commentId",
  requireToken,
  async (req, res, next) => {
    try {
      const { threadId, commentId } = req.params;

      // Retrieve the thread
      const thread = await Thread.findById(threadId);

      // Handle 404 if the thread is not found
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      // Find the comment within the thread's comments array
      const comment = thread.comments.id(commentId);

      // Handle 404 if the comment is not found
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Ensure ownership of the comment
      if (!comment.owner.equals(req.user.id)) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this comment" });
      }

      // Remove the comment from the thread
      comment.remove();

      // Save the thread with the updated comments array
      await thread.save();

      // Respond with status 204 for successful deletion
      res.sendStatus(204);
    } catch (error) {
      // Pass any errors along to the error handler
      next(error);
    }
  }
);

module.exports = router;
