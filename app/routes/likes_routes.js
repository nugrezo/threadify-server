// Express docs: http://expressjs.com/en/api.html
const express = require("express");
// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");

// pull in Mongoose model for examples
const Thread = require("../models/thread");
const User = require("../models/user");
const Likes = require("../models/likes");

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require("../../lib/custom_errors");

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404;
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership;

const requireOwnershipBool = customErrors.requireOwnershipBool;

// this is middleware that will remove blank fields from `req.body`, e.g.
// { threadify: { title: '', text: 'foo' } } -> { threadify: { text: 'foo' } }
const removeBlanks = require("../../lib/remove_blank_fields");
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate("bearer", { session: false });

// instantiate a router (mini app that only handles routes)
const router = express.Router();

// POST route to handle liking or unliking a thread
router.post("/threads/:id/like", requireToken, async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the thread by ID
    const thread = await Thread.findById(id);

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Check if the user has already liked the thread
    const existingLike = thread.likes.find(
      (like) => like.likedBy.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // User has already liked the thread, so unlike it
      thread.likes.pull(existingLike._id);
    } else {
      // User hasn't liked the thread, so create a new like
      const newLike = { likedBy: req.user._id };
      thread.likes.push(newLike);
    }

    await thread.save();

    // Respond with the updated like count
    res.status(200).json({ likes: thread.likes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
