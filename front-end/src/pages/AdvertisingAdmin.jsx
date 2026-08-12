import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdvertising } from "../advertising/AdvertisingContext";

const placements = [["home", "Início"], ["artists", "Artistas"], ["songs", "Músicas"], ["song", "Player"]];
const initialForm = { advertiser: "", title: "", description: "", link: "", imageUrl: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", placements: ["home"], active: true };

const AdvertisingAdmin = () => {
  const { campaigns, token, login, loadCampaigns, saveCampaign } = useAdvertising();
  const [form, setForm] = useState(initialForm);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => { if (token) loadCampaigns().catch((reason) => setError(reason.message)); }, [loadCampaigns, token]);

  const handleBanner = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("imageUrl", reader.result);
    reader.readAsDataURL(file);
  };
  const submitLogin = async (event) => {
    event.preventDefault(); setError("");
    try { const nextToken = await login(password); await loadCampaigns(nextToken); }
    catch (reason) { setError(reason.message); }
  };
  const submitCampaign = async (event) => {
    event.preventDefault(); setError("");
    try { await saveCampaign(form); setForm(initialForm); setMessage("Campanha cadastrada e pronta para veiculação."); }
    catch (reason) { setError(reason.message); }
  };
  const csv = () => {
    const rows = [["Anunciante", "Campanha", "Impressões", "Cliques", "CTR (%)"], ...campaigns.map((item) => [item.advertiser, item.title, item.impressions, item.clicks, item.impressions ? ((item.clicks / item.impressions) * 100).toFixed(2) : "0.00"])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "relatorio-publicidade.csv"; link.click(); URL.revokeObjectURL(url);
  };

  if (!token) return <main className="admin-page admin-login"><Link className="back-link" to="/">← Voltar para a plataforma</Link><form className="campaign-form" onSubmit={submitLogin}><h2>Área administrativa</h2><p>Informe a senha de administrador para gerenciar publicidade.</p><label>Senha<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button type="submit">Entrar</button>{error && <p className="error">{error}</p>}</form></main>;

  return <main className="admin-page"><Link className="back-link" to="/">← Voltar para a plataforma</Link><div className="admin-page__heading"><div><p className="eyebrow">MONETIZAÇÃO</p><h2>Publicidade</h2><p>Campanhas ativas aparecem primeiro; sem campanha contratada, o espaço usa o fallback AdMob.</p></div><button type="button" onClick={csv}>Baixar relatório CSV</button></div><section className="admin-grid"><form className="campaign-form" onSubmit={submitCampaign}><h3>Nova campanha</h3><label>Anunciante<input required value={form.advertiser} onChange={(event) => setField("advertiser", event.target.value)} /></label><label>Título do anúncio<input required value={form.title} onChange={(event) => setField("title", event.target.value)} /></label><label>Descrição<textarea required value={form.description} onChange={(event) => setField("description", event.target.value)} /></label><label>Link de destino<input required type="url" placeholder="https://" value={form.link} onChange={(event) => setField("link", event.target.value)} /></label><label>Banner (arquivo)<input required={!form.imageUrl} type="file" accept="image/*" onChange={handleBanner} /></label><label>ou URL do banner<input type="url" placeholder="https://" value={form.imageUrl.startsWith("data:") ? "Banner enviado" : form.imageUrl} onChange={(event) => setField("imageUrl", event.target.value)} /></label><div className="date-fields"><label>Início<input required type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} /></label><label>Fim<input required type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} /></label></div><fieldset><legend>Telas de exibição</legend>{placements.map(([value, label]) => <label className="checkbox" key={value}><input type="checkbox" checked={form.placements.includes(value)} onChange={() => setField("placements", form.placements.includes(value) ? form.placements.filter((item) => item !== value) : [...form.placements, value])} />{label}</label>)}</fieldset><label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setField("active", event.target.checked)} />Campanha ativa</label><button type="submit">Salvar campanha</button>{message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}</form><section className="campaign-report"><h3>Relatório de veiculação</h3>{campaigns.length === 0 ? <p>Nenhuma campanha contratada. Os espaços estão usando AdMob.</p> : <div className="campaign-table"><div className="campaign-table__head"><span>Campanha</span><span>Período</span><span>Impressões</span><span>Cliques</span><span>CTR</span></div>{campaigns.map((item) => <div className="campaign-table__row" key={item.id}><span><strong>{item.title}</strong><small>{item.advertiser}</small></span><span>{item.startDate} — {item.endDate}</span><span>{item.impressions}</span><span>{item.clicks}</span><span>{item.impressions ? ((item.clicks / item.impressions) * 100).toFixed(2) : "0.00"}%</span></div>)}</div>}</section></section></main>;
};
export default AdvertisingAdmin;
