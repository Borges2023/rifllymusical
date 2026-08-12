import { useEffect, useMemo } from "react";
import { useAdvertising } from "../advertising/AdvertisingContext";

const BannerAd = ({ placement }) => {
  const { getAd, loadPlacement, recordImpression, recordClick } = useAdvertising();
  const ad = useMemo(() => getAd(placement), [getAd, placement]);

  useEffect(() => {
    loadPlacement(placement);
  }, [loadPlacement, placement]);

  useEffect(() => {
    recordImpression(ad.id);
  }, [ad.id, recordImpression]);

  return (
    <aside className="banner-ad" aria-label="Publicidade">
      <span className="banner-ad__label">{ad.source === "contracted" ? "Publicidade" : "Anúncio AdMob"}</span>
      <img src={ad.imageUrl || ad.logo} alt={`Anúncio de ${ad.advertiser || ad.title}`} />
      <div>
        <strong>{ad.title}</strong>
        <p>{ad.description}</p>
      </div>
      <a href={ad.link} target="_blank" rel="noopener noreferrer" onClick={() => recordClick(ad.id)}>Saiba mais</a>
    </aside>
  );
};

export default BannerAd;
