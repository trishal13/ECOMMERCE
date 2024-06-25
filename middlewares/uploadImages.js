const cloudinary = require('cloudinary').v2;
require("dotenv").config();

exports.uploadImageToCloudinary  = async (file, folder, height, quality) => {
    const options = { folder };
    if(height) {
        options.height = height;
    }
    if(quality) {
        options.quality = quality;
    }
    options.resource_type = "auto";
    return await cloudinary.uploader.upload(file.tempFilePath, options);
} 

// Utility function to delete an image from Cloudinary
exports.deleteImageFromCloudinary = async (imageUrl) => {
    try {
      // Extract public_id from the image URL
      const publicId = imageUrl.split('/').pop().split('.')[0];
      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(`${process.env.FOLDER}/${publicId}`);
    } catch (error) {
      throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  };