import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import admin from "firebase-admin"
import {Server} from "socket.io"
import {v4} from "uuid"
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
app.use("/", express.static(path.join(__dirname, "..", "application")))
app.use("/song/highest", express.static(path.join(__dirname, "..", "song", "highest")))
app.use("/song/lowest", express.static(path.join(__dirname, "..", "song", "lowest")))

IO.on("connection", socket => {
	let inactive = false
	const sendToClient = (ev: string, tag: string, ...args: any[]) => {
		IO.emit(ev + "_" + tag, ...args)
	}

	socket.on("search", (...args) => {
		search(sendToClient, () => inactive, youtubeApi, ...args).then()
	})
	socket.onAny((...args) => {
		console.log("Socket", args)
	})

	socket.on("disconnect", () => inactive = true)
})

app.get("/", (req, res) =>  {
	res.redirect("/soundroid.apk")
})

app.get("/playlist/songs", (req, res) => {
	const TAG = `playlist_songs<${v4()}>:`
	console.time(TAG)
	const playlistId = req.query.playlistId

	playlist_songs(TAG, playlistId, youtubeApi)
		.then(songs => res.status(200).send(songs))
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.delete("/playlist/delete", (req, res) => {
	const TAG = `delete_playlist<${v4()}>:`
	console.time(TAG)
	const playlistId = req.body.playlistId

	delete_playlist(TAG, admin.firestore(), playlistId)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.put("/playlist/edit", (req, res) => {
	const TAG = `edit_playlist<${v4()}>:`
	console.time(TAG)

	edit_playlist(TAG, admin.firestore(), req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.put("/playlist/save", async (req, res) => {
	const TAG = `save_playlist<${v4()}>:`
	console.time(TAG)

	save_playlist(TAG, admin.firestore(), youtubeApi, req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.get("/song/:quality_/:filename", (req, res) => {
	const {quality_, filename} = req.params

	if (!["highest", "lowest"].includes(quality_)) {
		return res.status(400).send(`Cannot GET /song/${quality_}/${filename}`)
	}

	const quality = quality_ as "highest" | "lowest"
	const IDRegex = filename.match(/^(.+)\.mp3$/)
	if (IDRegex) {
		const TAG = `convert_song_${quality}<${v4()}>:`
		console.time(TAG)

		convert_song(TAG, IDRegex[1], quality)
			.then(res.redirect.bind(res))
			.catch(err => res.status(400).send(err.message))
			.finally(() => console.timeEnd(TAG))
	}
	else {
		return res.status(400).send(`Cannot GET /song/${quality}/${filename}`)
	}
})

youtubeApi.initalize().then(() => console.log("Initialized YouTube API"))
server.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))
