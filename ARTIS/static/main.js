document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const progressBar = document.getElementById("uploadProgressBar");
  const fileList = document.getElementById("fileList");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const paginationControls = document.getElementById("paginationControls");

  // Toast elements
  const statusToastEl = document.getElementById("statusToast");
  const statusToastBodyEl = document.getElementById("statusToastBody");
  const statusToast = new bootstrap.Toast(statusToastEl);

  // Track current page in JS
  let currentPage = 1;
  let totalFiles = 0;
  let pageSize = 20;

  // Show the toast notification
  function showToast(message) {
    statusToastBodyEl.textContent = message;
    statusToast.show();
  }

  // Refresh the file list for the current page
  function refreshFileList(page = 1) {
    fetch(`/files?page=${page}`)
      .then((response) => response.json())
      .then((data) => {
        const files = data.files;
        totalFiles = data.total_files;
        pageSize = data.page_size;
        currentPage = data.current_page;

        // Clear existing items
        fileList.innerHTML = "";

        // Build list
        if (files.length > 0) {
          files.forEach((filename) => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            // File name
            const span = document.createElement("span");
            span.textContent = filename;
            li.appendChild(span);

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("btn", "btn-sm", "btn-danger");
            deleteBtn.title = "Delete File";
            deleteBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                   class="bi bi-trash3" viewBox="0 0 16 16">
                <path d="M6.5 1.5v1h3v-1a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V3H2V1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5Z"/>
                <path d="M3 3h10v1H3V3Zm1 2h1v9H4V5Zm3 0h1v9H7V5Zm3 0h1v9h-1V5Z"/>
              </svg>
            `;
            deleteBtn.onclick = () => deleteFile(filename);

            li.appendChild(deleteBtn);
            fileList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.classList.add("list-group-item");
          li.textContent = "No files uploaded yet.";
          fileList.appendChild(li);
        }

        // Update pagination controls
        updatePaginationControls();
      })
      .catch((err) => {
        console.error("Error fetching file list:", err);
        showToast(`Error fetching file list: ${err}`);
      });
  }

  // Delete a file
  function deleteFile(filename) {
    fetch("/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: filename }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          showToast(data.message);
          refreshFileList(currentPage);
        } else if (data.error) {
          showToast(`Error: ${data.error}`);
        }
      })
      .catch((err) => {
        showToast(`Error: ${err}`);
      });
  }

  // Update pagination buttons (Prev/Next)
  function updatePaginationControls() {
    // If no files, hide pagination entirely
    if (totalFiles === 0) {
      paginationControls.style.display = "none";
      return;
    }
    paginationControls.style.display = "flex";

    // Determine if there's a next page
    const totalPages = Math.ceil(totalFiles / pageSize);

    // If we're on page 1, disable previous
    prevPageBtn.disabled = (currentPage <= 1);
    // If we're on last page, disable next
    nextPageBtn.disabled = (currentPage >= totalPages);
  }

  // Event handlers for pagination buttons
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      refreshFileList(currentPage - 1);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    // Check total pages
    const totalPages = Math.ceil(totalFiles / pageSize);
    if (currentPage < totalPages) {
      refreshFileList(currentPage + 1);
    }
  });

  // Handle file upload
  uploadBtn.addEventListener("click", () => {
    const files = fileInput.files;
    if (!files.length) {
      showToast("Please choose at least one file to upload.");
      return;
    }

    // Reset progress bar
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    progressBar.setAttribute("aria-valuenow", 0);

    // Prepare FormData
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }

    // Create XHR and track progress
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percentComplete + "%";
        progressBar.textContent = percentComplete + "%";
        progressBar.setAttribute("aria-valuenow", percentComplete);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // Upload complete - refresh file list on the same page
        refreshFileList(currentPage);
        showToast("File(s) uploaded successfully!");
        // Reset file input
        fileInput.value = "";
        // Reset progress bar
        progressBar.style.width = "0%";
        progressBar.textContent = "0%";
        progressBar.setAttribute("aria-valuenow", 0);
      }
    };

    xhr.open("POST", "/upload", true);
    xhr.send(formData);
  });

  // On initial load, fetch page 1
  refreshFileList(1);
});
