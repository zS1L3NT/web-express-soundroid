import path from "path"
import fs from "fs"
import ytdl from "ytdl-core"
import {v4} from "uuid"
import {convert_song} from "../all";

const songsWritePath = (id: string) =>
	path.join(__dirname, "..", "..", "song", id + ".mp3")

let converting: string[] = []

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

	if (converting.includes(id)) {
		console.log(TAG, "Converting already, waiting for file...")
		await new Promise(res => setTimeout(res, 1000))
		resolve(await convert_song(id))
		return
	}

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

	console.log(TAG, "File creating...")
	converting.push(id)
	youtubeStream
		.pipe(fs.createWriteStream(songsWritePath(id)))
		.on("finish", () => {
			console.log(TAG, "Created File: " + id)
			console.timeEnd(TAG)
			resolve(`/song/${id}.mp3`)
			converting = converting.filter(i => i !== id)
		})
		.on("error", err => {
			console.error(TAG, err)
			console.timeEnd(TAG)
			reject(`Error converting song on Server`)
			converting = converting.filter(i => i !== id)
		})
})
