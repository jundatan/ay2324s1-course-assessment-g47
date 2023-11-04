import React, { useState } from "react";
import { Link } from "react-router-dom";
import LoginPage from "./Login";
import "./Login.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

function Profile({ user, handleUserChange, handleLogout, handleLogin }) {
	const postgresqlPort = 4001;
	const [isEditing, setIsEditing] = useState(false);
	const [localUser, setLocalUser] = useState({
		username: user ? user.username : "",
		email: user ? user.email : "",
		password: user ? user.password : "",
	});
	// const navigate = N();

	const handleEditClick = () => {
		setIsEditing(true);
	};

	const handleSaveClick = async (e) => {
		// Check if the username and email are not empty
		if (!localUser.username || !localUser.email || !localUser.password) {
			console.log("Username, email and password cannot be empty");
			toast.error("Username, email and password cannot be empty");
			return;
		}

		e.preventDefault();
		setIsEditing(false);

		handleUserChange(localUser);
		//get user id from local storage then update user info
		try {
			console.log(user);
			const response = await fetch(
				`http://localhost:${postgresqlPort}/users/update/${user.user_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(localUser),
				}
			);

			if (response.status === 200) {
				//successful update
				const data = await response.json();
				console.log("Update successful");
			} else {
				// Handle other error cases
				console.log("Server error");
			}
		} catch (error) {
			console.error("Error:", error);
		}
	};

	const handleDeleteClick = async (e) => {
		e.preventDefault();

		// Show a confirmation dialog
		const confirmed = window.confirm(
			"Are you sure you want to delete this user?"
		);

		if (confirmed) {
			try {
				const response = await fetch(
					`http://localhost:${postgresqlPort}/users/delete`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(user),
					}
				);

				if (response.status === 200) {
					//successful delete
					const data = await response.json();
					console.log("Delete successful");

					handleLogout();
				} else if (response.status === 401) {
					// Invalid email or password
					const errorData = await response.json();
					console.log("Delete failed: " + errorData.error);
				} else {
					// Handle other error cases
					console.log("Server error");
				}
			} catch (error) {
				console.error("Error:", error);
			}
		}
	};

	if (!user) {
		console.log("User is not defined");
		return <Navigate to="/" replace={true} />;
	}

	return (
		<div className="profile-container">
			<h2 className="profile-heading">Profile</h2>
			<div className="username-wrapper">
				<label className="login-label">Username:</label>
				{isEditing ? (
					<input
						className="login-input"
						type="text"
						onChange={(e) => {
							setLocalUser({
								...localUser,
								username: e.target.value,
							});
						}}
						value={localUser.username}
						name="username"
					/>
				) : (
					<span>{user && user.username}</span>
				)}
			</div>
			<div className="email-wrapper">
				<label className="login-label">Email:</label>
				{isEditing ? (
					<input
						className="login-input"
						type="email"
						onChange={(e) => {
							setLocalUser({
								...localUser,
								email: e.target.value,
							});
						}}
						value={localUser.email}
						name="email"
					/>
				) : (
					<span>{user && user.email}</span>
				)}
			</div>
			<div className="password-wrapper">
				<label className="login-label">Password:</label>
				{isEditing ? (
					<input
						className="login-input"
						type="text" // Change input type to text
						onChange={(e) => {
							setLocalUser({
								...localUser,
								password: e.target.value,
							});
						}}
						value={localUser.password}
						name="password"
					/>
				) : (
					<span>{"*".repeat(localUser.password.length)}</span> // Display asterisks or a masked value
				)}
			</div>
			<div className="buttons">
				{isEditing ? (
					<button
						className="login-button"
						onClick={(e) => handleSaveClick(e)}
					>
						Save
					</button>
				) : (
					<>
						<button
							className="login-button"
							onClick={handleEditClick}
						>
							Edit
						</button>
						<button
							className="login-button"
							onClick={handleDeleteClick}
						>
							Delete account
						</button>
					</>
				)}
			</div>
			{!isEditing ? <Link to="/">Dashboard</Link> : null}
			<ToastContainer />
		</div>
	);
}

export default Profile;