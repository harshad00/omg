const mongoose = require("mongoose");


// mongoose.connect("mongodb://0.0.0.0:27017/mogDB");
mongoose.connect(`${process.env.MONGODB_URL}/mogDB`);


const productSchema = mongoose.Schema({ 
  
    
    "productname": String,
    "description": String,
    "category": String,
    "price": Number,
    "stockQuantity": Number,
    "gender": [String],
    "images": [String],
    "availability": Boolean,
    // "discounts": [
    //   {
    //     "type": String,
    //     "value": Number,
    //     "startDate": Date,
    //     "endDate": Date
    //   }
    // ],
    "manufacturer": String,
    // "variants": [
    //   {
    //     "size": [String], 
    //     "color": String,
    //     "price": Number,
    //     "stockQuantity": Number,
    //     "availability": Boolean,
    //   }
    // ],
  },
  {timestamps: true}
);


module.exports = mongoose.model('Product', productSchema);
