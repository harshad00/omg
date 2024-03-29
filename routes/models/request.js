const mongoose = require('mongoose');

const requestuser = new mongoose.Schema({
   req_name: {
    type: String,
    required: true,
  },
  req_number: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  user_msg: {
    type: String,
    required: true,
  },
  
});



const UserRequest = mongoose.model('UserRequest', requestuser);

module.exports = UserRequest;
