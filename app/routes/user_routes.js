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

const File = require("../models/file");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../threadify-client/src/images/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// const upload = multer({ storage: storage });

// const storage = multer.memoryStorage();

// const upload = multer({ storage });

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate("bearer", { session: false });

const router = express.Router();

// SIGN UP
// POST /sign-up
router.post("/sign-up", async (req, res, next) => {
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
      username: req.body.credentials.username,
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

// GET /users/:id
router.get("/users/:id", requireToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new BadCredentialsError();
    }

    // Respond with user JSON
    res.status(200).json({ user: user.toObject() });
  } catch (error) {
    // If an error occurs, pass it to the error handler middleware
    next(error);
  }
});

router.patch("/change-username/:id", requireToken, async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new BadCredentialsError();
    }

    // Update the username if provided in the request body
    if (req.body.username) {
      user.username = req.body.username;
    }

    // Save the updated user
    await user.save();

    // If the update succeeded, return 204 and no JSON
    res.sendStatus(204);
  } catch (error) {
    // If an error occurs, pass it to the error handler middleware
    next(error);
  }
});

// PATCH /change-email/:id
router.patch("/change-email/:id", requireToken, async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new BadCredentialsError();
    }

    // Update the email if provided in the request body
    if (req.body.email) {
      user.email = req.body.email;
    }

    // Save the updated user
    await user.save();

    // If the update succeeded, return 204 and no JSON
    res.sendStatus(204);
  } catch (error) {
    // If an error occurs, pass it to the error handler middleware
    next(error);
  }
});

// POST /upload-photo - Handle photo uploads for authenticated users
router.post(
  "/upload-photo",
  requireToken,
  upload.single("profilePhoto"),
  async (req, res, next) => {
    try {
      console.log("Req.file is in photo upload is ", JSON.stringify(req.file));
      // Find the user by ID
      const user = await User.findById(req.user.id);

      console.log("User object before update:", user.toObject());

      // Check if a profile photo was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Verify that the user making the request is the owner of the photo
      if (!user || user._id.toString() !== req.user.id) {
        console.log("Unauthorized access. User not found or IDs do not match.");
        return res.status(403).json({ message: "Unauthorized access" });
      }

      // Create a new File document for the uploaded photo
      const file = new File({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        owner: user,
      });

      // Save the file to the database
      const savedFile = await file.save();

      // Update the user's profile photo
      user.profilePhoto = savedFile._id;
      await user.save();
      console.log("Photo uploaded successfully");
      // Respond with success message and the URL of the uploaded photo
      res.status(201).json({
        message: "Photo uploaded successfully",
        file: {
          ...req.file,
          owner: user, // Include owner field in the response
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /photos/:id - Retrieve and display a specific photo by its ID
router.get("/get-photo", requireToken, async (req, res, next) => {
  try {
    // Find the file by its ID
    const file = await File.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });

    // If the file doesn't exist or it's not an image, return a 404 error
    if (!file || !file.contentType.startsWith("image/")) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Set the appropriate content type for the response
    res.setHeader("Content-Type", file.contentType);

    console.log("Photo retrieved successfully:", file);
    // Send a success message along with the file data
    res.status(200).json({
      message: "JSON MESSAGE Photo retrieved successfully",
      data: file.data,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /delete-photo - Handle photo deletion for authenticated users
router.delete("/delete-photo", requireToken, async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user.id);

    // Check if the user has a profile photo
    if (!user.profilePhoto) {
      return res
        .status(400)
        .json({ message: "User does not have a profile photo" });
    }

    // Delete the profile photo from the database
    await File.findByIdAndDelete(user.profilePhoto);

    // Remove the profile photo reference from the user document
    user.profilePhoto = null;
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
