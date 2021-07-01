import admin from "firebase-admin"
import {Playlist} from "../all";
import {compareLists} from "compare-lists";

export default async (TAG: string, firestore: admin.firestore.Firestore, body: any) => {
	const playlist = body as Playlist
	const songsColl = firestore.collection("songs")

	console.log(TAG, "Data", playlist)

	const snap = await firestore
		.collection("playlists")
		.doc(playlist.id)
		.get()

	if (!snap.exists) {
		console.log(TAG, "Document not found in database")
		throw new Error("Document not found in database")
	}
	const data = snap.data() as Playlist

	const report = compareLists({
		left: data.order.slice().sort(),
		right: playlist.order.slice().sort(),
		compare: (left, right) => left.localeCompare(right),
		returnReport: true
	})

	const promises: Promise<any>[] = report.missingInRight.map(async songId => {
		const snaps = await songsColl
			.where("playlistId", "==", playlist.id)
			.where("songId", "==", songId)
			.get()

		if (!snaps.empty) {
			console.log(TAG, `Deleted song ${songId}`)
			await songsColl.doc(snaps.docs[0].id).delete()
		}
	})

	await firestore
		.collection("playlists")
		.doc(playlist.id)
		.set(playlist)

	await Promise.allSettled(promises)
}