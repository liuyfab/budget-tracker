

//variable for the database
let db;
//create a connection to IndexedDB database and set it to version 1
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    //  locally scoped connection to the db &
    // create the object store(table) called`offline-events`, and set it to have an auto incrementing primary key 
  
    db.createObjectStore('offline_events', { autoIncrement: true });
  };


  request.onsuccess = function(event) {
    //saves database reference to the global db variable
    db = event.target.result;

    //if app is online, run uploadActions() function to send all local db data to api
    if (navigator.onLine) {
        uploadActions();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with the database with read & write permission
    const transaction = db.transaction(['offline_events'], 'readwrite');
    // access the budgetObjectStore in indexedDB where the record will go
    const budgetEntryObjectStore = transaction.objectStore('offline_events');
    // add the record 
    budgetEntryObjectStore.add(record);
  }
  
function uploadActions() {
    const transaction = db.transaction(['offline_events'], 'readwrite');
    const actionsObjectStore = transaction.objectStore('offline_events');
 
//get all records from store and set to a variable
const getAll = actionsObjectStore.getAll();

//upon a successful .getAll() execution, run this function
getAll.onsuccess = function() {
    //if there was data in indexedDB's store, use the bulk upload route to send it all to the server
    if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['offline_events'], 'readwrite');
                    const actionsObjectStore = transaction.objectStore('offline_events');
                    actionsObjectStore.clear();

                    alert('Transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//listen for online connection
window.addEventListener('online', uploadEvents);