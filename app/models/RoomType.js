const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../server"); // Sequelize instance

const RoomType = sequelize.define("RoomType", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false, // Room type name e.g., "Duplex", "King Room"
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false, // Number of guests this room type can hold
        defaultValue: 2
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false, // Total rooms of this type available
        defaultValue: 0
    },
    pricePerNight: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    images: {
        type: DataTypes.TEXT, // Store as JSON string
        allowNull: true,
        get() {
            return this.getDataValue("images") ? JSON.parse(this.getDataValue("images")) : [];
        },
        set(value) {
            this.setDataValue("images", JSON.stringify(value));
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true, // Optional room description
    }
}, { tableName: "room_types", timestamps: false });

sequelize
    .sync({ alter: false })
    .then(() => {
        console.log("RoomTypes table synchronized successfully");
    })
    .catch((err) => {
        console.error("RoomTypes table synchronization failed:", err);
    });

module.exports = RoomType;