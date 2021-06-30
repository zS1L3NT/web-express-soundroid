import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import admin from "firebase-admin"
import {Server} from "socket.io"
import {convert_song, delete_playlist, edit_playlist, playlist_songs, save_playlist, search} from "./all"

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
admin.initializeApp({
	credential: admin.credential.cert(require("../config.json").firebase.service_account)
})

app.use(express.json())
app.use("/song", express.static(path.join(__dirname, "..", "song")))

IO.on("connection", socket => {
	let inactive = false
	const sendToClient = (ev: string, tag: string, ...args: any[]) => {
		IO.emit(ev + "_" + tag, ...args)
	}

	socket.on("search", (...args) => {
		search(sendToClient, () => inactive, youtubeApi, ...args).then()
	})
	socket.onAny((...args) => {
		console.log("Socket", ...args)
	})

	socket.on("disconnect", () => inactive = true)
})

app.get("/playlist/:playlist_id/songs", (req, res) => {
	const playlist_id = req.params.playlist_id

	playlist_songs(playlist_id, youtubeApi)
		.then(songs => res.status(200).send(songs))
		.catch(err => res.status(400).send(err.message))
})

app.delete("/playlist/:playlist_id/delete", (req, res) => {
	const playlist_id = req.params.playlist_id

	delete_playlist(admin.firestore(), playlist_id)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
})

app.put("/playlist/edit", (req, res) => {
	edit_playlist(admin.firestore(), req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
})

app.put("/playlist/save", async (req, res) => {
	save_playlist(admin.firestore(), youtubeApi, req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
})

app.get("/song/:filename", (req, res) => {
	const filename = req.params.filename

	const IDRegex = filename.match(/^(.+)\.mp3$/)
	if (IDRegex) {
		const id = IDRegex[1]
		convert_song(id)
			.then(res.redirect.bind(res))
			.catch(err => res.status(400).send(err.message))
	}
	else {
		res.status(400).send("Cannot GET /song/" + filename)
	}
})

youtubeApi.initalize().then(() => console.log("Initialized YouTube API"))
server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
