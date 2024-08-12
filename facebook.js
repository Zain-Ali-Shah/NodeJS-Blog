require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const qs = require("qs");

const app = express();
const PORT = process.env.PORT || 3000;

const SCOPES = [
	"pages_show_list",
	"pages_read_engagement",
	"pages_manage_posts",
	"pages_read_user_content",
];
const TOKEN_PATH = "token.json";

const oAuth2Client = {
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	redirect_uri: process.env.REDIRECT_URI,
};

app.get("/auth", (req, res) => {
	const authUrl =
		`https://www.facebook.com/v12.0/dialog/oauth?` +
		`client_id=${oAuth2Client.client_id}&` +
		`redirect_uri=${oAuth2Client.redirect_uri}&` +
		`scope=${SCOPES.join(",")}`;
	res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
	const code = req.query.code;
	if (!code) {
		return res.status(400).send("Error: No code provided");
	}

	try {
		const tokenResponse = await axios({
			method: "get",
			url: "https://graph.facebook.com/v12.0/oauth/access_token",
			params: {
				client_id: oAuth2Client.client_id,
				redirect_uri: oAuth2Client.redirect_uri,
				client_secret: oAuth2Client.client_secret,
				code,
			},
		});

		const token = tokenResponse.data;
		fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
		res.redirect("/");
	} catch (err) {
		console.error(
			"Error retrieving access token:",
			err.response ? err.response.data : err.message
		);
		res.status(400).send("Error retrieving access token");
	}
});

app.get("/events", async (req, res) => {
	const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

	try {
		const response = await axios.get(
			`https://graph.facebook.com/me/accounts?access_token=${token.access_token}`
		);

		if (response.data && response.data.data) {
			const pages = response.data.data;
			if (pages.length > 0) {
				const pageAccessToken = pages[0].access_token;
				console.log("Page Access Token:", pageAccessToken);
				res.send(pageAccessToken);
			} else {
				res.status(400).send("No pages found for the user.");
			}
		} else {
			res.status(400).send("Failed to retrieve pages.");
		}
	} catch (error) {
		console.error(
			"Error fetching page access token:",
			error.response ? error.response.data : error.message
		);
		res
			.status(400)
			.send(
				"Error fetching page access token: " +
					(error.response ? error.response.data : error.message)
			);
	}
});

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}`);
});
