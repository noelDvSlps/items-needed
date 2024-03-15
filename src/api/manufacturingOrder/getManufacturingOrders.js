import { API_CONFIG } from "../config";

export const getManufacturingOrders = () =>
  fetch(API_CONFIG.baseUrl + "/manufacturingOrders").then((response) => {
    if (!response.ok) {
      throw new Error("could not get manufacturingOrders");
    }

    return response.json();
  });
