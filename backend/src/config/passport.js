const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      if (rows.length > 0) {
        const { rows: updated } = await pool.query(
          'UPDATE users SET name = $1, avatar_url = $2 WHERE google_id = $3 RETURNING *',
          [profile.displayName, profile.photos?.[0]?.value, profile.id]
        );
        return done(null, updated[0]);
      }

      const { rows: created } = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [
          profile.id,
          profile.emails?.[0]?.value,
          profile.displayName,
          profile.photos?.[0]?.value,
        ]
      );
      done(null, created[0]);
    } catch (err) {
      done(err);
    }
  }
));
