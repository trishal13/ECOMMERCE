const express = require("express");

const {
    isAdmin,
    authMiddleware
} = require("../middlewares/authMiddleware");

const {
    uploadImages,
    deleteImages
} = require("../controller/uploadCtrl");

const router = express.Router();

router.post("/", authMiddleware, isAdmin, uploadImages);
router.put("/delete-img", authMiddleware, isAdmin, deleteImages);

module.exports = router;