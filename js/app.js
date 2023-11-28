// jQuery is a JS library designed to simplify working with the DOM (Document Object Model) and event handling.
// This code runs the function createBugList() only after the DOM has completely loaded, ensuring safe DOM element interaction.
$(document).ready(createBugList());

// Auto-focus on input of add task modal
$("#add-bug-container").on("shown.bs.modal", function () {
  $("#new-bug-description").trigger("focus");
});

async function createBugList() {
  try {
    // get the first account provided by Ganache
    await getAccount();
    // Create a new contract object using the ABI and bytecode
    contract = new web3.eth.Contract(contractABI, contractAddress);

    try {
      bugNum = await contract.methods
        .getBugCount()
        .call({ from: web3.eth.defaultAccount });
      console.log("bug num", bugNum);
      // make sure there is at least one bug present
      if (bugNum != 0) {
        // fetch all of the bugs and create the list to display
        let bugIndex = 0;
        while (bugIndex < bugNum) {
          try {
            let bug = await contract.methods
              .getBug(bugIndex)
              .call({ from: web3.eth.defaultAccount });
            if (bug.description !== "") {
              // addBugToList adds a bug as a child of the <ul> tag
              addBugToList(bugIndex, bug.description, bug.id, bug.status);
            } else {
              console.log("The index is empty: " + bugIndex);
            }
          } catch {
            console.log("Failed to get bug: " + bugIndex);
          }
          bugIndex++;
        }
        // update the bug count
        updateBugCount();
      }
    } catch {
      console.log("Failed to retrieve bug count from blockchain.");
    }
  } catch {
    console.log("Failed to retrieve default account from blockchain.");
  }
}

function addBugToList(id, description, bugId, status) {
  // get the id of the <ul> then append children to it
  let list = document.getElementById("list");
  let item = document.createElement("li");
  item.classList.add(
    "list-group-item",
    "border-0",
    "d-flex",
    "justify-content-between",
    "align-items-center"
  );
  item.id = "item-" + id;
  // add text to the <li> element
  let bug = document.createElement("div");
  bug.innerHTML = `<strong>ID:</strong> ${bugId}, <strong>Description:</strong> ${description}, <strong>Status:</strong> ${status}`;
  // create a select element for Bug Status
  let statusSelect = document.createElement("select");
  statusSelect.id = "item-" + id + "-status";
  statusSelect.classList.add("form-control");
  statusSelect.value = status;
  statusSelect.options.add(new Option("Reported", "Reported"));
  statusSelect.options.add(new Option("In Progress", "In Progress"));
  statusSelect.options.add(new Option("Done", "Done"));
  statusSelect.onchange = function () {
    changeBugStatus(statusSelect.id, id);
  };

  // if status is true then add bug-done class to <li> element so that the text font has a line through
  if (status) {
    item.classList.add("bug-done");
  }

  // Set color class based on bug status
  if (status === "Reported") {
    item.classList.add("status-reported");
  } else if (status === "In Progress") {
    item.classList.add("status-in-progress");
  } else if (status === "Done") {
    item.classList.add("status-done");
  }

  list.appendChild(item);
  item.appendChild(bug);
  item.appendChild(statusSelect);
}

// change the status of the bug stored on the blockchain
async function changeBugStatus(id, bugIndex) {
  // get select element
  let statusSelect = document.getElementById(id);
  // get the id of the <li> element
  let textId = id.replace("-status", "");
  // get the <li> element
  let text = document.getElementById(textId);
  try {
    await contract.methods
      .updateBugStatus(bugIndex, statusSelect.value === "Done")
      .send({ from: web3.eth.defaultAccount });
    if (statusSelect.value === "Done") {
      text.classList.add("bug-done");
    } else {
      text.classList.remove("bug-done");
    }

    // Remove previous color class
    text.classList.remove(
      "status-reported",
      "status-in-progress",
      "status-done"
    );

    // Set color class based on bug status
    if (statusSelect.value === "Reported") {
      text.classList.add("status-reported");
    } else if (statusSelect.value === "In Progress") {
      text.classList.add("status-in-progress");
    } else if (statusSelect.value === "Done") {
      text.classList.add("status-done");
    }
  } catch (error) {
    console.log("Failed to change status of bug. Index: " + bugIndex);
  }
}

async function addBug(description, bugId, status) {
  let form = document.getElementById("add-bug-container");
  document.getElementById("new-bug-description").value = "";
  document.getElementById("new-bug-id").value = "";
  form.classList.remove("was-validated");

  try {
    await contract.methods
      .addBug(description, bugId, status)
      .send({ from: web3.eth.defaultAccount });

    let bugNum = await contract.methods
      .getBugCount()
      .call({ from: web3.eth.defaultAccount });

    addBugToList(bugNum, description, bugId, status);
  } catch {
    console.log("Failed to save bug to blockchain.");
  }
}
