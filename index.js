import express from "express";
import session from "express-session";

const app = express();
const port = 3000;

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
