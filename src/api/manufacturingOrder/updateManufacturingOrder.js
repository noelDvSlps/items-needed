import { API_CONFIG } from "../config";

export const updateManufacturingOrder = (id, objToUpdate, token) => {
  console.log(token);
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  // myHeaders.append("Authorization", `Bearer ${token}`);
  var raw = JSON.stringify(objToUpdate);

  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  return fetch(
    API_CONFIG.baseUrl + "/manufacturingOrders/" + id,
    requestOptions
  ).then((response) => {
    //   if (!response.ok) {
    //     throw new Error("login failed");
    //   }
    return response.json();
  });
};
