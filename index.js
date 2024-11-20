import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";

const app = express();
const port = 3000;

// Allow the use of environment variables
env.config();

// Setting up connection to use postgres as the session store
// Session is stored inside session table in passport js database
const PostgresSessionStore = connectPgSimple(session);
const sessionStore = new PostgresSessionStore({
	conString: "postgres://postgres:12345@localhost:5432/passportjs"
})

// Enable body parser. To read the data sent from the client form (urlencoded)
app.use(express.urlencoded({ extended: false}))

// Set express-session as the middleware
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
		},
		store: sessionStore
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

// Handle user sign up (registration)
app.post("/signup", (req, res) => {
	const {body: {username, password, confirmPassword}} = req;
	
	// Return error if password don't match
	if (password !== confirmPassword) return res.status(400).render("signup.ejs", { error: "Password don't match"});
})

app.listen(port, () => console.log(`Listening on port ${port}`));
