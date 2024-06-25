const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { validateMongodbId } = require("../utils/validateMongodbId");
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require("../middlewares/uploadImages");

const createBlog = asyncHandler(async (req, res) => {
    try{
        const newBlog = await Blog.create(req.body);
        res.json(newBlog);
    } catch(error){
        throw new Error(error);
    }
});

const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const updatedBlog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedBlog);
    } catch(error){
        throw new Error(error);
    }
});

const getBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const findBlog = await Blog.findById(id).populate("likes").populate("dislikes");
        await Blog.findByIdAndUpdate(id, {
            $inc: { numViews: 1 },
        }, { new: true });
        res.json(findBlog);
    } catch(error){
        throw new Error(error);
    }
});

const getAllBlogs = asyncHandler(async (req, res) => {
    try{
        const findBlogs = await Blog.find();
        res.json(findBlogs);
    } catch(error){
        throw new Error(error);
    }
});

const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const findBlog = await Blog.findById(id);
        const images = findBlog?.images;
        for (let i=0 ; i<images?.length ; i++){
            deleteImageFromCloudinary(images[i]?.url);
        }
        const deletedBlog = await Blog.findByIdAndDelete(id);
        res.json(deletedBlog);
    } catch(error){
        throw new Error(error);
    }
});

const likeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongodbId(blogId);

    // find the blog which you want to like
    const blog = await Blog.findById(blogId);
    // find the login user
    const loginUserId = req?.user?._id;
    // find if the user has liked the blog
    const isLiked = blog?.isLiked;
    // find if the user has disliked the post
    const alreadyDisliked = blog?.dislikes?.find((userId) => userId?.toString() === loginUserId?.toString());
    if (alreadyDisliked){
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        }, { new: true });
        res.json(blog);
    }
    if (isLiked){
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        }, { new: true });
        res.json(blog);
    } else{
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { likes: loginUserId },
            isLiked: true,
        }, { new: true });
        res.json(blog);
    }
});

const dislikeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongodbId(blogId);

    // find the blog which you want to dislike
    const blog = await Blog.findById(blogId);
    // find the login user
    const loginUserId = req?.user?._id;
    // find if the user has disliked the blog
    const isDisliked = blog?.isDisliked;
    // find if the user has liked the post
    const alreadyLiked = blog?.likes?.find((userId) => userId?.toString() === loginUserId?.toString());
    if (alreadyLiked){
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        }, { new: true });
        res.json(blog);
    }
    if (isDisliked){
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        }, { new: true });
        res.json(blog);
    } else{
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { dislikes: loginUserId },
            isDisliked: true,
        }, { new: true });
        res.json(blog);
    }
});

module.exports = {
    createBlog,
    updateBlog,
    getBlog,
    getAllBlogs,
    deleteBlog,
    likeBlog,
    dislikeBlog,
};