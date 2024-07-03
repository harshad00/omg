const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

mongoose.connect("mongodb://0.0.0.0:27017/mogDB");

const userSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      default: function () {
        // Generate a random 5-character string for _id
        return crypto.randomBytes(3).toString("hex");
      },
      unique: true,
    },
    username: String,
    mobile: Number,
    password: String,
    role: {
      type: String,
      enum: ["user", "admin"], // Assuming there are two roles: 'user' and 'admin'
      default: "user", // Default role is 'user' if not specified
    },
    like:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    userAddressId: [{ // Fix the property name here
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAddress' // Assuming you have a 'UserAddress' model. Adjust as needed.
    }],

  },
  
   
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    // Check if the password is present and is modified
    if (!this.isModified("password")) {
      return next();
    }
    // console.log("userr seve");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
    // console.log(this.username, this.password,);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

userSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.plugin(plm);
module.exports = mongoose.model("User", userSchema);



  