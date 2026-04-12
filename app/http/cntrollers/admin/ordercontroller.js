const { Op } = require("sequelize");
const Booking = require("../../../models/Booking");
const User = require("../../../models/user");
const Room = require("../../../models/RoomType");
const moment = require("moment");

function orderController(io) {
    return {
        // ✅ View all bookings
        async index(req, res) {
            try {
                const bookings = await Booking.findAll({
                    where: { status: { [Op.ne]: "completed" } },
                    include: [
                        { model: User, attributes: ["id", "name"] },
                        { model: Room, as: "roomType", attributes: ["id", "name"] }
                    ],
                    order: [["createdAt", "DESC"]],
                });

                return res.render("admin/orders", { bookings, moment });
            } catch (err) {
                console.error("⚠️ Fetch Bookings Error:", err);
                return res.status(500).send("Something went wrong!");
            }
        },

        // ✅ Update booking status from dropdown
        async updateStatus(req, res) {
            try {
                const { id } = req.params;
                const { status } = req.body;

                const booking = await Booking.findOne({ where: { id } });
                if (!booking) return res.status(404).send("Booking not found");

                booking.status = status;
                await booking.save();

                // Emit socket event to user side for live update
                io.emit("bookingUpdated", { id: booking.id, status: booking.status });

                req.flash("success", Booking `status updated to ${status}`);
                res.redirect("/admin/bookings");
            } catch (err) {
                console.error("⚠️ Error updating booking:", err);
                req.flash("error", "Something went wrong while updating status!");
                res.redirect("/admin/bookings");
            }
        },

        // ✅ Delete booking (Admin only)
        async delete(req, res) {
            try {
                const booking = await Booking.findOne({ where: { id: req.params.id } });
                if (!booking) return res.status(404).send("Booking not found");

                await booking.destroy();

                // Emit socket event for deletion
                io.emit("bookingDeleted", { id: booking.id });

                req.flash("success", "Booking deleted successfully");
                res.redirect("/admin/bookings");
            } catch (err) {
                console.error("⚠️ Delete Booking Error:", err);
                req.flash("error", "Something went wrong while deleting booking!");
                res.redirect("/admin/bookings");
            }
        },
    };
}

module.exports = orderController;