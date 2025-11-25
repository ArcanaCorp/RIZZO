import { config } from "dotenv";

config();

export const API_URL = process.env.ENVIRONMENT === 'development' ? process.env.URL_API_DEVELPMENT : process.env.URL_API_PRODUCTION;
export const PORT = process.env.ENVIRONMENT === 'development' ? 3000 : process.env.PORT || 3000;
export const DATA_PATH = process.env.DATA_PATH || "./data";