import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Campaigns.css";

const emptyForm = {
  name: "",
  platform: "META_ADS",
  objective: "GERAR_LEADS",
  status: "RASCUNHO",
  budget: "",
  spent: "",
  commissionGenerated: "",
  revenueGenerated: "",
  propertyId: "",
  startDate: "",
  endDate: "",
  externalCampaignId: "",
  notes: ""
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [campaignsRes, propertiesRes] = await Promise.all([
        api.get("/traffic/campaigns"),
        api.get("/properties")
      ]);
      setCampaigns(campaignsRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => campaigns.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.name, item.platform, item.property?.title, item.property?.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
  }), [campaigns, search]);

  function change(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      platform: item.platform || "META_ADS",
      objective: item.objective || "GERAR_LEADS",
      status: item.status || "RASCUNHO",
      budget: item.budget ?? "",
      spent: item.spent ?? "",
      commissionGenerated: item.commissionGenerated ?? "",
      revenueGenerated: item.revenueGenerated ?? "",
      propertyId: item.propertyId || "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      externalCampaignId: item.externalCampaignId || "",
      notes: item.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (editingId) await api.patch(`/traffic/campaigns/${editingId}`, form);
      else await api.post("/traffic/campaigns", form);
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar campanha.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(item) {
    if (!window.confirm(`Arquivar a campanha "${item.name}"?`)) return;
    try {
      await api.patch(`/traffic/campaigns/${item.id}`, { status: "ARQUIVADA" });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao arquivar campanha.");
    }
  }

  return (
    <div className="campaign-page">
      <div className="campaign-header">
        <div><span>MARKETING</span><h1>Campanhas</h1><p>Cadastre a mídia paga e vincule cada campanha aos imóveis da JB.</p></div>
      </div>

      {error && <div className="campaign-error">{error}</div>}

      <form className="campaign-form" onSubmit={save}>
        <div className="campaign-form-top"><h2>{editingId ? "Editar campanha" : "Nova campanha"}</h2>{editingId && <button type="button" className="campaign-cancel" onClick={reset}>Cancelar edição</button>}</div>
        <div className="campaign-form-grid">
          <Field label="Nome da campanha *"><input name="name" value={form.name} onChange={change} required placeholder="Ex.: AP Cidade Tiradentes - Outubro" /></Field>
          <Field label="Plataforma"><select name="platform" value={form.platform} onChange={change}><option value="META_ADS">Meta Ads</option><option value="GOOGLE_ADS">Google Ads</option><option value="INSTAGRAM">Instagram</option><option value="FACEBOOK">Facebook</option><option value="OUTRO">Outro</option></select></Field>
          <Field label="Objetivo"><select name="objective" value={form.objective} onChange={change}><option value="GERAR_LEADS">Gerar leads</option><option value="WHATSAPP">WhatsApp</option><option value="TRAFEGO_SITE">Tráfego para o site</option><option value="REMARKETING">Remarketing</option><option value="VENDA">Venda</option></select></Field>
          <Field label="Status"><select name="status" value={form.status} onChange={change}><option value="RASCUNHO">Rascunho</option><option value="ATIVA">Ativa</option><option value="PAUSADA">Pausada</option><option value="FINALIZADA">Finalizada</option><option value="ARQUIVADA">Arquivada</option></select></Field>
          <Field label="Imóvel"><select name="propertyId" value={form.propertyId} onChange={change}><option value="">Sem imóvel específico</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ""}{p.title}</option>)}</select></Field>
          <Field label="ID da campanha no Meta/Google"><input name="externalCampaignId" value={form.externalCampaignId} onChange={change} placeholder="Será útil na integração automática" /></Field>
          <Field label="Orçamento"><input type="number" min="0" step="0.01" name="budget" value={form.budget} onChange={change} placeholder="0,00" /></Field>
          <Field label="Gasto real"><input type="number" min="0" step="0.01" name="spent" value={form.spent} onChange={change} placeholder="0,00" /></Field>
          <Field label="Comissão gerada"><input type="number" min="0" step="0.01" name="commissionGenerated" value={form.commissionGenerated} onChange={change} placeholder="0,00" /></Field>
          <Field label="Valor de vendas gerado"><input type="number" min="0" step="0.01" name="revenueGenerated" value={form.revenueGenerated} onChange={change} placeholder="0,00" /></Field>
          <Field label="Início"><input type="date" name="startDate" value={form.startDate} onChange={change} /></Field>
          <Field label="Fim"><input type="date" name="endDate" value={form.endDate} onChange={change} /></Field>
          <Field label="Observações" wide><textarea name="notes" value={form.notes} onChange={change} rows="3" placeholder="Criativo, público, estratégia, observações..." /></Field>
        </div>
        <div className="campaign-form-actions"><button disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar campanha"}</button></div>
      </form>

      <section className="campaign-list-panel">
        <div className="campaign-list-head"><div><h2>Campanhas cadastradas</h2><p>{campaigns.length} campanha(s)</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar campanha ou imóvel..." /></div>
        {loading ? <div className="campaign-empty">Carregando...</div> : filtered.length === 0 ? <div className="campaign-empty">Nenhuma campanha encontrada.</div> : (
          <div className="campaign-grid">
            {filtered.map((item) => (
              <article className="campaign-card" key={item.id}>
                <div className="campaign-card-top"><div><span className="campaign-platform">{item.platform}</span><h3>{item.name}</h3><p>{item.property?.code ? `${item.property.code} · ` : ""}{item.property?.title || "Sem imóvel vinculado"}</p></div><span className={`campaign-status status-${item.status.toLowerCase()}`}>{item.status}</span></div>
                <div className="campaign-numbers"><div><span>Gasto</span><strong>{money(item.spent)}</strong></div><div><span>Leads</span><strong>{item.metrics?.leads || 0}</strong></div><div><span>CPL</span><strong>{money(item.metrics?.cpl)}</strong></div><div><span>Vendas</span><strong>{item.metrics?.sales || 0}</strong></div></div>
                <div className="campaign-return"><span>Comissão gerada</span><strong>{money(item.commissionGenerated)}</strong><small>ROI {Number(item.metrics?.roi || 0).toFixed(1).replace(".", ",")}%</small></div>
                <div className="campaign-actions"><button onClick={() => edit(item)}>Editar</button>{item.status !== "ARQUIVADA" && <button className="archive" onClick={() => archive(item)}>Arquivar</button>}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, wide = false, children }) {
  return <label className={wide ? "campaign-field campaign-field-wide" : "campaign-field"}><span>{label}</span>{children}</label>;
}
