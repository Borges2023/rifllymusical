import { Link, useLocation } from "react-router-dom";

const SongItem = ({ image, name, duration, _id, id, index }) => {
  const location = useLocation();
  const isGlobalList = ["/", "/songs"].includes(location.pathname);
  const songId = _id ?? id;

  const minutesCount = Number(duration?.split(":")[0] || 0);

  return (
    <Link
      to={`/song/${songId}`}
      state={{ fromGlobalList: isGlobalList }}
      className="song-item"
    >
      <div className="song-item__number-album">
        <p>{index + 1}</p>

        <div className="song-item__album">
          <img
            src={image}
            alt={`Imagem da Música ${name}`}
            className="song-item__image"
          />

          <p className="song-item__name">{name}</p>
        </div>
      </div>

      <div className="song-item__duration">
        <p>{duration}</p>
        <p>{minutesCount} min</p>
      </div>
    </Link>
  );
};

export default SongItem;
