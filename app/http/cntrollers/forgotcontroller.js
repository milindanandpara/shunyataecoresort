const { Op } = require('sequelize'); // Import Op (Operators) from Sequelize
const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
 host: "mail.shanamitechnologies.in",
            port: 465,
            secure: true,
          
            auth: {
                user: "forgot-password@shanamitechnologies.in",
                pass: "rewari@123"
            },
                          tls: {
    // production: keep true to validate certs
    rejectUnauthorized: true,
  
  },
});

function forgotcontroller() {
    return {
        // Render forgot password page
        forgotPassword(req, res) {
            res.render("auth/forgot-password");
        },

        // Handle forgot password request
        async postForgotPassword(req, res) {
            const { email } = req.body;
            if (!email) {
                req.flash("error", "Please enter your email.");
                return res.redirect("/forgot-password");
            }

            try {
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    req.flash("error", "No account found with this email.");
                    return res.redirect("/forgot-password");
                }

                // Generate reset token
                const resetToken = uuidv4();
                console.log("Generated Reset Token:", resetToken); // Log raw token before storing

                // Store token in database with expiration (1 hour)
                user.resetToken = resetToken;
                user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiration
                await user.save();

                // Send reset email
                const resetLink = ` https://shunyataecoresort.onrender.com/reset-password/${resetToken}`;
                const mailOptions = {

                    from:  `<forgot-password@shanamitechnologies.in>`,
                    to: user.email,
                    subject: "Reset Your Password - Shunyata Eco Resort",
                    
                    html: `
                   <!DOCTYPE html>
<html>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; padding: 20px;">
    
    <!-- Email Container -->
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Header / Banner -->
      <div style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'); 
                  background-size: cover; 
                  background-position: center; 
                  height: 180px; 
                  text-align: center; 
                  color: #fff; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;">
        <h1 style="font-size: 28px; font-weight: bold; text-shadow: 1px 1px 6px rgba(0,0,0,0.5); margin: 0;">
          Shunyata Eco-Resort
        </h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px;">
        <h2 style="color: #2f855a; margin-bottom: 15px;">Password Reset Request</h2>

        <p>Hello ${user.name || 'Guest'},</p>

        <p>We received a request to reset the password for your account at <strong>Shunyata Eco-Resort</strong>.</p>

        <p>If you requested this, click the button below to reset your password:</p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 14px 28px; background-color: #2f855a; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s;">
            Reset My Password
          </a>
        </div>

        <p>If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #2f855a;"><a href="${resetLink}" style="color: #2f855a;">${resetLink}</a></p>

        <p><strong>Note:</strong> For security reasons, this link will expire in 1 hour.</p>

        <p>If you did not request a password reset, please ignore this email or contact our support team.</p>

        <br/>
        <p>Warm regards,<br/><strong>Shunyata Eco-Resort Team</strong></p>
      </div>

      <!-- Footer -->
      <div style="background-color: #edf7f1; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        Need help? Contact us at 
        <a href="mailto:reservations@shunyataresort.com" style="color: #2f855a; text-decoration: none;">reservations@shunyataresort.com</a>
        <br/><br/>
        <span style="color: #aaa;">© 2025 Shunyata Eco-Resort. All rights reserved.</span>
      </div>

    </div>
  </body>
</html> `
                };

                await transporter.sendMail(mailOptions);
                req.flash("success", "Password reset link sent to your email.");
                return res.redirect("/login");
            } catch (err) {
                console.error("Error sending reset email:", err);
                req.flash("error", "Something went wrong.");
                return res.redirect("/forgot-password");
            }
        },

        // Render reset password page
        async resetPassword(req, res) {
            const { token } = req.params;
            console.log("Received Reset Token:", token); // Log received token

            try {
                const user = await User.findOne({
                    where: {
                        resetToken: token,
                        resetTokenExpires: { [Op.gt]: Date.now() } // Check if token has not expired
                    }
                });

                if (!user) {
                    req.flash("error", "Invalid or expired reset link.");
                    return res.redirect("/forgot-password");
                }

                res.render("auth/reset-password", { token });
            } catch (err) {
                console.error("Error finding reset token:", err);
                req.flash("error", "Something went wrong.");
                return res.redirect("/forgot-password");
            }
        },

        // Handle reset password form submission
        async postResetPassword(req, res) {
            const { token } = req.params;
            const { password, confirmPassword } = req.body;

            if (!password || !confirmPassword) {
                req.flash("error", "All fields are required.");
                return res.redirect(`/reset-password/${token}`);
            }

            if (password !== confirmPassword) {
                req.flash("error", "Passwords do not match.");
                return res.redirect(`/reset-password/${token}`);
            }

            try {
                const user = await User.findOne({
                    where: {
                        resetToken: token,
                        resetTokenExpires: { [Op.gt]: Date.now() } // Check if token has not expired
                    }
                });

                if (!user) {
                    req.flash("error", "Invalid or expired reset link.");
                    return res.redirect("/forgot-password");
                }

                // Hash new password and save it
                user.password = await bcrypt.hash(password, 10);
                user.resetToken = null;
                user.resetTokenExpires = null;
                await user.save();

                req.flash("success", "Password reset successful. Please log in.");
                return res.redirect("/login");
            } catch (err) {
                console.error("Error resetting password:", err);
                req.flash("error", "Something went wrong.");
                return res.redirect("/forgot-password");
            }
        }
    };
}

module.exports = forgotcontroller;