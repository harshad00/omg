// Import required modules
var express = require("express"); // Import the Express.js framework
var router = express.Router(); // Create a router instance
require("dotenv").config();
const userModal = require("./models/users"); // Import the user model
const productModal = require("./models/products"); // Import the product model
const userAddressModal = require("./models/userAddress"); // Import the user address model
const userOrderModal = require("./models/userOrder"); // Import the user order model
const userReqModal = require("./models/request"); // Import the user order model
const passport = require("passport"); // Import Passport.js for user authentication
const localStrategy = require("passport-local").Strategy; // Import Passport.js local strategy
const multer = require("multer"); // Import multer for handling file uploads
const twilio = require("twilio"); // Import Twilio API for sending SMS messages
const accountSid = process.env.Twilio_account_SID; // Twilio account SID
const authToken = process.env.Twilio_authentication_token; // Twilio authentication token
const client = new twilio(accountSid, authToken); // Create Twilio client instance
const stripe = require("stripe")(process.env.Stripe_Id);
const PhoneNumber = require("libphonenumber-js");

const path = require("path"); // Import path module

// Import the generateOTP function
const generateOTP = require("../public/javascripts/optUtil");
const upload = require("./multer"); // Import multer upload configuration
const { log } = require("console");
const { send } = require("process");

// Configure Passport to use the local strategy
passport.use(new localStrategy(userModal.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});
// navbae text 
router.get("/home/contact", function (req, res, next) { 
               
  res.render("home/contact");
});
router.post("/home/contact",  async function (req, res, next) {
  try {
    const userReq = new userReqModal({
      req_name: req.body.name,
      req_number: req.body.number,
      email: req.body.email,
      user_msg: req.body.usertext,
    });
  
     console.log(userReq);
    await userReq.save(); // Save the userReq instance to the database

    res.render("home/contact" ,{ successMessage: " OMG team will Connect You Soon" }); // Render the view after saving
  } catch (error) {
    // Handle errors appropriately
    console.error("Error saving user request:", error);
    res.status(500).send("Error saving user request");
  }
});
//* end of  navbav text  
// !  gallery
router.get("/home/gallery", function (req, res, next) {
  res.render("home/gallery");
}) 
/* show cart page if user is not logged in */
router.get("/cart", function (req, res, next) {
  // Render the cart page
  res.render("cart");
});

