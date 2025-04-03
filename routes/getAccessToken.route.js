const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/* GET */
router.post("/get-access-token", authController.getAccessToken);

module.exports = router;
