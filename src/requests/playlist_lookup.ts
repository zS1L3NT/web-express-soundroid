import {color_thief, Song} from "../all"
import {v4} from "uuid"

/**
 * Endpoint to get more details from the playlist
 *
 * @param sendToClient
 * @param inactive
 * @param youtubeApi
 * @param args
 */
export default async (
	sendToClient: (event: string, tag: string, data: any) => void,
	inactive: () => boolean,
	youtubeApi: any,
	...args: any[]
) => {
	const [id] = args as string[]
	const TAG = "playlist_lookup[" + v4() + "]:"
	if (!id) return sendToClient("error", id, "Missing id")
	console.time(TAG)
	console.log(TAG, "Playlist ID: " + id)

	const destroy = () => {
		console.log(TAG, "disconnected")
		console.timeEnd(TAG)
	}

	try {
		const response = await youtubeApi.getAlbum(id)
		if (inactive()) return destroy()

		const songs: Song[] = []
		for (let i = 0; i < response.tracks.length; i++) {
			const track = response.tracks[i]
			const song: Song = {
				type: "Song",
				id: track.videoId,
				title: track.name,
				artiste: track.artistNames,
				cover: track.thumbnails[track.thumbnails.length - 1].url,
				colorHex: await color_thief(track.thumbnails[track.thumbnails.length - 1].url)
			}
			songs.push(song)
			sendToClient("playlist_item", id, song)
			if (inactive()) return destroy()
		}

		sendToClient("playlist_lookup", id, songs)
	} catch (err) {
		if (inactive()) return destroy()
		console.error(TAG, err)
		sendToClient("error", id, "Error searching on server")
		return
	}

	console.timeEnd(TAG)
}