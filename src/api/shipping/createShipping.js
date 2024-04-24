import { API_CONFIG } from "../config";

export const createShipping = ({
  item,
  qty,
  backOrdered,
  invoiced,
  name,
  num,
  po,
  shipDate,
  memo,
  createdAt,
  orgId,
}) => {
  return fetch(API_CONFIG.baseUrl + "/shippings", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      item,
      qty,
      backOrdered,
      invoiced,
      name,
      num,
      po,
      shipDate,
      memo,
      createdAt,
      orgId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("create shipping failed");
      }
      return response;
    })
    .then((response) => {
      return response.json();
    });
};
