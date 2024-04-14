import { API_CONFIG } from "../config";

export const createAxsNeedItem = ({
  item,
  qbBackOrder,
  need,
  excess,
  stock,
  wip,
  purchase,
  allocated,
  openMoQty,
  createdAt,
}) => {
  return fetch(API_CONFIG.baseUrl + "/axsNeedItems", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      item,
      qbBackOrder: Math.abs(qbBackOrder),
      stock,
      wip,
      purchase,
      allocated,
      openMoQty,
      need,
      excess: excess < 0 ? 0 : excess,
      createdAt,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("create mo failed");
      }
      return response;
    })
    .then((response) => {
      return response.json();
    });
};
