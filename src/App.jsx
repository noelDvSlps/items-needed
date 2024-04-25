import { useRef, useState } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import Select from "react-dropdown-select";
import { uid } from "uid";
import Modal from "react-modal";
import { createManufacturingOrder } from "./api/manufacturingOrder/createManufacturingOrder";
import { deleteManufacturingOrders } from "./api/manufacturingOrder/deleteManufacturingOrders";
import { deleteWcsNeedItems } from "./api/wcsNeedItem/deleteWcsNeedItems";
import { createWcsNeedItem } from "./api/wcsNeedItem/createWcsNeedItem";
import { deleteAxsNeedItems } from "./api/axsNeedItem/deleteAxsNeedItems";
import { createAxsNeedItem } from "./api/axsNeedItem/createAxsNeedItem";
import { updateItemsCount } from "./api/itemCount/updateItemsCount";
import { deleteNeedBreakdowns } from "./api/needBreakdown/deleteNeedBreakdowns";
import { createNeedBreakdown } from "./api/needBreakdown/createNeedBreakdown";
import { deleteShippings } from "./api/shipping/deleteShippings";
import { createShipping } from "./api/shipping/createShipping";
import { deleteQbItems } from "./api/qbItem/deleteQbItems";
import { createQbItem } from "./api/qbItem/createQbItem";
function App() {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      maxHeight: "80vh",
      minWidth: "300px",
    },
  };
  Modal.setAppElement("#root");
  const [modalIsOpen, setIsOpen] = useState(false);
  const [orgId, setOrgId] = useState("");

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }
  const [del, setDel] = useState(true);
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
  const [password, setPassword] = useState("");
  const refSort = useRef({ key: "totQMisysNeed", ascending: false });

  const [data, setData] = useState([]);
  const [qbData, setQbData] = useState([]);
  const [qbData2, setQbData2] = useState([]);
  const [masterList, setMasterList] = useState([]);

  const [msg, setMsg] = useState("msg");

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
    "qbBackOrder",
  ];

  const table1Fields = [
    "mohId",
    "jobId",
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

  const excludedItem = [
    "Repair",
    "Assembly",
    "Excise",
    "Shipping",
    "Prototype",
    "Engineer",
    "Laser",
  ];

  const readExcel = (file) => {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.onload = (e) => {
        const bufferArray = e.target.result;

        const wb = XLSX.read(bufferArray, { type: "buffer" });

        const firstSheetName = wb.SheetNames[0];
        const firstWs = wb.Sheets[firstSheetName];
        const sourceData = XLSX.utils.sheet_to_json(firstWs);
        if (sourceData.length > 0) {
          const keys = Object.keys(sourceData[0]);
          if (keys.includes("orgId")) {
            setOrgId(sourceData[0].orgId);
          }
        }

        const sheetIndex = 1;

        const wsName = wb.SheetNames[sheetIndex];

        const ws = wb.Sheets[wsName];

        const data = XLSX.utils.sheet_to_json(ws);
        setElementValue("label", wsName);
        resolve(data);
      };

      fileReader.onerror = reject;
    });

    promise.then(async (d) => {
      const tableName = getElementValue("label");

      if (tableName === "qbData1") {
        await deleteQbItems(orgId, "token");
        const qb = d.map((item, index) => {
          const itemNumber = item.__EMPTY_2;
          const itemNumber2 = itemNumber ? itemNumber.split(" ") : [undefined];
          item.__EMPTY_2 = itemNumber2[0];
          const c = index + 1;

          if (
            item.__EMPTY_2 !== undefined &&
            (item["On Sales Order"] > 0 || item["On Hand"] > 0)
          ) {
            setTimeout(async () => {
              const res = await createQbItem({
                item: item.__EMPTY_2,
                onHand: item["On Hand"],
                onSalesOrder: item["On Sales Order"],
                available: item["On Hand"] - item["On Sales Order"],
                createdAt: Date.now(),
                orgId,
              });
              console.log(`${c} of ${d.length}`);
              console.log(res);
            }, index * 10);
          }

          return item;
        });
        const qb2 = qb.filter((item) => {
          return (
            item.__EMPTY_2 !== undefined &&
            item["On Hand"] - item["On Sales Order"] < 0
          );
        });
        console.log(qb2);
        setQbData(qb2);
      }
      let prevVal = undefined;

      if (tableName === "qbData2") {
        const qb = d.map((item) => {
          const arrString = item.__EMPTY_2 ? item.__EMPTY_2.split(" ") : [""];

          const itemNumber = item.__EMPTY_2
            ? arrString[0] === "Total"
              ? undefined
              : prevVal
            : prevVal;
          prevVal = item.__EMPTY_2
            ? arrString[0] === "Total"
              ? undefined
              : arrString[0]
            : prevVal;
          if (itemNumber) {
            var excluded = false;
            for (var i = 0; i < excludedItem.length; i++) {
              if (itemNumber.includes(excludedItem[i])) {
                excluded = true;
                break;
              }
            }
            return !excluded
              ? { Item: itemNumber, ...item }
              : { Item: undefined };
          }
          return { Item: undefined };
        });

        const filteredQb = qb.filter((qbItem) => qbItem.Item !== undefined);
        console.log(filteredQb);
        setQbData2(filteredQb);
      }
      if (tableName === "MIMOH") {
        setTable1(d);
        setFields(table1Fields);
      }
      if (tableName === "MIMORD") {
        let currentMO = null;
        const sortedTable2 = d
          .filter((item) => item.compQty === 0)
          .sort(
            (a, b) => a.mohId.localeCompare(b.mohId) || a.lineNbr - b.lineNbr
          )
          .map((item) => {
            if (currentMO !== item.mohId) {
              currentMO = item.mohId;
              const ordQty = table1.filter((mo) => mo.mohId === item.mohId);
              const prevQty = d.filter((prev) => {
                return (
                  prev.lineNbr === +item.lineNbr - 1 &&
                  prev.mohId === item.mohId
                );
              });
              const startQty =
                prevQty[0] !== undefined
                  ? prevQty[0].compQty
                  : ordQty[0].ordQty;
              return {
                ...item,
                startQty,
                runTime: item.cycleTime * startQty + item.setupTime,
              };
            }
            return;
          })
          .filter((item) => item !== undefined);

        console.log("sortedTable2");
        // console.log(sortedTable2);
        setTable2(sortedTable2);
        setFields(table2Fields);
        updateProcesses(sortedTable2);
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
        // console.log(d);
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

      const qbBackOrder =
        "qbBackOrder" in objToUpdate
          ? objToUpdate.qbBackOrder
          : item.qbBackOrder;

      // const qtyNeed =
      //   qtyMisysNeed -
      //   (totQStk + totQWip + totQOrd + ordQty - endQty + Math.abs(tempQty));

      const totalStock =
        item.totQStk +
        item.totQWip +
        item.totQOrd +
        ordQty -
        endQty -
        item.totQUsed;
      if (item.itemId === itemId) {
        masterItems[i] = {
          ...masterItems[i],
          ...objToUpdate,
          ordQty,
          endQty,
          tempQty,
          totQMisysNeed:
            qbBackOrder === 0
              ? totQMisysNeed
              : -qbBackOrder - totalStock < 0
              ? 0
              : -qbBackOrder - totalStock,
          qtyNeed,
          qbBackOrder,
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
      const qbBackOrder =
        "qbBackOrder" in objToUpdate ? objToUpdate.qbBackOrder : 0;

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
        qbBackOrder,
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
    const famData = getFamily(selectedFather === "" ? "ALL" : selectedFather);

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

  const handleCompute = async () => {
    let openMos = [];
    masterItems = [];
    // items transfer stocks
    console.log("Transferring Items Data...");
    items.map((item) => {
      const { itemId, totQStk, totQWip, totQOrd } = item;
      const qbFind = qbData.filter((qbItem) => qbItem.__EMPTY_2 === itemId);
      const qbBackOrder =
        qbFind.length > 0
          ? qbFind[0]["On Hand"] - qbFind[0]["On Sales Order"]
          : 0;
      const excess = totQStk + totQWip + totQOrd + qbBackOrder;

      updateMasterItems({
        itemId,
        totQStk,
        totQWip,
        totQOrd,
        totQExcess: excess,
        qbBackOrder,
      });
    });

    console.log(masterItems);

    console.log("Transferring Open Mo data");
    // items transfer mo qty
    table1.map((mo) => {
      const { ordQty, endQty } = mo;
      const itemId = mo.buildItem;
      const i = masterItems.filter((item) => item.itemId === itemId);

      const excess = i[0].totQExcess + ordQty - endQty;

      updateMasterItems({
        itemId,
        ordQty,
        endQty,
        totQExcess: excess,
      });
    });

    console.log("Getting Items without bom where used or w/o mo where used");
    // segregate topLevels
    masterItems.map((item) => {
      const topLevel = !isTopLevelWhereUse(item.itemId);
      // console.log(`Processing ${index + 1} of ${masterItems.length}`);
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
      filteredBoms.map((bom) => {
        // console.log(`Processing ${index + 1} of ${filteredBoms.length}`);
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

        if (bom.partId.indexOf("MA-") === -1) {
          parentChild.push({ parent: parentItem, child: bom.partId, qtyNeed });
        }

        getSubsMisysNeed(bom.partId, qtyNeed, qtyMo);
      });
    };

    // const filteredMasterItems = masterItems.filter(
    //   (item) => item.topLevel === true && item.ordQty > 0
    // );

    let parentItem = "";
    let options = [{ value: "ALL", label: "ALL" }];

    qbData.map((qbItem) => {
      const onSalesOrder = qbItem["On Hand"] - qbItem["On Sales Order"];
      console.log(`onSalesOrder ${onSalesOrder}`);
      if (onSalesOrder < 0) {
        parentItem = qbItem.__EMPTY_2;
        const i = items.filter((item) => item.itemId === parentItem);
        const additionalQty = i.length > 0 ? i[0].totQStk + i[0].totQOrd : 0;
        console.log(parentItem);

        options.push({ value: parentItem, label: parentItem });
        let parentQty = 0 - Number(onSalesOrder);
        parentQty = parentQty - additionalQty;

        getSubsMisysNeed(parentItem, 0, parentQty < 0 ? 0 : parentQty);
      }
    });

    // filteredMasterItems.map((topItem, index) => {
    //   console.log(`Processing ${index + 1} of ${filteredMasterItems.length}`);
    //   parentItem = topItem.itemId;
    //   options.push({ value: parentItem, label: parentItem });

    //   getSubsMisysNeed(topItem.itemId, 0, topItem.ordQty - topItem.endQty);
    // });
    setParentList(parentChild);

    setFatherOptions(options);

    console.log(`Finish`);
    console.log(parentChild);
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
    // console.log(sortedData);
    setLoading(false);
    setElementValue("lblMsg", "Finish");
    setTimeout(() => {
      setElementValue("lblMsg", "");
    }, 5000);
  };

  const convertDateExcel = (excelTimestamp) => {
    // 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug")
    // 2. Convert to milliseconds.
    const secondsInDay = 24 * 60 * 60;
    const excelEpoch = new Date(1899, 11, 31);
    const excelEpochAsUnixTimestamp = excelEpoch.getTime();
    const missingLeapYearDay = secondsInDay * 1000;
    const delta = excelEpochAsUnixTimestamp - missingLeapYearDay;
    const excelTimestampAsUnixTimestamp = excelTimestamp * secondsInDay * 1000;
    const parsed = excelTimestampAsUnixTimestamp + delta;

    const localDate = isNaN(parsed)
      ? "invalid Date"
      : new Date(parsed).toLocaleDateString();
    return localDate;
  };

  const getProcess = (mohId) => {
    const a = table2.filter((mo) => mo.mohId === mohId);

    return a.length !== 0 ? a[0].cmnt : "Is the MO a split?";
  };

  const getBuildItem = (mohId) => {
    const result = table1.filter((item) => {
      return item.mohId === mohId;
    });

    return result[0].buildItem;
  };
  const getLocId = (mohId) => {
    const result = table1.filter((item) => {
      return item.mohId === mohId;
    });
    return result[0].locId;
  };
  const getJobId = (mohId) => {
    const result = table1.filter((item) => {
      return item.mohId === mohId;
    });
    return result[0].jobId ? result[0].jobId : "unassigned";
  };
  const getDueDate = (mohId) => {
    const result = table1.filter((item) => {
      return item.mohId === mohId;
    });

    return convertDateExcel(result[0].endDt);
  };

  const getDescr = (buildItem) => {
    const result = items.filter((item) => {
      return item.itemId === buildItem;
    });

    return result[0].descr;
  };
  // API
  const updateProcesses = async (table2) => {
    if (del === true) {
      await deleteManufacturingOrders("ALL", "token");
    }
    setDel(!del);
    // map table 1
    table1.map(async (item) => {
      // check if exist in table 2
      const filteredTable2 = table2.filter((mo) => mo.mohId === item.mohId);

      if (filteredTable2.length !== 0) {
        const {
          mohId,
          opCode,
          wcId,
          lineNbr,
          cycleTime,
          setupTime,
          startQty,
          compQty,
          runTime,
          cmnt,
        } = filteredTable2[0];

        const buildItem = getBuildItem(mohId);
        const descr = getDescr(buildItem);
        const locId = getLocId(mohId);
        const dueDate = Date.parse(getDueDate(mohId));
        const jobId = getJobId(mohId);

        await createManufacturingOrder({
          mohId,
          dueDate,
          jobId,
          locId,
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
          createdAt: Date.now(),
        });
      }
      if (filteredTable2.length === 0) {
        const mohId = item.mohId;
        const opCode = "☹️";
        const wcId = "LOST IN SPACE";
        const lineNbr = 0;
        const cycleTime = 0;
        const setupTime = 0;
        const startQty = 0;
        const compQty = 0;
        const runTime = 0;
        const cmnt = "is this a SPLIT? See Misys";

        const buildItem = getBuildItem(mohId);
        const descr = getDescr(buildItem);
        const locId = item.locId ? item.locId : "n/a";
        const jobId = item.jobId ? item.jobId : "n/a";
        const dueDate = Date.parse(getDueDate(mohId));

        await createManufacturingOrder({
          mohId,
          dueDate,
          jobId,
          locId,
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
          createdAt: Date.now(),
        });
      }
    });
  };

  const updateQbItems = async () => {
    await deleteQbItems(orgId, "token");
    qbData.map(async (qbItem, index) => {
      setTimeout(async () => {
        const a = await createQbItem({
          item: qbItem.__EMPTY_2,
          onHand: qbItem["On Hand"],
          onSalesOrder: qbItem["On Sales Order"],
          available: qbItem.Available,
          createdAt: Date.now(),
          orgId,
        });
        console.log(a);
      }, index * 10);
    });
  };

  const updateShipping = async () => {
    await deleteShippings(orgId, "token");
    qbData2.map(async (qbItem, index) => {
      setTimeout(async () => {
        const { Item, Qty, BackOrdered, Invoiced, Name, Num, Memo } = qbItem;
        const dt = convertDateExcel(qbItem["Ship Date"]);

        const a = await createShipping({
          item: Item,
          qty: Qty,
          backOrdered: BackOrdered,
          invoiced: Invoiced,
          name: Name,
          num: Num,
          po: qbItem["P. O. #"],
          shipDate: dt,
          memo: Memo,
          createdAt: Date.now(),
          orgId,
        });
        console.log(a);
      }, index * 10);
    });
  };
  const updateWcsNeedItems = async (needItems) => {
    await updateItemsCount(
      "661c53f779d35b95b6615a15",
      { itemsCount: needItems.length },
      "token"
    );
    await deleteWcsNeedItems("ALL", "token");

    await needItems.map(async (needItem, index) => {
      setTimeout(async () => {
        const {
          itemId,
          totQStk,
          totQWip,
          totQUsed,
          totQOrd,
          ordQty,
          endQty,
          totQMisysNeed,
          totQExcess,
          qbBackOrder,
        } = needItem;

        const a = await createWcsNeedItem({
          item: itemId,
          qbBackOrder,
          stock: totQStk,
          wip: totQWip,
          purchase: totQOrd,
          allocated: totQUsed,
          openMoQty: ordQty - endQty,
          need: totQMisysNeed,
          excess: totQExcess,
          createdAt: Date.now(),
        });
        console.log(a);
      }, index * 10);
    });

    const filteredParentChild = parentList.filter((item) => item.qtyNeed > 0);
    const delData = await deleteNeedBreakdowns("WCS", "token");
    console.log(delData);
    filteredParentChild.map(async (item, index) => {
      setTimeout(async () => {
        const res = await createNeedBreakdown({
          parentItem: item.parent,
          childItem: item.child,
          qtyNeed: item.qtyNeed,
          orgId,
        });
        console.log(res);
      }, index * 10);
    });

    updateShipping();
    // updateQbItems();
  };

  const updateAxsNeedItems = async (needItems) => {
    await updateItemsCount(
      "661c53fd79d35b95b6615a16",
      { itemsCount: needItems.length },
      "token"
    );
    await deleteAxsNeedItems("ALL", "token");

    await needItems.map(async (needItem, index) => {
      setTimeout(async () => {
        const {
          itemId,
          totQStk,
          totQWip,
          totQUsed,
          totQOrd,
          ordQty,
          endQty,
          totQMisysNeed,
          totQExcess,
          qbBackOrder,
        } = needItem;
        setMsg(itemId);
        await createAxsNeedItem({
          item: itemId,
          qbBackOrder,
          stock: totQStk,
          wip: totQWip,
          purchase: totQOrd,
          allocated: totQUsed,
          openMoQty: ordQty - endQty,
          need: totQMisysNeed,
          excess: totQExcess,
          createdAt: Date.now(),
        });
      }, index * 10);
    });

    const filteredParentChild = parentList.filter((item) => item.qtyNeed > 0);
    const delData = await deleteNeedBreakdowns("AXS", "token");
    console.log(delData);
    filteredParentChild.map(async (item, index) => {
      setTimeout(async () => {
        const res = await createNeedBreakdown({
          parentItem: item.parent,
          childItem: item.child,
          qtyNeed: item.qtyNeed,
          orgId,
        });
        console.log(res);
      }, index * 10);
    });
    updateShipping();
    // updateQbItems();
  };

  return (
    <div style={{ width: "100%", maxHeight: "100vh" }}>
      <div> {msg}</div>
      <input
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
      ></input>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <button onClick={closeModal}>close</button>
        {modalData.length > 0 && (
          <div>Item Number: {modalData[0].buildItem}</div>
        )}

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
              <div>LOCATION {mo.locId}</div>
              <div>JOB {mo.jobId}</div>
              <div>MO# {mo.mohId}</div>
              <div>QTY {mo.ordQty}</div>
              <div>PROCESS {getProcess(mo.mohId)}</div>
              <div>DUE DATE {convertDateExcel(mo.endDt)}</div>
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
      <div>
        {password === "wcs12345" && (
          <button onClick={() => updateWcsNeedItems(data)}> wcs</button>
        )}
        {password === "wcs12345" && (
          <button onClick={() => updateAxsNeedItems(data)}> axs</button>
        )}
      </div>
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
                values={fatherOptions.length > 0 ? [fatherOptions[0]] : []}
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
                            {key === "totQUsed" ? "Allocated" : key}
                          </td>
                        );
                      }
                    })}
                  </tr>

                  {data.map((item, index) => {
                    return (
                      <tr
                        key={index}
                        onContextMenu={(e) => {
                          e.preventDefault(); // prevent the default behaviour when right clicked
                          const data = [];
                          const itemInfos = table1.filter(
                            (mo) => item.itemId === mo.buildItem
                          );
                          data.push(...itemInfos);
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
                                    (item[key3] < 0 &&
                                      key3 === "qbBackOrder") ||
                                    item["itemId"] === selectedFather
                                      ? "red"
                                      : "black",
                                  fontSize:
                                    (item[key3] > 0 &&
                                      key3 === "totQMisysNeed") ||
                                    (item[key3] < 0 &&
                                      key3 === "qbBackOrder") ||
                                    item["itemId"] === selectedFather
                                      ? "20px"
                                      : "16px",
                                }}
                              >
                                {typeof item[key3] === "boolean"
                                  ? item[key3].toString()
                                  : typeof item[key3] === "number"
                                  ? item[key3].toFixed(2) < 0
                                    ? key3 === "qbBackOrder"
                                      ? Math.abs(item[key3]).toFixed(2)
                                      : (0).toFixed(2)
                                    : item[key3].toFixed(2)
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
