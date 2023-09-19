require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");

// For OTP Verification model
const UserOTPVerification = require("./models/UserOTPVerification");
const mongoose = require('mongoose');

// Connecting to MongoDB and verifying its connection
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 30000, // Global server selection timeout in milliseconds
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// For postgresql
const cors = require("cors");
const pool = require("./database");
const bcrypt = require("bcrypt");
const port = process.env.POSTGRESQLPORT;

// Nodemailer stuff
const { AUTH_EMAIL, AUTH_PASS } = process.env;
let transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    auth: {
        user: AUTH_EMAIL,
        pass: AUTH_PASS,
    },
});

const app = express(); //Start up express app

// For postgresql
app.use(express.json()); // Body parser middleware
app.use(cors()); // CORS middleware (allows requests from other domains)

// Register User
let id_counter;

app.post("/users/register", async (req, res) => {
	res.setHeader("Content-Type", "application/json");

	const username = req.body["username"];
	const email = req.body["email"];
	const password = req.body["password"];


	console.log("Username:" + username);
	console.log("Email:" + email);
	console.log("Password:" + password);
	console.log("Account Type: User");

	try {
		// Check if the user with the same email or username already exists
		const userExistsQuery = `SELECT * FROM accounts WHERE email = $1;`;
		const userExistsResult = await pool.query(userExistsQuery, [email]);

		if (userExistsResult.rowCount > 0) {
			// User with the same email or username already exists
			console.log("User already exists");
			return res.status(401).json({ message: "Email already exists" });
		}
		// Hash the password
		// const saltRounds = 10; // Number of salt rounds
		// const hashedPassword = bcrypt.hashSync(password, saltRounds);

		// console.log("Hashed password:" + hashedPassword);

		const insertSTMT = `INSERT INTO accounts (username, email, password, account_type) VALUES ('${username}', '${email}', '${password}', 'user') RETURNING user_id;`;
		pool.query(insertSTMT)
			.then((response) => {
				id_counter = response.rows[0].user_id;
				console.log("User added");
				console.log(response);
				console.log("Last Inserted ID:", id_counter);
			})
			.catch((err) => {
				console.log(err);
			});
	
		console.log(req.body);
		res.json({ message: "Account Created!", data: req.body });
		sendOTPVerificationEmail({ _id: id_counter, email, res });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: err.message });
	}
});

// Send OTP verification email
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
	try {
		const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

		const mailOptions = {
			from: AUTH_EMAIL,
			to: email,
			subject: "Verify Your Email",
			html: `<p>Enter <b>${otp}</b> in the app to verify your email address.</p><p>This code <b>expires in 1 hour</b>.</p>`,
		};

		const saltRounds = 10;
		const hashedOTP = await bcrypt.hash(otp, saltRounds);

		try {
			const UserOTPVerificationRecords = await UserOTPVerification.find({ email: email.toString(), });
			if (UserOTPVerificationRecords.length > 0) {
				throw new Error (
					"An existing account with this email address has already been created! Please try with a new email address!"
				);
			}
			const newOTPVerification = new UserOTPVerification({
			  user_Id: _id,
			  email: email,
			  otp: hashedOTP,
			  createdAt: Date.now(),
			  expiresAt: Date.now() + 3600000,
			});
		  
			// Save OTP Record
			await newOTPVerification.save();

			await transporter.sendMail(mailOptions);

		} catch (error) {
			console.error("Error while inserting into MongoDB:", error);
			if (res) {
			  res.status(500).json({
				status: "FAILED",
				message: "Internal server error",
			  });
			}
		}
	} catch (error) {
		console.log(error);
		if (res) {
			res.json({
				status: "FAILED",
				message: error.message,
			});
		}
	}
};

