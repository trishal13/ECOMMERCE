const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");
const { validateMongodbId } = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const crypto = require("crypto");
const uniqid = require("uniqid");
const { error } = require("console");

// register
const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });
    if (!findUser){
        // create new user
        const newUser = await User.create(req.body);
        res.json(newUser);
    } else{
        // user already exist
        throw new Error("User Already Exists");
    }
});

// logout
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie.refreshToken){
        throw new Error("No refresh token in cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user){
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        return res.sendStatus(204); // forbidden
    }
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" }, { new: true });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204); // forbidden
});

// login
const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists
    const findUser = await User.findOne({ email: email });
    if (findUser && await findUser.isPasswordMatched(password)){
        // user exists
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateUser = await User.findByIdAndUpdate(findUser._id, { refreshToken: refreshToken }, { new: true });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 72*60*60*1000,
        });
        res.json({
            _id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id)
        });
    } else{
        // user doesnot exists
        throw new Error("Invalid Credentials");
    }
});

// admin login
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists
    const findAdmin = await User.findOne({ email: email });
    if (findAdmin?.role !== "admin"){
        throw new Error("Not Authorized");
    }
    if (findAdmin && await findAdmin.isPasswordMatched(password)){
        // user exists
        const refreshToken = await generateRefreshToken(findAdmin?._id);
        const updateAdmin = await User.findByIdAndUpdate(findAdmin?._id, { refreshToken: refreshToken }, { new: true });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 72*60*60*1000,
        });
        res.json({
            _id: findAdmin?._id,
            firstname: findAdmin?.firstname,
            lastname: findAdmin?.lastname,
            email: findAdmin?.email,
            mobile: findAdmin?.mobile,
            token: generateToken(findAdmin?._id)
        });
    } else{
        // user doesnot exists
        throw new Error("Invalid Credentials");
    }
});

// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie.refreshToken){
        throw new Error("No refresh token in cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user){
        throw new Error("No refresh token present in db or not matched");
    }
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id){
            throw new Error("There is something wrong with the refresh token");
        }
        const accessToken = generateToken(user?._id);
        res.json({ accessToken });
    });
    res.json(user);
});

// get all users
const getAllUsers = asyncHandler(async (req, res) => {
    try{
        const getUsers = await User.find();
        res.json(getUsers);
    } catch(error){
        throw new Error(error);
    }
});

// get a single user
const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.user;
    validateMongodbId(id);
    try{
        const getUser = await User.findById(id);
        res.json({
            getUser,
        });
    } catch(error){
        throw new Error(error);
    }
});

// delete a user
const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const deleteUser = await User.findByIdAndDelete(id);
        res.json({
            deleteUser,
        });
    } catch(error){
        throw new Error(error);
    }
});

// update a user
const updateaUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const updatedUser = await User.findByIdAndUpdate(_id, {
            firstname: req?.body?.firstname,
            lastname: req?.body?.lastname,
            email: req?.body?.email,
            mobile: req?.body?.mobile,
        }, { new: true });
        res.json(updatedUser);
    } catch(error){
        throw new Error(error);
    }
});

// save user address
const saveAddress = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const updatedUser = await User.findByIdAndUpdate(_id, {
            address: req?.body?.address,
        }, { new: true });
        res.json(updatedUser);
    } catch(error){
        throw new Error(error);
    }
});

// block a user
const bloackUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const block = await User.findByIdAndUpdate(id, { isBlocked: true}, { new: true });
        res.json({
            message: "User blocked",
        });
    } catch(error){
        throw new Error(error);
    }
});

// unblock a user
const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const unblock = await User.findByIdAndUpdate(id, { isBlocked: false}, { new: true });
        res.json({
            message: "User unblocked",
        });
    } catch(error){
        throw new Error(error);
    }
});

// update password
const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongodbId(_id);
    const user = await User.findById(_id);
    if (password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else{
        res.json(user);
    }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user){
        throw new Error("User not found with this email");
    }
    try{
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetUrl = `Hi, Please follow this link to reset your password. 
                            This link is valid till 10 minutes from now. 
                            <a href="http://localhost:3000/reset-password/${token}">Click Here</a>`;
        const data = {
            to: email,
            text: "Hey User",
            subject: "Forgot Password Link",
            htm: resetUrl,
        }
        sendEmail(data);
        res.json(token);
    } catch(error){
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user){
        throw new Error("Token Expired, Please try again later");
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getWislist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const findUser = await User.findById(_id).populate("wishlist");
        res.json(findUser);
    } catch(error){
        throw new Error(error);
    }
});

