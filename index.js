import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
	res.render("homepage.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
})

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
})

app.get("/userpage", (req, res) => {
    res.render("userpage.ejs");
})

app.listen(port, () => console.log(`Listening on port ${port}`));
