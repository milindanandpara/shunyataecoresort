const { DataTypes } = require("sequelize");
const sequelize = require("../../server");
const User = require("./user");
const RoomType = require("./RoomType");

const Booking = sequelize.define(
    "Booking",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },

        customerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
            onDelete: "CASCADE",
        },

        roomTypeId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: RoomType,
                key: "id",
            },
        },

        checkInDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        checkOutDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        guests: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        totalPrice: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        customerPhone: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        customerAddress: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        specialRequest: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // ⭐ Important Razorpay fields
        razorpayOrderId: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        razorpaySignature: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        paymentId: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        paymentType: {
            type: DataTypes.STRING,
            defaultValue: "COD",
        },

        paymentStatus: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        // Booking status
        status: {
            type: DataTypes.STRING,
            defaultValue: "pending",
        },

        // ⭐ Refund Fields
        refundStatus: {
            type: DataTypes.STRING,
            defaultValue: "pending",
        },

        refundInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "bookings",
        timestamps: true,
    }
);

// Associations
Booking.belongsTo(User, { foreignKey: "customerId", onDelete: "CASCADE" });
User.hasMany(Booking, { foreignKey: "customerId" });

Booking.belongsTo(RoomType, { foreignKey: "roomTypeId", as: "roomType" });
RoomType.hasMany(Booking, { foreignKey: "roomTypeId" });

// Sync
sequelize
    .sync({ force: false, alter: false })
    .then(() => console.log("Booking Model Sync Success"))
    .catch((err) => console.log("Booking Sync Error:", err));

module.exports = Booking;