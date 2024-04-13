import { API_CONFIG } from "../config";

export const createWcsNeedItem = ({
  item,
  qbBackOrder,
  stock,
  wip,
  purchase,
  allocated,
  openMoQty,
  need,
  excess,
  createdAt,
}) => {
  console.log(item);
  return fetch(API_CONFIG.baseUrl + "/wcsNeedItems", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      item,
      qbBackOrder,
      stock,
      wip,
      purchase,
      allocated,
      openMoQty,
      need,
      excess,
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