// Login User
app.post("/users/login", async (req, res) => {
	res.setHeader("Content-Type", "application/json");

	const email = req.body["email"];
	const password = req.body["password"];

	console.log("Email:" + email);
	console.log("Password:" + password);

	const selectSTMT = `SELECT * FROM accounts WHERE 
        email = '${email}' AND password = '${password}';`;

	try {
		const response = await pool.query(selectSTMT);

		if (response.rows.length === 0)
			return res.status(401).json({ error: "Invalid email or password" });

		const user = response.rows[0];
		console.log(user);

		if (user.password !== password) {
			// Password does not match
			return res.status(401).json({ error: "Invalid email or password" });
		}

		// Successful login
		return res.status(200).json({ message: "Login successful", user });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// Update User using ID
app.post("/users/update/:id", async (req, res) => {
	const id = req.params.id; // Get the user's ID from the URL parameter
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;

	console.log("User ID: " + id);
	console.log("Username: " + username);
	console.log("Email: " + email);
	console.log("Password: " + password);

	// Construct the UPDATE query with the ID in the WHERE clause
	const updateSTMT = `UPDATE accounts SET username = '${username}', 
                       email = '${email}', password = '${password}' WHERE user_id = ${id}`;

	try {
		const response = await pool.query(updateSTMT);
		console.log("User updated");
		console.log(response);
		return res
			.status(200)
			.json({ message: "Login successful", data: req.body });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// Update password using email (forgot password)
app.post("/users/update/password", async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	// Hash the password
	const saltRounds = 10; // Number of salt rounds
	const hashedPassword = await bcrypt.hash(password, saltRounds);

	console.log("Password:" + hashedPassword);
	console.log("Email:" + email);

	const updateSTMT = `UPDATE accounts SET password = '${hashedPassword}' WHERE email = '${email}';`;

	try {
		const response = await pool.query(updateSTMT);
		console.log("User updated");
		console.log(response);
		return res
			.status(200)
			.json({ message: "Login successful", data: req.body });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// Delete User using email
app.post("/users/delete", async (req, res) => {
	const email = req.body.email;

	console.log("Email:" + email);

	const deleteSTMT = `DELETE FROM accounts WHERE email = '${email}';`;

	try {
		const response = await pool.query(deleteSTMT);
		console.log("User deleted");
		console.log(response);
		return res
			.status(200)
			.json({ message: "Deleted successful", data: req.body });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// Update account type using email
app.post("/users/update/type/:id", async (req, res) => {
	const email = req.body.email;
	const account_type = req.body.account_type;
	
	console.log("Email:" + email);
	console.log("Account Type:" + account_type);

	const updateSTMT = `UPDATE accounts SET account_type = '${account_type}' WHERE email = '${email}';`;

	try {
		const response = await pool.query(updateSTMT);
		console.log("User updated");
		console.log(response);
		return res
			.status(200)
			.json({ message: "Update successful", data: req.body });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(port, () =>
	console.log(`PostgreSQL server running on port ${port}`)
);

// Verify OTP email
app.post("/verifyOTP", async (req, res) => {
	try {
		let { email, otp } = req.body;
		console.log(email);
		console.log(otp);
		if (!email || !otp) {
			throw Error("Empty OTP details are not allowed");
		} else {
			const UserOTPVerificationRecords = await UserOTPVerification.find({
				email: email.toString(),
			});
			if (UserOTPVerificationRecords.length <= 0) {
				throw new Error (
					"Account record doesn't exist or has been verified already. Please sign up or log in."
				);
			} else {
				const { expiresAt } = UserOTPVerificationRecords[0];
				const hashedOTP = UserOTPVerificationRecords[0].otp;
				// const storedEmail = UserOTPVerificationRecords[0].email;

				if (expiresAt < Date.now()) {
					// User OTP record has expired
					await UserOTPVerification.deleteMany({ email: email.toString() });
					throw new Error("Code has expired. Please request again.");
				} else {
					const validOTP = await bcrypt.compare(otp, hashedOTP);
					if (!validOTP) {
						// OTP given is wrong / invalid
						throw new Error("Invalid verification code given. Check your inbox and submit again.");
					} else {
						const updateAuthentication = `UPDATE accounts SET authentication_stats = 'true' WHERE email = '${email}';`;
						const response = await pool.query(updateAuthentication);
						console.log("User updated");
						console.log(response);
						await UserOTPVerification.deleteMany({ email: email.toString() });
						return res
							.status(200)
							.json({ status: "VERIFIED", message: "You are now verified!", data: req.body });
					}
				}
			}
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ status: "FAILED", message: error.message });
	}
});

// Resending OTP
app.post("/resendOTPVerificationCode", async (req, res) => {
	try {
		let { email } = req.body;

		if (!email) {
			throw Error("Empty user details are not allowed");
		} else {
			// check if there's even an entry for this email
			const UserOTPVerificationRecords = await UserOTPVerification.find({ email: email.toString(), });
			if (UserOTPVerificationRecords.length <= 0) {
				throw new Error (
					"An existing account with this email address has already been created! Please try with a new email address!"
				);
			}
			// delete existing records and resend
			await UserOTPVerification.deleteMany({ email: email.toString() });
			const selectUserIdQuery = `SELECT user_id FROM accounts WHERE email = '${email}';`;
			const response = await pool.query(selectUserIdQuery);
			const userID = response.rows[0].user_id;
			console.log(response);

			if (response.rowCount === 0) {
				throw Error("Invalid email given. Please check the email you keyed in and resubmit.");
			}

			sendOTPVerificationEmail({ _id: userID, email }, res);
			return res
			.status(200)
			.json({ status: "RESENT", message: "New verification code has been sent to you.", data: req.body });
		}
	} catch (error) {
		return res
			.status(500)
			.json({ status: "FAILED", message: error.message,
		});
	}
});
