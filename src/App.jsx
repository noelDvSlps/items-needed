import { useRef, useState } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import Select from "react-dropdown-select";
import { uid } from "uid";
import Modal from "react-modal";
function App() {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
    },
  };
  Modal.setAppElement("#root");
  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [fields, setFields] = useState([]);
  const [items, setItems] = useState([]);
  const [fatherOptions, setFatherOptions] = useState([]);
  const [selectedFather, setSelectedFather] = useState("");
  const [parentList, setParentList] = useState([]);
  const [table1, setTable1] = useState([]);
  const [table2, setTable2] = useState([]);
  const [boms, setBoms] = useState([]);
  const refSort = useRef({ key: "totQMisysNeed", ascending: false });

  const [data, setData] = useState([]);
  const [masterList, setMasterList] = useState([]);

  let topLevelWhereUse = false;

  const masterItemsFields = [
    "itemId",
    "totQStk",
    "totQWip",
    "totQOrd",
    "ordQty",
    "endQty",
    "totQUsed",
    // "tempQty",
    "totQMisysNeed",
    "totQExcess",
  ];

  const table1Fields = [
    "mohId",
    "locId",
    "buildItem",
    "bomRev",
    "ordQty",
    "endQty",
    "endDt",
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

      const totQMisysNeed =
        "totQMisysNeed" in objToUpdate
          ? item.totQMisysNeed + objToUpdate.totQMisysNeed
          : item.totQMisysNeed;

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
          totQMisysNeed,
          qtyNeed,
        };

        return true;
      }
    });

    if (obj === undefined) {
      const itemId = objToUpdate.itemId;
      const totQStk = "totQStk" in objToUpdate ? objToUpdate.totQStk : 0;
      const totQWip = "totQWip" in objToUpdate ? objToUpdate.totQWip : 0;
      const totQOrd = "totQOrd" in objToUpdate ? objToUpdate.totQOrd : 0;
      const totQExcess =
        "totQExcess" in objToUpdate ? objToUpdate.totQExcess : 0;

      masterItems.push({
        itemId,
        totQStk,
        totQWip,
        totQOrd,
        totQUsed: 0,
        ordQty: 0,
        endQty: 0,
        tempQty: 0,
        totQMisysNeed: 0,
        qtyNeed: 0,
        totQExcess,
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

  const sortMasterList = (key) => {
    const famData = getFamily(selectedFather);
    setData([]);
    let sortedData = [];

    if (refSort.current.key === key) {
      refSort.current.ascending = !refSort.current.ascending;
    } else {
      refSort.current.key = key;
      refSort.current.ascending = key !== "itemId" ? false : true;
    }

    sortedData = refSort.current.ascending
      ? key !== "itemId"
        ? famData.sort((a, b) => a[key] - b[key])
        : famData.sort((a, b) => a[key].localeCompare(b[key]))
      : key !== "itemId"
      ? famData.sort((a, b) => b[key] - a[key])
      : famData.sort((a, b) => b[key].localeCompare(a[key]));

    setTimeout(() => {
      setData(sortedData);
    }, 0);
  };

  const getFamily = (fatherItem) => {
    if (fatherItem === "ALL") {
      return masterList;
    }
    const p = parentList.filter((parent) => {
      return parent.parent === fatherItem && parent.child.indexOf("MA-") === -1;
    });
    console.log(p);
    const data = masterList.filter((item) => {
      if (item.itemId === fatherItem) {
        return item;
      }
      const fam = p.filter((family) => family.child === item.itemId);
      if (fam.length > 0) {
        return item;
      }

      return;
    });
    return data;
  };

  const handleCompute = () => {
    let openMos = [];
    masterItems = [];
    // items transfer stocks
    console.log("Transferring Items Data...");
    items.map((item) => {
      const { itemId, totQStk, totQWip, totQOrd } = item;
      updateMasterItems({
        itemId,
        totQStk,
        totQWip,
        totQOrd,
        totQExcess: totQStk + totQWip + totQOrd,
      });
    });

    console.log("Transferring Open Mo data");
    // items transfer mo qty
    table1.map((mo) => {
      const { ordQty, endQty } = mo;
      const itemId = mo.buildItem;
      const i = masterItems.filter((item) => item.itemId === itemId);
      updateMasterItems({
        itemId,
        ordQty,
        endQty,
        totQExcess: i[0].totQExcess + ordQty - endQty,
      });
    });

    console.log("Getting Items without bom where used or w/o mo where used");
    // segregate topLevels
    masterItems.map((item, index) => {
      const topLevel = !isTopLevelWhereUse(item.itemId);
      console.log(`Processing ${index + 1} of ${masterItems.length}`);
      updateMasterItems({ itemId: item.itemId, topLevel });
    });

    //get misysNeed for subs
    console.log("Setting qty for open mo with mo where used");
    const parentChild = [];

    const getSubsMisysNeed = (itemId, qty, upperMoQty) => {
      // Step 1. Get all the subs of itemId
      const filteredBoms = boms.filter((bom) => itemId === bom.bomItem);
      if (filteredBoms.length === 0) {
        return;
      }
      // step 2. Iterate all the subs
      filteredBoms.map((bom, index) => {
        console.log(`Processing ${index + 1} of ${filteredBoms.length}`);
        // 2.1 get qty of sub misys need
        const qtyMisysNeed =
          qty + upperMoQty < 0 ? 0 : (+qty + +upperMoQty) * bom.qty;

        // 2.2 get sub info
        const itemData = masterItems.filter(
          (item) => item.itemId === bom.partId
        );
        const {
          totQStk,
          totQWip,
          totQOrd,
          ordQty,
          endQty,
          totQUsed,
          totQExcess,
        } = itemData[0];

        const totalStock =
          totQStk + totQWip + totQOrd + ordQty - endQty - totQUsed;

        let tempQtyNeed = +qtyMisysNeed - totalStock;

        let qtyMo = ordQty - endQty;

        const qtyNeed = tempQtyNeed < 0 ? 0 : tempQtyNeed;

        const qtyUsed = tempQtyNeed < 0 ? qtyMisysNeed : qtyMisysNeed - qtyNeed;

        const objToUpdate = {
          itemId: bom.partId,
          totQMisysNeed: tempQtyNeed < 0 ? 0 : tempQtyNeed,
          totQUsed: totQUsed + qtyUsed,
          totQExcess: totQExcess - (qtyUsed >= 0 ? qtyUsed : 0),
        };
        updateMasterItems(objToUpdate);

        const openMo = openMos.filter((openMo) => openMo === bom.partId);
        if (openMo.length === 0) {
          openMos.push(bom.partId);
        } else {
          qtyMo = 0;
        }
        parentChild.push({ parent: parentItem, child: bom.partId });
        getSubsMisysNeed(bom.partId, qtyNeed, qtyMo);
      });
    };
    const filteredMasterItems = masterItems.filter(
      (item) => item.topLevel === true && item.ordQty > 0
    );

    let parentItem = "";
    let options = [{ value: "ALL", label: "ALL" }];

    filteredMasterItems.map((topItem, index) => {
      console.log(`Processing ${index + 1} of ${filteredMasterItems.length}`);
      parentItem = topItem.itemId;
      options.push({ value: parentItem, label: parentItem });

      getSubsMisysNeed(topItem.itemId, 0, topItem.ordQty - topItem.endQty);
    });
    setParentList(parentChild);
    setFatherOptions(options);
    console.log(`Finish`);
    return true;
  };

  const setTableData = () => {
    setFields(masterItemsFields);
    masterItems.map((item) => {
      if (item.tempQty <= 0) {
        updateMasterItems({ qtyNeed: 0 });
      }
    });

    const sortedData = masterItems
      .filter((item) => item.itemId !== undefined)
      .filter((item) => {
        const str = item.itemId;

        return str.indexOf("MA-") === -1;
      })
      .sort((a, b) => b.totQMisysNeed - a.totQMisysNeed);
    setData(sortedData);
    setMasterList(sortedData);
    setLoading(false);
    setElementValue("lblMsg", "Finish");
    setTimeout(() => {
      setElementValue("lblMsg", "");
    }, 5000);
  };

  const convertDate = (num) => {
    // const
  };

  return (
    <div style={{ width: "100%", maxHeight: "100vh" }}>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <button onClick={closeModal}>close</button>
        {modalData.length > 0 &&
          modalData.map((mo, index) => (
            <div
              key={index}
              style={{
                border: "1px solid",
                padding: "5px",
                margin: "5px",
                minWidth: "150px",
                borderRadius: "8px",
              }}
            >
              <div>MO# {mo.mohId}</div>
              <div>QTY {mo.ordQty}</div>
              {/* <div>DUE DATE {convertDate(mo.endDt)}</div> */}
            </div>
          ))}
      </Modal>
      <div style={{ padding: "15px" }}>
        <label>
          <i>This site is for merging Excel Files - Noel Pulido</i>
        </label>
      </div>
      <div style={{ padding: "15px" }}>
        <label id="lblMsg"></label>
      </div>
      {data.length === 0 && loading === false && (
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
      )}
      {items.length > 0 && boms.length > 0 && table1.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            // border: "1px solid",
            minWidth: "900px",
            marginTop: "10px",
            justifyContent: "space-between",
          }}
        >
          {loading === false && (
            <button
              id="btn-Compute"
              onClick={() => {
                setElementValue("lblMsg", "Please Wait....");
                setLoading(true);
                setTimeout(() => {
                  handleCompute();
                  setTableData();
                }, 1000);
              }}
            >
              Compute
            </button>
          )}
          {loading === false && (
            <div>
              <label>
                Select item with open MO with NO MO where use to show related
                items
              </label>
              <Select
                options={fatherOptions}
                placeholder="Select item with open MO with NO MO where use"
                style={{ minWidth: "50%" }}
                separator={true}
                onChange={(values) => {
                  setSelectedFather(values[0].value);
                  const d = getFamily(values[0].value);
                  setData(d);
                }}
              />
            </div>
          )}

          {loading === false && (
            <button id="btn-Excel" onClick={scrapeData}>
              Download Excel File
            </button>
          )}
        </div>
      )}
      {data.length > 0 && loading === false && (
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
              width: "900px",
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
                        return (
                          <td
                            key={uid()}
                            onClick={() => {
                              sortMasterList(key);
                            }}
                          >
                            {key}
                          </td>
                        );
                      }
                    })}
                  </tr>

                  {data.map((item, index) => {
                    return (
                      <tr
                        key={index}
                        onClick={() => {
                          const data = [];
                          const itemInfos = table1.filter(
                            (mo) => item.itemId === mo.buildItem
                          );
                          data.push(...itemInfos);
                          console.log(data);

                          setModalData(data);
                          openModal();
                        }}
                      >
                        {Object.keys(item).map((key3, index) => {
                          if (fields.includes(key3)) {
                            return (
                              <td
                                key={index}
                                style={{
                                  color:
                                    (item[key3] > 0 &&
                                      key3 === "totQMisysNeed") ||
                                    item["itemId"] === selectedFather
                                      ? "red"
                                      : "black",
                                  fontSize:
                                    (item[key3] > 0 &&
                                      key3 === "totQMisysNeed") ||
                                    item["itemId"] === selectedFather
                                      ? "20px"
                                      : "16px",
                                }}
                              >
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
