import {
  inputEnabled,
  setDiv,
  message,
  setToken,
  token,
  enableInput,
} from "./index.js";
import { showLoginRegister } from "./loginRegister.js";
import { showAddEdit } from "./addEdit.js";

let jobsDiv = null;
let jobsTable = null;
let jobsTableHeader = null;

let searchInput = null;
let statusFilter = null;
let paginationDiv = null;

let currentPage = 1;

export const handleJobs = () => {
  jobsDiv = document.getElementById("jobs");
  const logoff = document.getElementById("logoff");
  const addJob = document.getElementById("add-job");
  jobsTable = document.getElementById("jobs-table");
  jobsTableHeader = document.getElementById("jobs-table-header");

  searchInput = document.getElementById("search");
  statusFilter = document.getElementById("filter-status");
  paginationDiv = document.getElementById("pagination");

  jobsDiv.addEventListener("click", async (e) => {
    if (inputEnabled && e.target.nodeName === "BUTTON") {
      if (e.target === addJob) {
        showAddEdit(null);
      } else if (e.target === logoff) {
        setToken(null);

        message.textContent = "You have been logged off.";

        jobsTable.replaceChildren([jobsTableHeader]);

        showLoginRegister();
      } else if (e.target.classList.contains("editButton")) {
        message.textContent = "";
        showAddEdit(e.target.dataset.id);
      } else if (e.target.classList.contains("deleteButton")) {
        enableInput(false);

        try {
          const response = await fetch(`/api/v1/jobs/${e.target.dataset.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.status === 200) {
            message.textContent = data.msg;
            showJobs(); // refresh table
          } else {
            message.textContent = data.msg;
          }
        } catch (err) {
          console.log(err);
          message.textContent = "A communication error occurred.";
        }

        enableInput(true);
      }
    }
  });

  /* SEARCH */
  const searchButton = document.getElementById("search-button");

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      currentPage = 1;
      showJobs();
    });
  }
};

export const showJobs = async () => {
  try {
    enableInput(false);

      const search = searchInput ? searchInput.value : "";
      const status = statusFilter ? statusFilter.value : "";

      let url = `/api/v1/jobs?page=${currentPage}&limit=5`;

      if (search) {
        url += `&search=${search}`;
      }

      if (status) {
        url += `&status=${status}`;
      }

    const response = await fetch(/*   "/api/v1/jobs"   */ url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    let children = [jobsTableHeader];

    if (response.status === 200) {
      if (data.count === 0) {
        jobsTable.replaceChildren(...children); // clear this for safety
      } else {
        for (let i = 0; i < data.jobs.length; i++) {
          let rowEntry = document.createElement("tr");

          let editButton = `<td><button type="button" class="editButton" data-id=${data.jobs[i]._id}>edit</button></td>`;
          let deleteButton = `<td><button type="button" class="deleteButton" data-id=${data.jobs[i]._id}>delete</button></td>`;
          let rowHTML = `
            <td>${data.jobs[i].company}</td>
            <td>${data.jobs[i].position}</td>
            <td>${data.jobs[i].status}</td>
            <div>${editButton}${deleteButton}</div>`;

          rowEntry.innerHTML = rowHTML;
          children.push(rowEntry);
        }
        jobsTable.replaceChildren(...children);
      }
      createPagination(data.numOfPages);
    } else {
      message.textContent = data.msg;
    }
  } catch (err) {
    console.log(err);
    message.textContent = "A communication error occurred.";
  }
  enableInput(true);
  setDiv(jobsDiv);
};

/* PAGINATION */

const createPagination = (numPages) => {

  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";

  for (let i = 1; i <= numPages; i++) {

    const btn = document.createElement("button");

    btn.textContent = i;

    if (i === currentPage) {
      btn.style.fontWeight = "bold";
    }

    btn.addEventListener("click", () => {
      currentPage = i;
      showJobs();
    });

    paginationDiv.appendChild(btn);

  }

};