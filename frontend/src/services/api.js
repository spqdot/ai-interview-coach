import axios from "axios";

const api = axios.create({
  baseURL: "https://ai-interview-coach-2-82in.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;