const userCart = asyncHandler(async (req, res) => {
    const { productId, color, quantity, price } = req.body;
    const { _id } = req.user;
    validateMongodbId(_id);
    validateMongodbId(productId);
    try{
        let newCart = await new Cart({
            userId: _id,
            productId,
            quantity,
            color,
            price,
        }).save();
        res.json(newCart);
    } catch(error){
        throw new Error(error);
    }
});

const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const cart = await Cart.find({ userId: _id }).populate("productId").populate("color");
        res.json(cart);
    } catch(error){
        throw new Error(error);
    }
});

const removeProductFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { id } = req.params;
    validateMongodbId(_id);
    validateMongodbId(id);
    try{
        const deletedProduct = await Cart.deleteOne({ userId: _id, _id: id });
        res.json(deletedProduct);
    } catch(error){
        throw new Error(error);
    }
});

const emptyCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const deletedCart = await Cart.deleteMany({ userId: _id });
        res.json(deletedCart);
    } catch(error){
        throw new Error(error);
    }
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { id, newQuantity } = req.params;
    validateMongodbId(_id);
    validateMongodbId(id);
    try{
        const cartItem = await Cart.findOne({ userId: _id, _id: id });
        cartItem.quantity = newQuantity;
        cartItem.save();
        res.json(cartItem);
    } catch(error){
        throw new Error(error);
    }
});

const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    const { shippingInfo, orderItems, totalPrice, totalPriceAfterDiscount, paymentInfo } = req.body;
    try{
        const order = await Order.create({
            user: _id,
            shippingInfo,
            paymentInfo,
            orderItems,
            totalPrice,
            totalPriceAfterDiscount,
        });
        res.json({ order, success: true });
    } catch(error){
        throw new Error(error);
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const orders = await Order.find({ user: _id })
                                    .populate("user")
                                    .populate("orderItems.product")
                                    .populate("orderItems.color");
        res.json({orders});
    } catch(error){
        throw new Error(error);
    }
});

const getSingleOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const orders = await Order.findById(id).populate("orderItems.product").populate("orderItems.color");
        res.json({orders});
    } catch(error){
        throw new Error(error);
    }
});

const updateOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const orders = await Order.findById(id);
        orders.orderStatus = req.body.status;
        await orders.save();
        res.json({orders});
    } catch(error){
        throw new Error(error);
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    try{
        const orders = await Order.find()
                                    .populate("user")
                                    .populate("orderItems.product")
                                    .populate("orderItems.color");
        res.json({orders});
    } catch(error){
        throw new Error(error);
    }
});

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
    let monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    let d = new Date();
    let endDate = "";
    d.setDate(1);
    for  (let i=0 ; i<11 ; i++){
        d.setMonth(d.getMonth()-1);
        endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
    }
    try{
        const data = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $lte: new Date(),
                        $gte: new Date(endDate),
                    }
                }
            },
            {
                $group: {
                    _id: { month: "$month" },
                    count: { $sum: 1 },
                    amount: { $sum: "$totalPriceAfterDiscount" },
                }
            }
        ]);
        res.json(data);
    } catch(error){
        throw new Error(error);
    }
});

const getYearlyTotalOrders = asyncHandler(async (req, res) => {
    let monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    let d = new Date();
    let endDate = "";
    d.setDate(1);
    for  (let i=0 ; i<11 ; i++){
        d.setMonth(d.getMonth()-1);
        endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
    }
    try{
        const data = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $lte: new Date(),
                        $gte: new Date(endDate),
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: "$totalPriceAfterDiscount" },
                }
            }
        ]);
        res.json(data);
    } catch(error){
        throw new Error(error);
    }
});

module.exports = {
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
    removeProductFromCart,
    updateProductQuantityFromCart,
    createOrder,
    getMyOrders,
    getMonthWiseOrderIncome,
    getYearlyTotalOrders,
    getAllOrders,
    getSingleOrder,
    updateOrder,
    emptyCart,
};