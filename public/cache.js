let cache;
const request = window.indexedDB.open("Budget", 1);

request.onupgradeneeded = event => {
    cache = event.target.result;
    const storePend = cache.createObjectStore("pending", {autoIncrement :true});
    storePend.createIndex("statusIndex", "status");
};

request.onsuccess = event => {
    cache = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = event => {console.log(event)};

function save (record) {
    cache = request.result;
    const transaction = cache.transaction(["pending"], "readwrite");
    const transPend = transaction.objectStore("pending");

    transPend.add(record);
};

function checkDatabase() {
    const checkTrans = cache.transaction(["pending"], "readwrite");
    const checking = checkTrans.objectStore("pending");
    const getAll = checking.getAll();
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch ("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then( response => response.json())
            .then(() => {
                const transFin = cache.transaction(["pending"], "readwrite");
                const finish = transFin.objectStore("pending");
                finish.clear();
            });
        }
    };
}

window.addEventListener("online", checkDatabase);