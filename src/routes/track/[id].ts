import { ytmusic } from "../../apis"
import { data } from "../../functions/responses"
import { RequestHandler } from "../../functions/withErrorHandling"

export const GET: RequestHandler = async req => {
	const track = await ytmusic.getSong(req.params.id!)
	return data({
		id: track.videoId,
		title: track.name,
		artists: track.artists.map(artist => artist.name).join(", "),
		thumbnail: track.thumbnails.at(-1)?.url || ""
	})
}