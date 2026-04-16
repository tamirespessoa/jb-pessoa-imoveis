import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001"
});

export default publicApi;