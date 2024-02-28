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

  try {
    const user = await User.findOne({ email: req.body.credentials.email });

    if (!user) {
      throw new BadCredentialsError();
    }

    const correctPassword = await bcrypt.compare(pw, user.hashedPassword);

    if (!correctPassword) {
      throw new BadCredentialsError();
    }

    // If the passwords matched
    const token = crypto.randomBytes(16).toString("hex");
    user.token = token;

    // Save the token to the DB as a property on the user
    await user.save();

    // Return status 201, the email, and the new token
    res.status(201).json({ user: user.toObject() });
  } catch (error) {
    // Handle errors and pass them to the error handler
    next(error);
  }
});

// CHANGE password
// PATCH /change-password
router.patch("/change-password", requireToken, async (req, res, next) => {
  try {
    // `req.user` will be determined by decoding the token payload
    const user = await User.findById(req.user.id);

    // check that the old password is correct
    const correctPassword = await bcrypt.compare(
      req.body.passwords.old,
      user.hashedPassword
    );

    // `correctPassword` will be true if hashing the old password ends up the
    // same as `user.hashedPassword`
    if (!req.body.passwords.new || !correctPassword) {
      throw new BadParamsError();
    }

    // hash the new password
    const hash = await bcrypt.hash(req.body.passwords.new, bcryptSaltRounds);

    // set and save the new hashed password in the DB
    user.hashedPassword = hash;
    await user.save();

    // respond with no content and status 204
    res.sendStatus(204);
  } catch (error) {
    // pass any errors along to the error handler
    next(error);
  }
});

router.delete("/sign-out", requireToken, (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = crypto.randomBytes(16);
  // save the token and respond with 204
  req.user
    .save()
    .then(() => res.sendStatus(204))
    .catch(next);
});

module.exports = router;
