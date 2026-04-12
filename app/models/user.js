const { DataTypes } = require("sequelize");
const sequelize = require("../../server");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ensure that the email is unique
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: "customer", // Default role is 'customer'
        },
        blocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        verificationToken: {
            type: DataTypes.UUID, // Change to UUID to store a verification token
            allowNull: true,
            unique: true,  // Ensure the token is unique
            defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false, // Default to false, will be true once the email is verified
        },
        resetToken: {
            type: DataTypes.UUID, // UUID for password reset token
            allowNull: true,
            unique: true,
        },
        resetTokenExpires: {
            type: DataTypes.DATE, // Expiration time for reset token
            allowNull: true,
        }
    },
    {
        tableName: "users",
        timestamps: true,
    }
);

// Sync the user table with UUID as the primary key
sequelize
    .sync({ alter: false }) // This ensures changes are applied to the existing table
    .then(() => {
        console.log("Users table synchronized successfully with UUID.");
    })
    .catch((err) => {
        console.error("Users table synchronization failed:", err);
    });

module.exports = User;