const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  NewMOB: {
    type: Number,
  },
});

const userAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userAddress', 
    required: true,
  },
  address: {
    type: addressSchema,
    required: true,
  },
});

const UserAddress = mongoose.model('UserAddress', userAddressSchema);

module.exports = UserAddress;
