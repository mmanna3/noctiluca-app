import Constants from "expo-constants";
import { Client } from "./clients";
import { HttpClientWrapper } from "./http-client-wrapper";

const API_BASE_URL: string = Constants.expoConfig?.extra?.apiUrl ?? "";

const httpClient = new HttpClientWrapper();
export const api = new Client(API_BASE_URL, httpClient);
