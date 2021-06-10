import {color_thief, Song} from "../all"
import {v4} from "uuid"

export default async (
	sendToClient: (event: string, tag: string, data: any) => void,
	youtubeApi: any,
	...args: any[]
) => {
	const [id] = args as string[]
	const TAG = "playlist_lookup[" + v4() + "]:"
	if (!id) return sendToClient("error", id, "Missing id")
	console.time(TAG)
	console.log(TAG)

	const songs: Song[] = []
	try {
		const response = await youtubeApi.getAlbum(id)

		for (let i = 0; i < response.tracks.length; i++) {
			const song = response.tracks[i]
			songs.push({
				type: "Song",
				id: song.videoId,
				title: song.name,
				artiste: song.artistNames,
				cover: song.thumbnails[song.thumbnails.length - 1].url,
				colorHex: await color_thief(song.thumbnails[song.thumbnails.length - 1].url)
			})
		}

		console.log(TAG, "Playlist songs: " + songs.length)
	} catch (err) {
		console.error(TAG, err)
		sendToClient("error", id, "Error searching on server")
		return
	}

	sendToClient("playlist_lookup", id, songs)
	console.timeEnd(TAG)
}