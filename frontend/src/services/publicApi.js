import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:3001"
});

export default publicApi;