/* GET profile-likeProduct page */
router.get("/profile-likeProduct", isLoggedIn, async function (req, res, next) {
  try {
    // Fetch the logged-in user's liked products and render the profile page
    const userId = req.user._id;
    const user = await userModal.findOne({ _id: userId }).populate("like");
    res.render("profile-likeProduct", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Handle liking a product
router.get("/likeProduct/:id", isLoggedIn, async function (req, res) {
  const productId = req.params.id;
  const userId = req.user._id;

  try {
    const product = await productModal.findById(productId);

    if (product) {
      const likeProduct = await userModal.findOne({ _id: userId });

      if (!likeProduct.like.includes(productId)) {
        likeProduct.like.push(productId);
        await likeProduct.save();
        // Send a single argument or use an object to wrap both the status message and the product information
        // res.status(200).send({ message: "Product Liked", product });
        res.status(200).render("likeProduct");
      } else {
        res.status(400).send("Product Already Liked");
      }
    } else {
      res.status(404).send("Product Not Found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to delete liked products from user profile
router.get("/delete-like-list", async (req, res) => {
  res.render("delete-like-list");
});

// Handle deleting a liked product
router.get(
  "/profile-likeProduct/:productId",
  isLoggedIn,
  async function (req, res, next) {
    try {
      //  you have the user ID from the logged-in user
      const userId = req.user._id;
      const productIdToDelete = req.params.productId;

      // Find the user by ID and update the 'like' array by removing the specified product ID
      const updatedUser = await userModal.findByIdAndUpdate(
        userId,
        { $pull: { like: productIdToDelete } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      // Redirect to the "profile-likeProduct" page
      res.redirect("/profile-likeProduct");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Assuming you have the required dependencies and setup for your Express app
router.get("/profile", isLoggedIn, function (req, res) {
  // Check the role of the authenticated user
  if (req.isAuthenticated() && req.user.role === "admin") {
    res.render("admin");
  } else if (req.isAuthenticated()) {
    // Handle the case when the user is not an admin
    // You may render a specific "user" profile or redirect as needed
    res.render("Profile", { loggedInUsername: req.user.username });
  } else {
    // Handle other cases or redirect as needed
    res.redirect("/login");
  }
});
router.get("/userprofile", async function (req, res) {
  const userId = req.user._id;
    let userprofile =  await userModal.findOne(userId) 
  res.render("userprofile" ,{ userprofile});
});



// Render registration page
router.get("/register", function (req, res, next) {
  const errorMessages = " ";
  console.log(errorMessages);
  res.render("register");
});

//!Handle user registration
router.post("/register", async function (req, res, next) {
  // Registration logic
  try {
    const userData = new userModal({ ...req.body });
    const existingUserMobile = await userModal.findOne({
      mobile: req.body.mobile,
    });

    if (existingUserMobile) {
      return res.render("register", {
        errorMessages: ["A user with the given mobile number already exists."],
      });
    }

    await userModal.register(userData, req.body.password);
    passport.authenticate("local")(req, res, function () {
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.render("register", {
      errorMessages: [
        error.message || "An unexpected error occurred during registration.",
      ],
    });
  }
});

//! Register User using mobile otp authentication :
// router.post("/register", async function (req, res, next) {
//   try {
//     const trimmedUsername = req.body;
//     const trimmedPassword = req.body;

//     const userData = new userModal({
//         username: trimmedUsername,
//         mobile: req.body.mobile,
//         password: trimmedPassword,
//     });
// console.log( userData.username);
// console.log( userData.password);
//     console.log(client);
//     // Check if the mobile number already exists
//     const existingUserMobile = await userModal.findOne({
//       mobile: req.body.mobile,
//     });
//     const existingUsername = await userModal.findOne({
//       username: req.body.username,
//     });

//     if (existingUserMobile || existingUsername) {
//       let errorMessages = [];
//       if (existingUserMobile) {
//         errorMessages.push(
//           "A user with the given mobile number already exists."
//         );
//       }
//       if (existingUsername) {
//         errorMessages.push("A user with the given username already exists.");
//       }
//       return res.render("register", { errorMessages });
//     }

     //! Generate OTP and store it in the session
    // const otp = generateOTP();
    // req.session.otp = otp;
    // console.log(req.session.otp);
    // req.session.userData = {
    //   // Store other data in the session as needed
    //   username: req.body.username,
    //   mobile: req.body.mobile,
    //   password: req.body.password,
    // };
    // console.log(req.session.userData);

    //! Send OTP via Twilio
    // const phoneNumber = PhoneNumber(req.body.mobile, "IN");
    // const formattedNumber = phoneNumber.formatInternational();

    // await client.messages.create({
    //   to: formattedNumber,
    //   from: +16502296943,
    //   body: `Your OTP for registration is: ${otp}`,
    // });

    // Redirect to OTP verification page with mobile number
//     res.redirect(`/verify?mobile=${req.body.mobile}`);
//   } catch (error) {
//     if (error.code === 20003) {
//       // Twilio authentication error
//       console.error("Twilio authentication error:", error);
//       return res.render("error", {
//         message:
//           "Failed to authenticate with Twilio. Please check your Twilio credentials.",
//       });
//     } else {
//       // Other errors
//       console.error("Registration error:", error);
//       return res.render("error", {
//         message: "An error occurred during registration.",
//       });
//     }
//   }
// });

//! Render OTP verification page
router.get("/verify",  function (req, res, next) {
  res.render("verify");
});

// Handle OTP verification for user registration
router.post("/verify", async function (req, res, next) {
  try {
    // console.log(accountSid);
    // Check if OTP from session matches the user-input OTP
    if (req.session.otp !== req.body.otp) {
      return res.render("verify", {
        errorMessages: ["Invalid OTP. Please try again."],
      });
    }
    // Access stored user data from the session
    const storedUserData = req.session.userData;

    if (!storedUserData || !storedUserData.password) {
      // Handle the case where userData or password is not available
      return res.render("verify", {
        errorMessages: ["User data is missing or incomplete."],
      });
    }

    // Find or create the user by mobile number
    let user = await userModal.findOne({ mobile: storedUserData.mobile });

    if (!user) {
      // If user not found, create a new user
      user = new userModal({
        mobile: storedUserData.mobile,
        username: storedUserData.username,
        password: storedUserData.password,
        // Include other fields as needed
      });
    }

    //! Clear the OTP after successful verification
    user.verificationCode = undefined;

    await userModal.register(user, storedUserData.password);

    // passport.authenticate("local")(req, res, function () {
    req.login(user, function (err) {
      if (err) {
        console.error("Passport login error:", err);
        return res.render("verify", {
          errorMessages: ["An unexpected error occurred during login."],
        });
      }
      // Clear the session data after successful login
      req.session.otp = undefined;
      req.session.userData = undefined;
      // });
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.render("verify", {
      errorMessages: [
        error.message || "An unexpected error occurred during verification.",
      ],
    });
  }
});

//! Delete user data
router.get("/admin-datas/delete-userData/:id", isLoggedIn, async (req, res) => {
  const userId = req.params.id;
  try {
    await userModal.findByIdAndDelete(userId);
    res.redirect("/admin-datas/user-data");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Render user address page for adding new address
router.get(
  "/userAddress/:productId",
  isLoggedIn,
  async function (req, res, next) {
    try {
      const productId = req.params.productId;
      
      // console.log(productId);

      // Assuming you have the user ID from the logged-in user
      const userId = req.user._id;

      // Correct the query to use findOne
      const userAddress = await userModal
        .findOne({ _id: userId })
        .populate("userAddressId");

      // console.log(userAddress);

      // Store data in the session
      req.session.userId = userId;
      req.session.productId = productId;
      res.render("userAddress", { userAddress });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//  payment page
router.get("/paymentSuccessful", function (req, res, next) {
  res.render("paymentSuccessful");
});

// ! payment using payment geteway.

router.get(
  "/payment/:userAddressId",
  isLoggedIn,
  async function (req, res, next) {
    const userId = req.session.userId;
    const productId = req.session.productId;
    const userAddressId = req.params.userAddressId;

    console.log(productId, userId, userAddressId);

    try {
      // Fetch product details
      const product = await productModal.findOne({ _id: productId });

      // Placeholder function to retrieve user details
      const { name } = await getUserDetails(userId);

      // Use Stripe to create a payment session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr", // Defaulting to INR
              product_data: {
                name: product.productname,
                // You can add more details about your product here
              },
              unit_amount: product.price * 100, // Convert price to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: "http://localhost:3000/paymentSuccessful",
        cancel_url: "https://localhost:3000/paymentFailed",
        customer_name: name, // Include customer name
        billing_address_collection: "required", // Specify that billing address is required
      });
      const payment_id = session.id;

      // Create a new user order
      const userOrder = new userOrderModal({
        user: userId,
        product: productId,
        userAddress: userAddressId,
        payment_id: payment_id,
      });

      // Save the user order
      await userOrder.save();

      // Redirect the user to the Stripe checkout page
      res.redirect(session.url);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Placeholder function to retrieve user details
async function getUserDetails(userId) {
  // Here, you should implement the logic to fetch user details from your database or session
  // For demonstration purposes, let's assume you have a user model with name and address fields
  const user = await userModal.findById(userId); // Replace userModel with your actual user model
  if (user) {
    return {
      name: user.name,
      address: user.address,
    };
  } else {
    // Handle case where user details are not found
    throw new Error("User details not found");
  }
}

// Show user order details
router.get("/userOrder/:orderId", isLoggedIn, async (req, res) => {
  try {
    // Assuming you have a parameter named orderId in the URL
    const orderId = req.params.orderId;

    // Fetch the UserOrder document from the database
    const userOrder = await userOrderModal
      .findOne({ _id: orderId })
      .populate("user") // Assuming you want to populate the 'user' field
      .populate("product") // Assuming you want to populate the 'product' field
      .populate("userAddress"); // Assuming you want to populate the 'userAddress' field

    console.log(userOrder);
    if (!userOrder) {
      return res.status(404).send("UserOrder not found");
    }

    // Render the hbs template, passing the userOrder data
    res.render("userOrderTemplate", { userOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Render success page after storing address
router.get("/address-storeosuccessfully", function (req, res) {
  res.render("address-storeosuccessfully");
});

// Handle adding user address
router.post("/userAddress", isLoggedIn, async function (req, res) {
  try {
    const productId = req.params.productId;
    console.log(productId);
    const userId = await userModal.findOne({
      username: req.session.passport.user,
    });

    // Create a new user address instance using the UserAddress model
    const newUserAddress = new userAddressModal({
      userId: userId._id,
      address: {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        NewMOB: req.body.new_mobNO,
      },
    });

    // Save the user address to the database
    await newUserAddress.save();

    // Assuming you have a property named userAddressId in your User model
    // If your property is named Addressid, change it accordingly
    userId.userAddressId.push(newUserAddress._id);

    // Save the updated user with the new user address reference
    await userId.save();
    // res.status(200).render("address-storeosuccessfully");
    res.status(200).render("address-storeosuccessfully");
  } catch (error) {
    console.error("Error submitting user address:", error);
    res.status(500).send("Internal Server Error");
  }
});

// dalete address
router.get("/deleteAddress", isLoggedIn, (req, res) => {
  res.render("deleteAddress");
});
router.get("/deleteAddress/:Address_id", isLoggedIn, async function (req, res) {
  try {
    //  you have the user ID from the logged-in user
    const userId = req.user._id;
    const AddtressToDelete = req.params.Address_id;

    // Find the user by ID and update the 'userAdress' array by removing the specified product ID
    const updatedUserAddress = await userModal.findByIdAndUpdate(
      userId,
      { $pull: { userAddressId: AddtressToDelete } },
      { new: true }
    );

    if (!updatedUserAddress) {
      return res.status(404).send("User not found");
    }

    // Redirect to the "profile-likeProduct" page
    res.redirect("/deleteAddress");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//! Handle adding user address
router.get("/admin-datas/order-details", isLoggedInAdmin, async (req, res) => {
  try {
    // Correct the query to use findOne
    const userOrderdata = await userOrderModal
      .find()
      .populate("user")
      .populate("product")
      .populate("userAddress");

    console.log(userOrderdata);

    //  res.status(200).send(userOrderdata)
    res.render("admin-datas/order-details", { userOrderdata });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Delete user address
router.delete(
  "/deleteAddress/:addressId",
  isLoggedIn,
  async function (req, res, next) {
    try {
      const userId = req.user._id;
      const addressIdToDelete = req.params.addressId;

      // Add logic to delete the address with the given ID for the user
      await userModal.findOneAndUpdate(
        { _id: userId },
        { $pull: { userAddressId: { _id: addressIdToDelete } } },
        { new: true }
      );

      res.status(200).json({ message: "Address deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Render cart data pages
router.get("/cart-data/balt-data", function (req, res, next) {
  res.render("cart-data/balt-data");
});
router.get("/cart-data/optical", function (req, res, next) {
  res.render("cart-data/optical");
});
router.get("/cart-data/sunglassis", function (req, res, next) {
  res.render("cart-data/sunglassis");
});
router.get("/cart-data/watches", function (req, res, next) {
  res.render("cart-data/watches");
});
router.get("/cart-data/mal-wallTes", function (req, res, next) {
  res.render("cart-data/mal-walltes");
});

// Render Login page
router.get("/login", function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});

// Render login page
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {
    // Check the role of the authenticated user
    if (req.isAuthenticated() && req.user.role === "admin") {
      res.render("admin");
    } else if (req.isAuthenticated()) {
      res.render("profile");
    } else {
      // Handle other cases or redirect as needed
      res.redirect("/login");
    }
  }
);

// Product Cards route
router.get("/productcard", isLoggedIn, async (req, res) => {
  try {
    const products = await productModal.find();
    res.render("productcard", { products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Render admin page
router.get("/admin", isLoggedInAdmin, function (req, res, next) {
  res.render("admin");
});

// Render user data for admin
router.get(
  "/admin-datas/user-data",
  isLoggedIn,
  async function (req, res, next) {
    try {
      const user_data = await userModal.find({ role: "user" });
      res.render("admin-datas/user-data", { user_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Render product data for admin
router.get(
  "/admin-datas/product-data",
  isLoggedInAdmin,
  async function (req, res, next) {
    try {
      const product_data = await productModal.find();
      res.render("admin-datas/product-data", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/admin-datas/delete-product/:id",
  isLoggedInAdmin,
  async (req, res) => {
    const productId = req.params.id;
    try {
      await productModal.findByIdAndDelete(productId);
      res.redirect("/admin-datas/product-data");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//!  user Requert table 

router.get("/admin-datas/userRequert", async function (req, res, next) {
  try {
    const userRequests = await userReqModal.find(); // Fetch all user requests from the database
    res.render("admin-datas/userRequert", { userRequests }); // Render the view with userRequests data
  } catch (error) {
    // Handle errors appropriately
    console.error("Error fetching user requests:", error);
    res.status(500).send("Error fetching user requests");
  }
});
// Handle editing a product
router.get(
  "/admin-datas/edit-product/:id",
  isLoggedInAdmin,
  async (req, res) => {
    const productId = req.params.id;
    try {
      const product = await productModal.findById(productId);
      res.render("admin-datas/edit-product", { product });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//! Update product route
router.post(
  "/admin-datas/edit-product/:id",
  isLoggedInAdmin,
  async (req, res) => {
    const productId = req.params.id;
    const updatedData = req.body;
    // Convert 'on' string to true, and undefined to false for the 'availability' field
    updatedData.availability = updatedData.availability === "on";
    try {
      // Extract variants from the request body
      const updatedVariants = updatedData.variants || [];

      // Use findByIdAndUpdate to update the product with the specified ID
      const updatedProduct = await productModal.findByIdAndUpdate(
        productId,
        {
          $set: {
            productname: updatedData.productName,
            description: updatedData.description,
            category: updatedData.category,
            price: updatedData.price,
            stockQuantity: updatedData.stockQuantity,
            gender: updatedData.gender,
            images: updatedData.images,
            availability: updatedData.availability,
            manufacturer: updatedData.manufacturer,
            // Update the "variants" field using the positional $ operator
            "variants.$": updatedVariants,
            // Add other fields as needed
          },
        },
        { new: true } // Return the updated document
      );

      if (!updatedProduct) {
        return res.status(404).send("Product not found");
      }

      res.redirect("/admin-datas/product-data");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//! Add product route
router.get(
  "/admin-datas/addproduct",
  isLoggedInAdmin,
  function (req, res, next) {
    res.render("admin-datas/addproduct");
  }
);

router.post(
  "/admin-datas/addproduct",
  isLoggedInAdmin,
  upload.array("images", 1),
  async function (req, res) {
    try {
      const images = req.files.map((file) => path.basename(file.path));
      const variants = getVariantsFromRequest(req.body);

      // Extract data for gender
      const genders = Array.isArray(req.body.gender)
        ? req.body.gender
        : [req.body.gender];

      // Create a new productModal instance with the extracted data
      const productData = new productModal({
        productname: req.body.productname,
        description: req.body.description,
        category: req.body.category,
        price: Number(req.body.price),
        stockQuantity: Number(req.body.stockQuantity),
        gender: genders,
        images: images,
        availability: req.body.availability === "true",
        manufacturer: req.body.manufacturer,
        // variants: variants,
      });

      // Save the product data to the database
      const savedProduct = await productData.save();

      //? Respond with success message or redirect to product details page
      // res.status(201).json({
      //   success: true,
      //   message: "Product added successfully",
      //   product: savedProduct,
      // });
      res.status(201).redirect("product-data");
    } catch (error) {
      handleFormError(res, error);
    }
  }
);

//! show data in profilr page
router.get("/user-balt-pro", isLoggedIn, (req, res) => {
  // Render the hbs template and pass the cardData to it
  res.render("productModal", { cardData });
});

router.get(
  "/profile-card/user-balt-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "Belt" });
      // console.log(product_data);

      res.render("profile-card/user-balt-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/profile-card/user-mal-walltes-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "Wallet" });
      // console.log(product_data);

      res.render("profile-card/user-mal-walltes-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/profile-card/user-optical-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "Optical" });
      // console.log(product_data);

      res.render("profile-card/user-optical-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);



router.get(
  "/profile-card/user-sunglassis-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "Sunglasses" });
      // console.log(product_data);

      res.render("profile-card/user-sunglassis-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/profile-card/user-watches-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "Watches" });
      // console.log(product_data);

      res.render("profile-card/user-watches-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//! Order details route
router.get(
  "/admin-datas/order-details",
  isLoggedInAdmin,
  function (req, res, next) {
    res.render("admin-datas/order-details");
  }
);

// ! Order details route for user
router.get('/userOrserDetail', async (req, res) => {
  try {
      const userOrders = await userOrderModal.find()
      .populate('user product userAddress')
      .exec();
      res.render('userOrserDetail', { userOrders }); // Assuming you're using a templating engine like EJS or Handlebars
  } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).send('Internal Server Error');
  }
});
//! Logout route
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//!   product by gander
//  male
router.get("/by_gender/male", isLoggedIn, async (req, res) => {
  try {
    // Fetch products for males from the database
    const maleProducts = await productModal.find({ gender: "male" });
    // res.json(maleProducts);
    res.render("by_gender/male", { maleProducts });
  } catch (err) {
    // console.error('Error fetching products for males:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/by_gender/female", isLoggedIn, async (req, res) => {
  try {
    // Fetch products for females from the database
    const femaleProducts = await productModal.find({ gender: "female" });
    res.render("by_gender/female", { femaleProducts });
  } catch (err) {
    // console.error('Error fetching products for males:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/by_gender/kids", isLoggedIn, async (req, res) => {
  try {
    // Fetch products for kides from the database
    const kidsProducts = await productModal.find({ gender: "kids" });
    res.render("by_gender/kids", { kidsProducts });
  } catch (err) {
    // console.error('Error fetching products for males:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/by_gender/forAll", isLoggedIn, async (req, res) => {
  try {
    // Fetch products for add from the database
    const allProducts = await productModal.find();
    res.render("by_gender/forAll", { allProducts });
  } catch (err) {
    // console.error('Error fetching products for males:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//! footer Pages

router.get("/footerpages/exe",(req, res ) => {

  res.render("/footerpages/exe")
})


// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// for admin auth
function isLoggedInAdmin(req, res, next) {
  // Check if the user is authenticated
  if (req.isAuthenticated()) {
    // Check if the user has the role of "admin"
    if (req.user && req.user.role === "admin") {
      return next(); // Proceed to the next middleware or route handler
    } else {
      res.status(404).send("404 Page Not Found"); // Redirect to a 404 page for non-admin users
    }
  } else {
    res.redirect("/"); // Redirect to the home page if the user is not authenticated
  }
}

//! footer pages 

 router.get("/footerPages/BLOG", function (req, res, next) {
  res.render("footerPages/BLOG");
});
 router.get("/footerPages/CookiesSetting", function (req, res, next) {
  res.render("footerPages/CookiesSetting");
});
 router.get("/footerPages/Documentaion", function (req, res, next) {
  res.render("footerPages/Documentaion");
});
 router.get("/footerPages/FAQ", function (req, res, next) {
  res.render("footerPages/FAQ");
});
 router.get("/footerPages/Investor", function (req, res, next) {
  res.render("footerPages/Investor");
});
 router.get("/footerPages/JOB", function (req, res, next) {
  res.render("footerPages/JOB");
});
 router.get("/footerPages/PrivacyPolicy", function (req, res, next) {
  res.render("footerPages/PrivacyPolicy");
});
 router.get("/footerPages/TermsOfServices", function (req, res, next) {
  res.render("footerPages/TermsOfServices");
});



// Helper function to extract variants from the request body
function getVariantsFromRequest(body) {
  const variants = [];
  const variantSize = body.variantSize;
  const variantColor = body.variantColor;
  const variantPrice = body.variantPrice;
  const variantStockQuantity = body.variantStockQuantity;
  const variantAvailability = body.variantAvailability;

  // Check if variants are provided
  if (variantSize && Array.isArray(variantSize)) {
    // Assuming all variant arrays have the same length
    for (let i = 0; i < variantSize.length; i++) {
      // Split the size string into an array of numbers
      const sizeArray = variantSize[i].split(" ").map(Number);

      // Create variant objects and push them to the variants array
      const variant = {
        size: sizeArray,
        color: variantColor[i],
        price: Number(variantPrice[i]),
        stockQuantity: Number(variantStockQuantity[i]),
        availability: variantAvailability[i] === "true",
      };

      variants.push(variant);
    }
  }

  return variants;
}

// Helper function to handle form errors
function handleFormError(res, error) {
  console.error("Error processing form data:", error);

  // Check if it's a validation error (e.g., required field missing)
  if (error.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.errors,
    });
  } else {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Export the router
module.exports = router;
