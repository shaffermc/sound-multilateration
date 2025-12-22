const { io } = require("../server")
const Device = require("../models/Device")

const devices = new Map()
const stations = new Map()

function makeKey(station, type, id) {
  return `${station}-${type}-${id}`
}

async function handleDeviceUpdate(req, res) {
  const data = req.body
  const now = Date.now()

  const key = makeKey(data.station, data.deviceType, data.deviceId)

  const deviceState = {
    ...data,
    key,
    lastSeen: now,
    status: "OK"
  }

  devices.set(key, deviceState)

  // Persist snapshot
  await Device.findOneAndUpdate(
    { key },
    deviceState,
    { upsert: true, new: true }
  )

  updateStationState(data.station)

  io.emit("device:update", deviceState)

  res.send({ ok: true })
}

function updateStationState(stationId) {
  const stationDevices = [...devices.values()]
    .filter(d => d.station === stationId)

  let status = "OK"

  for (const d of stationDevices) {
    if (d.status === "OFFLINE") {
      status = "DEGRADED"
    }
  }

  stations.set(stationId, {
    station: stationId,
    status,
    updatedAt: Date.now()
  })

  io.emit("station:update", stations.get(stationId))
}

setInterval(() => {
  const now = Date.now()

  for (const [key, device] of devices.entries()) {
    let newStatus = device.status

    if (now - device.lastSeen > 60000) {
      newStatus = "OFFLINE"
    } else if (now - device.lastSeen > 10000) {
      newStatus = "STALE"
    }

    if (newStatus !== device.status) {
      device.status = newStatus
      devices.set(key, device)

      io.emit("device:update", device)
      updateStationState(device.station)
    }
  }
}, 5000)

module.exports = { handleDeviceUpdate }
