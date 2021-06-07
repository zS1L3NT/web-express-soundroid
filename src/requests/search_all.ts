import {search_youtube} from "../all";

/**
 * Endpoint to search for songs
 *
 * @param sendToClient
 * @param youtubeApi
 * @param args
 */
export default (
	sendToClient: (event: string, data: any) => void,
	youtubeApi: any,
	...args: any[]
) => {
	const [uuid, query] = args as string[]
	const TAG = "search_all[" + uuid + "]:"
	if (!uuid) return
	if (!query) return sendToClient("error_" + uuid, "Missing query")
	console.time(TAG)
	console.log(TAG)

	search_youtube(TAG, uuid, query, youtubeApi, sendToClient).then(() => console.timeEnd(TAG))
}
