import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { adsArray } from "../assets/database/ads";

const AdvertisingContext = createContext(null);
const apiUrl = import.meta.env.VITE_API_URL || "/api";
const tokenKey = "riffly-admin-token";

const fallback = (placement) => ({ ...adsArray[0], id: `admob-${placement}`, source: "admob", advertiser: "Google AdMob" });
const request = async (path, options = {}, token) => {
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não foi possível concluir a operação.");
  return response.status === 204 ? null : response.json();
};

export const AdvertisingProvider = ({ children }) => {
  const [activeAds, setActiveAds] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey));

  const loadPlacement = useCallback(async (placement) => {
    try {
      const campaign = await request(`/advertising/active?placement=${placement}`);
      setActiveAds((current) => ({ ...current, [placement]: campaign ? { ...campaign, source: "contracted" } : fallback(placement) }));
    } catch { setActiveAds((current) => ({ ...current, [placement]: fallback(placement) })); }
  }, []);
  const getAd = useCallback((placement) => activeAds[placement] || fallback(placement), [activeAds]);
  const record = useCallback((id, metric) => {
    if (id.startsWith("admob-")) return;
    fetch(`${apiUrl}/advertising/${id}/${metric}`, { method: "POST", keepalive: true }).catch(() => {});
  }, []);
  const login = useCallback(async (password) => {
    const { token: nextToken } = await request("/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    sessionStorage.setItem(tokenKey, nextToken); setToken(nextToken); return nextToken;
  }, []);
  const loadCampaigns = useCallback(async (currentToken = token) => {
    if (!currentToken) return [];
    const nextCampaigns = await request("/admin/advertising/campaigns", {}, currentToken);
    setCampaigns(nextCampaigns); return nextCampaigns;
  }, [token]);
  const saveCampaign = useCallback(async (campaign) => {
    const saved = await request("/admin/advertising/campaigns", { method: "POST", body: JSON.stringify(campaign) }, token);
    setCampaigns((current) => [saved, ...current]);
    saved.placements.forEach(loadPlacement);
    return saved;
  }, [loadPlacement, token]);

  const value = useMemo(() => ({ campaigns, token, login, loadCampaigns, saveCampaign, loadPlacement, getAd, recordImpression: (id) => record(id, "impressions"), recordClick: (id) => record(id, "clicks") }), [campaigns, getAd, loadCampaigns, loadPlacement, login, record, saveCampaign, token]);
  return <AdvertisingContext.Provider value={value}>{children}</AdvertisingContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdvertising = () => useContext(AdvertisingContext);
