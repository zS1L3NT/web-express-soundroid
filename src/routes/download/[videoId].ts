import ytdl from "ytdl-core"

import { RequestHandler } from "../../functions/withErrorHandling"

export const GET: RequestHandler = async req => {
	try {
		return {
			redirect: (await ytdl.getInfo(req.params.videoId!)).formats
				.filter(f => f.container === "webm")
				.filter(f => f.mimeType?.startsWith("audio"))
				.filter(f => f.audioBitrate !== undefined)
				.sort((a, b) => b.audioBitrate! - a.audioBitrate!)
				.at(0)?.url!
		}
	} catch {
		return {
			status: 400,
			data: {
				message: "Cannot get download link for this video"
			}
		}
	}
}
