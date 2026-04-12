const authcontroller = require("../app/http/cntrollers/authcontroller");
const forgotcontroller = require("../app/http/cntrollers/forgotcontroller");
const homecontroller = require("../app/http/cntrollers/homecontroller");
const BookingCartController = require("../app/http/cntrollers/customers/BookingCartController");
const policycontroller = require("../app/http/cntrollers/policycontroller");
const orderController = require("../app/http/cntrollers/customers/ordercontroller");
const checkoutController = require("../app/http/cntrollers/customers/checkoutController");
const Ordercontroller = require("../app/http/cntrollers/admin/ordercontroller");
const cencelordercontroller = require("../app/http/cntrollers/admin/cencelordercontroller");
const adminn = require("../app/http/cntrollers/admin/adminhome");
const roomTypeController = require("../app/http/cntrollers/admin/RoomTypeController"); 
const usercontroller = require("../app/http/cntrollers/admin/usercontroller"); 
const searchRoomsController = require("../app/http/cntrollers/searchRoomsController");
const statusController  = require("../app/http/cntrollers/admin/statusController");
const returnController = require("../app/http/cntrollers/admin/returnController");

const passport = require("passport"); // 🔥 ADD THIS

//middleware 
const guest =  require("../app/http/middlewares/guest");
const auth  =  require("../app/http/middlewares/auth");
const admin =  require("../app/http/middlewares/admin");

function initroutes(app) {

    app.get('/', homecontroller().index)
   
    app.get('/login', guest, authcontroller().login)
    app.post('/login', authcontroller().postLogin)

    // ================= GOOGLE LOGIN =================
    app.get("/auth/google",
        passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/login"
        }),
        (req, res) => {
            res.redirect("/"); // success login
        }
    );

    app.get('/register', guest, authcontroller().register)
    app.get('/verify/:token',guest, authcontroller().verifyEmail)
    app.post('/logout', authcontroller().logout)

    //forgot password links//    
    app.get('/forgot-password', forgotcontroller().forgotPassword);
    app.post('/forgot-password', forgotcontroller().postForgotPassword);
    app.get('/reset-password/:token', forgotcontroller().resetPassword);
    app.post('/reset-password/:token', forgotcontroller().postResetPassword);
 
    app.post('/register', authcontroller().postRegister)

    app.post("/api/search-rooms", searchRoomsController().searchRooms);
    app.get("/api/room-types", roomTypeController().indexApi());

    // ================= CART (NO LOGIN REQUIRED) =================
    app.get('/pre-confirm-booking', BookingCartController().viewCart); // ❌ auth removed
    app.post('/prebooking/add', BookingCartController().addToCart);   // ❌ auth removed
    app.post('/prebooking/update-item', BookingCartController().updateItem);
    app.post('/prebooking/delete-item', BookingCartController().deleteItem);

    // ================= CHECKOUT (LOGIN REQUIRED) =================
    app.get("/checkout", (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login?redirect=/checkout');
        }
        next();
    }, checkoutController().showCheckout);

    app.get("/checkout/preview", checkoutController().preview);

    // ================= ORDER + PAYMENT =================
    app.post("/create-order", auth, orderController().createOrder);
    app.post("/verify-payment", auth, orderController().verifyPayment);
    app.post("/cod-booking", auth, orderController().codBooking);

    app.get("/customer/booking", auth, orderController().index);
    app.post("/customer/orders/cancel/:id", auth, orderController().cancelBooking);

    // ================= ADMIN =================
    app.get('/admin/bookings', admin, Ordercontroller().index);
    app.post("/admin/bookings/update-status/:id", admin, Ordercontroller().updateStatus);
    app.post("/admin/bookings/delete/:id", admin, Ordercontroller().delete);

    app.get('/admin/adminpass', admin, adminn().indexx)
    app.get('/admin/rooms', admin, roomTypeController().list)
    app.post('/admin/edit-room', admin,  roomTypeController().editRoom )
    app.post('/admin/delete-room', admin,  roomTypeController().deleteRoom )
    app.post('/admin/add-room', admin,  roomTypeController().addRoom );

    // ================= USERS =================
    app.get('/admin/users', admin, usercontroller().users)
    app.post('/edit-user', admin, usercontroller().editUser)
    app.post('/block-user', admin, usercontroller().blockUser)
    app.post('/delete-user', admin, usercontroller().deleteUser)

    app.get("/profile", auth, usercontroller().profile);
    app.post("/profile/change-password", auth, usercontroller().changePassword);

    app.post('/admin/order/status', admin, statusController().update)

    // ================= RETURNS =================
    app.get('/execlusive-deal', auth, returnController().index);
    app.get('/execlusive-deal', auth, returnController().createReturnPage);
    app.post('/execlusive-deal', auth, returnController().postReturnRequest);
    
    app.get('/admin/returns', admin, returnController().viewAllReturns);
    app.post('/admin/returns/update', admin, returnController().updateReturnStatus);

    // ================= POLICIES =================
    app.get("/privacy-policy", guest, policycontroller().privacy);
    app.get("/terms-and-conditions", policycontroller().terms);
    app.get("/cancellation-refund", policycontroller().refund);
    app.get("/shipping-policy", policycontroller().shipping);
    app.get("/enquiry", guest, policycontroller().enquiry);

    // ================= CANCEL =================
    app.post("/customer/booking/cancel/:id", auth, cencelordercontroller().userCancelBooking);
    app.get("/customer/cencel-booking", auth, cencelordercontroller().userCanceledOrders);

    app.get("/admin/cencelorders", admin, cencelordercontroller().index);
    app.post("/admin/cencelorders/approve/:id", admin, cencelordercontroller().approve);
    app.post("/admin/cencelorders/reject/:id", admin, cencelordercontroller().reject);
    app.post("/admin/cencelorders/delete/:id", admin, cencelordercontroller().deleteOrder);
}

module.exports = initroutes;