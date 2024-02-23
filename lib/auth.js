// require authentication related packages
const passport = require("passport");
const bearer = require("passport-http-bearer");

// user model will be used to set `req.user` in
// authenticated routes
const User = require("../app/models/user");

// this strategy will grab a bearer token from the HTTP headers and then
// run the callback with the found token as `token`
const strategy = new bearer.Strategy(async function (token) {
  // look for a user whose token matches the one from the header
  const user = await User.findOne({ token: token });
  if (!user) {
    throw new Error("User not found");
  }
  return { user, scope: "all" };
});

// serialize and deserialize functions are used by passport under
// the hood to determine what `req.user` should be inside routes
passport.serializeUser((user, done) => {
  // we want access to the full Mongoose object that we got in the
  // strategy callback, so we just pass it along with no modifications
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// register this strategy with passport
passport.use(strategy);

// create a passport middleware based on all the above configuration
module.exports = passport.initialize();
