import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

const app = express();
const port = 3000;

// Set express-session as the middleware
app.use(
	session({
		secret: "secret",
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
		},
	})
);

// Initialize passport
app.use(passport.initialize());

// Middleware below will restore login state from session
// If credentials are valid then a session is established and middleware will populate req.user containing user info
app.use(passport.session());

// Render the homepage
app.get("/", (req, res) => {
	res.render("homepage.ejs");
});

// Render the login page
app.get("/login", (req, res) => {
	res.render("login.ejs");
});

// Render the sign up page
app.get("/signup", (req, res) => {
	res.render("signup.ejs");
});

// Render the user page
app.get("/userpage", (req, res) => {
	res.render("userpage.ejs");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
