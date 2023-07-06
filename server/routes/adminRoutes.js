const router = require("express").Router();

const adminControllers = require("../controllers/adminController");

router.get("/dashboard", adminControllers.getCountUserAndPost);

router.get("/allPosts", adminControllers.getAllPosts);

router.get("/getReports", adminControllers.getAllReports);

router.delete("/delete/:id", adminControllers.deletePost);

router.delete("report/delete/:id", adminControllers.deleteReport);

module.exports = router;
