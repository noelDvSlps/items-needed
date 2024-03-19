import { API_CONFIG } from "../config";

export const createManufacturingOrder = ({
  mohId,
  dueDate,
  locId,
  jobId,
  buildItem,
  descr,
  opCode,
  wcId,
  lineNbr,
  cycleTime,
  setupTime,
  startQty,
  compQty,
  runTime,
  cmnt,
  createdAt,
}) => {
  // console.log(userId);
  return fetch(API_CONFIG.baseUrl + "/manufacturingOrders", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      mohId,
      dueDate,
      locId,
      jobId,
      buildItem,
      descr,
      opCode,
      wcId,
      lineNbr,
      cycleTime,
      setupTime,
      startQty,
      compQty,
      runTime,
      cmnt,
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
