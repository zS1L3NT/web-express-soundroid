import path from "path"
import fs from "fs"
import ytdl from "ytdl-core"
import {convert_song} from "../all"

let converting: { highest: string[], lowest: string[] } = {
	highest: [],
	lowest: []
}

export default async (TAG: string, songId: string, quality: "highest" | "lowest") => new Promise<string>(async (resolve, reject) => {
	if (!songId) return reject("Missing id")

	console.log(TAG, `Song`, songId)

	if (converting[quality].includes(songId)) {
		console.log(TAG, "Converting already, waiting for file...")
		await new Promise(res => setTimeout(res, 1000))
		resolve(await convert_song(TAG, songId, quality))
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
		quality
	})

	console.log(TAG, "File creating...")
	converting[quality].push(songId)
	youtubeStream
		.pipe(fs.createWriteStream(path.join(__dirname, "..", "..", "song", quality, songId + ".mp3")))
		.on("finish", () => {
			console.log(TAG, "Created File: " + songId)
			resolve(`/song/${quality}/${songId}.mp3`)
			converting[quality] = converting[quality].filter(i => i !== songId)
		})
		.on("error", err => {
			console.error(TAG, err)
			reject(`Error converting song on Server`)
			converting[quality] = converting[quality].filter(i => i !== songId)
		})
})
