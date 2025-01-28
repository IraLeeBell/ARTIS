document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const progressBar = document.getElementById("uploadProgressBar");
    const fileList = document.getElementById("fileList");
  
    // Function to update the file list in the UI
    function refreshFileList() {
      fetch("/files")
        .then((response) => response.json())
        .then((files) => {
          // Clear existing items
          fileList.innerHTML = "";
  
          if (files.length > 0) {
            files.forEach((filename) => {
              const li = document.createElement("li");
              li.classList.add("list-group-item");
              li.textContent = filename;
              fileList.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.textContent = "No files uploaded yet.";
            fileList.appendChild(li);
          }
        })
        .catch((err) => {
          console.error("Error fetching file list:", err);
        });
    }
  
    // Event handler for the Upload button
    uploadBtn.addEventListener("click", () => {
      const files = fileInput.files;
      if (!files.length) {
        alert("Please choose at least one file to upload.");
        return;
      }
  
      // Reset the progress bar
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
          // Upload complete - refresh file list
          refreshFileList();
          alert("Upload successful!");
          // Optionally reset file input
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
  });
  