const { uploadImageToCloudinary, deleteImageFromCloudinary } = require("../middlewares/uploadImages");
const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler")

async function uploadImgs(images){
    try{
        let urls = [];
        for (const file of images){
            const img = await uploadImageToCloudinary(file,process.env.FOLDER,300,90);
            const secure_url = img.secure_url;
            const public_id = img.public_id;
            urls.push({public_id: public_id, url: secure_url});
        }
        return urls;
    } catch(error){
        throw new Error(error);
    }
}

const uploadImages = asyncHandler(async (req, res) => {
    try{
        let urls = [];
        const files = req.files.images;
        if (files.length > 1){
            for (const file of files){
                const img = await uploadImageToCloudinary(file,process.env.FOLDER,300,90);
                const secure_url = img.secure_url;
                const public_id = img.public_id;
                urls.push({public_id: public_id, url: secure_url});
            }
        }
        else{
            const img = await uploadImageToCloudinary(files,process.env.FOLDER,300,90);
            const secure_url = img.secure_url;
            const public_id = img.public_id;
            urls.push({public_id: public_id, url: secure_url});
        }
        res.json(urls);
    } catch(error){
        throw new Error(error);
    }
});

const deleteImages = asyncHandler(async (req, res) => {
    const { url } = req.body;
    try{
        deleteImageFromCloudinary(url);
        res.json({ message: "deleted" });
    } catch(error){
        throw new Error(error);
    }
});

module.exports = {
    uploadImages,
    deleteImages,
    uploadImgs,
};