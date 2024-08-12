require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const expressLayout = require("express-ejs-layouts");
const app = express();
const cookieParser = require("cookie-parser");
const fs = require("fs");
const { google } = require("googleapis");
const session = require("express-session");
const OAuth2 = google.auth.OAuth2;
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static("public"));
app.use(expressLayout);
app.use(
	session({
		secret: "keyboard cat",
		resave: false,
		saveUninitialized: true,
	})
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const TOKEN_PATH = "token.json";

let oAuth2Client;

// app.set('layout','./layouts/main');
// due to this layout express will automatically search for main.ejs
// in main.ejs it looks for rendered view.
app.set("layout", "./layouts/main");
app.set("layout", "./layouts/admin");
app.set("view engine", "ejs");

// Load client secrets from a local file.
fs.readFile("googleCalender/credentials.json", (err, content) => {
	if (err) return console.log("Error loading client secret file:", err);
	const credentials = JSON.parse(content);
	const { client_secret, client_id, redirect_uris } = credentials.web;
	oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
	getAccessToken();
});

function getAccessToken() {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
		prompt: "consent", // Force consent screen to show every time
	});
	// console.log("Authorize this app by visiting this url:", authUrl);
}

// Route to start the OAuth2 flow
app.get("/authorize", (req, res) => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
		prompt: "consent", // Force consent screen to show every time
	});
	res.redirect(authUrl);
});

app.get("/oauth2callback", (req, res) => {
	const code = req.query.code;
	oAuth2Client.getToken(code, (err, token) => {
		if (err) return res.status(400).send("Error retrieving access token");
		oAuth2Client.setCredentials(token);
		fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err) return res.status(400).send("Error storing token");
			res.redirect("/"); // Redirect to homepage after successful authentication
		});
	});
});

app.get("/events", (req, res) => {
	const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
	calendar.events.list(
		{
			calendarId: "primary",
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: "startTime",
		},
		(err, result) => {
			if (err) return res.status(400).send("The API returned an error: " + err);
			const events = result.data.items;
			res.send(events);
		}
	);
});

// Updated Mongoose connection with options
mongoose
	.connect(process.env.MONGODB_URI, {
		serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
		socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
	})
	.then(() => console.log("Connected to MongoDB Atlas!!!"))
	.catch((err) => console.error("Failed to connect to MongoDB Atlas:", err));

// Check connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
	console.log("Connected to MongoDB Atlas");
});

// Use your routes only after the authentication middleware
app.use("/", require("./server/routes/main"));
app.use("/", require("./server/routes/admin"));

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
});
