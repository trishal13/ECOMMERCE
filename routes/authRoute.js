const express = require("express");

const {
    createUser,
    loginUserCtrl,
    getAllUsers,
    getaUser,
    deleteaUser,
    updateaUser,
    bloackUser,
    unblockUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    loginAdmin,
    getWislist,
    saveAddress,
    userCart,
    getUserCart,
    createOrder,
    removeProductFromCart,
    updateProductQuantityFromCart,
    getMyOrders,
    getMonthWiseOrderIncome,
    getYearlyTotalOrders,
    getAllOrders,
    getSingleOrder,
    updateOrder,
    emptyCart
} = require("../controller/userCtrl");

const {
    authMiddleware,
    isAdmin
} = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Hello World!!");
});
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.put("/updateOrder/:id", authMiddleware, isAdmin, updateOrder);
router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/order/checkout", authMiddleware, checkout);
router.post("/order/paymentVerification", authMiddleware, paymentVerification);
// router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/create-order", authMiddleware, createOrder);
router.get("/all-users", getAllUsers);
router.get("/getmyorders", authMiddleware, getMyOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/getaOrder/:id", authMiddleware, isAdmin, getSingleOrder);
// router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getOrderByUserId);
router.get("/wishlist", authMiddleware, getWislist);
router.get("/cart", authMiddleware, getUserCart);
router.get("/getMonthWiseOrderIncome", authMiddleware, isAdmin, getMonthWiseOrderIncome);
// router.get("/getMonthWiseOrderCount", authMiddleware, isAdmin, getMonthWiseOrderCount);
router.get("/getyearlyorders", authMiddleware, isAdmin, getYearlyTotalOrders);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/:id", authMiddleware, isAdmin, getaUser);
router.delete("/delete-product-cart/:id", authMiddleware, removeProductFromCart);
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", deleteaUser);
router.put("/edit-user", authMiddleware, updateaUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, bloackUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);
router.put("/update-product-cart/:id/:newQuantity", authMiddleware, updateProductQuantityFromCart);

module.exports = router;