const express = require("express");
const app = express();
const ejs = require("ejs");
const passport = require("passport");
const path = require('path');
const expressLayout = require('express-ejs-layouts');
const noty = require("noty");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const Emitter = require("events");
const { Sequelize } = require('sequelize');
const flash = require('express-flash');
app.use(flash());

// ====== Direct MySQL Credentials (No dotenv) ======
const DB_USER = "fiqssphh_root";
const DB_PASSWORD = "rewari@123";
const DB_NAME = "fiqssphh_shunyata";
const DB_HOST = "localhost";   // Agar same server DB use ho rahi hai

// ====== Sequelize Connection ======
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: false, // Disable logging for cleaner output
});

// Test the MySQL connection
sequelize.authenticate()
    .then(() => console.log('SQL Connection Successful'))
    .catch(err => console.error('❌MySQL Connection Error:', err));

// ====== Session Store (MySQL) ======
const sessionStore = new MySQLStore({
    host: DB_HOST,
    port: 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
});

// Export sequelize instance for use in models
module.exports = sequelize;

// ====== Middleware ======
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set template engine
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');

// Event Emitter
const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

// ====== Session Config ======
app.use(session({
    secret: "supersecretcookiekey123",   //  yaha apna khud ka secret set kar lena
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Passport config
const passportInit = require("./app/config/passport");
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});

// Routes
require('./routes/web')(app);

app.get('/test-flash', (req, res) => {
    req.flash('success', 'This is a test message');
    res.redirect('/register'); 
});

// ====== Server Start ======
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
;
});

// ====== Socket.io for real-time updates ======
const io = require('socket.io')(server);
io.on('connection', (socket) => {
    socket.on('join', (orderId) => {
        socket.join(orderId);
    });
});

// ====== Emitters for real-time updates ======
eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}).emit('orderUpdated', data`);
});

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
});