import type { Channel } from '../types'
import { MediaCard } from '../../../framework/components/MediaCard'
import { GfBadge } from '../../../framework/components/Badge'
import { GfIcon } from '../../../framework/iconSystem'

interface ChannelListProps {
  channels: Channel[]
  playingId: string | null
  isLoading: boolean
  favorites: string[]
  onPlay: (channel: Channel) => void
  onToggleFavorite: (id: string) => void
}

export function ChannelList({
  channels,
  playingId,
  isLoading,
  favorites,
  onPlay,
  onToggleFavorite,
}: ChannelListProps) {
  return (
    <div className="gf-somafm__grid">
      {channels.map((channel, i) => (
        <MediaCard
          key={channel.id}
          id={channel.id}
          index={i}
          image={channel.image}
          title={channel.title}
          description={channel.description}
          metadata={
            <>
              <GfBadge variant="listeners">
                <GfIcon name="headphones" size={10} />
                {channel.listeners >= 1000
                  ? `${(channel.listeners / 1000).toFixed(1)}k`
                  : channel.listeners}
              </GfBadge>
              <span className="gf-somafm__genre">{channel.genre.split('|')[0]}</span>
            </>
          }
          nowPlaying={channel.lastPlaying}
          isPlaying={playingId === channel.id}
          isLoading={isLoading && playingId === channel.id}
          isFavorite={favorites.includes(channel.id)}
          onPlay={() => onPlay(channel)}
          onFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
