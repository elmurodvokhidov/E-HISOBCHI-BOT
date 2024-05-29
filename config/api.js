const axios = require('axios');
const api = axios.create({ baseURL: "https://backend.e-hisobchi.uz/api" });
module.exports = api;