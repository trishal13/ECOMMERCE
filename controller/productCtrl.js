const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const User = require("../models/userModel");
const { validateMongodbId } = require("../utils/validateMongodbId");
// const { uploadImg } = require("../../admin-app/src/features/upload/uploadSlice");
const { uploadImgs } = require("./uploadCtrl");
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require("../middlewares/uploadImages");

const createProduct = asyncHandler(async (req, res) => {
    try{
        if (req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch(error){
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const { id }= req.params;
    validateMongodbId(id);
    try{
        if (req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedProduct);
    } catch(error){
        throw new Error(error);
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id }= req.params;
    validateMongodbId(id);
    try{
        const findProduct = await Product.findById(id);
        const images = findProduct?.images;
        for (let i=0 ; i<images?.length ; i++){
            deleteImageFromCloudinary(images[i]?.url);
        }
        const deletedProduct = await Product.findByIdAndDelete(id);
        res.json(deletedProduct);
    } catch(error){
        throw new Error(error);
    }
});

const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const findProduct = await Product.findById(id).populate("color");
        res.json(findProduct);
    } catch(error){
        throw new Error(error);
    }
});

const getAllProduct = asyncHandler(async (req, res) => {
    try{
        // filtering
        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach(el => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
        let query = Product.find(JSON.parse(queryStr));

        // sorting
        if (req.query.sort){
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else{
            query = query.sort("-createdAt");
        }

        // limiting the fields
        if (req.query.fields){
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        } else{
            query = query.select("-__v");
        }

        // pagination
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page){
            const productCount = await Product.countDocuments();
            if (skip >= productCount){
                throw new Error("This page doesnot exists");
            }
        }

        const product = await query;
        res.json(product);
    } catch(error){
        throw new Error(error);
    }
});

const addToWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    const { prodId } = req.body;
    validateMongodbId(prodId);
    try{
        const user = await User.findById(_id);
        const alreadyAdded = user.wishlist.find((id) => id.toString() === prodId.toString());
        if (alreadyAdded){
            let updatedUser = await User.findByIdAndUpdate(_id, {
                $pull: { wishlist: prodId },
            }, { new: true });
            res.json(updatedUser);
        } else{
            let updatedUser = await User.findByIdAndUpdate(_id, {
                $push: { wishlist: prodId },
            }, { new: true });
            res.json(updatedUser);
        }
    } catch(error){
        throw new Error(error);
    }
});

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    const { star, prodId, comment } = req.body;
    validateMongodbId(prodId);
    try{
        const product = await Product.findById(prodId);
        let alreadyRated = product.ratings.find((userId) => userId.postedBy.toString() === _id.toString());
        if (alreadyRated){
            const updateRating = await Product.updateOne(
                { ratings: { $elemMatch: alreadyRated } },
                { $set: { "ratings.$.star": star, "ratings.$.comment": comment } },
                { new: true },
            );
        } else{
            const rateProduct = await Product.findByIdAndUpdate(prodId, {
                $push: { ratings: { star: star, comment: comment, postedBy: _id} }
            }, { new: true });
        }
        const allRatings = await Product.findById(prodId);
        let totalRatings = allRatings.ratings.length;
        let ratingSum = allRatings.ratings.map((item) => item.star).reduce((prev, curr) => prev + curr, 0);
        let actualRating = Math.round(ratingSum / totalRatings);
        const findalProduct = await Product.findByIdAndUpdate(prodId, { totalRating: actualRating }, { new: true });
        res.json(findalProduct);
    } catch(error){
        throw new Error(error);
    }
});

// const uploadImages = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     validateMongodbId(id);
//     try{
//         let urls = [];
//         const files = req.files.Images;
//         // console.log(files);
//         for (const file of files){
//             const img = await uploadImageToCloudinary(file,process.env.FOLDER,300,90);
//             const secure_url = img.secure_url;
//             urls.push(secure_url);
//         }
//         const product = await Product.findById(id);
//         for (const url of product.images){
//             urls.push(url);
//         }
//         const findProduct = await Product.findByIdAndUpdate(id, {
//             images: urls.map((file) => {
//                 return file;
//             }),
//         }, { new: true });
//         res.json(findProduct);
//         // const images = urls.map((file) => {
//         //     return file;
//         // })
//         // res.json(images);
//     } catch(error){
//         throw new Error(error);
//     }
// });

// const deleteImages = asyncHandler(async (req, res) => {
//     const { url } = req.body;
//     const { id } = req.params;
//     validateMongodbId(id);
//     try{
//         const product = await Product.findById(id);
//         const urls = []
//         for (const link of product.images){
//             if (link !== url){
//                 urls.push(link);
//             }
//         }
//         deleteImageFromCloudinary(url);
//         const findProduct = await Product.findByIdAndUpdate(id, {
//             images: urls.map((file) => {
//                 return file;
//             }),
//         }, { new: true });
//         res.json({ message: "deleted" });
//     } catch(error){
//         throw new Error(error);
//     }
// });

module.exports = {
    createProduct,
    getaProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    addToWishlist,
    rating,
};