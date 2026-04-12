const User = require("../../../models/user"); // Ensure this is your Sequelize model

function usercontroller() {
    return {
        // Fetch all users and render them
        async users(req, res) {
            try {
                const users = await User.findAll();
                return res.render("admin/allusers", { pizzas: users }); // Assuming 'pizzas' refers to users in the template
            } catch (err) {
                console.error("Error fetching users:", err);
                return res.status(500).send("Error fetching users");
            }
        },

        // Edit user details
        async editUser(req, res) {
            const { userId, name, email, role } = req.body;
            if (!userId || !name || !email || !role) {
                return res.status(400).json({ message: "All fields are required" });
            }

            try {
                const [updatedRows] = await User.update(
                    { name, email, role },
                    { where: { id: userId } }
                );

                if (updatedRows === 0) {
                    return res.status(404).json({ message: "User not found or no changes made" });
                }
                return res.status(200).json({ message: "User updated successfully" });
            } catch (err) {
                console.error("Error updating user:", err);
                return res.status(500).json({ message: "Failed to update user" });
            }
        },

        // Block or unblock user
        async blockUser(req, res) {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            try {
                const user = await User.findByPk(userId);
                if (!user) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }

                user.blocked = !user.blocked; // Toggle the value
                await user.save(); // Save the changes

                return res.status(200).json({
                    success: true,
                    message: user.blocked ? "User blocked successfully" : "User unblocked successfully",
                    blocked: user.blocked,
                });
            } catch (err) {
                console.error("Error updating block status:", err);
                return res.status(500).json({ success: false, message: "Failed to update block status" });
            }
        },

        // Delete user
        async deleteUser(req, res) {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ message: "User ID is required" });
            }

            try {
                const deletedRows = await User.destroy({ where: { id: userId } });

                if (deletedRows === 0) {
                    return res.status(404).json({ message: "User not found" });
                }
                return res.status(200).json({ message: "User deleted successfully" });
            } catch (err) {
                console.error("Error deleting user:", err);
                return res.status(500).json({ message: "Failed to delete user" });
            }
        },
        async  profile(req, res) {
            if (!req.isAuthenticated()) {
                return res.redirect("/login");
            }

            res.render("auth/profile", { user: req.user });
        },
        async changePassword(req, res) {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                req.flash("error", "All fields are required.");
                return res.redirect("/profile");
            }

            if (newPassword !== confirmPassword) {
                req.flash("error", "New passwords do not match.");
                return res.redirect("/profile");
            }

            try {
                const user = await User.findByPk(req.user.id);
                if (!user) {
                    req.flash("error", "User not found.");
                    return res.redirect("/profile");
                }

                // Verify current password
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    req.flash("error", "Current password is incorrect.");
                    return res.redirect("/profile");
                }

                // Hash new password and update
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
                await user.save();

                req.flash("success", "Password updated successfully.");
                return res.redirect("/profile");
            } catch (err) {
                console.error("Error updating password:", err);
                req.flash("error", "Something went wrong.");
                return res.redirect("/profile");
            }
        }
    };
}

module.exports = usercontroller;