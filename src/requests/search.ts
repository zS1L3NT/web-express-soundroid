import {color_thief, Playlist, Song} from "../all"
import {v4} from "uuid"

export default async (
	sendToClient: (event: string, tag: string, data: any) => void,
	youtubeApi: any,
	...args: any[]
) => {
	const [query] = args as string[]
	const TAG = "search[" + v4() + "]"
	if (!query) return sendToClient("error", query, "Missing query")
	console.time(TAG)
	console.log(TAG)

	Promise.allSettled([
		youtubeApi.search(query, "song"),
		youtubeApi.search(query, "album")
	]).then(async res => {
		if (res[0].status === "fulfilled" && res[1].status === "fulfilled") {
			const playlists_ = res[1].value.content.filter((a: any) => a.type === "album")
			const playlists = playlists_.slice(0, playlists_.length >= 5 ? 5 : playlists_.length)
			const songs_ = res[0].value.content
			const songs = songs_.slice(0, songs_.length >= 15 ? 15 : songs_.length)

			await Promise.all([...playlists.map((playlist: any) => new Promise(async resolve => {
				sendToClient("search_result", query, {
					type: "Playlist",
					id: playlist.browseId,
					name: playlist.name,
					cover: playlist.thumbnails[playlist.thumbnails.length - 1].url,
					colorHex: await color_thief(playlist.thumbnails[playlist.thumbnails.length - 1].url)
				} as Playlist)
				resolve(null)
			})), ...songs.map((song: any) => new Promise(async resolve => {
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

			sendToClient("search_done", query, null)
		}
		else {
			console.error(TAG, JSON.stringify(res, null, 2))
			sendToClient("error", query, "Error searching on server")
		}
		console.timeEnd(TAG)
	})


}