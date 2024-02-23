const express = require("express");
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require("crypto");
// Passport docs: http://www.passportjs.org/docs/
const passport = require("passport");
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require("bcrypt");

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10;

// pull in error types and the logic to handle them and set status codes
const errors = require("../../lib/custom_errors");

const BadParamsError = errors.BadParamsError;
const BadCredentialsError = errors.BadCredentialsError;

const User = require("../models/user");

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate("bearer", { session: false });
console.log("requireToken middleware executed", requireToken);
// instantiate a router (mini app that only handles routes)
const router = express.Router();

// SIGN UP
// POST /sign-up
router.post("/sign-up", async (req, res, next) => {
  console.log(`req.body is sign-up ${JSON.stringify(req.body)}`);
  try {
    const credentials = req.body.credentials;

    if (
      !credentials ||
      !credentials.password ||
      credentials.password !== credentials.password_confirmation
    ) {
      throw new BadParamsError();
    }

    const hash = await bcrypt.hash(
      req.body.credentials.password,
      bcryptSaltRounds
    );

    const user = {
      email: req.body.credentials.email,
      hashedPassword: hash,
    };

    const newUser = await User.create(user);

    res.status(201).json({ user: newUser.toObject() });
  } catch (error) {
    next(error);
  }
});

// SIGN IN
// POST /sign-in
router.post("/sign-in", async (req, res, next) => {
  const pw = req.body.credentials.password;
  console.log(`req.body is sign-in ${JSON.stringify(req.body)}`);
  let user;

  try {
    const record = await User.findOne({ email: req.body.credentials.email });

    if (!record) {
      throw new BadCredentialsError();
    }

    user = record;

    const correctPassword = await bcrypt.compare(pw, user.hashedPassword);

    if (correctPassword) {
      const token = crypto.randomBytes(16).toString("hex");
      user.token = token;

      await user.save();
    } else {
      throw new BadCredentialsError();
    }

    res.status(201).json({ user: user.toObject() });
  } catch (error) {
    next(error);
  }
});

// CHANGE password
// PATCH /change-password
router.patch("/change-password", async (req, res, next) => {
  const pw = req.body.passwords.old;
  console.log("Received change-password request");

  try {
    const userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header
    const user = await User.findOne({ token: userToken });

    if (!user) {
      throw new Error("User not found");
    }

    const correctPassword = await bcrypt.compare(pw, user.hashedPassword);
    console.log("Correct old password:", correctPassword);

    if (!req.body.passwords.new || !correctPassword) {
      console.log("Invalid request parameters");
      throw new BadParamsError();
    }

    const hash = await bcrypt.hash(req.body.passwords.new, bcryptSaltRounds);
    console.log("New password hashed:", hash);

    user.hashedPassword = hash;
    await user.save();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

router.delete("/sign-out", async (req, res, next) => {
  try {
    const userToken = req.headers.authorization.split(" ")[1]; // Extract the token from the Authorization header
    const user = await User.findOne({ token: userToken });

    if (!user) {
      throw new Error("User not found");
    }

    // Clear the user's token
    user.token = null;
    await user.save();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
