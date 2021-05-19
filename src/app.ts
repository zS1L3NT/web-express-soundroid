import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import { Server } from "socket.io"
import convert_song from "./convert_song"

const app = express()
const server = http.createServer(app)
const IO = new Server(server, {
	cors: {
		origin: "*"
	},
	pingTimeout: 60000,
	pingInterval: 300000
})
const PORT = 5190
const SONG_URL = "http://soundroid.zectan.com/songs"
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path)

app.use(express.json())
app.use("/songs", express.static(path.join(__dirname, "..", "songs")))

IO.on("connection", socket => {
	socket.on("convert_song", (...args) => {
		convert_song(
			(event: string, data: any) => IO.emit(event, data),
			SONG_URL,
			args
		)
	})
})

server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
