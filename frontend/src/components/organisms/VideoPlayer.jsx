export default function VideoPlayer({ video, onPlay }) {
  return (
    <div className="aspect-video w-full overflow-hidden bg-black sm:rounded-xl">
      <video
        key={video.id}
        src={video.video_url}
        poster={video.thumbnail_url}
        controls
        autoPlay
        playsInline
        preload="metadata"
        onPlay={onPlay}
        className="size-full"
      >
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  )
}
