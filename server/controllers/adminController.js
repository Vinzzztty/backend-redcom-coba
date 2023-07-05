const Post = require("../models/Post");
const User = require("../models/User");
const Kategori = require("../models/Kategori");
const Comment = require("../models/Comment");
const { verifyAccessToken } = require("../middleware/jwt_helper");
const { formatDate, formatTime } = require("../utils/formattedDate");

exports.getCountUserAndPost = async (req, res) => {
    try {
        const countUsers = await User.countDocuments({ is_admin: { $ne: 1 } });
        const countPosts = await Post.countDocuments();

        res.status(200).json({
            status: "success",
            data: { countUsers, countPosts },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();

        res.status(200).json({
            status: "success",
            data: posts._id,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};
