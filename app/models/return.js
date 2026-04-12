const { DataTypes } = require("sequelize");
const sequelize = require("../../server");
const User = require("./user");
const Order = require("./Booking");

const Return = sequelize.define("Return", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Order,
            key: "id",
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending",
    },
    
});

Return.belongsTo(User, { foreignKey: "userId" });
Return.belongsTo(Order, { foreignKey: "orderId" });

// Sync the orders table
sequelize
    .sync({ alter:false })
    .then(() => {
        console.log("returnOrder table synchronized successfully.");
    })
    .catch((err) => {
        console.error("returnOrder table synchronization failed:", err);
    });
module.exports = Return;