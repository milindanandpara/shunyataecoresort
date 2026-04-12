const Booking = require("../../../models/Booking");
const User = require("../../../models/user");
const moment = require("moment");

function CheckoutController() {
  return {
    // ✅ Show checkout page (FINAL FIXED VERSION)
    async showCheckout(req, res) {
      try {
        const cart = req.session.cart;
        if (!cart || !cart.items) {
          req.flash("error", "Your prebooking cart is empty.");
          return res.redirect("/rooms");
        }

        // 🧾 Prepare booking summary WITH QTY + NIGHTS
        const roomList = Object.values(cart.items).map((room) => {
          const nights = moment(room.item.checkout).diff(
            moment(room.item.checkin),
            "days"
          );

          const total = room.item.price * nights * room.qty;

          return {
            id: room.item.id,
            name: room.item.name,
            guests: room.item.guests,
            qty: room.qty,
            checkin: moment(room.item.checkin).format("DD MMM YYYY"),
            checkout: moment(room.item.checkout).format("DD MMM YYYY"),
            nights,
            price: room.item.price,
            total,
          };
        });

        // 💰 Pricing summary (now based on correct qty × nights)
        const subtotal = roomList.reduce((sum, r) => sum + r.total, 0);
        const tax = subtotal * 0.05; // 5% GST
        const discount = subtotal > 10000 ? 1000 : 0; // Optional
        const grandTotal = subtotal + tax - discount;

        // Store final total in session for Razorpay
        req.session.finalAmount = grandTotal;

        res.render("customer/checkout", {
          user: req.user,
          cart,
          roomList,
          subtotal,
          tax,
          discount,
          grandTotal,
        });
      } catch (err) {
        console.error("⚠️ Checkout Page Error:", err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/rooms");
      }
    },

    // 🧾 AJAX Preview (if needed — now also correct)
    async preview(req, res) {
      try {
        const cart = req.session.cart;
        if (!cart || !cart.items) {
          return res.status(400).json({ message: "No rooms in cart." });
        }

        const summary = Object.values(cart.items).map((room) => {
          const nights = moment(room.item.checkout).diff(
            moment(room.item.checkin),
            "days"
          );

          return {
            roomType: room.item.name,
            checkInDate: room.item.checkin,
            checkOutDate: room.item.checkout,
            guests: room.item.guests,
            qty: room.qty,
            total: room.item.price * nights * room.qty,
          };
        });

        res.json({
          success: true,
          summary,
        });
      } catch (err) {
        console.error("⚠️ Checkout Preview Error:", err);
        res.status(500).json({ message: "Error generating preview." });
      }
    },
  };
}

module.exports = CheckoutController;