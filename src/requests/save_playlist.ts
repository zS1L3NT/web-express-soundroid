import {Playlist, playlist_songs} from "../all";
import admin from "firebase-admin"
import {v4} from "uuid";

export default async (TAG: string, firestore: admin.firestore.Firestore, youtubeApi: any, body: any) => {
	const playlist = body as Playlist

	console.log(TAG, "Data", playlist)
	const songs = await playlist_songs(`playlist_songs<${v4()}>`, playlist.id, youtubeApi)

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
			userId: playlist.userId,
			queries: getQueries(song.title)
		}))
	}
	promises.push(playlistDoc.set({
		colorHex: playlist.colorHex,
		cover: playlist.cover,
		id,
		name: playlist.name,
		userId: playlist.userId,
		order: songs.map(s => s.songId),
		queries: getQueries(playlist.name)
	} as Playlist))

	await Promise.allSettled(promises)
}

const getQueries = (str: string) => {
	const queries: string[] = []
	for (let i = 0; i < str.length; i++) {
		queries.push(str.slice(0, i + 1).toLowerCase())
	}
	return queries
}