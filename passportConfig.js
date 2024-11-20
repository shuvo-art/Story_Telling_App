const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple").Strategy;
const User = require("./models/userModel");
const { generateToken } = require("./config/jwtToken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/user/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = await User.create({
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            email: profile.emails[0].value,
            password: "OAuthGoogleUser",
          });
        }
        return done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      callbackURL: `${process.env.BASE_URL}/api/user/apple/callback`,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyString: process.env.APPLE_PRIVATE_KEY,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create a user
        let user = await User.findOne({ email: profile.email });
        if (!user) {
          user = await User.create({
            firstname: profile.name ? profile.name.firstName : "AppleUser",
            lastname: profile.name ? profile.name.lastName : "",
            email: profile.email,
            password: "OAuthAppleUser",
          });
        }
        return done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
