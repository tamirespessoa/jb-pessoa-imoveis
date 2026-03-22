import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [metrics, setMetrics] = useState({
    clients: 0,
    owners: 0,
    properties: 0,
    documents: 0
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [personsRes, propertiesRes, documentsRes] = await Promise.all([
          api.get("/persons"),
          api.get("/properties"),
          api.get("/documents")
        ]);

        const persons = personsRes.data || [];
        const properties = propertiesRes.data || [];
        const documents = documentsRes.data || [];

        setMetrics({
          clients: persons.filter((item) => item.type === "CLIENTE_COMPRADOR").length,
          owners: persons.filter((item) => item.type === "PROPRIETARIO").length,
          properties: properties.length,
          documents: documents.length
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadMetrics();
  }, []);

  return (
    <div>
      <div style={styles.gridTop}>
        <div style={styles.bigCard}>
          <div style={styles.cardTitle}>Meus imóveis</div>
          <div style={styles.bigNumber}>{metrics.properties}</div>
          <div style={styles.subtitle}>ativos</div>

          <div style={styles.infoLine}><span style={styles.gold}>0</span> publicados no site</div>
          <div style={styles.infoLine}><span style={styles.blue}>0</span> captados no mês</div>
          <div style={styles.infoLine}><span style={styles.red}>0</span> desatualizados</div>
        </div>

        <div style={styles.bigCard}>
          <div style={styles.cardTitle}>Meus clientes</div>
          <div style={styles.bigNumber}>{metrics.clients}</div>
          <div style={styles.subtitle}>ativos</div>

          <div style={styles.infoLine}><span style={styles.blue}>0</span> captados no mês</div>
          <div style={styles.infoLine}><span style={styles.red}>0</span> desatualizados</div>
        </div>
      </div>

      <div style={styles.gridBottom}>
        <div style={styles.smallCard}>
          <div style={styles.smallTitle}>Leads do mês</div>
          <div style={styles.smallNumber}>{metrics.clients}</div>
        </div>

        <div style={styles.smallCard}>
          <div style={styles.smallTitle}>Visitas agendadas</div>
          <div style={styles.smallNumber}>{metrics.owners}</div>
        </div>

        <div style={styles.smallCard}>
          <div style={styles.smallTitle}>Negociações abertas</div>
          <div style={styles.smallNumber}>{metrics.documents}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  gridTop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px"
  },
  bigCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    minHeight: "240px"
  },
  cardTitle: {
    fontSize: "18px",
    color: "#596674",
    marginBottom: "24px"
  },
  bigNumber: {
    fontSize: "66px",
    textAlign: "center",
    color: "#c7a22b",
    fontWeight: "500",
    lineHeight: 1
  },
  subtitle: {
    textAlign: "center",
    color: "#6c747d",
    fontSize: "18px",
    marginTop: "6px",
    marginBottom: "24px"
  },
  infoLine: {
    fontSize: "16px",
    color: "#434b55",
    marginBottom: "8px"
  },
  gold: {
    color: "#c7a22b",
    fontWeight: "700"
  },
  blue: {
    color: "#2d63d6",
    fontWeight: "700"
  },
  red: {
    color: "#db3d3d",
    fontWeight: "700"
  },
  gridBottom: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px"
  },
  smallCard: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "26px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    minHeight: "130px"
  },
  smallTitle: {
    fontSize: "18px",
    color: "#4b5560",
    marginBottom: "18px",
    fontWeight: "600"
  },
  smallNumber: {
    fontSize: "56px",
    color: "#c7a22b",
    fontWeight: "500"
  }
};

export default Dashboard;