interface Song {
	type: "Song"
	id: string
	title: string
	artiste: string
	cover: string
	colorHex: string
}

export default async (TAG: string, uuid: string, query: string, youtubeApi: any, sendToClient: (event: string, data: any) => void) => {
	try {
		const response: any = await youtubeApi.search(query, "song")
		const songs: Song[] = response.content.map((item: any) => ({
				type: "Song",
				id: item.videoId,
				title: item.name,
				artiste: Array.isArray(item.artist) ? item.artist.map((a: any) => a.name).join(", ") : item.artist.name,
				cover: `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`,
				colorHex: ""
			} as Song)
		)

		if (songs.length === 0) {
			console.log(TAG, "No songs???", query, response)
		}

		console.log(TAG, "Results: " + songs.length)
		sendToClient("search_result_" + uuid, songs)
	} catch (err) {
		console.error(TAG, err)
		sendToClient("error_" + uuid, "Error searching on server")
	}
}