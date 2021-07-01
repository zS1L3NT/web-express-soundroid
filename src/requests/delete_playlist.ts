import admin from "firebase-admin"

export default async (TAG: string, firestore: admin.firestore.Firestore, playlistId: string) => {
	const playlistDoc = firestore.collection("playlists").doc(playlistId);
	const songsColl = firestore.collection("songs")

	console.log(TAG, `Playlist`, playlistId)
	const promises: Promise<any>[] = []

	songsColl
		.where("playlistId", "==", playlistId)
		.get()
		.then(snaps => snaps.forEach(snap => {
			promises.push(songsColl.doc(snap.id).delete())
		}))

	await Promise.allSettled(promises)
	await playlistDoc.delete()
}