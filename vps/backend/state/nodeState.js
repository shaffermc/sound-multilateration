const { io } = require("../server")
const Node = require("../models/Node")

const nodes = new Map()

// thresholds
const STALE_MS = 15 * 60 * 1000   // 15 minutes
const OFFLINE_MS = 20 * 60 * 1000 // 20 minutes

function makeKey(station, kind, id) {
  return `${station}:${kind}:${id}`
}

async function handleNodeUpdate({ station, kind, id, name, meta }) {
  const now = Date.now()
  const key = makeKey(station, kind, id)

  const node = {
    key,
    station,
    kind,
    name,
    meta,
    lastSeen: now,   // ms timestamp
    status: "OK"
  }

  nodes.set(key, node)

  await Node.findOneAndUpdate(
    { key },
    node,
    { upsert: true, new: true }
  )

  io.emit("node:update", node)
  updateStationState(station)
}

function updateStationState(station) {
  const stationNodes = [...nodes.values()].filter(n => n.station === station)

  let status = "OK"

  for (const n of stationNodes) {
    if (n.status === "OFFLINE") {
      status = "DOWN"
      break
    }
    if (n.status === "STALE") {
      status = "DEGRADED"
    }
  }

  io.emit("station:update", {
    station,
    status,
    updatedAt: Date.now()
  })
}

setInterval(() => {
  const now = Date.now()

  for (const node of nodes.values()) {
    // lastSeen is already a ms timestamp
    const age = now - node.lastSeen

    let next = "OK"
    if (age > OFFLINE_MS) next = "OFFLINE"
    else if (age > STALE_MS) next = "STALE"

    if (next !== node.status) {
      node.status = next
      io.emit("node:update", node)
      updateStationState(node.station)
    }
  }
}, 5000)

module.exports = { handleNodeUpdate }
