const User = require("../models/User");
const Post = require("../models/Post");
const Report = require("../models/Report");
const Comment = require("../models/Comment");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} = require("../middleware/jwt_helper");

const { formatDate, formatTime } = require("../utils/formattedDate");

exports.signup = async (req, res) => {
    try {
        const { username, email, password, is_admin } = req.body;

        const doesExistEmail = await User.findOne({ email: email });
        if (doesExistEmail) {
            return res.status(401).json({
                msg: `${email} is already been registered`,
            });
        }

        const doesExistUsername = await User.findOne({ username: username });
        if (doesExistUsername) {
            return res.status(401).json({
                msg: `${username} is already been registered`,
            });
        }

        const hashPassword = await bcryptjs.hash(password, 8);
        const user = new User({
            username: username,
            email: email,
            password: hashPassword,
            is_admin: is_admin,
        });
        await user.save();

        //const accessToken = await signAccessToken(user._id);
        //const refreshToken = await signRefreshToken(user._id);

        res.status(201).json({
            message: "User created successfully",
            //access_token: { accessToken },
            //refresh_token: { refreshToken },
            user,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
            error: error.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({
                message: "Email not found",
            });
        }

        const isPasswordMatch = await bcryptjs.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid password",
            });
        }

        const accessToken = await signAccessToken(user._id, user.is_admin);
        //const refreshToken = await signRefreshToken(user._id);

        res.status(200).json({
            message: "User logged in successfully",
            access_token: accessToken,
            //refresh_token: refreshToken,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw res.status(404).json({
                message: "Bad Request",
            });
        const userId = await verifyRefreshToken(refreshToken);

        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);

        res.send({ accessToken, refToken });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
            error: error.message,
        });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const userId = req.payload.aud;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
                });
            }

            res.status(200).json({
                status: "success",
                data: user,
            });
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.getUserPost = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unathorized " });
            }

            const userId = req.payload.aud;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
                });
            }

            const posts = await Post.find({ user_id: userId })
                .populate("user_id")
                .populate("kategori_id")
                .sort({ crdAt: -1 });

            if (!posts) {
                return res.status(404).json({
                    status: "Not have Post",
                    message: "This user not create Post",
                });
            }

            const formattedPosts = await Promise.all(
                posts.map(async (post) => {
                    const formattedCreatedAtDate = formatDate(post.crdAt);
                    const formattedCreatedAtTime = formatTime(post.crdAt);

                    const totalComments = await Comment.countDocuments({
                        user_id: userId,
                    });

                    const totalCommentsByPost = await Comment.countDocuments({
                        post_id: post._id,
                    });

                    return {
                        _id: post._id,
                        content: post.content,
                        kategori_id: post.kategori_id,
                        user_id: post.user_id,
                        total_comments: totalCommentsByPost,
                        user_total_comments: totalComments,
                        date_created: formattedCreatedAtDate,
                        time: formattedCreatedAtTime,
                    };
                })
            );
            res.status(200).json({
                status: "success",
                data: formattedPosts,
            });
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.editUser = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const userId = req.payload.aud;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
                });
            }

            const { username, email } = req.body;

            // cek email
            if (email === user.email) {
                if (username === user.username) {
                    // Email and username remains the same, no need validation
                    const doesExistsUsername = await User.findOne({
                        username: username,
                    });
                    if (doesExistsUsername) {
                        return res.status(401).json({
                            msg: `${username} is already been use`,
                        });
                    }

                    const updatedUser = await User.findByIdAndUpdate(
                        userId,
                        {
                            username,
                            email,
                        },
                        { new: true }
                    );

                    return res.status(200).json({
                        status: "success",
                        data: updatedUser,
                    });
                }
                const doesExistsUsername = await User.findOne({
                    username: username,
                });
                if (doesExistsUsername) {
                    return res.status(401).json({
                        msg: `${username} is already been use`,
                    });
                }
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        username,
                        email,
                    },
                    { new: true }
                );

                return res.status(200).json({
                    status: "success",
                    data: updatedUser,
                });
            }

            if (username === user.username) {
                if (email === user.email) {
                    const doesExistEmail = await User.findOne({ email: email });
                    if (doesExistEmail) {
                        return res.status(401).json({
                            msg: `${email} is already been use`,
                        });
                    }
                    const updatedUser = await User.findByIdAndUpdate(
                        userId,
                        {
                            username,
                            email,
                        },
                        { new: true }
                    );

                    return res.status(200).json({
                        status: "success",
                        data: updatedUser,
                    });
                }

                const doesExistsUsername = await User.findOne({
                    username: username,
                });
                if (doesExistsUsername) {
                    return res.status(401).json({
                        msg: `${username} is already been use`,
                    });
                }
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        username,
                        email,
                    },
                    { new: true }
                );

                return res.status(200).json({
                    status: "success",
                    data: updatedUser,
                });
            } else {
                const doesExistEmail = await User.findOne({ email: email });
                if (doesExistEmail) {
                    return res.status(401).json({
                        msg: `${email} is already been use`,
                    });
                }

                const doesExistsUsername = await User.findOne({
                    username: username,
                });
                if (doesExistsUsername) {
                    return res.status(401).json({
                        msg: `${username} is already been use`,
                    });
                }

                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        username,
                        email,
                    },
                    { new: true }
                );

                return res.status(200).json({
                    status: "success",
                    data: updatedUser,
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

exports.reportPost = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({
                    error: "Unauthorized",
                });
            }

            const userId = req.payload.aud;
            const postId = req.params.id;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
                });
            }

            const existingReport = await Report.findOne({
                post_id: postId,
                user_id: userId,
            });

            if (existingReport) {
                return res.status(409).json({
                    status: "error",
                    message: "You have already reported this post",
                });
            }

            const report = new Report({
                post_id: postId,
                user_id: userId,
                reason: req.body.reason, // Assuming the user provides a reason for reporting the post in the request body
            });

            await report.save();

            res.status(201).json({
                status: "success",
                message: "Post reported successfully",
            });
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
            error: error.message,
        });
    }
};

exports.logout = async (req, res) => {
    try {
        logoutUser(req, res);
        res.status(200).json({
            message: "User logged out successfully",
            session: req.session,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    } finally {
        // Clear session data
        req.session = null;
    }
};

const logoutUser = (req, res, next) => {
    const token = req.headers["authorization"];
    if (token) {
        jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
            if (err) {
                return err;
            }

            decoded.exp = Date.now();
        });
    }
};
