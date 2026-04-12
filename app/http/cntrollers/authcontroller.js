require('dotenv').config();
const User = require("../../models/user"); // Import User model from Sequelize
const passport = require("passport");
const bcrypt = require("bcryptjs");

const { v4: uuidv4 } = require("uuid"); // Import UUID generator
const nodemailer = require("nodemailer"); // Import Nodemailer
require("dotenv").config(); // Load .env variables

function authcontroller() {
    const _getRedirectUrl = (req) => {
        return req.user.role === "admin" ? "/admin/adminpass" : "/";
    };

    return {
        login(req, res) {
            res.render("auth/login");
        },

        postLogin(req, res, next) {
            passport.authenticate("local", (err, user, info) => {
                if (err) {
                    req.flash("error", info.message);
                    return next(err);
                }
                if (!user) {
                    req.flash("error", info.message);
                    return res.redirect("/login");
                }
                if (!user.isVerified) {
                    req.flash("error", "Please verify your email before logging in.");
                    return res.redirect("/login");
                }
                req.logIn(user, () => {
                    if (err) {
                        req.flash("error", info.message);
                        return next(err);
                    }
                    return res.redirect(_getRedirectUrl(req));
                });
            })(req, res, next);
        },

        register(req, res) {
            res.render("auth/register");
        },

        async postRegister(req, res) {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                req.flash("error", "All fields are required");
                req.flash("name", name);
                req.flash("email", email);
                return res.redirect("/register");
            }

            try {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    req.flash("error", "Email already taken");
                    req.flash("name", name);
                    req.flash("email", email);
                    return res.redirect("/register");
                }
            } catch (err) {
                console.error("❌ Error checking existing user:", err);
                req.flash("error", "Error checking existing user.");
                return res.redirect("/register");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const rawToken = uuidv4(); // Store the raw token

            try {
                const user = await User.create({
                    name,
                    email,
                    password: hashedPassword,
                    verificationToken: rawToken, // Store the raw token here
                    isVerified: false,
                });

                console.log("✅ User saved successfully:", user);

                // Send verification email with the raw token
                await sendVerificationEmail(user.email, rawToken);

                req.flash("success", "Registration successful! Check your email to verify your account.");
                return res.redirect("/login");
            } catch (err) {
                console.error("❌ Error in postRegister:", err);
                req.flash("error", "Something went wrong. Please check logs.");
                return res.redirect("/register");
            }
        },

        async verifyEmail(req, res) {
            const { token } = req.params;

            try {
                const user = await User.findOne({ where: { verificationToken: token } });

                if (!user) {
                    req.flash("error", "Invalid or expired verification token.");
                    return res.redirect("/login");
                }

                // Update user verification status
                user.isVerified = true;
                user.verificationToken = null; // Remove the token after verification
                await user.save();

                req.flash("success", "Email verified successfully! You can now log in.");
                return res.redirect("/login");
            } catch (err) {
                console.error("❌ Error during email verification:", err);
                req.flash("error", "Something went wrong during verification.");
                return res.redirect("/login");
            }
        },

        logout(req, res) {
            req.logout();
            return res.redirect("/login");
        }
    };
}

async function sendVerificationEmail(email, token) {
    try {
        console.log("📧 Sending verification email to:", email);

        const transporter = nodemailer.createTransport({
            host: "mail.shunyataecoresort.com",
            port: 465,
            secure: true,
         
            auth: {
                user: "register@shunyataecoresort.com",
              
            pass: "shunyata@123"
            },
              tls: {
    // production: keep true to validate certs
    rejectUnauthorized: true,
  
  },
 

        });

        const verificationLink=`https://shunyataecoresort.com/verify/${token}`;
        console.log("🔗 Verification link:", verificationLink);

    // 🟢 Har mail ko unique banane ke liye headers aur footer
    const uniqueId = Date.now() + "-" + Math.floor(Math.random() * 10000);
        const mailOptions = {
          
            from:  ` "Shunyata Eco Resort"<register@shunyataecoresort.com>`,
            to: email,
          
            subject: `Thank you for registering - Shunyata Eco Resort [${uniqueId}]`, // subject me unique token
        headers: {
            "X-Entity-Ref-ID": uniqueId,  
            "X-Unique-Id": uniqueId,
        },
            
            html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; padding: 20px;">
            
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              
              <div style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'); 
                          background-size: cover; 
                          background-position: center; 
                          height: 180px; 
                          text-align: center; 
                          color: #2f855a; 
                          display: flex; 
                          align-items: center; 
                          justify-content: center;">
                <h1 style="font-size: 28px; font-weight: bold; text-shadow: 1px 1px 6px rgba(0,0,0,0.5); margin: 0;">
                  Welcome to Shunyata Eco-Resort
                </h1>
              </div>
              
              <div style="padding: 30px;">
                <h2 style="color: #2f855a; margin-bottom: 15px;">Account Creation Request</h2>
        
                <p>Hello,</p>
        
                <p>We received a request to create an account for you at <strong>Shunyata Eco-Resort</strong>.</p>
        
                <p>If you made this request, click the button below to verify your email:</p>
        
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${verificationLink}" 
                     style="display: inline-block; padding: 14px 28px; background-color: #2f855a; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s;">
                    Verify My Email
                  </a>
                </div>
        
                <p>If the button does not work, copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #2f855a;">
                  <a href="${verificationLink}" style="color: #2f855a;">${verificationLink}</a>
                </p>
        
                <p><strong>Note:</strong> For security reasons, this link will expire in 1 hour.</p>
        
                <p>If you did not request an account, please ignore this email or contact our support team.</p>
        
                <br/>
                <p>Warm regards,<br/><strong>Shunyata Eco-Resort Team</strong></p>
              </div>
        
              <div style="background-color: #edf7f1; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                Need help? Contact us at 
                <a href="mailto:admin@shunyataecoresort.com" style="color: #2f855a; text-decoration: none;">admin@shunyataecoresort.com</a>
                <br/><br/>
                <span style="color: #aaa;">© 2025 Shunyata Eco-Resort. All rights reserved.</span>
                <br/>
                <span style="color:#aaa;">Mail ID: ${uniqueId}</span> <!-- Unique footer line -->
              </div>
        
            </div>
          </body>
        </html>` };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully");
    } catch (err) {
        console.error("❌ Error sending email:", err);
        throw new Error("Email sending failed");
    }
}

module.exports = authcontroller;