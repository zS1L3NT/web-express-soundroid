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
	let inactive = false
	const sendToClient = (ev: string, tag: string, ...args: any[]) => {
		IO.emit(ev + "_" + tag, ...args)
	}

	socket.on("playlist_lookup", (...args) => {
		playlist_lookup(sendToClient, () => inactive, youtubeApi, ...args).then()
	})
	socket.on("search", (...args) => {
		search(sendToClient, () => inactive, youtubeApi, ...args).then()
	})
	socket.onAny((...args) => {
		console.log("Socket", ...args)
	})

	socket.on("disconnect", () => inactive = true)
})

app.get("/songs/:filename", (req, res) => {
	const filename = req.params.filename

	const IDRegex = filename.match(/^(.+)\.mp3$/)
	if (IDRegex) {
		const id = IDRegex[1]
		convert_song(id)
			.then(res.redirect.bind(res))
			.catch(err => res.status(400).send(err.message))
	}
	else {
		res.status(400).send("Cannot GET /songs/" + filename)
	}
})

youtubeApi.initalize().then(() => console.log("Initialized YouTube API"))
server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
