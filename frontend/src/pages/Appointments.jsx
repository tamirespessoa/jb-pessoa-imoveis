import { useEffect, useState } from "react";
import axios from "axios";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppointments(response.data);
    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err);
      setError("Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  if (loading) return <div>Carregando agendamentos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Agendamentos</h1>

      {appointments.length === 0 ? (
        <p>Nenhum agendamento encontrado.</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <p>
              <strong>Imóvel:</strong>{" "}
              {appointment.propertyId?.title || "Não informado"}
            </p>
            <p>
              <strong>Cliente:</strong>{" "}
              {appointment.clientId?.fullName || "Não informado"}
            </p>
            <p>
              <strong>Data:</strong>{" "}
              {appointment.appointmentDate
                ? new Date(appointment.appointmentDate).toLocaleString("pt-BR")
                : "Não informada"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {appointment.status || "PENDENTE"}
            </p>
            <p>
              <strong>Observações:</strong>{" "}
              {appointment.notes || "Sem observações"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}