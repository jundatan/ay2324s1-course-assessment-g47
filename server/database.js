require("dotenv").config(); // Load environment variables from .env file

//write database code
const { Pool } = require("pg");

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
});

// CREATE TABLE
// const createTblQry = `CREATE TABLE accounts (
//     user_id serial PRIMARY KEY,
//     username VARCHAR ( 255 ) NOT NULL,
// email VARCHAR ( 255 ) UNIQUE NOT NULL,
//     password VARCHAR ( 255 ) NOT NULL);
//     `;

// pool.query(createTblQry)
// 	.then((res) => {
// 		console.log("Table created");
// 		console.log(res);
// 		// pool.end();
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 		// pool.end();
// 	});

// CREATE NEW DATABASE
// pool.query("CREATE DATABASE yt_login_system;")
// 	.then((res) => {
// 		console.log("Database created");
// 		console.log(res);
// 		// pool.end();
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 		// pool.end();
// 	});

module.exports = pool;
