const express = require("express")
const router = express.Router()
const { handleNodeUpdate } = require("../state/nodeState")

router.post("/update", async (req, res) => {
  await handleNodeUpdate(req.body)
  res.send({ ok: true })
})

module.exports = router
