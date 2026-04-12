// smtp.js
const nodemailer = require('nodemailer');

async function sendTestEmail(req, res) {
    const transporter = nodemailer.createTransport({
        host: "mail.askquizpatente.com",
        port: 465,
        secure: true,
        auth: {
            user: "admin@askquizpatente.com",
            pass: "rewari@123"
        },
        logger: true,   // Enable logging
        debug: true     // Enable debug output
    });

    const mailOptions = {
        from: '"ASK Elisir.com" <admin@askquizpatente.com>',
        to: 'amit83459@gmail.com',  // Replace with your email
        subject: 'SMTP Test Email',
        text: 'This is a test email sent from smtp.js!',
        html: '<b>This is a test email sent from smtp.js!</b>'
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
        res.send("✅ Test email sent successfully!");
    } catch (err) {
        console.error("❌ Error sending email:", err);
        res.status(500).send("❌ Failed to send test email.");
    }
}

module.exports = { sendTestEmail };