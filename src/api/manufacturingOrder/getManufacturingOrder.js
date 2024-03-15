import { API_CONFIG } from "../config";

export const getManufacturingOrder = (mo_id) =>
  fetch(API_CONFIG.baseUrl + "/manufacturingOrders/" + mo_id).then(
    (response) => {
      if (!response.ok) {
        throw new Error("could not get mo");
      }

      return response.json();
    }
  );
