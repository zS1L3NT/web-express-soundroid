import assert from "assert"
import getImageColor from "../../functions/getImageColor"
import { cache, logger } from "../../app"
import { OBJECT, STRING, validate } from "validate-any"
import { RequestHandler } from "../../functions/withErrorHandling"

export const POST: RequestHandler = async req => {
	const { success, errors, data } = validate(req.body, OBJECT({ trackId: STRING() }))
	if (!success) {
		logger.warn(req.rid, `Invalid request body, returning 400`, req.body)
		return {
			status: 400,
			data: {
				errors
			}
		}
	}
	assert(data!)

	logger.log(req.rid, `Getting track from trackId`, data.trackId)
	const track = await cache.ytmusic_api.getSong(data.trackId)
	return {
		status: 200,
		data: {
			trackId: track.videoId || "",
			title: track.name,
			thumbnail: track.thumbnails.at(-1)?.url || "",
			colorHex: await getImageColor(track.thumbnails.at(-1)?.url || "")
		}
	}
}