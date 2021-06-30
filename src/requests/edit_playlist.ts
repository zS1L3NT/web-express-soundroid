import admin from "firebase-admin"
import {Playlist} from "../all";
import {v4} from "uuid";
import {compareLists} from "compare-lists";

export default async (firestore: admin.firestore.Firestore, body: any) => {
	const playlist = body as Playlist
	const songsColl = firestore.collection("songs")

	const TAG = "edit_playlist[" + v4() + "]:"
	console.time(TAG)
	console.log(TAG, "Data", playlist)

	let snap
	try {
		snap = await firestore
			.collection("playlists")
			.doc(playlist.id)
			.get()
	} catch (e) {
		console.timeEnd(TAG)
		throw e
	}

	if (!snap.exists) {
		console.timeEnd(TAG)
		console.log(TAG, "Cannot find playlist document in database")
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
	console.timeEnd(TAG)
}