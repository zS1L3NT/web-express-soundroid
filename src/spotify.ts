import SpotifyWebApi from "spotify-web-api-node"

export default class Spotify {
	private spotifyApi: SpotifyWebApi

	public constructor() {
		this.spotifyApi = new SpotifyWebApi(require("../config.json").spotify)
	}

	public async authenticate() {
		const data = await this.spotifyApi.clientCredentialsGrant()
		this.spotifyApi.setAccessToken(data.body.access_token)
	}

	public async getPlaylist(playlistId: string) {
		try {
			return (await this.spotifyApi.getPlaylist(playlistId)).body
		} catch (e) {
			if (e.body.error.status === 401) {
				await this.authenticate()
				return await this.getPlaylist(playlistId)
			}
		}
	}

	public async getAlbum(albumId: string) {
		try {
			return (await this.spotifyApi.getAlbum(albumId)).body
		} catch (e) {
			if (e.body.error.status === 401) {
				await this.authenticate()
				return await this.getAlbum(albumId)
			}
		}
	}
}