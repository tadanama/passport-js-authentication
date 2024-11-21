import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import db from "./db.js";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;

// Allow the use of environment variables
env.config();

// Setting up connection to use postgres as the session store
// Session is stored inside session table in passport js database
const PostgresSessionStore = connectPgSimple(session);
const sessionStore = new PostgresSessionStore({
	conString: "postgres://postgres:12345@localhost:5432/passportjs",
});

// Enable body parser. To read the data sent from the client form (urlencoded)
app.use(express.urlencoded({ extended: false }));

// Set express-session as the middleware
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
		},
		store: sessionStore,
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
	const {
		body: { username, password, confirmPassword },
	} = req;

	// Return error if password don't match
	if (password !== confirmPassword)
		return res
			.status(400)
			.render("signup.ejs", { error: "Password don't match" });

	// Hash the password
	bcrypt.hash(password, 15, async (error, hashedPassword) => {
		if (error) {
			console.error("Error whan hashing password:", error);
			return res
				.status(500)
				.render("signup.ejs", { error: "Server cannot hash password" });
		}

		//? We can also query the database to check if there is a user with the same username or email and prompt the user to use a different username or email before executing the try catch block below
		try {
			// Generate a new user id
			const newUserID = uuidv4();

			// Insert the new user to the database alon with the credentials
			// Upon successful insertion return the id and username of the newly inserted user data
			const newUser = await db.query(
				"INSERT INTO users VALUES ($1, $2, $3) RETURNING id, username",
				[newUserID, username, hashedPassword]
			);
			console.log(newUser.rows[0]);

			// Error spelling is different to differentiate from the error above
		} catch (err) {
			console.error("Error when inserting new user to database:", err);
			return res.status(500).render("signup.ejs", {
				error: "Server cannot insert new user into database",
			});
		}
	});
});

app.listen(port, () => console.log(`Listening on port ${port}`));
