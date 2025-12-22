const express = require("express")
const router = express.Router()
const { handleDeviceUpdate } = require("../state/deviceState")

router.post("/update", handleDeviceUpdate)

module.exports = router
