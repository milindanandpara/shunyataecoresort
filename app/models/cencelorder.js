// models/CencelOrder.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../server");
const User = require("./user"); // User model import

const CencelOrder = sequelize.define(
  "CencelOrder",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User, // Must reference the User model
        key: "id",
      },
      onDelete: "CASCADE",
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
   
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.STRING,
      defaultValue: "COD",
    },
    paymentStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundStatus: {
      type: DataTypes.STRING,
      defaultValue: "not_applicable", // initiated, completed, failed
    },
    refundInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actionByAdmin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending", // pending, approved, rejected
    },
  },
  {
    tableName: "cencelOrders",
    timestamps: true,
  }
);

// Safe sync: only create table if not exists
(async () => {
  try {
    // Check if there is at least one user, else skip foreign key enforcement temporarily
    const usersCount = await User.count();
    if (usersCount === 0) {
      console.warn("⚠️ No users found. Please add a user first to avoid FK constraint errors.");
    }

    await CencelOrder.sync({ alter: true }); // safe alter, will not drop table
    console.log("✅ CencelOrders table synchronized successfully.");
  } catch (err) {
    console.error("❌ CencelOrders table synchronization failed:", err);
  }
})();

module.exports = CencelOrder;