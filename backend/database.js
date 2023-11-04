require("dotenv").config(); // Load environment variables from .env file

//write database code
const { Pool } = require("pg");

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE, //Comment out when creating a new database
});

// // CREATE NEW DATABASE IF IT DOESN'T EXIST
// const createDatabaseQuery = `
//   CREATE DATABASE ${process.env.DB_DATABASE};
// `;

// pool.query(createDatabaseQuery)
// 	.then((res) => {
// 		console.log("Database created or already exists");
// 	})
// 	.catch((err) => {
// 		console.error("Error creating database:", err);
// 	});

// CREATE TABLE IF NOT EXISTS
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS accounts (
    user_id serial PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  );
`;

pool.query(createTableQuery)
	.then((res) => {
		console.log("Table created or already exists");
	})
	.catch((err) => {
		console.error("Error creating table:", err);
	});

// // CREATE NEW DATABASE
// pool.query("CREATE DATABASE cs3219_g47;")
// 	.then((res) => {
// 		console.log("Database created");
// 		console.log(res);
// 		// pool.end();
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 		// pool.end();
// 	});

// // CREATE TABLE
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

module.exports = pool;