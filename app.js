const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 4000;

// Function to send a test email
function sendTestEmail() {
    const transporter = nodemailer.createTransport({
        host: "mail.askquizpatente.com",
        port: 465,
        secure: true,
        auth: {
            user: "admin@askquizpatente.com",
            pass: "rewari@123"
        }
    });

    const mailOptions = {
        from: '"ASK Elisir.com" admin@askquizpatente.com',
        to: 'nishabirla1985@gmail.com',  // Replace this with your test email
        subject: "Test Email",
        text: "This is a test email sent directly from server.js!",
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Error sending email:", error);
        } else {
            console.log("✅ Email sent successfully:", info.response);
        }
    });
}

// Call the function when the server starts
sendTestEmail();

// Start the server
app.listen(PORT, () => {
    console.log("🚀 Server is running on http://localhost:${PORT}");
});