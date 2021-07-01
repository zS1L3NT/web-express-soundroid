import path from "path"
import fs from "fs"
import ytdl from "ytdl-core"
import {convert_song} from "../all";

const songsWritePath = (id: string) =>
	path.join(__dirname, "..", "..", "song", id + ".mp3")

let converting: string[] = []

export default async (TAG: string, songId: string) => new Promise<string>(async (resolve, reject) => {
	if (!songId) return reject("Missing id")

	console.log(TAG, `Song`, songId)

	if (converting.includes(songId)) {
		console.log(TAG, "Converting already, waiting for file...")
		await new Promise(res => setTimeout(res, 1000))
		resolve(await convert_song(TAG, songId))
		return
	}

	const url = "https://youtu.be/" + songId
	try {
		console.log(TAG, "Fetching: " + songId)
		await ytdl.getBasicInfo(url)
		console.log(TAG, "Found   : " + songId)
	} catch (e) {
		console.error(TAG, "Invalid YouTube ID")
		return reject("Invalid YouTube ID")
	}

	const youtubeStream = ytdl(url, {
		filter: "audioonly",
		quality: "highest"
	})

	console.log(TAG, "File creating...")
	converting.push(songId)
	youtubeStream
		.pipe(fs.createWriteStream(songsWritePath(songId)))
		.on("finish", () => {
			console.log(TAG, "Created File: " + songId)
			resolve(`/song/${songId}.mp3`)
			converting = converting.filter(i => i !== songId)
		})
		.on("error", err => {
			console.error(TAG, err)
			reject(`Error converting song on Server`)
			converting = converting.filter(i => i !== songId)
		})
})
