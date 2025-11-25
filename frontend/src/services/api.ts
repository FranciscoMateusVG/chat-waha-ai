import axios from 'axios';

export const api = axios.create({
  baseURL: `http://localhost:3000/`,
  withCredentials: false,
  headers: {
    'x-api-key': 'dev-api-key-12345'
  }
});