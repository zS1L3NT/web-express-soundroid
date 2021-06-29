import admin from "firebase-admin"
import {v4} from "uuid";

export default async (firestore: admin.firestore.Firestore, playlist_id: string) => {
	const playlistDoc = firestore.collection("playlists").doc(playlist_id);
	const songsColl = firestore.collection("songs")

	const TAG = "delete_playlist[" + v4() + "]:"
	console.time(TAG)
	console.log(TAG, `Playlist ID: ${playlist_id}`)
	const promises: Promise<any>[] = []

	songsColl
		.where("playlistId", "==", playlist_id)
		.get()
		.then(snaps => snaps.forEach(snap => {
			promises.push(songsColl.doc(snap.id).delete())
		}))

	try {
		await Promise.allSettled(promises)
		await playlistDoc.delete()
		console.timeEnd(TAG)
	} catch (e) {
		console.timeEnd(TAG)
		throw e
	}

}