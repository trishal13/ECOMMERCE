const express = require("express");

const {
    authMiddleware,
    isAdmin
} = require("../middlewares/authMiddleware");

const {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getAllCategory
} = require("../controller/blogcategoryCtrl");

const router = express.Router();

router.post("/", authMiddleware, isAdmin, createCategory);
router.put("/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
router.get("/:id", getCategory);
router.get("/", getAllCategory);

module.exports = router;