const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    let db = event.target.result;
    db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online before reading from db
    if (navigator.onLine) {
        uploadTransactions();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(["new_transaction"], "readwrite");
    const store = transaction.objectStore("new_transaction");

    store.add(record);
};

function uploadTransactions() {
    const transaction = db.transaction(["new_transaction"], "readwrite");
    const store = transaction.objectStore("new_transaction");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            }).then(response => {
                return response.json();
            }).then(() => {
                // delete records if successful
                const transaction = db.transaction(["new_transaction"], "readwrite");
                const store = transaction.objectStore("new_transaction");
                store.clear();
            });
        }
    };
};

// listen for app coming back online
window.addEventListener("online", uploadTransactions);