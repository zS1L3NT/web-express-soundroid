import admin from "firebase-admin"
import {color_thief, Playlist} from "../all";
import {compareLists} from "compare-lists";

export default async (TAG: string, firestore: admin.firestore.Firestore, body: any) => {
	const newPlaylist = body as Playlist
	const songsColl = firestore.collection("songs")

	console.log(TAG, "Data", newPlaylist)

	const snap = await firestore
		.collection("playlists")
		.doc(newPlaylist.id)
		.get()

	if (!snap.exists) {
		console.log(TAG, "Document not found in database")
		throw new Error("Document not found in database")
	}
	const oldPlaylist = snap.data() as Playlist

	const report = compareLists({
		left: oldPlaylist.order.slice().sort(),
		right: newPlaylist.order.slice().sort(),
		compare: (left, right) => left.localeCompare(right),
		returnReport: true
	})

	const promises: Promise<any>[] = report.missingInRight.map(async songId => {
		const snaps = await songsColl
			.where("playlistId", "==", newPlaylist.id)
			.where("songId", "==", songId)
			.get()

		if (!snaps.empty) {
			console.log(TAG, `Deleted song ${songId}`)
			await songsColl.doc(snaps.docs[0].id).delete()
		}
	})

	if (oldPlaylist.cover !== newPlaylist.cover) {
		newPlaylist.colorHex = await color_thief(newPlaylist.cover)
	}

	await firestore
		.collection("playlists")
		.doc(newPlaylist.id)
		.set(newPlaylist)

	await Promise.allSettled(promises)
}