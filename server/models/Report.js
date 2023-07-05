const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        post_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        reason: {
            type: String,
            enum: ["Tidak Senonoh", "Ujaran Kebencian"],
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: "crdAt",
            updatedAt: "upAt",
        },
    }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
