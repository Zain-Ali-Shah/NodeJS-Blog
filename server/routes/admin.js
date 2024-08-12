const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const Contact = require("../../models/Contact");
const User = require("../../models/User");
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLayout = "../views/layouts/admin";

router.use((req, res, next) => {
	res.locals.layout = "./layouts/admin"; // Admin layout
	next();
});

router.get("/admin", async (req, res) => {
	const locals = {
		title: "Admin",
		description: "Simple Blog created with NodeJS,express and mongo",
	};
	try {
		res.render("admin/index", { locals, layout: adminLayout });
	} catch (error) {
		console.log(error);
	}
});

router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		if (username === "admin" && password === "password") {
			const locals = {
				title: "Admin Panel",
				description: "Simple Blog created",
				currentPath: req.path,
			};
			const message = req.query.message;
			req.query.message = "";

			try {
				let perPage = 3;
				let page = parseInt(req.query.page) || 1;

				const count = await Contact.countDocuments(); // Use countDocuments instead of count
				const contacts = await Contact.find()
					.skip(perPage * (page - 1))
					.limit(perPage)
					.exec();

				const totalPages = Math.ceil(count / perPage);
				const hasNextPage = page < totalPages;
				const hasPrevPage = page > 1;

				res.render("index", {
					locals,
					contacts,
					current: page,
					nextPage: hasNextPage ? page + 1 : null,
					prevPage: hasPrevPage ? page - 1 : null,
					totalPages: totalPages,
					message: message,
				});
			} catch (error) {
				console.error("Error fetching contacts:", error);
				res.render("index", {
					locals,
					contacts: [],
					error: "Failed to fetch contacts!!!",
				});
			}
		} else {
			res.send("Wrong username or password");
		}
	} catch (error) {
		console.log(error);
	}
});

router.post("/register", async (req, res) => {
	try {
		const { username, password } = req.body;
		const hashedPassword = await bycrypt.hash(password, 10); // Corrected typo from 'bycrypt' to 'bcrypt'
		const user = new User({ username, password: hashedPassword });
		try {
			await user.save();
			return res.status(201).json({ message: "User Created", user });
		} catch (error) {
			return res.status(409).json({ message: "User already exists" });
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "Internal Server error" });
	}
});

module.exports = router;
