const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const Contact = require("../../models/Contact");

// Middleware
router.use(bodyParser.urlencoded({ extended: true }));

router.use((req, res, next) => {
	res.locals.layout = "./layouts/main"; // Default layout for main routes
	next();
});

router.get("/", async (req, res) => {
	const locals = {
		title: "NodeJs Blog",
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
});

// Display edit form
router.get("/edit-contact/:id", async (req, res) => {
	const contactId = req.params.id;
	try {
		const contact = await Contact.findById(contactId).exec();
		res.render("edit-contact", { contact });
	} catch (error) {
		console.error("Error fetching contact:", error);
		res.redirect("/");
	}
});

// Handle edit form submission
router.post("/edit/:id", async (req, res) => {
	const contactId = req.params.id;
	const updatedData = {
		name: req.body.name,
		phone: req.body.phone,
		email: req.body.email,
		address: req.body.address,
	};

	try {
		await Contact.findByIdAndUpdate(contactId, updatedData);
		res.redirect("/?message=Contact edited successfully");
	} catch (error) {
		console.error("Error updating contact:", error);
		res.redirect(`/edit/${contactId}`);
	}
});

// Handle delete request
router.post("/delete/:id", async (req, res) => {
	const contactId = req.params.id;
	try {
		await Contact.findByIdAndDelete(contactId);
		res.redirect("/?message=Contact deleted successfully");
	} catch (error) {
		console.error("Error deleting contact:", error);
		res.redirect("/");
	}
});

router.get("/about", (req, res) => {
	const locals = {
		title: "NodeJs Blog",
		description: "Simple Blog created",
		currentPath: req.path,
	};
	res.render("about", { locals });
});

router.get("/contact", (req, res) => {
	const locals = {
		title: "NodeJs Blog",
		description: "Simple Blog created",
		currentPath: req.path,
	};
	res.render("contact", { locals });
});

router.post("/contact", async (req, res) => {
	const { name, phone, email, address } = req.body;
	const newContact = new Contact({ name, phone, email, address });
	const locals = {
		title: "NodeJs Blog",
		description: "Simple Blog created",
		currentPath: req.path,
	};

	try {
		await newContact.save();
		res.render("contact", {
			success: "Contact information saved successfully!",
			locals,
		});
	} catch (error) {
		console.error(error);
		res.render("contact", {
			success: "An error occurred. Please try again!!!",
			locals,
		});
	}
});

module.exports = router;
