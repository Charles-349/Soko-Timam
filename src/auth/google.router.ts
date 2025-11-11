import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "../auth/google.strategy";

const router = express.Router();

//Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//Handle callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
     console.log("Callback route hit");
    console.log("Req.user:", req.user);

    if (!req.user) {
      console.error("No user returned from Google Strategy");
      return res.status(400).send("Login failed");
    }
    const user = req.user as any;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "7d" }
    );
 console.log("JWT generated:", token);
    // Redirect back to frontend with the JWT
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

export default router;
