export interface ChannelPlaylist {
  url: string
  format: string
  quality: string
}

export interface Channel {
  id: string
  title: string
  description: string
  genre: string
  image: string
  largeimage: string
  listeners: string
  lastPlaying: string
  playlists: ChannelPlaylist[]
}
