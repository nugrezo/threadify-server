// Express docs: http://expressjs.com/en/api.html
const express = require("express");
// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");

// pull in Mongoose model for examples
const Example = require("../models/example");
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
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require("../../lib/remove_blank_fields");
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate("bearer", { session: false });

// instantiate a router (mini app that only handles routes)
const router = express.Router();

// INDEX
// GET /examples
router.get("/examples", async (req, res, next) => {
  let userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header // Declare userToken variable outside the try block
  let user; // Declare user variable outside the try block

  try {
    user = await User.findOne({ token: userToken });

    if (!user) {
      throw new Error("User not found");
    }

    // Querying the Database
    const examples = await Example.find();

    // Converting to Plain JavaScript Objects (POJO)
    const examplesPOJO = examples.map((example) => example.toObject());

    // Responding to the Client
    res.status(200).json({ examples: examplesPOJO });
  } catch (error) {
    // Error Handling
    next(error);
  }
});

// SHOW
// GET /examples/5a7db6c74d55bc51bdf39793
router.get("/examples/:id", async (req, res, next) => {
  let userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header // Declare userToken variable outside the try block
  let user; // Declare user variable outside the try block

  try {
    user = await User.findOne({ token: userToken });

    if (!user) {
      throw new Error("User not found");
    }

    // Finding the example by ID
    const example = await Example.findById(req.params.id);

    if (!example) {
      throw new Error("Example not found");
    }

    // Respond with 200 and "example" JSON
    res.status(200).json({ example: example.toObject() });
  } catch (error) {
    // Error Handling
    next(error);
  }
});

// CREATE
// POST /examples
router.post("/examples", async (req, res, next) => {
  const userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header
  let user;

  try {
    // Look up the user by the token
    user = await User.findOne({ token: userToken });

    if (!user) {
      throw new Error("User not found");
    }

    // Set owner of new example to be the current user
    req.body.example.owner = user.id;

    // Create the example
    const example = await Example.create(req.body.example);

    // Respond to successful `create` with status 201 and JSON of new "example"
    res.status(201).json({ example: example.toObject() });
  } catch (error) {
    next(error);
  }
});

// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793
router.patch("/examples/:id", async (req, res, next) => {
  const userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header
  let user;

  try {
    // Look up the user by the token
    user = await User.findOne({ token: userToken });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the example by ID
    const example = await Example.findById(req.params.id);
    handle404(example);

    // Set owner of the new example to be the current user
    req.body.example.owner = user.id;

    // You may still want to include some validation or checks here
    // before updating, depending on your requirements

    // Update the example based on the request body
    await example.updateOne(req.body.example);

    // If the update succeeded, return 204 and no JSON
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete("/examples/:id", async (req, res, next) => {
  const userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header

  try {
    // Look up the user by the token
    const user = await User.findOne({ token: userToken });

    if (!user) {
      console.error("User not found");
      throw new Error("User not found");
    }

    // Find the example by ID
    const example = await Example.findById(req.params.id);

    if (!example) {
      console.error("Example not found");
      throw new Error("Example not found");
    }

    // Ensure the current user owns the example (if needed)

    // Delete the example
    await example.deleteOne();

    // Respond with status 204 (no content) if the deletion succeeded
    res.sendStatus(204);
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
});

module.exports = router;
