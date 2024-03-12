// Import required modules
var express = require("express");
var router = express.Router();
const userModal = require("./models/users");
const productModal = require("./models/products");
const userAddressModal = require("./models/userAddress");
const userOrderModal = require("./models/userOrder");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const multer = require("multer");
const twilio = require("twilio");
const accountSid = "AC3778768b665454fc9796bf452df3ba07";
const authToken = "47ff63cd04ba0749aa88c772e22c60c4";
const client = new twilio(accountSid, authToken);
// const PhoneNumber = require("libphonenumber-js");
// const request = require("request");

const path = require("path");

// Import the generateOTP function
const generateOTP = require("../public/javascripts/optUtil");
const upload = require("./multer");
const { log } = require("console");
const { send } = require("process");

// Configure Passport to use the local strategy
passport.use(new localStrategy(userModal.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

/* GET cart Home  page. */
router.get("/profile-likeProduct", isLoggedIn, async function (req, res, next) {
  try {
    // Assuming you have the user ID from the logged-in user
    const userId = req.user._id;

    const user = await userModal.findOne({ _id: userId }).populate("like");

    // Render the template with the user object
    res.render("profile-likeProduct", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

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
        res.status(200).render("http://localhost:3000/profile-likeProduct");
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

// ! delete

router.get("/delete-like-list", async (req, res) => {
  res.render("delete-like-list");
});
// ...

router.get(
  "/profile-likeProduct/:productId",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Assuming you have the user ID from the logged-in user
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

router.get("/profile", function (req, res) {
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

// Render registration page
router.get("/register", function (req, res, next) {
  const errorMessages = " ";
  console.log(errorMessages);
  res.render("register");
});

// !Handle user registration
router.post("/register", async function (req, res, next) {
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
//  router.post("/register", async function (req, res, next) {
//   try {
//     const userData = new userModal({
//       username: req.body.username,
//       mobile: req.body.mobile,
//       password: req.body.password, // Fix: Assign the password field correctly
//     });

//     // Check if the mobile number already exists
//     const existingUserMobile = await userModal.findOne({
//       mobile: req.body.mobile,
//     });

//     if (existingUserMobile) {
//       return res.render("register", {
//         errorMessages: ["A user with the given mobile number already exists."],
//       });
//     }

//     // Generate OTP and store it in the session
//     const otp = generateOTP();
//     req.session.otp = otp;
//     console.log(req.session.otp);
//     req.session.userData = {
//       // Store other data in the session as needed
//       username: req.body.username,
//       mobile: req.body.mobile,
//       password: req.body.password,
//     };
//     console.log(req.session.userData);

//     // Send OTP via Twilio
//     const phoneNumber = PhoneNumber(req.body.mobile, "IN");
//     const formattedNumber = phoneNumber.formatInternational();

//     await client.messages.create({
//       to: formattedNumber,
//       from: +16502296943,
//       body: `Your OTP for registration is: ${otp}`,
//     });

//     // Redirect to OTP verification page with mobile number
//     res.redirect(`/verify?mobile=${req.body.mobile}`);
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.render("register", {
//       errorMessages: [
//         error.message ||
//           "An unexpected error occurred during registration.",
//       ],
//     });
//   }
// });

// // !Verify OTP
// router.get("/verify",  function (req, res, next) {
//   res.render("verify");
// });

// router.post("/verify", async function (req, res, next) {
//   try {
//     // Check if OTP from session matches the user-input OTP
//     if (req.session.otp !== req.body.otp) {
//       return res.render("verify", {
//         errorMessages: ["Invalid OTP. Please try again."],
//       });
//     }

//     // Access stored user data from the session
//     const storedUserData = req.session.userData;

//     if (!storedUserData || !storedUserData.password) {
//       // Handle the case where userData or password is not available
//       return res.render("verify", {
//         errorMessages: ["User data is missing or incomplete."],
//       });
//     }

//     // Find or create the user by mobile number
//     let user = await userModal.findOne({ mobile: storedUserData.mobile });

//     if (!user) {
//       // If user not found, create a new user
//       user = new userModal({
//         mobile: storedUserData.mobile,
//         username: storedUserData.username,
//         password: storedUserData.password,
//         // Include other fields as needed
//       });
//     }

//     // Clear the OTP after successful verification
//     user.verificationCode = undefined;

//     await userModal.register(user, storedUserData.password);

//     // passport.authenticate("local")(req, res, function () {
//       req.login(user, function (err) {
//         if (err) {
//           console.error("Passport login error:", err);
//           return res.render("verify", {
//             errorMessages: ["An unexpected error occurred during login."],
//           });
//         }
//         // Clear the session data after successful login
//         req.session.otp = undefined;
//         req.session.userData = undefined;
//       // });
//       res.redirect("/login");
//     });
//   } catch (error) {
//     console.error("Verification error:", error);
//     res.render("verify", {
//       errorMessages: [
//         error.message ||
//           "An unexpected error occurred during verification.",
//       ],
//     });
//   }
// });
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

// ! new
router.get("/userAddress/:productId", isLoggedIn, async function (req, res, next) {
  try {
    const productId = req.params.productId;
    console.log(productId);

    // Assuming you have the user ID from the logged-in user
    const userId = req.user._id;

    // Correct the query to use findOne
    const userAddress = await userModal
      .findOne({ _id: userId })
      .populate('userAddressId');

      console.log(userAddress);

    // Store data in the session
    req.session.userId = userId;
    req.session.productId = productId;
    // req.session.userAddressId = userAddress.userAddressId; // Assuming userAddressId is a property in the userAddress object
   
    // Render the template with the user object
    // res.send(userAddress);
    res.render("userAddress", { userAddress });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



// ! check


// router.get("/checkSessionData/:userAddressId", async function (req, res) {
//   const userId = req.session.userId;
//   const productId = req.session.productId;
//   const userAddressId = req.params.userAddressId;
//   console.log(userAddressId, productId, userId);

//   // try {
//   //   const userOrder = await userOrderModal.findOne({
//   //     user: userId,
//   //     product: productId,
//   //     userAddress: userAddressId,
//   //   });

//     // Create a new productModal instance with the extracted data
//     const userOrder  = new userOrderModal({
//       user: userId,
//       product: productId,
//      userAddress: userAddressId,
     
//     });

//     // Save the product data to the database
//     const savedProduct = await userOrderModal.save();

//     if (userOrder) {
//       res.send("Data is stored in the session.");
//     } else {
//       res.send("Data is not stored in the session.");
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/checkSessionData/:userAddressId", async function (req, res) {
  const userId = req.session.userId;
  const productId = req.session.productId;
  const userAddressId = req.params.userAddressId;
  console.log(userAddressId, productId, userId);

  try {
    // Create a new userOrderModal instance with the extracted data
    const userOrder = new userOrderModal({
      user: userId,
      product: productId,
      userAddress: userAddressId,
    });

    // Save the userOrder data to the database
    await userOrder.save();  // Use await here to ensure it's asynchronous

    res.send("Data is stored in the session.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// ! show the order
router.get("/userOrder/:orderId", async (req, res) => {
  try {
    // Assuming you have a parameter named orderId in the URL
    const orderId = req.params.orderId;

    // Fetch the UserOrder document from the database
    const userOrder = await userOrderModal.findOne({ _id: orderId })
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


//,,
// ! add data
router.post("/userAddress", isLoggedIn, async function (req, res) {
  // const userId = req.user._id;

  try {
    const userId = await userModal.findOne({
      username: req.session.passport.user,
    });
    // console.log('userId:', userId);
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

    // res.status(200).send('User address submitted successfully!');

    res.render("userAddress");
  } catch (error) {
    console.error("Error submitting user address:", error);
    res.status(500).send("Internal Server Error");
  }
});

// !  user order
router.get('/userorder', (req, res) => {});

// ! Delete data
// Assuming you have something like this in your server-side code
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

//! Cart data routes
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

// Login routes
router.get("/login", function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});

//! OLD-login
// router.post(
//   "/login",
//   passport.authenticate("local", {
//     // successRedirect: "/profile",
//     failureRedirect: "/login",
//     failureFlash: true,
//   }),
//   function (req, res) {
//     // Check the role of the authenticated user
//     if (req.user && req.user.role === "admin") {
//       res.render("admin");
//     } else {
//       res.render("profile");
//     }
//   }
// );

// !/login

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
router.get("/productcard", async (req, res) => {
  try {
    const products = await productModal.find();
    res.render("productcard", { products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

//! Admin routes
router.get("/admin", isLoggedIn, function (req, res, next) {
  res.render("admin");
});

router.get(
  "/admin-datas/user-data",
  isLoggedIn,
  async function (req, res, next) {
    try {
      const user_data = await userModal.find();
      res.render("admin-datas/user-data", { user_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/admin-datas/product-data",
  isLoggedIn,
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

router.get("/admin-datas/delete-product/:id", isLoggedIn, async (req, res) => {
  const productId = req.params.id;
  try {
    await productModal.findByIdAndDelete(productId);
    res.redirect("/admin-datas/product-data");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/admin-datas/edit-product/:id", isLoggedIn, async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await productModal.findById(productId);
    res.render("admin-datas/edit-product", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//... (Previous code remains unchanged)

//! Update product route
router.post("/admin-datas/edit-product/:id", isLoggedIn, async (req, res) => {
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
});

//..
//! Add product route
router.get("/admin-datas/addproduct", isLoggedIn, function (req, res, next) {
  res.render("admin-datas/addproduct");
});

router.post(
  "/admin-datas/addproduct",
  isLoggedIn,
  upload.array("images", 4),
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

router.get("/user-balt-pro", (req, res) => {
  // Render the hbs template and pass the cardData to it
  res.render("productModal", { cardData });
});
// ! 0
router.get(
  "/profile-card/user-balt-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "balt" });
      // console.log(product_data);

      res.render("profile-card/user-balt-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);
// ! 1
router.get(
  "/profile-card/user-mal-walltes-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "wallet" });
      console.log(product_data);

      res.render("profile-card/user-mal-walltes-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ! 2
router.get(
  "/profile-card/user-optical-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "optical" });
      // console.log(product_data);

      res.render("profile-card/user-optical-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// !3
router.get(
  "/profile-card/user-optical-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "optical" });
      console.log(product_data);

      res.render("profile-card/user-optical-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// !4
router.get(
  "/profile-card/user-sunglassis-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "sunglassis" });
      console.log(product_data);

      res.render("profile-card/user-sunglassis-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);
// !5
router.get(
  "/profile-card/user-watches-pro",
  isLoggedIn,
  async function (req, res, next) {
    try {
      // Fetch only products with category "balt"
      const product_data = await productModal.find({ category: "watches" });
      console.log(product_data);

      res.render("profile-card/user-watches-pro", { product_data });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// !Order details route
router.get("/admin-datas/order-details", isLoggedIn, function (req, res, next) {
  res.render("admin-datas/order-details");
});

// Logout route
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

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
