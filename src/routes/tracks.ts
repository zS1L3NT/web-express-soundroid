import assert from "assert"
import { LIST, OBJECT, OR, STRING, UNDEFINED, validate } from "validate-any"

import { ytmusic } from "../apis"
import { logger } from "../app"
import getImageColor from "../functions/getImageColor"
import { RequestHandler } from "../functions/withErrorHandling"

export const POST: RequestHandler = async req => {
	const { success, errors, data } = validate(
		req.body,
		OBJECT({ artistId: OR(STRING(), UNDEFINED()), trackIds: OR(LIST(STRING()), UNDEFINED()) })
	)
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

	if (Object.keys(data).length !== 1) {
		logger.warn(req.rid, `Invalid request body, returning 400`, req.body)
		return {
			status: 400,
			data: {
				message: "Invalid body"
			}
		}
	}

	const trackIds: string[] = []

	if (data.trackIds) {
		trackIds.push(...data.trackIds)
		logger.log(req.rid, `Getting tracks from trackIds`, data.trackIds)
	}

	if (data.artistId) {
		const artist = await ytmusic.getArtist(data.artistId)
		trackIds.push(...artist.topSongs.map(song => song.videoId || ""))
		logger.log(req.rid, `Getting tracks from artistId`, data.artistId)
	}

	return {
		status: 200,
		data: await Promise.all(
			trackIds.map(async id => {
				const track = await ytmusic.getSong(id)
				return {
					trackId: track.videoId || "",
					title: track.name,
					thumbnail: track.thumbnails.at(-1)?.url || "",
					colorHex: await getImageColor(track.thumbnails.at(-1)?.url || "")
				}
			})
		)
	}
}
