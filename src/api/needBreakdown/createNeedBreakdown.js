import { API_CONFIG } from "../config";

export const createNeedBreakdown = ({
  parentItem,
  childItem,
  qtyNeed,
  createdAt,
}) => {
  return fetch(API_CONFIG.baseUrl + "/needBreakdowns", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      parentItem,
      childItem,
      qtyNeed,
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
