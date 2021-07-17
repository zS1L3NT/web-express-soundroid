import admin from "firebase-admin"
import {color_thief, Spotify} from "../all";

export default async (
	TAG: string,
	firestore: admin.firestore.Firestore,
	youtubeApi: any,
	body: any,
	importing: { [userId: string]: string },
	respond: () => void
) => {
	const {url, userId} = body as { url: string, userId: string }
	const link = new URL(url)
	const spotify = new Spotify()

	if (link.host === "open.spotify.com") {
		const playlistId = link.pathname.match(/^\/playlist\/(.*)/)?.[1]
		const albumId = link.pathname.match(/^\/album\/(.*)/)?.[1]
		const firestoreId = firestore.collection("playlists").doc().id

		const queries: string[] = []
		if (!playlistId && !albumId) {
			console.error(TAG, "Spotify URL does not reference a playlist")
			throw new Error("Spotify URL does not reference a playlist")
		}

		if (importing[userId]) {
			console.error("User is already importing a playlist!")
			throw new Error("User is already importing a playlist!")
		}
		importing[userId] = firestoreId

		if (playlistId) {
			console.log(TAG, "Spotify Playlist ID    : ", playlistId)
			const playlist = await spotify.getPlaylist(playlistId)
			const tracks = playlist.tracks.items
			console.log(TAG, "Spotify Playlist Tracks: ", tracks.length)

			for (let i = 0; i < tracks.length; i++) {
				const track = tracks[i].track
				queries.push(`${track?.name || ""} ${track?.artists[0]?.name || ""} ${track?.album?.name || ""}`)
			}

			await firestore.collection("playlists").doc(firestoreId).set({
				colorHex: await color_thief(playlist.images[0]?.url || ""),
				cover: playlist.images[0]?.url || "",
				id: firestoreId,
				name: playlist.name,
				order: [],
				queries: getQueries(playlist.name),
				userId
			})
		}

		if (albumId) {
			console.log(TAG, "Spotify Album ID    : ", albumId)
			const album = await spotify.getAlbum(albumId)
			const tracks = album.tracks.items
			console.log(TAG, "Spotify Album Tracks: ", tracks.length)

			for (let i = 0; i < tracks.length; i++) {
				const track = tracks[i]
				queries.push(`${track?.name || ""} ${track?.artists[0]?.name || ""} ${track?.album?.name || ""}`)
			}

			await firestore.collection("playlists").doc(firestoreId).set({
				colorHex: await color_thief(album.images[0]?.url || ""),
				cover: album.images[0]?.url || "",
				id: firestoreId,
				name: album.name,
				order: [],
				queries: getQueries(album.name),
				userId
			})
		}

		respond()

		const order: string[] = []
		for (let i = 0; i < queries.length; i++) {
			const query = queries[i]
			const results = await youtubeApi.search(query, "song")
			const data = results.content[0]

			order.push(data.videoId)
			const song = {
				artiste: data?.artist?.name || "",
				colorHex: await color_thief(`https://i.ytimg.com/vi/${data.videoId}/maxresdefault.jpg`),
				cover: `https://i.ytimg.com/vi/${data.videoId}/maxresdefault.jpg`,
				playlistId: firestoreId,
				queries: getQueries(data.name),
				songId: data.videoId,
				title: data.name,
				userId
			}

			console.log(TAG, "Song: ", song.songId)

			await firestore.collection("songs").add(song)
			await firestore.collection("playlists").doc(firestoreId).update({
				order
			})
		}
	} else {
		console.error(TAG, "URL does not reference a playlist")
		throw new Error("URL does not reference a playlist")
	}
}

const getQueries = (str: string) => {
	const queries: string[] = []
	for (let i = 0; i < str.length; i++) {
		queries.push(str.slice(0, i + 1).toLowerCase())
	}
	return queries
}