import { useEffect } from "react"
import { io } from "socket.io-client"

const socket = io(import.meta.env.VITE_API_URL)

export function useDeviceSocket(setDevices, setStations) {
  useEffect(() => {
    socket.on("device:update", device => {
      setDevices(prev => ({
        ...prev,
        [device.key]: device
      }))
    })

    socket.on("station:update", station => {
      setStations(prev => ({
        ...prev,
        [station.station]: station
      }))
    })

    return () => socket.disconnect()
  }, [])
}
