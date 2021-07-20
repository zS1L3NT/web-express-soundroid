import express from "express"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import http from "http"
import admin from "firebase-admin"
import {Server} from "socket.io"
import {v4} from "uuid"
import {
	convert_song,
	delete_playlist,
	edit_playlist,
	edit_song,
	import_playlist,
	playlist_songs,
	save_playlist,
	search
} from "./all"
import fs from "fs";

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
const VERSION = "1.2.2"
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path)
admin.initializeApp({
	credential: admin.credential.cert(require("../config.json").firebase.service_account)
})

app.use(express.json())
app.use("/", express.static(path.join(__dirname, "..", "application")))
app.use("/part/highest", express.static(path.join(__dirname, "..", "part", "highest")))
app.use("/part/lowest", express.static(path.join(__dirname, "..", "part", "lowest")))
app.use("/song/highest", express.static(path.join(__dirname, "..", "song", "highest")))
app.use("/song/lowest", express.static(path.join(__dirname, "..", "song", "lowest")))

const importing: { [userId: string]: string } = {}

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
	res.redirect(`/soundroid-v${VERSION}.apk`)
})

app.get("/version", (req, res) => {
	res.send(VERSION)
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

	delete_playlist(TAG, admin.firestore(), playlistId, importing)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.put("/playlist/edit", (req, res) => {
	const TAG = `edit_playlist<${v4()}>:`
	console.time(TAG)

	edit_playlist(TAG, admin.firestore(), req.body, importing)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.put("/song/edit", (req, res) => {
	const TAG = `edit_song<${v4()}>`
	console.time(TAG)

	edit_song(TAG, admin.firestore(), req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.put("/playlist/save", (req, res) => {
	const TAG = `save_playlist<${v4()}>:`
	console.time(TAG)

	save_playlist(TAG, admin.firestore(), youtubeApi, req.body)
		.then(() => res.status(200).send())
		.catch(err => res.status(400).send(err.message))
		.finally(() => console.timeEnd(TAG))
})

app.post("/playlist/import", (req, res) => {
	const TAG = `import_playlist<${v4()}>:`
	console.time(TAG)

	import_playlist(TAG, admin.firestore(), youtubeApi, req.body, importing, () => res.status(200).send())
		.then(() => console.log(TAG, "All Songs added"))
		.catch(err => res.status(400).send(err.message))
		.finally(() => {
			console.timeEnd(TAG)
			delete importing[req.body.userId]
		})
})

app.get("/play/:quality_/:filename", (req, res) => {
	const {quality_, filename} = req.params

	if (!["highest", "lowest"].includes(quality_)) {
		return res.status(400).send(`Cannot GET /play/${quality_}/${filename}`)
	}

	const quality = quality_ as "highest" | "lowest"
	const IDRegex = filename.match(/^(.+)\.mp3$/)
	if (IDRegex) {
		if (fs.existsSync(path.join(__dirname, "..", "song", quality, filename))) {
			return res.redirect(`/song/${quality}/${filename}`)
		} else if (fs.existsSync(path.join(__dirname, "..", "part", quality, filename))) {
			return res.redirect(`/part/${quality}/${filename}`)
		} else {
			convert_song(`convert_song_${quality}<${v4()}>:`, IDRegex[1], quality)
			setTimeout(() => {
				res.redirect(`/part/${quality}/${filename}`)
			}, 10000)
		}
	}
	else {
		return res.status(400).send(`Cannot GET /play/${quality}/${filename}`)
	}
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
