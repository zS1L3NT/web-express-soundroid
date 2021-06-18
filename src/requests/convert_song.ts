import path from "path"
import fs from "fs"
import ytdl from "ytdl-core"
import {v4} from "uuid"

const config = require("../../config.json")

const songsWritePath = (id: string) =>
	path.join(__dirname, "..", "..", "songs", id + ".mp3")

/**
 * Endpoint to convert or wait for a song
 *

 */
export default async (
	id: string
) => new Promise<string>(async (resolve, reject) => {
	const TAG = "convert_song[" + v4() + "]:"
	if (!id) return reject("Missing id")
	console.time(TAG)
	console.log(TAG)

	const url = "https://youtu.be/" + id
	try {
		console.log(TAG, "Fetching: " + id)
		await ytdl.getBasicInfo(url)
		console.log(TAG, "Found   : " + id)
	} catch (e) {
		console.error(TAG, "Invalid YouTube ID")
		console.timeEnd(TAG)
		return reject("Invalid YouTube ID")
	}

	const youtubeStream = ytdl(url, {
		filter: "audioonly",
		quality: "highest"
	})

	console.log("File creating...")
	youtubeStream
		.pipe(fs.createWriteStream(songsWritePath(id)))
		.on("finish", () => {
			console.log(TAG, "File created" + id)
			console.timeEnd(TAG)
			resolve(`${config.songs}/${id}.mp3`)
		})
		.on("error", err => {
			console.error(TAG, err)
			console.timeEnd(TAG)
			reject(`Error converting song on Server`)
		})
})
