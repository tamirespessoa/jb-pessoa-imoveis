import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://jb-pessoa-imoveis.onrender.com"
});

export default publicApi;