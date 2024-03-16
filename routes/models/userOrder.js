const mongoose = require("mongoose");
const crypto = require("crypto");
// Define the schema for the user order
const userOrderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    default: function () {
      // Generate a random 5-character string for _id
      return crypto.randomBytes(3).toString("hex");
    },
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the Product model
    required: true,
  },

  userAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserAddress", // Reference to the Product model
    required: true,
  },
  payment_id:{ 
    type:String,
   },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the UserOrder model
const UserOrder = mongoose.model("UserOrder", userOrderSchema);

module.exports = UserOrder;
