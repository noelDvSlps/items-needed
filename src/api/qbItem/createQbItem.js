import { API_CONFIG } from "../config";

export const createQbItem = ({
  item,
  onHand,
  onSalesOrder,
  available,
  orgId,
  createdAt,
}) => {
  return fetch(API_CONFIG.baseUrl + "/qbItems", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      item,
      onHand,
      onSalesOrder,
      available,
      orgId,
      createdAt,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("create qbItem failed");
      }
      return response;
    })
    .then((response) => {
      return response.json();
    });
};
