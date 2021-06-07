import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import {Server} from "socket.io"
import {convert_song, cover_color, search_all} from "./all"

const YoutubeMusicApi = require("youtube-music-api")

const app = express()
const server = http.createServer(app)
const youtubeApi = new YoutubeMusicApi()
const IO = new Server(server, {
	cors: {
		origin: "*"
	},
	pingTimeout: 60000,
	pingInterval: 300000
})
const PORT = 5190
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path)

app.use(express.json())
app.use("/songs", express.static(path.join(__dirname, "..", "songs")))

IO.on("connection", socket => {
	socket.on("convert_song", (...args) => {
		convert_song(IO.emit.bind(IO), ...args).then()
	})
	socket.on("search_all", (...args) => {
		search_all(IO.emit.bind(IO), youtubeApi, ...args)
	})
	socket.on("cover_color", (...args) => {
		cover_color(IO.emit.bind(IO), ...args).then()
	})
})

youtubeApi.initalize().then(() => console.log("Initialized YouTube API"))
server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
