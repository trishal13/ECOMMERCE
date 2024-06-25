const Color = require("../models/colorModel");
const asyncHandler = require("express-async-handler");
const { validateMongodbId } = require("../utils/validateMongodbId");

const createColor = asyncHandler(async (req, res) => {
    try{
        const newColor = await Color.create(req.body);
        res.json(newColor);
    } catch(error){
        throw new Error(error);
    }
});

const updateColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const updatedColor = await Color.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedColor);
    } catch(error){
        throw new Error(error);
    }
});

const deleteColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const deletedColor = await Color.findByIdAndDelete(id);
        res.json(deletedColor);
    } catch(error){
        throw new Error(error);
    }
});

const getColor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const color = await Color.findById(id);
        res.json(color);
    } catch(error){
        throw new Error(error);
    }
});

const getAllColor = asyncHandler(async (req, res) => {
    try{
        const color = await Color.find();
        res.json(color);
    } catch(error){
        throw new Error(error);
    }
});

module.exports = {
    createColor,
    updateColor,
    deleteColor,
    getColor,
    getAllColor,
};