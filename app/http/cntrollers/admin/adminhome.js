const Order = require("../../../models/Booking");
const User = require("../../../models/user");
const Product = require("../../../models/RoomType");
const CencelOrder = require("../../../models/cencelorder");

function adminHomeController() {
    return {
        async indexx(req, res) {
            try {
                const totalOrders = await Order.count();
                const totalUsers = await User.count();
                const totalProducts = await Product.count();
                const totalCencelOrders = await CencelOrder.count(); // Count cancelled orders

                return res.render("admin/adminpass", {
                    user: req.user,
                    totalOrders,
                    totalUsers,
                    totalProducts,
                    totalCencelOrders // Pass cancelled orders count to EJS
                });
            } catch (err) {
                console.error("❌ Error fetching dashboard data:", err);
                return res.status(500).send("Error loading admin dashboard");
            }
        }
    };
}

module.exports = adminHomeController;