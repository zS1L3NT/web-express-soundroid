import assert from "assert"
import { cache } from "../../app"
import { OBJECT, STRING, validate } from "validate-any"
import { Request } from "express"
import { RequestHandler } from "../../functions/withErrorHandling"

export const POST: RequestHandler = async (req: Request) => {
	const { success, data, errors } = validate(req.body, OBJECT({ artistId: STRING() }))
	if (!success) {
		return {
			status: 400,
			data: {
				errors
			}
		}
	}
	assert(data!)

	const artist = await cache.ytmusic_api.getArtist(data.artistId)
	return {
		status: 200,
		data: {
			artistId: artist.artistId,
			name: artist.name,
			thumbnail: artist.thumbnails.at(-1)?.url || "",
			description: artist.description || ""
		}
	}
}
