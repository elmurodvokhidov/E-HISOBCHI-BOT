const axios = require('axios');
const api = axios.create({ baseURL: "http://backend.e-hisobchi.uz/api" });
module.exports = api;