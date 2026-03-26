import { useEffect, useState } from "react";
import axios from "axios";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
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
      console.error(err);
      setError("Erro ao carregar agendamentos");
    }
  }

  return (
    <div>
      <h1>Agendamentos</h1>

      {error && <p>{error}</p>}

      {appointments.map((item) => (
        <div key={item._id}>
          <p><strong>Imóvel:</strong> {item.propertyId?.title}</p>
          <p><strong>Cliente:</strong> {item.clientId?.fullName}</p>
          <p>
            <strong>Data:</strong>{" "}
            {item.appointmentDate
              ? new Date(item.appointmentDate).toLocaleString("pt-BR")
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}