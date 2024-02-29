import { useRef, useState } from "react";
import "./App.css";
import * as XLSX from "xlsx";
// import { useDownloadExcel } from "react-export-table-to-excel";
import { uid } from "uid";
function App() {
  const [fields, setFields] = useState([]);
  const [items, setItems] = useState([]);
  const [table1, setTable1] = useState([]);
  const [table2, setTable2] = useState([]);
  const [boms, setBoms] = useState([]);

  const [data, setData] = useState([]);

  let topLevelWhereUse = false;

  const masterItemsFields = [
    "itemId",
    "totQStk",
    "totQWip",
    "totQOrd",
    "ordQty",
    "endQty",
    // "tempQty",
    "qtyMisysNeed",
    "excess",
  ];

  const table1Fields = [
    "mohId",
    "locId",
    "buildItem",
    "bomRev",
    "ordQty",
    "endQty",
  ];

  const table2Fields = ["mohId", "lineNbr", "cmnt"];

  const bomsFields = ["bomItem", "bomRev", "partId", "qty"];
  const itemsFields = ["itemId", "revId", "descr", "totQStk", "totQWip"];

  const scrapeData = () => {
    // Acquire Data (reference to the HTML table)
    var table_elt = document.getElementById("my-table-id");

    // Extract Data (create a workbook object from the table)
    var workbook = XLSX.utils.table_to_book(table_elt);

    // Process Data (add a new row)
    var ws = workbook.Sheets["Sheet1"];
    XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], {
      origin: -1,
    });

    // Package and Release Data (`writeFile` tries to write and save an XLSB file)
    XLSX.writeFile(workbook, "Report.xlsb");
  };

  const setElementValue = (id, value) => {
    let labelElement = document.getElementById(id);
    labelElement.innerHTML = value;
  };

  const getElementValue = (id) => {
    let labelElement = document.getElementById(id);
    return labelElement.textContent;
  };

  const tableRef = useRef(null);

  const readExcel = (file) => {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.onload = (e) => {
        const bufferArray = e.target.result;

        const wb = XLSX.read(bufferArray, { type: "buffer" });

        const sheetIndex = 1;

        const wsName = wb.SheetNames[sheetIndex];

        const ws = wb.Sheets[wsName];

        const data = XLSX.utils.sheet_to_json(ws);
        setElementValue("label", wsName);
        resolve(data);
      };

      fileReader.onerror = reject;
    });

    promise.then((d) => {
      // console.log(d);
      // setData(d);
      const tableName = getElementValue("label");
      if (tableName === "MIMOH") {
        setTable1(d);
        setFields(table1Fields);
      }
      if (tableName === "MIMORD") {
        setTable2(d);
        setFields(table2Fields);
      }
      if (tableName === "MIBOMD") {
        const array = [];
        d.map((bom) => {
          const filteredItem = items.filter((item) => {
            return item.itemId === bom.bomItem && item.revId === bom.bomRev;
          });

          if (filteredItem.length > 0) {
            array.push(bom);
          }
          return bom;
        });
        // setData(array);
        setBoms(array);
        setFields(bomsFields);
      }
      if (tableName === "MIITEM") {
        setItems(d);
        setFields(itemsFields);
      }
      console.log("Excel finish");
    });
  };

  let masterItems = [];

  const updateMasterItems = (objToUpdate) => {
    let obj = masterItems.find((item, i) => {
      const itemId = objToUpdate.itemId;

      const ordQty =
        "ordQty" in objToUpdate
          ? objToUpdate.ordQty + item.ordQty
          : item.ordQty;
      const endQty =
        "endQty" in objToUpdate
          ? objToUpdate.endQty + item.endQty
          : item.endQty;
      const tempQty = "tempQty" in objToUpdate ? objToUpdate.tempQty : 0;

      const qtyMisysNeed =
        "qtyMisysNeed" in objToUpdate
          ? item.qtyMisysNeed + objToUpdate.qtyMisysNeed
          : item.qtyMisysNeed;

      const qtyNeed =
        "qtyNeed" in objToUpdate
          ? item.qtyNeed + objToUpdate.qtyNeed
          : item.qtyNeed;
      // const qtyNeed =
      //   qtyMisysNeed -
      //   (totQStk + totQWip + totQOrd + ordQty - endQty + Math.abs(tempQty));

      if (item.itemId === itemId) {
        masterItems[i] = {
          ...masterItems[i],
          ...objToUpdate,
          ordQty,
          endQty,
          tempQty,
          qtyMisysNeed,
          qtyNeed,
          // excess: qtyNeed > 0 ? 0 : Math.abs(qtyNeed),
        };
        // if (objToUpdate.itemId === "10161/102P") {
        //   console.log(`---${objToUpdate.itemId}`);
        //   console.log(`tempqty: ${objToUpdate.tempQty}`);
        //   console.log(`misysNeed: ${qtyMisysNeed}`);
        //   console.log(`qtyNeed: ${masterItems[i].qtyNeed}`);
        //   console.log("-------------------------");
        // }
        // if (objToUpdate.itemId === "WCS-0034/800") {
        //   console.log("---WCS-0034/800");
        //   console.log(`tempqty: ${objToUpdate.tempQty}`);
        //   console.log(`misysNeed: ${qtyMisysNeed}`);
        //   console.log(`qtyNeed: ${masterItems[i].qtyNeed}`);
        //   console.log("---");
        // }
        return true;
      }
    });
    // console.log(obj);

    if (obj === undefined) {
      const itemId = objToUpdate.itemId;
      const totQStk = "totQStk" in objToUpdate ? objToUpdate.totQStk : 0;
      const totQWip = "totQWip" in objToUpdate ? objToUpdate.totQWip : 0;
      const totQOrd = "totQOrd" in objToUpdate ? objToUpdate.totQOrd : 0;

      masterItems.push({
        itemId,
        totQStk,
        totQWip,
        totQOrd,
        ordQty: 0,
        endQty: 0,
        tempQty: 0,
        qtyMisysNeed: 0,
        qtyNeed: 0,
        excess: 0,
        topLevel: "false",
      });
    }
  };

  const isTopLevelWhereUse = (itemId, level) => {
    // topLevelWhereUse = level === 1 ? false : topLevelWhereUse;
    topLevelWhereUse = false;
    const bomWhereUse = boms.filter((bom) => bom.partId === itemId);
    if (bomWhereUse.length === 0) {
      if (level === 1) {
        topLevelWhereUse = false;
      }
    } else {
      bomWhereUse.map((bom) => {
        if (topLevelWhereUse) {
          return;
        }
        const moWhereUse = table1.filter((mo) => mo.buildItem === bom.bomItem);
        if (moWhereUse.length > 0) {
          topLevelWhereUse = true;
          return;
        } else {
          isTopLevelWhereUse(bom.bomItem, 2);
        }
      });
    }
    return topLevelWhereUse;
  };

  const handleCompute = () => {
    masterItems = [];
    // items transfer stocks
    console.log("Transferring Items Data...");
    items.map((item) => {
      const { itemId, totQStk, totQWip, totQOrd } = item;
      updateMasterItems({ itemId, totQStk, totQWip, totQOrd });
    });

    console.log("Transferring Open Mo data");
    // items transfer mo qty
    table1.map((mo) => {
      const { ordQty, endQty } = mo;
      const itemId = mo.buildItem;
      updateMasterItems({ itemId, ordQty, endQty });
    });

    console.log("Getting Items without bom where used");
    // segregate topLevels
    masterItems.map((item, index) => {
      const topLevel = !isTopLevelWhereUse(item.itemId);
      console.log(`Processing ${index + 1} of ${masterItems.length}`);

      updateMasterItems({ itemId: item.itemId, topLevel });
    });

    //get  topLevels

    console.log("Getting Items with Open Mo without mo where used");
    // const topItems = masterItems.filter(
    //   (item) => item.topLevel === true && item.ordQty > 0
    // );

    //get misysNeed for topLevels
    // console.log("Setting qty for open mo without mo where used");
    // topItems.map((topItem, index) => {
    //   const { itemId, ordQty, endQty } = topItem;
    //   console.log(`Processing ${index + 1} of ${topItems.length}`);

    //   updateMasterItems({ itemId, qtyMisysNeed: ordQty - endQty });
    // });

    //get misysNeed for subs
    console.log("Setting qty for open mo with mo where used");

    const getSubsMisysNeed = (itemId, qty) => {
      const filteredBoms = boms.filter((bom) => itemId === bom.bomItem);

      filteredBoms.map((bom, index) => {
        console.log(`Processing ${index + 1} of ${filteredBoms.length}`);
        const qtyMisysNeed = qty * bom.qty;
        const itemData = masterItems.filter(
          (item) => item.itemId === bom.partId
        );
        const { totQStk, totQWip, totQOrd, ordQty, endQty } = itemData[0];
        const totalStock = totQStk + totQWip + totQOrd + ordQty - endQty;

        let tempQtyNeed = qtyMisysNeed - totalStock;

        const qtyMo = ordQty - endQty;
        const qtyNeed = qtyMo > tempQtyNeed ? qtyMo : tempQtyNeed;

        updateMasterItems({
          itemId: bom.partId,
          qtyMisysNeed: tempQtyNeed <= 0 ? 0 : tempQtyNeed,
          excess: tempQtyNeed <= 0 ? Math.abs(tempQtyNeed) : 0,
        });
        getSubsMisysNeed(bom.partId, qtyNeed);
      });
    };
    const filteredMasterItems = masterItems.filter(
      (item) => item.topLevel === true && item.ordQty > 0
    );

    filteredMasterItems.map((topItem, index) => {
      console.log(`Processing ${index + 1} of ${filteredMasterItems.length}`);

      getSubsMisysNeed(topItem.itemId, topItem.ordQty - topItem.endQty);
    });
    console.log(`Finish`);
  };

  const setTableData = () => {
    setFields(masterItemsFields);
    masterItems.map((item) => {
      if (item.tempQty <= 0) {
        updateMasterItems({ qtyNeed: 0 });
      }
    });
    const sortedData = masterItems.sort(
      (a, b) => b.qtyMisysNeed - a.qtyMisysNeed
    );
    setData(sortedData);
  };
  return (
    <div style={{ width: "100%", maxHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          // border: "1px solid",
          justifyContent: "space-between",
        }}
      >
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            readExcel(file);
          }}
        />
        <label id="label"></label>
      </div>
      {items.length > 0 && boms.length > 0 && table1.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            // border: "1px solid",
            marginTop: "10px",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => {
              handleCompute();
              setTableData();
              document.getElementById("btn-Excel").disabled = false;
            }}
          >
            Compute
          </button>

          <button id="btn-Excel" disabled onClick={scrapeData}>
            Download Excel File
          </button>
        </div>
      )}

      {data.length > 0 && (
        <div
          style={{
            maxHeight: "80vh",
            overflowY: "scroll",
            border: "1px solid black",
            marginTop: "10px",
          }}
        >
          <table
            ref={tableRef}
            id="my-table-id"
            style={{
              color: "black",
              backgroundColor: "whitesmoke",
            }}
          >
            {data.length > 0 && (
              <>
                {/* <thead>
              <tr>
                {Object.keys(data[0]).map((key) => {
                  if (fields.includes(key)) {
                    return <th key={uid()}>{key}</th>;
                  }
                })}
              </tr>
            </thead> */}
                <tbody>
                  <tr
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "lightblue",
                    }}
                  >
                    {Object.keys(data[0]).map((key) => {
                      if (fields.includes(key)) {
                        return <td key={uid()}>{key}</td>;
                      }
                    })}
                  </tr>

                  {data.map((item, index) => {
                    return (
                      <tr key={index}>
                        {Object.keys(item).map((key3, index) => {
                          if (fields.includes(key3)) {
                            return (
                              <td key={index}>
                                {typeof item[key3] === "boolean"
                                  ? item[key3].toString()
                                  : typeof item[key3] === "number"
                                  ? item[key3].toFixed(2)
                                  : item[key3]}
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
