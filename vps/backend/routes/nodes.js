const express = require("express")
const router = express.Router()
const Node = require("../models/Node")

router.get("/", async (req, res) => {
  const nodes = await Node.find({}).sort({ updatedAt: -1 })
  res.json(nodes)
})

module.exports = router
