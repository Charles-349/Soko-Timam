import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import  db from "../Drizzle/db";
import { users } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
console.log("Google callback URL:", process.env.GOOGLE_CALLBACK_URL);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log("Google Strategy called");
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      console.log("Profile:", profile);
      try {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, profile.emails?.[0]?.value || ""),
        });
           console.log("Existing User:", existingUser);

        if (existingUser) return done(null, existingUser);

        // Otherwise, create a new one
        const newUser = await db
          .insert(users)
          .values({
            firstname: profile.name?.givenName || "Google",
            lastname: profile.name?.familyName || "User",
            email: profile.emails?.[0]?.value || "",
            password: "google_oauth", 
            image_url: profile.photos?.[0]?.value,
          })
          .returning();
          console.log("New User created:", newUser[0]);

        return done(null, newUser[0]);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);
