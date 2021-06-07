const ColorThief = require("colorthief")

export default async (
	sendToClient: (event: string, data: any) => void,
	...args: any[]
) => {
	const [uuid, url] = args as string[]
	const TAG = "cover_color[" + uuid + "]:"
	if (!uuid) return
	if (!url) return sendToClient("error_" + uuid, "Missing url")
	console.time(TAG)
	console.log(TAG)

	try {
		const [r, g, b] = await ColorThief.getColor(url) as number[]

		let rs = r.toString(16)
		let gs = g.toString(16)
		let bs = b.toString(16)

		if (rs.length == 1) rs = "0" + rs
		if (gs.length == 1) gs = "0" + gs
		if (bs.length == 1) bs = "0" + bs

		sendToClient("cover_color_result_" + uuid, "#" + rs + gs + bs)
	} catch (err) {
		console.error(TAG, err)
		sendToClient("error_" + uuid, "Error fetching image dominant color")
	}
	console.timeEnd(TAG)
}