const { Op } = require("sequelize");
const moment = require("moment");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

const Booking = require("../../../models/Booking");
const CancelOrder = require("../../../models/cencelorder");
const User = require("../../../models/user");

const razorpay = new Razorpay({
    key_id: "rzp_live_Rfc7dYQHMQQfkC",
    key_secret: "5fRMeoyoaVeenKf6mzRDKpGR",
});

// ✉️ Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "mail.shunyataecoresort.com",
    port: 465,
    secure: true,
    auth: {
        user: "reservation-confirmation@shunyataecoresort.com",
        pass: "rewari@123321123",
    },
});

async function sendBookingConfirmationEmail(to, name, booking) {
    try {
        const checkIn = moment(booking.checkInDate).format("MMMM Do YYYY");
        const checkOut = moment(booking.checkOutDate).format("MMMM Do YYYY");
        const mailOptions = {
            from: '<reservation-confirmation@shunyataecoresort.com>',
            to,
            subject:" Booking Confirmation - Shunyata Eco Resort",
            html: `
                <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
                    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background:#0b3d2e; color:#fff; padding:15px 20px;">
                            <h2 style="margin:0;">Booking Confirmation</h2>
                        </div>
                        <div style="padding:20px; color:#333;">
                            <p>Dear <strong>${name || "Guest"}</strong>,</p>
                            <p>We are delighted to inform you that your booking at <strong>Shunyata Eco Resort</strong> has been successfully confirmed.</p>

                            <h3 style="margin-top:25px;">Booking Details</h3>
                            <table style="width:100%; border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0;"><strong>Booking ID:</strong></td>
                                    <td>${booking.id}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;"><strong>Check-in Date:</strong></td>
                                    <td>${checkIn}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;"><strong>Check-out Date:</strong></td>
                                    <td>${checkOut}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;"><strong>Guests:</strong></td>
                                    <td>${booking.guests}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;"><strong>Payment Type:</strong></td>
                                    <td>${booking.paymentType}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;"><strong>Total Amount:</strong></td>
                                    <td>₹${booking.totalPrice}</td>
                                </tr>
                            </table>

                            <p style="margin-top:20px;">We look forward to welcoming you soon. Please keep this email as a confirmation of your booking.</p>

                            <p style="margin-top:25px;">Warm regards,<br>
                            <strong>Shunyata Eco Resort Team</strong><br>
                            <a href="https://shunyataecoresort.com" style="color:#0b3d2e;">www.shunyataecoresort.com</a></p>
                        </div>

                        <div style="background:#f1f1f1; text-align:center; padding:10px; font-size:12px; color:#666;">
                            © ${new Date().getFullYear()} Shunyata Eco Resort. All rights reserved.
                        </div>
                    </div>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log("✅ Booking confirmation email sent to:", to);
    } catch (err) {
        console.error("⚠️ Error sending booking confirmation email:", err);
    }
}

function OrderController() {
    return {
        // ✅ 1️⃣ Create Razorpay Order (before payment)
        async createOrder(req, res) {
            try {
                if (!req.session.cart || !req.session.cart.items) {
                    return res.status(400).json({ message: "No rooms in prebooking cart." });
                }
                  if (!req.session.finalAmount) {
            return res.status(400).json({ message: "Checkout final amount missing." });
        }


                const totalAmount = Math.round(req.session.finalAmount * 100);
                const options = {
                    amount: totalAmount,
                    currency: "INR",
                    receipt: `receipt_${Date.now()}`,
                };

                const order = await razorpay.orders.create(options);

                return res.json({
                    success: true,
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    key: "rzp_live_Rfc7dYQHMQQfkC",
                });
            } catch (err) {
                console.error("⚠️ Razorpay Order Creation Error:", err);
                return res.status(500).json({ message: "Could not create Razorpay order." });
            }
        },

       // ✅ 2️⃣ Verify Payment + Save Booking in Database
async verifyPayment(req, res) {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, customerPhone, customerAddress } = req.body;

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return res.status(400).json({ message: "Incomplete payment details." });
        }

        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", "5fRMeoyoaVeenKf6mzRDKpGR")
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment verification failed." });
        }

        const cart = req.session.cart;
        if (!cart || !cart.items) {
            return res.status(400).json({ message: "Cart not found in session." });
        }

        const user = await User.findByPk(req.user.id);

        for (const key in cart.items) {
            const { item, qty } = cart.items[key];
            const totalAmount = item.price * qty;

            const booking = await Booking.create({
                customerId: req.user.id,
                roomTypeId: item.id,
                checkInDate: item.checkin,
                checkOutDate: item.checkout,
                guests: item.guests,
                totalPrice: totalAmount,
                customerPhone,
                customerAddress,

                // 🔥 NEW FIELDS ADDED
                paymentId: razorpayPaymentId,
                razorpayOrderId: razorpayOrderId,
                razorpaySignature: razorpaySignature,
                refundStatus: "not_requested",

                paymentType: "Razorpay",
                paymentStatus: true,
                status: "panding",
            });

            if (user && user.email) {
                await sendBookingConfirmationEmail(user.email, user.name, booking);
            }
        }

        delete req.session.cart;
        return res.json({ success: true, message: "Payment verified & booking confirmed!" });
    } catch (err) {
        console.error("⚠️ Payment Verification Error:", err);
        return res.status(500).json({ message: "Something went wrong while verifying payment." });
    }
},

        // ✅ 3️⃣ Save booking for COD (Cash on Delivery)
        async codBooking(req, res) {
            try {
                const { customerPhone, customerAddress } = req.body;

                if (!req.session.cart || !req.session.cart.items) {
                    return res.status(400).json({ message: "No rooms in prebooking cart." });
                }

                const cart = req.session.cart;
                const user = await User.findByPk(req.user.id);

                for (const key in cart.items) {
                    const { item, qty } = cart.items[key];
                    const totalAmount = item.price * qty;

                    const booking = await Booking.create({
                        customerId: req.user.id,
                        roomTypeId: item.id,
                        checkInDate: item.checkin,
                        checkOutDate: item.checkout,
                        guests: item.guests,
                        totalPrice: totalAmount,
                        customerPhone,
                        customerAddress,
                        paymentType: "COD",
                        paymentStatus: false,
                        status: "pending",
                    });

                    if (user && user.email) {
                        await sendBookingConfirmationEmail(user.email, user.name, booking);
                    }
                }

                delete req.session.cart;
                return res.json({ success: true, message: "Booking placed successfully! Pay at check-in." });
            } catch (err) {
                console.error("⚠️ COD Booking Error:", err);
                return res.status(500).json({ message: "Could not place booking." });
            }
        },

        // ✅ 4️⃣ View all bookings for logged-in user
        async index(req, res) {
            try {
                const bookings = await Booking.findAll({
                    where: { customerId: req.user.id },
                    order: [["createdAt", "DESC"]],
                });

                res.render("customer/orders", { bookings, moment });
            } catch (err) {
                console.error("⚠️ Fetch Bookings Error:", err);
                res.status(500).send("Could not fetch bookings.");
            }
        },

        // ✅ 5️⃣ Cancel Booking
        async cancelBooking(req, res) {
            const bookingId = req.params.id;
            try {
                const booking = await Booking.findOne({ where: { id: bookingId } });
                if (!booking) {
                    req.flash("error", "Booking not found.");
                    return res.redirect("/customer/cencel-booking");
                }

                await CancelOrder.create({
                    id: booking.id,
                    customerId: booking.customerId,
                    phone: booking.customerPhone,
                    totalPrice: booking.totalPrice,
                    address: booking.customerAddress,
                    status: "Cancelled",
                    paymentType: booking.paymentType,
                    paymentStatus: booking.paymentStatus,
                    createdAt: booking.createdAt,
                    updatedAt: new Date(),
                });

                await Booking.destroy({ where: { id: bookingId } });

                req.flash("success", "Booking cancelled successfully.");
                res.redirect("/customer/booking");
            } catch (err) {
                console.error("⚠️ Cancel Booking Error:", err);
                req.flash("error", "Something went wrong while cancelling.");
                res.redirect("/customer/booking");
            }
        },
    };
}

module.exports = OrderController;