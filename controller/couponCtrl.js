const Coupon = require("../models/couponModel");
const asyncHandler = require("express-async-handler");
const { validateMongodbId } = require("../utils/validateMongodbId");

const createCoupon = asyncHandler(async (req, res) => {
    try{
        const newCoupon = await Coupon.create(req.body);
        res.json(newCoupon);
    } catch(error){
        throw new Error(error);
    }
});

const getAllCoupons = asyncHandler(async (req, res) => {
    try{
        const coupon = await Coupon.find();
        res.json(coupon);
    } catch(error){
        throw new Error(error);
    }
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedCoupon);
    } catch(error){
        throw new Error(error);
    }
});

const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const deletedCoupon = await Coupon.findByIdAndDelete(id);
        res.json(deletedCoupon);
    } catch(error){
        throw new Error(error);
    }
});

const getCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const findCoupon = await Coupon.findById(id);
        res.json(findCoupon);
    } catch(error){
        throw new Error(error);
    }
});

module.exports = {
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    getCoupon
};