import {color_thief, Playlist, Song} from "../all"
import {v4} from "uuid"

/**
 * Endpoint to search the API for song results
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
	const [query] = args as string[]
	const TAG = "search[" + v4() + "]"
	if (!query) return sendToClient("error", query, "Missing query")
	console.time(TAG)
	console.log(TAG, "Search: " + query)

	const destroy = () => {
		console.log(TAG, "disconnect")
		console.timeEnd(TAG)
	}

	Promise.allSettled([
		youtubeApi.search(query, "song"),
		youtubeApi.search(query, "album")
	]).then(async res => {
		if (inactive()) return destroy()
		if (res[0].status === "fulfilled" && res[1].status === "fulfilled") {
			const playlists_ = res[1].value.content.filter((a: any) => a.type === "album")
			const playlists = playlists_.slice(0, playlists_.length >= 5 ? 5 : playlists_.length)
			const songs_ = res[0].value.content
			const songs = songs_.slice(0, songs_.length >= 15 ? 15 : songs_.length)

			await Promise.allSettled(
				[
					...playlists.map((playlist: any) => new Promise(async (resolve, reject) => {
						if (inactive()) return reject(null)
						sendToClient("search_result", query, {
							type: "Playlist",
							id: playlist.browseId,
							name: playlist.name,
							cover: playlist.thumbnails[playlist.thumbnails.length - 1].url,
							colorHex: await color_thief(playlist.thumbnails[playlist.thumbnails.length - 1].url)
						} as Playlist)
						resolve(null)
					})), ...songs.map((song: any) => new Promise(async (resolve, reject) => {
					if (inactive()) return reject(null)
					sendToClient("search_result", query, {
						type: "Song",
						id: song.videoId,
						title: song.name,
						artiste: Array.isArray(song.artist) ? song.artist.map((a: any) => a.name).join(", ") : song.artist.name,
						cover: `https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`,
						colorHex: await color_thief(`https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`)
					} as Song)
					resolve(null)
				}))])

			if (inactive()) return destroy()
			sendToClient("search_done", query, null)
		}
		else {
			console.error(TAG, JSON.stringify(res, null, 2))
			sendToClient("error", query, "Error searching on server")
		}
		console.timeEnd(TAG)
	})


}