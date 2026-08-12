import Player from "../components/Player";
import { Link, useParams, useLocation } from "react-router-dom";
import { songsArray } from "../assets/database/songs";
import { artistArray } from "../assets/database/artists";

const Song = () => {
  const { id } = useParams();
  const location = useLocation();
  const fromGlobalList = location.state?.fromGlobalList;

  const songObj = songsArray.find((currentSongObj) =>
    String(currentSongObj._id || currentSongObj.id) === String(id)
  );

  if (!songObj) {
    return <div className="song">Música não encontrada</div>;
  }

  const { image, name, duration, artist, audio } = songObj;
  // console.log(songObj);

  const artistObj = artistArray.filter(
    (currentArtistObj) => currentArtistObj.name === artist
  )[0];
  // console.log(artistObj);

  const songsArrayFromArtist = songsArray.filter(
    (currentSongObj) => currentSongObj.artist === artist
  );
  // console.log(songsArrayFromArtist);

  const playlistBase = fromGlobalList ? songsArray : songsArrayFromArtist;
  const playlist = playlistBase.some(
    (item) => String(item._id || item.id) === String(id)
  )
    ? playlistBase
    : songsArray;

  const randomIndex = songsArrayFromArtist.length > 0
    ? Math.floor(Math.random() * songsArrayFromArtist.length)
    : -1;
  const randomIndex2 = songsArrayFromArtist.length > 0
    ? Math.floor(Math.random() * songsArrayFromArtist.length)
    : -1;

  const randomIdFromArtist = randomIndex >= 0
    ? songsArrayFromArtist[randomIndex]._id || songsArrayFromArtist[randomIndex].id
    : null;
  const randomId2FromArtist = randomIndex2 >= 0
    ? songsArrayFromArtist[randomIndex2]._id || songsArrayFromArtist[randomIndex2].id
    : null;

  return (
    <div className="song">
      <div className="song__container">
        <div className="song__image-container">
          <img src={image} alt={`Imagem da música ${name}`} />
        </div>
      </div>

      <div className="song__bar">
        {artistObj ? (
          <Link to={`/artist/${artistObj._id || artistObj.id}`} className="song__artist-image">
            <img width={75} height={75} src={artistObj.image} alt={`Imagem do Artista ${artist}`} />
          </Link>
        ) : (
          <div className="song__artist-image">
            <img width={75} height={75} src={image} alt={`Imagem da música ${name}`} />
          </div>
        )}

        <Player
          duration={duration}
          randomIdFromArtist={randomIdFromArtist}
          randomId2FromArtist={randomId2FromArtist}
          audio={audio}
          playlist={playlist}
          currentId={id}
        />

        <div>
          <p className="song__name">{name}</p>
          <p>{artist}</p>
        </div>
      </div>
    </div>
  );
};

export default Song;
