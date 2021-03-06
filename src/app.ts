import "dotenv/config"

import express from "express"
import fs from "fs"
import path from "path"

import { iRoute } from "./setup"

const app = express()
const PORT = process.env.PORT || 5190

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

const readRouteFolder = (folderName: string) => {
	const folderPath = path.join(__dirname, "routes", folderName)

	for (const entityName of fs.readdirSync(folderPath)) {
		const [fileName, extensionName] = entityName.split(".")
		const pathName = `${folderName}/${fileName}`

		if (extensionName) {
			// Entity is a file
			const file = require(path.join(folderPath, entityName)) as Record<string, iRoute>
			for (const [method, Route] of Object.entries(file)) {
				app[method.toLowerCase() as "get" | "post" | "put" | "delete"](
					"/api" + pathName.replace(/\[(\w+)\]/g, ":$1"),
					(req, res) => new Route(req, res).setup()
				)
			}
		} else {
			readRouteFolder(pathName)
		}
	}
}

readRouteFolder("")

app.get("/open", (req,res) => {
	const url = new URL("sdd://soundroid.zectan.com")
	url.searchParams.set("mode", encodeURIComponent((req.query.mode as string | undefined) ?? ""))
	url.searchParams.set("code", encodeURIComponent((req.query.oobCode as string | undefined) ?? ""))
	res.redirect(url.href)
})

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
