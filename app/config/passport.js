const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/user");

function init(passport) {

  // ================= LOCAL LOGIN =================
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          console.log("🔍 Checking user with email:", email);

          const user = await User.findOne({ where: { email: email } });

          if (!user) {
            return done(null, false, { message: "No user found" });
          }

          if (user.blocked) {
            return done(null, false, { message: "Your account is blocked" });
          }

          const match = await bcrypt.compare(password, user.password);

          if (match) {
            return done(null, user, { message: "Logged in successfully" });
          } else {
            return done(null, false, { message: "Wrong password" });
          }

        } catch (err) {
          console.error("❌ Local Auth Error:", err);
          return done(null, false, { message: "Something went wrong" });
        }
      }
    )
  );

  // ================= GOOGLE LOGIN =================
  passport.use(
    new GoogleStrategy(
      {
     clientID: "760916293119-ru15jkiqlap6auou2rtm0hc2mn2thicb.apps.googleusercontent.com",
    clientSecret: "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",
        callbackURL: "https://www.shunyataecoresort.com/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 Google Profile:", profile.id);

          const email = profile.emails[0].value;

          // 🔍 check user by email
          let user = await User.findOne({ where: { email } });

          if (user) {
            // अगर user already hai → googleId update kar de
            if (!user.googleId) {
              await user.update({ googleId: profile.id });
            }

            return done(null, user);
          }

          // 🆕 new user create
          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            password: null, // google user ke liye password optional
          });

          return done(null, user);

        } catch (err) {
          console.error("❌ Google Auth Error:", err);
          return done(err, null);
        }
      }
    )
  );

  // ================= SERIALIZE =================
  passport.serializeUser((user, done) => {
    console.log("🔐 Serializing user:", user.id);
    done(null, user.id);
  });

  // ================= DESERIALIZE =================
  passport.deserializeUser(async (id, done) => {
    try {
      console.log("🔄 Deserializing user ID:", id);

      const user = await User.findByPk(id);

      if (!user) {
        return done(null, false);
      }

      done(null, user);

    } catch (err) {
      console.error("❌ Error deserializing user:", err);
      done(err, null);
    }
  });
}

module.exports = init;