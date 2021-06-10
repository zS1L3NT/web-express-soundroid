export {default as convert_song} from "./requests/convert_song"
export {default as playlist_lookup} from "./requests/playlist_lookup"
export {default as search} from "./requests/search"
export {default as color_thief} from "./color_thief"

export interface Song {
	type: "Song"
	id: string
	title: string
	artiste: string
	cover: string
	colorHex: string
}

export interface Playlist {
	type: "Playlist"
	id: string
	name: string
	cover: string
	order: string[]
	colorHex: string
}