import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import {Server} from "socket.io"
import {convert_song, playlist_lookup, search} from "./all"

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
	const sendToClient = (ev: string, tag: string, ...args: any[]) => {
		IO.emit(ev + "_" + tag, ...args)
	}

	socket.on("convert_song", (...args) => {
		convert_song(sendToClient, ...args).then()
	})
	socket.on("playlist_lookup", (...args) => {
		playlist_lookup(sendToClient, youtubeApi, ...args).then()
	})
	socket.on("search", (...args) => {
		search(sendToClient, youtubeApi, ...args).then()
	})
	socket.onAny((...args) => {
		console.log("Socket", ...args)
	})
})

youtubeApi.initalize().then(() => console.log("Initialized YouTube API"))
server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
