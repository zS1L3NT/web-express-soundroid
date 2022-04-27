import "dotenv/config"

import colors from "colors"
import express from "express"
import fs from "fs"
import path from "path"
import Tracer from "tracer"

import withErrorHandling from "./functions/withErrorHandling"

const app = express()
const PORT = 5190

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

const readRouteFolder = (folderName: string) => {
	const folderPath = path.join(__dirname, "routes", folderName)

	for (const entityName of fs.readdirSync(folderPath)) {
		const [fileName, extensionName] = entityName.split(".")
		const pathName = `${folderName}/${fileName}`

		if (extensionName) {
			// Entity is a file
			const file = require(path.join(folderPath, entityName)) as Record<any, any>
			for (const [method, handler] of Object.entries(file)) {
				app[method.toLowerCase() as "get" | "post" | "put" | "delete"](
					pathName.replace(/\[(\w+)\]/g, ":$1"),
					withErrorHandling(handler)
				)
			}
		} else {
			readRouteFolder(pathName)
		}
	}
}

readRouteFolder("")

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))

export const logger = Tracer.colorConsole({
	level: process.env.LOG_LEVEL || "log",
	format: "[{{timestamp}}] <{{path}}, Line {{line}}> {{message}}",
	methods: ["log", "http", "debug", "info", "warn", "error"],
	dateformat: "dd mmm yyyy, hh:MM:sstt",
	filters: {
		log: colors.gray,
		//@ts-ignore
		http: colors.cyan,
		debug: colors.blue,
		info: colors.green,
		warn: colors.yellow,
		error: [colors.red, colors.bold]
	},
	preprocess: data => {
		data.path = data.path.split("\\src\\")[1]!.replaceAll("\\", "/")
	}
})
