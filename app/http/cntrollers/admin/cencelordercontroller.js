const { Op } = require("sequelize");
const Booking = require("../../../models/Booking");
const CencelOrder = require("../../../models/cencelorder");
const User = require("../../../models/user");
const moment = require("moment");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");

// Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RZ_KEY_ID || "rzp_live_Rfc7dYQHMQQfkC",
  key_secret: process.env.RZ_KEY_SECRET || "5fRMeoyoaVeenKf6mzRDKpGR",
});

function cencelordercontroller(io) {
  const transporter = nodemailer.createTransport({
    host: "mail.shunyataecoresort.com",
    port: 465,
    secure: true,
    auth: {
      user: "reservation@shunyataecoresort.com",
      pass: "rewari@123321123",
    },
  });

  return {
    // ----------------- USER SIDE -----------------

    async userCancelBooking(req, res) {
      try {
        const bookingId = req.params.id;
        const booking = await Booking.findOne({ where: { id: bookingId, customerId: req.user.id } });

        if (!booking) {
          req.flash("error", "Booking not found.");
          return res.redirect("/customer/cencel-booking");
        }

        // Move booking data to CencelOrder
        await CencelOrder.create({
          id: booking.id,
          customerId: booking.customerId,
          email: req.user.email,
          phone: booking.customerPhone,
          address: booking.customerAddress,
          totalPrice: booking.totalPrice,
          paymentType: booking.paymentType,
          paymentStatus: booking.paymentStatus,
          paymentId: booking.paymentId || null,
          refundStatus: "not_applicable",
          refundInfo: null,
          reason: req.body.reason || null,
          status: "pending",
        });

        await booking.destroy();

        await transporter.sendMail({
          from: '"Shunyata Eco Resort" <reservation@shunyataecoresort.com>',
          to: req.user.email,
          subject: "Booking Cancellation Requested",
          html: `<p>Hi ${req.user.name},</p>
                 <p>Your booking with ID <strong>${booking.id}</strong> has been requested for cancellation.</p>
                 <p>Our admin will approve or reject your cancellation shortly.</p>
                 <p>Thank you, <br> Shunyata Eco Resort</p>`,
        });

        req.flash("success", "Booking cancellation requested successfully!");
        return res.redirect("/customer/cencel-booking");
      } catch (err) {
        console.error("User Cancel Booking Error:", err);
        req.flash("error", "Something went wrong while canceling booking.");
        return res.redirect("/customer/cencel-booking");
      }
    },

    async userCanceledOrders(req, res) {
      try {
        const orders = await CencelOrder.findAll({
          where: { customerId: req.user.id },
          order: [["createdAt", "DESC"]],
        });
        return res.render("customer/cencel-orders", { cencelorders: orders, moment });
      } catch (err) {
        console.error("Error fetching user canceled orders:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("/customer/cencel-booking");
      }
    },

    // ----------------- ADMIN SIDE -----------------

    async index(req, res) {
      try {
        const orders = await CencelOrder.findAll({
          where: { status: { [Op.ne]: "completed" } },
          order: [["createdAt", "DESC"]],
        });
        return res.render("admin/cencelorders", { cencelorders: orders, moment });
      } catch (err) {
        console.error("Admin Fetch Canceled Orders Error:", err);
        return res.status(500).json({ message: "Something went wrong!" });
      }
    },

    async approve(req, res) {
      try {
        const { id } = req.params;
        const order = await CencelOrder.findByPk(id);

        if (!order) {
          req.flash("error", "Canceled order not found.");
          return res.redirect("/admin/cencelorders");
        }

        // --------------------
        // RAZORPAY REFUND LOGIC
        // --------------------
        let refundResponse = null;

       if ((order.paymentStatus === true || order.paymentStatus === 1) && order.paymentId) {
    try {
        refundResponse = await razorpay.payments.refund(order.paymentId, {
            amount: Math.round(order.totalPrice * 100),
            speed: "optimum",
        });

        order.refundStatus = "initiated";
        order.refundInfo = JSON.stringify(refundResponse);

    } catch (error) {
        console.error("Refund API Error:", error);
        req.flash("error", "Refund API error — check Razorpay logs.");
        return res.redirect("/admin/cencelorders");
    }
} else {
    order.refundStatus = "not_applicable";
}

        // Update status
        order.status = "approved";
        await order.save();

        // Fetch user
        const user = await User.findByPk(order.customerId);

        // --------------------
        // SEND MAIL
        // --------------------
        if (user) {
          await transporter.sendMail({
            from: '"Shunyata Eco Resort" <reservation@shunyataecoresort.com>',
            to: user.email,
            subject: "Booking Cancellation Approved",
            html: `
              <p>Hi ${user.name},</p>
              <p>Your cancellation request for booking ID <strong>${order.id}</strong> has been <strong>approved</strong>.</p>

              ${
                refundResponse
                  ? `<p>Your refund of <strong>₹${order.totalPrice}</strong> has been initiated.</p>
                     <p>You should receive the amount within 5–7 business days.</p>`
                  : `<p>No online payment was detected, so refund is not applicable.</p>`
              }

              <p>Thank you,<br>Shunyata Eco Resort</p>
            `,
          });
        }

        // Emit for live update
        io.emit("cencelOrderUpdated", { id: order.id, status: order.status });

        req.flash("success", "Cancellation approved & refund processed!");
        return res.redirect("/admin/cencelorders");
      } catch (err) {
        console.error("Approve Error:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("/admin/cencelorders");
      }
    },

    async reject(req, res) {
      try {
        const { id } = req.params;
        const order = await CencelOrder.findByPk(id);

        if (!order) {
          req.flash("error", "Canceled order not found.");
          return res.redirect("/admin/cencelorders");
        }

        order.status = "rejected";
        await order.save();

        const user = await User.findByPk(order.customerId);
        if (user) {
          await transporter.sendMail({
            from: '"Shunyata Eco Resort" <reservation@shunyataecoresort.com>',
            to: user.email,
            subject: "Booking Cancellation Rejected",
            html: `<p>Hi ${user.name},</p>
                   <p>Your cancellation request for booking ID <strong>${order.id}</strong> has been <strong>rejected</strong> by our admin.</p>
                   <p>For any queries, contact support.</p>
                   <p>Thank you, <br> Shunyata Eco Resort</p>`,
          });
        }

        io.emit("cencelOrderUpdated", { id: order.id, status: order.status });
        req.flash("success", "Cancellation rejected successfully!");
        return res.redirect("/admin/cencelorders");
      } catch (err) {
        console.error("Reject Canceled Order Error:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("/admin/cencelorders");
      }
    },

    async deleteOrder(req, res) {
      try {
        const { id } = req.params;
        const order = await CencelOrder.findByPk(id);

        if (!order) {
          req.flash("error", "Canceled order not found.");
          return res.redirect("/admin/cencelorders");
        }

        await order.destroy();
        io.emit("cencelOrderDeleted", { id: order.id });
        req.flash("success", "Canceled order deleted successfully!");
        return res.redirect("/admin/cencelorders");
      } catch (err) {
        console.error("Delete Canceled Order Error:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("/admin/cencelorders");
      }
    },
  };
}

module.exports = cencelordercontroller;