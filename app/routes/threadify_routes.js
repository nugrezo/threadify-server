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

// INDEX
// GET /threads
router.get("/threads", requireToken, async (req, res, next) => {
  try {
    const threads = await Thread.find();
    // Map examples to plain JavaScript objects
    const mappedThreads = threads.map((thread) => thread.toObject());
    res.status(200).json({ threads: mappedThreads });
  } catch (error) {
    next(error);
  }
});

// SHOW
// GET /threads/5a7db6c74d55bc51bdf39793
router.get("/threads/:id", requireToken, async (req, res, next) => {
  try {
    // req.params.id will be set based on the `:id` in the route
    const thread = await Thread.findById(req.params.id);

    // If `findById` is successful, respond with 200 and "thread" JSON
    res.status(200).json({ thread: thread.toObject() });
  } catch (error) {
    // If an error occurs, pass it to the handler
    next(error);
  }
});

// CREATE
// POST /threads
router.post("/threads", requireToken, async (req, res, next) => {
  try {
    // Set owner of new thread to be the current user
    req.body.thread.owner = req.user.id;
    // Set username of new thread to be the current username
    req.body.thread.username = req.user.username;
    // Use await with Thread.create to handle it as a promise
    const thread = await Thread.create(req.body.thread);

    // Respond with the created thread
    res.status(201).json({ thread: thread.toObject() });
  } catch (error) {
    // Pass any errors along to the error handler
    next(error);
  }
});

// UPDATE
// PATCH /threads/5a7db6c74d55bc51bdf39793
router.patch(
  "/threads/:id",
  requireToken,
  removeBlanks,
  async (req, res, next) => {
    try {
      // If the client attempts to change the `owner` property by including a new owner, prevent that
      delete req.body.thread.owner;

      // Find the thread by ID
      const thread = await Thread.findById(req.params.id);
      // Handle 404 if the thread is not found
      handle404(thread);

      // Ensure ownership of the thread
      requireOwnership(req, thread);

      // Update the thread using the provided data
      await thread.updateOne(req.body.thread);

      // If the update succeeded, return 204 and no JSON
      res.sendStatus(204);
    } catch (error) {
      // If an error occurs, pass it to the handler
      next(error);
    }
  }
);

// DESTROY
// DELETE /threads/:id
router.delete("/threads/:id", requireToken, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    // Handle 404 if the thread is not found
    handle404(thread);

    // Ensure ownership of the thread
    requireOwnership(req, thread);

    // Use await to delete the thread
    await thread.deleteOne();

    // Respond with status 204 for successful deletion
    res.sendStatus(204);
  } catch (error) {
    // Pass any errors along to the error handler
    next(error);
  }
});

module.exports = router;
