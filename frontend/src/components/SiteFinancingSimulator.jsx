import { useMemo, useState } from "react";
import publicApi from "../services/publicApi";
import "./SiteFinancingSimulator.css";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function calculateInstallment(financedAmount, years) {
  if (!financedAmount || !years) return 0;

  const months = Number(years) * 12;
  const monthlyRate = 0.009;

  const installment =
    financedAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Number.isFinite(installment) ? installment : 0;
}

export default function SiteFinancingSimulator() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    monthlyIncome: "",
    propertyValue: "",
    downPayment: "",
    years: "35",
    hasMinorChild: "",
    hasDependents: "",
    dependentsCount: "",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const propertyValueNumber = Number(form.propertyValue || 0);
  const downPaymentNumber = Number(form.downPayment || 0);
  const financedAmount = Math.max(propertyValueNumber - downPaymentNumber, 0);

  const installment = useMemo(() => {
    return calculateInstallment(financedAmount, Number(form.years || 0));
  }, [financedAmount, form.years]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const message = [
        "Simulação de financiamento",
        `Cidade: ${form.city || "-"}`,
        `Renda mensal: ${form.monthlyIncome || "-"}`,
        `Valor do imóvel: ${form.propertyValue || "-"}`,
        `Entrada: ${form.downPayment || "-"}`,
        `Prazo: ${form.years || "-"} anos`,
        `Valor financiado: ${financedAmount || 0}`,
        `Parcela estimada: ${installment.toFixed(2)}`,
        `Possui filho menor de idade: ${form.hasMinorChild || "-"}`,
        `Possui dependente: ${form.hasDependents || "-"}`,
        `Quantidade de dependentes: ${form.dependentsCount || "-"}`,
        `Observações: ${form.notes || "-"}`
      ].join(" | ");

      const response = await publicApi.post("/leads", {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message
      });

      console.log("Lead criado com sucesso:", response.data);

      setFeedback("Simulação enviada com sucesso! Nossa equipe entrará em contato.");

      setForm({
        name: "",
        phone: "",
        email: "",
        city: "",
        monthlyIncome: "",
        propertyValue: "",
        downPayment: "",
        years: "35",
        hasMinorChild: "",
        hasDependents: "",
        dependentsCount: "",
        notes: ""
      });
    } catch (error) {
      console.error("Erro ao enviar simulação:", error);
      console.error("Resposta do backend:", error.response?.data);

      setFeedback(
        error.response?.data?.error ||
          error.response?.data?.details ||
          "Não foi possível enviar agora. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="simulator-section" id="simulador">
      <div className="simulator-wrapper">
        <div className="simulator-header">
          <span className="simulator-badge">Simulação online</span>
          <h2>Faça uma simulação do seu financiamento</h2>
          <p>
            Preencha os dados abaixo para estimar sua parcela e enviar suas
            informações diretamente para nossa equipe.
          </p>
        </div>

        <div className="simulator-grid">
          <form className="simulator-form" onSubmit={handleSubmit}>
            <div className="simulator-field">
              <label>Nome</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Digite seu nome"
                required
              />
            </div>

            <div className="simulator-field">
              <label>Telefone / WhatsApp</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="simulator-field">
              <label>E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seuemail@email.com"
              />
            </div>

            <div className="simulator-field">
              <label>Cidade</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="São Paulo"
              />
            </div>

            <div className="simulator-field">
              <label>Renda mensal</label>
              <input
                type="number"
                name="monthlyIncome"
                value={form.monthlyIncome}
                onChange={handleChange}
                placeholder="5000"
              />
            </div>

            <div className="simulator-field">
              <label>Valor do imóvel</label>
              <input
                type="number"
                name="propertyValue"
                value={form.propertyValue}
                onChange={handleChange}
                placeholder="350000"
              />
            </div>

            <div className="simulator-field">
              <label>Valor de entrada</label>
              <input
                type="number"
                name="downPayment"
                value={form.downPayment}
                onChange={handleChange}
                placeholder="50000"
              />
            </div>

            <div className="simulator-field">
              <label>Prazo</label>
              <select name="years" value={form.years} onChange={handleChange}>
                <option value="10">10 anos</option>
                <option value="15">15 anos</option>
                <option value="20">20 anos</option>
                <option value="25">25 anos</option>
                <option value="30">30 anos</option>
                <option value="35">35 anos</option>
              </select>
            </div>

            <div className="simulator-field">
              <label>Possui filho menor de idade?</label>
              <select
                name="hasMinorChild"
                value={form.hasMinorChild}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            <div className="simulator-field">
              <label>Possui dependente?</label>
              <select
                name="hasDependents"
                value={form.hasDependents}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            <div className="simulator-field">
              <label>Quantidade de dependentes</label>
              <input
                type="number"
                name="dependentsCount"
                value={form.dependentsCount}
                onChange={handleChange}
                placeholder="Ex.: 2"
                min="0"
              />
            </div>

            <div className="simulator-field simulator-field-full">
              <label>Observações</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Ex.: Quero apartamento com 2 dormitórios..."
                rows="4"
              />
            </div>

            <button type="submit" className="simulator-button" disabled={loading}>
              {loading ? "Enviando..." : "Simular e enviar"}
            </button>

            {feedback && <p className="simulator-message">{feedback}</p>}
          </form>

          <div className="simulator-result">
            <div className="simulator-card">
              <h3>Resultado estimado</h3>

              <div className="simulator-result-row">
                <span>Valor do imóvel</span>
                <strong>{formatCurrency(propertyValueNumber)}</strong>
              </div>

              <div className="simulator-result-row">
                <span>Entrada</span>
                <strong>{formatCurrency(downPaymentNumber)}</strong>
              </div>

              <div className="simulator-result-row">
                <span>Valor financiado</span>
                <strong>{formatCurrency(financedAmount)}</strong>
              </div>

              <div className="simulator-result-row">
                <span>Prazo</span>
                <strong>{form.years || 0} anos</strong>
              </div>

              <div className="simulator-result-row simulator-highlight">
                <span>Parcela estimada</span>
                <strong>{formatCurrency(installment)}</strong>
              </div>

              <small>
                Simulação ilustrativa. O valor final depende da análise de crédito,
                banco, taxa de juros e perfil do cliente.
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}