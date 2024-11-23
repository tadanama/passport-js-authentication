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

// Set the local variable to display error message if any
app.use((req, res, next) => {
	res.locals.error = req.session.messages;
	req.session.messages = []; // Set the error message back to an empty array. An array of error messages will be saved when multiple error happens if it is not emptied
	next();
});

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
app.get("/userpage", checkLogin, (req, res) => {
	res.render("userpage.ejs");
});

// Logout route
// Destroy the existing session
app.get("/logout", (req, res, next) => {
	req.logOut((error) => {
		if (error) return next(error);

		res.redirect("/");
	});
});

// User login route
// Redirect to /userpage if login success or /login page if login failure
app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/userpage",
		failureRedirect: "/login",
		failureMessage: true, // failure message stored in the session store
	})
);

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
			const user = newUser.rows[0];

			// Send data of the newly inserted user to the serializeUser function
			req.logIn(user, (error) => {
				if (error) {
					console.error("Error when intiating a session:", error);
					return res.status(500).render("/signup", {
						error: "Passport unable to establish a session",
					});
				}

				return res.status(200).redirect("/userpage");
			});

			// Error spelling is different to differentiate from the error above
		} catch (err) {
			console.error("Error when inserting new user to database:", err);
			return res.status(500).render("signup.ejs", {
				error: "Server cannot insert new user into database",
			});
		}
	});
});

// Passport middleware to authenticate user when they log in
// Passport automatically takes the username and password field and provide it as an argument in the verify function
// Assuming the field name is for username and password is "username" and "password"
// Otherwise we need to provide the options for the strategy (usernameField, passwordField) (put as first argument inside Strategy object right before the verify function)
passport.use(
	"local",
	new Strategy(async function verify(username, password, done) {
		// Query the database to see if the user exist
		const user = await db.query("SELECT * FROM users WHERE username = $1", [
			username,
		]);
		const userData = user.rows[0];
		console.log(userData);

		// Return error if user don't exist
		if (!userData) {
			// Provide an error message if credentials are not valid. The messages are available through req.session.messages and is part of session data that is stored in session store. Meaning session was established (mainly for attaching error message to the currently unauthenticated user). When the user finally logs in with valid credentials, this session is destroyed.
			// The name of the property must be "message" or otherwise it won't work
			return done(null, false, {
				message: `User with username ${username} don't exist in database`,
			});
		}

		// Compare the passwords
		bcrypt.compare(
			password,
			userData.password_hash,
			(err, doesPasswordMatch) => {
				// Redirect to the login page if bcrypt can't compare the passwords
				if (err) {
					console.log("Error when comparing passwords:", err);
					return res.status(500).render("/login");
				}

				if (!doesPasswordMatch) {
					// Return error if password don't match
					return done(null, false, { message: "Invalid password" });
				} else {
					// Establish a session with the user info (store to session store)
					return done(null, { id: userData.id, username: userData.username });
				}
			}
		);
	})
);

// Serialilze the user (executed one time when loggin or signing up)
// Session object is modified, session is established, browser gets a cookie with the with the session id
// Session id is stored in the session store (postgres in this case) with the user information
passport.serializeUser((user, done) => {
	// User info below is what we got from req.login
	// User object below contains id and username (in this case)
	console.log("Inside serialize user", user);

	// At this point is when the session object is modified
	// Passport modifies the session object for us containing the id (second argument of the done function)
	done(null, user.id);
});

// Deserialize the user (executed right after serializing the user and for subsequent request after loggin or signing up)
// User sends request to the browser with the cookie that contains the session id
// User info is retrieved from the session store that is associated with that session id
// Search the database if the user exists
// Attaches it to the req.user body
passport.deserializeUser(async (id, done) => {
	// Consoling the user info that is stored in the session store
	console.log("Inside deserialize user", id);

	try {
		// Querying the database to check if the user info from the session store exist in the database
		const foundUser = await db.query(
			"SELECT id, username FROM users WHERE id = $1",
			[id]
		);

		// Return error if the user info (id in this case) from session store does not exist database
		if (foundUser.rows === 0) {
			return done("No user with such id", null);
		}

		// Attach the user info from database to the req.user with the done callback
		const user = foundUser.rows[0];
		done(null, user);
	} catch (error) {
		// Return error if unable to query database
		console.error("Error when retrieving user info:", error);
		done("Error when querying database: " + error, null);
	}
});

// Middlware below is used when rendering the user page
function checkLogin(req, res, next) {
	// Check if a user is logged in
	if (req.isAuthenticated()) {
		next();
	} else {
		// Redirect unauthenticated user back to login page
		console.log("You are not authenticated");
		console.log(req.isAuthenticated());
		res.redirect("/");
	}
}

app.listen(port, () => console.log(`Listening on port ${port}`));
