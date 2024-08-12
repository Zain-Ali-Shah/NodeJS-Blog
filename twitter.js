require("dotenv").config();
const express = require("express");
const { TwitterApi } = require("twitter-api-v2");

const app = express();
const port = 3000;

// Initialize Twitter API client
const client = new TwitterApi({
	appKey: process.env.TWITTER_API_KEY,
	appSecret: process.env.TWITTER_API_SECRET_KEY,
	accessToken: process.env.TWITTER_ACCESS_TOKEN,
	accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

app.use(express.json());

// Function to get current user details
async function getCurrentUser() {
	try {
		return await client.v2.me();
	} catch (error) {
		throw new Error(`Failed to get current user: ${error.message}`);
	}
}

// Root route
app.get("/", (req, res) => {
	res.send("Twitter API Integration");
});

// Route to authenticate and get user details
app.get("/auth", async (req, res) => {
	try {
		const currentUser = await getCurrentUser();
		res.send(`Authenticated as ${currentUser.data.username}`);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Authentication failed");
	}
});

// Route to post a tweet
app.post("/tweet", async (req, res) => {
	const { message } = req.body;
	try {
		const tweet = await client.v2.tweet(message);
		res.send(`Tweeted: ${tweet.data.text}`);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Failed to post tweet");
	}
});

// Route to get user timeline
app.get("/timeline", async (req, res) => {
	try {
		const currentUser = await getCurrentUser();
		const timeline = await client.v2.userTimeline(currentUser.data.id, {
			max_results: 5,
		});
		res.json(timeline.data);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Failed to get timeline");
	}
});

// Route to search tweets
app.get("/search", async (req, res) => {
	const { query } = req.query;
	try {
		const searchResults = await client.v2.search(query, { max_results: 5 });
		res.json(searchResults.data);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Failed to search tweets");
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
