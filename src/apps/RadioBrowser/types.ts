export interface RadioStation {
  stationuuid: string
  name: string
  url: string
  url_resolved?: string
  favicon?: string
  tags?: string
  country?: string
  countrycode: string
  state?: string
  language?: string
  codec?: string
  bitrate?: number
  lastcheckok?: 0 | 1
  hls?: 0 | 1
  clickcount?: number
  clicktrend?: number
  homepage?: string
  votes?: number
}

export interface Tag {
  name: string
  stationcount: string
}

export interface Country {
  name: string
  stationcount: string
  iso_3166_1: string
}

export interface ClickResponse {
  ok: string
  message: string
  stationuuid: string
  name: string
  url: string
}
