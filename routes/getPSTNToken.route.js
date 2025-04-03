const express = require("express");
const router = express.Router();
const authController = require("./../controllers/auth.controller");

/* GET */
router.post("/get-pstn-token", authController.getPSTNToken);

module.exports = router;
