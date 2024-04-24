import { API_CONFIG } from "../config";

export const deleteQbItems = (item, token) => {
  console.log(token);
  const urlWithId = `${API_CONFIG.baseUrl}/qbItems/deleteMany/${item}`;
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  // myHeaders.append("Authorization", `Bearer ${token}`);
  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
  };

  const res = fetch(urlWithId, requestOptions)
    .then((res) => {
      return res;
    })
    .catch((error) => {
      console.log("error", error);
      return error;
    });
  return res;
};
