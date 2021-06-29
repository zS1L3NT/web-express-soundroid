import {Playlist, playlist_songs} from "../all";
import admin from "firebase-admin"
import {v4} from "uuid";

export default async (firestore: admin.firestore.Firestore, youtubeApi: any, body: any) => {
	const {info: playlist, user_id} = body as { info: Playlist, user_id: string }

	const TAG = "save_playlist[" + v4() + "]:"
	console.time(TAG)
	console.log(TAG, "Data", user_id, playlist)
	const songs = await playlist_songs(playlist.id, youtubeApi)

	const playlistColl = firestore.collection("playlists")
	const songsColl = firestore.collection("songs")
	const id = playlistColl.doc().id
	const playlistDoc = playlistColl.doc(id)
	const promises: Promise<any>[] = []

	for (let i = 0; i < songs.length; i++) {
		const song = songs[i]
		promises.push(songsColl.add({
			artiste: song.artiste,
			colorHex: song.colorHex,
			cover: song.cover,
			songId: song.songId,
			title: song.title,
			playlistId: id,
			userId: user_id,
			queries: getQueries(song.title)
		}))
	}
	promises.push(playlistDoc.set({
		colorHex: playlist.colorHex,
		cover: playlist.cover,
		id,
		name: playlist.name,
		userId: user_id,
		order: songs.map(s => s.songId),
		queries: getQueries(playlist.name)
	} as Playlist))

	try {
		await Promise.allSettled(promises)
		console.timeEnd(TAG)
	} catch (e) {
		console.timeEnd(TAG)
		throw e
	}
}

const getQueries = (str: string) => {
	const queries: string[] = []
	for (let i = 0; i < str.length; i++) {
		queries.push(str.slice(0, i + 1).toLowerCase())
	}
	return queries
}