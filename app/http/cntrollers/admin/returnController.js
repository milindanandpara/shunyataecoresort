
const Return = require("../../../models/return"); // Ensure the correct path
const Order = require("../../../models/Booking");
const User = require("../../../models/user");

function returnController() {
    return {
        // Render the return request form for customers
        createReturnPage(req, res) {
            res.render("customer/return-product");
        },
        async index(req, res) {
            try {
                const userId = req.user.id; // Assuming user is authenticated
                const returns = await Return.findAll({
                    where: { userId },
                    order: [["createdAt", "DESC"]],
                });

                return res.render("customer/return-product", { returns });
            } catch (error) {
                console.error("Error fetching returns:", error);
                return res.status(500).json({ message: "Something went wrong!" });
            }
        },
        // Handle submission of return request
        async postReturnRequest(req, res) {
            const { userId, orderId, description } = req.body;

            // Validate input
            if (!userId || !orderId || !description) {
                req.flash("error", "All fields are required.");
                return res.redirect("/product-return");
            }

            try {
                // Check if the user and order exist
                const userExists = await User.findByPk(userId);
                const orderExists = await Order.findByPk(orderId);

                if (!userExists || !orderExists) {
                    req.flash("error", "Invalid user or order ID.");
                    return res.redirect("/product-return");
                }

                // Create a new return request
                await Return.create({
                    userId,
                    orderId,
                    description,
                    status: "Pending",
                });

                req.flash("success", "Return request submitted successfully.");
                return res.redirect("/product-return");
            } catch (error) {
                console.error("Error submitting return request:", error);
                req.flash("error", "Something went wrong while submitting the request.");
                return res.redirect("/product-return");
            }
        },

        // View all return requests (Admin only)
        async viewAllReturns(req, res) {
            try {
                const returns = await Return.findAll({
                    include: [
                        { model: User, attributes: ["name", "email"] },
                        { model: Order, attributes: ["id", "totalPrice"] }
                    ],
                    order: [["createdAt", "DESC"]],
                });

                res.render("admin/returns", { returns });
            } catch (error) {
                console.error("Error fetching return requests:", error);
                res.status(500).send("Something went wrong while fetching returns.");
            }
        },

        // Approve or reject a return request (Admin only)
        async updateReturnStatus(req, res) {
            const { returnId, status } = req.body;

            try {
                const returnRequest = await Return.findByPk(returnId);
                if (!returnRequest) {
                    return res.status(404).json({ message: "Return request not found." });
                }

                // Update status (e.g., Approved, Rejected)
                returnRequest.status = status;
                await returnRequest.save();

                req.flash("success", `Return request ${status} successfully.`);
                return res.redirect("/admin/returns");
            } catch (error) {
                console.error("Error updating return status:", error);
                req.flash("error", "Something went wrong while updating status.");
                return res.redirect("/admin/returns");
            }
        }
    };
}

module.exports = returnController;