import {color_thief, Song} from "../all"

export default async (TAG: string, id: any, youtubeApi: any) => {
	if (!id) throw new Error("Missing Playlist ID")

	console.log(TAG, "Playlist ID: " + id)

	const response = await youtubeApi.getAlbum(id)
	const promises: Promise<Song>[] = []

	for (let i = 0; i < response.tracks.length; i++) {
		const track = response.tracks[i]
		promises.push((async () => ({
			type: "Song",
			songId: track.videoId,
			title: track.name,
			artiste: track.artistNames,
			cover: track.thumbnails[track.thumbnails.length - 1].url,
			colorHex: await color_thief(track.thumbnails[track.thumbnails.length - 1].url),
			playlistId: id,
			userId: "",
			queries: getQueries(track.name)
		} as Song))())
	}
	return await Promise.all(promises)
}

const getQueries = (str: string) => {
	const queries: string[] = []
	for (let i = 0; i < str.length; i++) {
		queries.push(str.slice(0, i + 1).toLowerCase())
	}
	return queries
}