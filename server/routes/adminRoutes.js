const router = require("express").Router();

const adminControllers = require("../controllers/adminController");

router.get("/dashboard", adminControllers.getCountUserAndPost);

router.get("/allPosts", adminControllers.getAllPosts);

router.get("/getReports", adminControllers.getAllReports);

router.delete("/delete:id", adminControllers.deletePost);

module.exports = router;
