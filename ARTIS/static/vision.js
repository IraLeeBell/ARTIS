// document.addEventListener("DOMContentLoaded", () => {
//     const cvFileList = document.getElementById("cvFileList");
//     const cvResults = document.getElementById("cvResults");
//     // Add a reference to the thumbnail <img> (make sure you have <img id="cvThumbnail"> in your HTML!)
//     const cvThumbnail = document.getElementById("cvThumbnail");
  
//     // Toast for status
//     const statusToastEl = document.getElementById("statusToast");
//     const statusToastBodyEl = document.getElementById("statusToastBody");
//     const statusToast = new bootstrap.Toast(statusToastEl);
  
//     function showToast(message) {
//       statusToastBodyEl.textContent = message;
//       statusToast.show();
//     }
  
//     // Refresh file list (reuse /files endpoint, ignoring pagination for simplicity)
//     function refreshCVFileList() {
//       fetch("/files?page=1")
//         .then((response) => response.json())
//         .then((data) => {
//           const files = data.files || [];
//           cvFileList.innerHTML = "";
  
//           if (files.length === 0) {
//             const li = document.createElement("li");
//             li.classList.add("list-group-item");
//             li.textContent = "No files uploaded yet.";
//             cvFileList.appendChild(li);
//             return;
//           }
  
//           files.forEach((filename) => {
//             const li = document.createElement("li");
//             li.classList.add(
//               "list-group-item",
//               "d-flex",
//               "justify-content-between",
//               "align-items-center"
//             );
  
//             // Filename text
//             const span = document.createElement("span");
//             span.textContent = filename;
//             li.appendChild(span);
  
//             // Button container
//             const buttonGroup = document.createElement("div");
  
//             // Determine file extension
//             const ext = filename.split(".").pop().toLowerCase();
  
//             // Decide if we should show OCR or Analyze
//             const supportedForOCR = ["jpg", "jpeg", "png", "bmp", "pdf", "tiff"];
//             const supportedForAnalysis = ["jpg", "jpeg", "png", "bmp"];
  
//             // OCR button
//             if (supportedForOCR.includes(ext)) {
//               const ocrBtn = document.createElement("button");
//               ocrBtn.classList.add("btn", "btn-sm", "btn-warning", "me-2");
//               ocrBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
//                   class="bi bi-eyeglasses" viewBox="0 0 16 16">
//                 <path d="M8.5 2c.828 0 1.5.672 1.5 1.5h1c0-1.378-1.122-2.5-2.5-2.5S6 2.122 6 3.5h1C7 2.672 7.672 2 8.5 2z"/>
//                 <path d="M3.5 4.5c.828 0 1.5.672 1.5 1.5h1a2.5 2.5 0 0 0-5 0h1c0-.828.672-1.5 1.5-1.5z"/>
//                 <path d="M11 6c0-.828.672-1.5 1.5-1.5S14 5.172 14 6h1a2.5 2.5 0 0 0-5 0h1z"/>
//                 <path d="M0 6.5v1h2v-1H0zm14 0v1h2v-1h-2z"/>
//               </svg> OCR`;
//               ocrBtn.onclick = () => doOCR(filename);
//               buttonGroup.appendChild(ocrBtn);
//             }
  
//             // Image Analysis button (and Content Check)
//             if (supportedForAnalysis.includes(ext)) {
//               const analyzeBtn = document.createElement("button");
//               analyzeBtn.classList.add("btn", "btn-sm", "btn-success");
//               analyzeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
//                   class="bi bi-image" viewBox="0 0 16 16">
//                 <path d="M8.002 5.5c-.828 0-1.49.662-1.49 1.48 0 .818.662 1.48 1.49 1.48.827 0 1.49-.662 1.49-1.48 0-.818-.663-1.48-1.49-1.48z"/>
//                 <path d="M2.002.5a2 2 0 0 0-2 2v11.999a2 2 0 0 0 2 2h11.996a2 2 0 0 0 2-2V2.5a2 2 0 0 0-2-2H2.002zm0 1h11.996c.552 0 1 .448 1 1v6.007l-2.375-2.376a1.5 1.5 0 0 0-2.121 0l-4.128 4.128-1.11-1.11a1.5 1.5 0 0 0-2.12 0L1.002 12.914V2.5c0-.552.447-1 1-1z"/>
//               </svg> Analyze`;
//               analyzeBtn.onclick = () => doAnalyze(filename);
//               buttonGroup.appendChild(analyzeBtn);
  
//               // Content Check
//               const contentCheckBtn = document.createElement("button");
//               contentCheckBtn.classList.add("btn", "btn-sm", "btn-danger", "ms-2");
//               contentCheckBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
//                   class="bi bi-exclamation-circle" viewBox="0 0 16 16">
//                 <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM7.001-.7c.414-.192.696-.226.696.243l.276 3.451C7.995 3.681 7.562 4 7.312 4s-.683-.319-.66-.854l.278-3.45c0-.47.283-.435.71-.245zM7 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>
//               </svg> Content Check`;
//               contentCheckBtn.onclick = () => doContentCheck(filename);
//               buttonGroup.appendChild(contentCheckBtn);
//             }
  
//             li.appendChild(buttonGroup);
//             cvFileList.appendChild(li);
//           });
//         })
//         .catch((err) => {
//           console.error("Error fetching file list:", err);
//           showToast(`Error fetching file list: ${err}`);
//         });
//     }
  
//     // ========== FUNCTIONS ==========
  
//     // OCR
//     function doOCR(filename) {
//       fetch(`/vision/ocr?filename=${encodeURIComponent(filename)}`)
//         .then((response) => response.json())
//         .then((data) => {
//           if (data.error) {
//             showToast(`Error: ${data.error}`);
//           } else {
//             cvResults.value = data.ocr_text || "No text found.";
//             showThumbnailIfImage(filename);
//           }
//         })
//         .catch((err) => {
//           showToast(`Error: ${err}`);
//         });
//     }
  
//     // Image Analysis
//     function doAnalyze(filename) {
//       fetch(`/vision/analyze?filename=${encodeURIComponent(filename)}`)
//         .then((response) => response.json())
//         .then((data) => {
//           if (data.error) {
//             showToast(`Error: ${data.error}`);
//           } else {
//             cvResults.value = JSON.stringify(data, null, 2);
//             showThumbnailIfImage(filename);
//           }
//         })
//         .catch((err) => {
//           showToast(`Error: ${err}`);
//         });
//     }
  
//     // Adult/Racy/Gory Content Check
//     function doContentCheck(filename) {
//       fetch(`/vision/contentcheck?filename=${encodeURIComponent(filename)}`)
//         .then((response) => response.json())
//         .then((data) => {
//           if (data.error) {
//             showToast(`Error: ${data.error}`);
//           } else {
//             cvResults.value = JSON.stringify(data, null, 2);
//             showThumbnailIfImage(filename);
//           }
//         })
//         .catch((err) => {
//           showToast(`Error: ${err}`);
//         });
//     }
  
//     // Show a thumbnail if the file is an image
//     function showThumbnailIfImage(filename) {
//       // If you have an <img id="cvThumbnail"> in computervision.html
//       if (!cvThumbnail) return;
  
//       const ext = filename.split(".").pop().toLowerCase();
//       const imageExts = ["jpg", "jpeg", "png", "bmp"];
  
//       if (imageExts.includes(ext)) {
//         // Endpoint that serves the raw image from Azure
//         cvThumbnail.src = `/thumbnail?filename=${encodeURIComponent(filename)}`;
//         cvThumbnail.alt = filename;
//       } else {
//         // Clear or show placeholder
//         cvThumbnail.src = "";
//         cvThumbnail.alt = "No image preview available.";
//       }
//     }
  
//     // Initial load
//     refreshCVFileList();
//   });

document.addEventListener("DOMContentLoaded", () => {
    const cvFileList = document.getElementById("cvFileList");
    const cvResults = document.getElementById("cvResults");
    const cvThumbnail = document.getElementById("cvThumbnail");
  
    // Toast for status
    const statusToastEl = document.getElementById("statusToast");
    const statusToastBodyEl = document.getElementById("statusToastBody");
    const statusToast = new bootstrap.Toast(statusToastEl);
  
    function showToast(message) {
      statusToastBodyEl.textContent = message;
      statusToast.show();
    }
  
    // ========== KEEPING YOUR EXACT BUTTON / LAYOUT CODE BELOW ==========
  
    // Refresh file list (reuse /files endpoint, ignoring pagination for simplicity)
    function refreshCVFileList() {
      fetch("/files?page=1")
        .then((response) => response.json())
        .then((data) => {
          const files = data.files || [];
          cvFileList.innerHTML = "";
  
          if (files.length === 0) {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.textContent = "No files uploaded yet.";
            cvFileList.appendChild(li);
            return;
          }
  
          files.forEach((filename) => {
            const li = document.createElement("li");
            li.classList.add(
              "list-group-item",
              "d-flex",
              "justify-content-between",
              "align-items-center"
            );
  
            // Filename text
            const span = document.createElement("span");
            span.textContent = filename;
            li.appendChild(span);
  
            // Button container
            const buttonGroup = document.createElement("div");
  
            // Determine file extension
            const ext = filename.split(".").pop().toLowerCase();
  
            // Decide if we should show OCR or Analyze
            const supportedForOCR = ["jpg", "jpeg", "png", "bmp", "pdf", "tiff"];
            const supportedForAnalysis = ["jpg", "jpeg", "png", "bmp"];
  
            // OCR button
            if (supportedForOCR.includes(ext)) {
              const ocrBtn = document.createElement("button");
              ocrBtn.classList.add("btn", "btn-sm", "btn-warning", "me-2");
              ocrBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-eyeglasses" viewBox="0 0 16 16">
                <path d="M8.5 2c.828 0 1.5.672 1.5 1.5h1c0-1.378-1.122-2.5-2.5-2.5S6 2.122 6 3.5h1C7 2.672 7.672 2 8.5 2z"/>
                <path d="M3.5 4.5c.828 0 1.5.672 1.5 1.5h1a2.5 2.5 0 0 0-5 0h1c0-.828.672-1.5 1.5-1.5z"/>
                <path d="M11 6c0-.828.672-1.5 1.5-1.5S14 5.172 14 6h1a2.5 2.5 0 0 0-5 0h1z"/>
                <path d="M0 6.5v1h2v-1H0zm14 0v1h2v-1h-2z"/>
              </svg> OCR`;
              ocrBtn.onclick = () => doOCR(filename);
              buttonGroup.appendChild(ocrBtn);
            }
  
            // Image Analysis button (and Content Check)
            if (supportedForAnalysis.includes(ext)) {
              const analyzeBtn = document.createElement("button");
              analyzeBtn.classList.add("btn", "btn-sm", "btn-success");
              analyzeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-image" viewBox="0 0 16 16">
                <path d="M8.002 5.5c-.828 0-1.49.662-1.49 1.48 0 .818.662 1.48 1.49 1.48.827 0 1.49-.662 1.49-1.48 0-.818-.663-1.48-1.49-1.48z"/>
                <path d="M2.002.5a2 2 0 0 0-2 2v11.999a2 2 0 0 0 2 2h11.996a2 2 0 0 0 2-2V2.5a2 2 0 0 0-2-2H2.002zm0 1h11.996c.552 0 1 .448 1 1v6.007l-2.375-2.376a1.5 1.5 0 0 0-2.121 0l-4.128 4.128-1.11-1.11a1.5 1.5 0 0 0-2.12 0L1.002 12.914V2.5c0-.552.447-1 1-1z"/>
              </svg> Analyze`;
              analyzeBtn.onclick = () => doAnalyze(filename);
              buttonGroup.appendChild(analyzeBtn);
  
              // Content Check
              const contentCheckBtn = document.createElement("button");
              contentCheckBtn.classList.add("btn", "btn-sm", "btn-danger", "ms-2");
              contentCheckBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-exclamation-circle" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM7.001-.7c.414-.192.696-.226.696.243l.276 3.451C7.995 3.681 7.562 4 7.312 4s-.683-.319-.66-.854l.278-3.45c0-.47.283-.435.71-.245zM7 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>
              </svg> Content Check`;
              contentCheckBtn.onclick = () => doContentCheck(filename);
              buttonGroup.appendChild(contentCheckBtn);
            }
  
            li.appendChild(buttonGroup);
            cvFileList.appendChild(li);
          });
        })
        .catch((err) => {
          console.error("Error fetching file list:", err);
          showToast(`Error fetching file list: ${err}`);
        });
    }
  
    // ==================== YOUR FUNCTIONS, UNCHANGED ====================
  
    // OCR
    function doOCR(filename) {
      fetch(`/vision/ocr?filename=${encodeURIComponent(filename)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            showToast(`Error: ${data.error}`);
          } else {
            cvResults.value = data.ocr_text || "No text found.";
            // Show thumbnail for images
            showThumbnailIfImage(filename);
          }
        })
        .catch((err) => {
          showToast(`Error: ${err}`);
        });
    }
  
    // Image Analysis
    function doAnalyze(filename) {
      fetch(`/vision/analyze?filename=${encodeURIComponent(filename)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            showToast(`Error: ${data.error}`);
          } else {
            cvResults.value = JSON.stringify(data, null, 2);
            // Show thumbnail for images
            showThumbnailIfImage(filename);
          }
        })
        .catch((err) => {
          showToast(`Error: ${err}`);
        });
    }
  
    // Adult/Racy/Gory Content Check
    function doContentCheck(filename) {
      fetch(`/vision/contentcheck?filename=${encodeURIComponent(filename)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            showToast(`Error: ${data.error}`);
          } else {
            cvResults.value = JSON.stringify(data, null, 2);
            // Show thumbnail for images
            showThumbnailIfImage(filename);
          }
        })
        .catch((err) => {
          showToast(`Error: ${err}`);
        });
    }
  
    // ==================== ONLY CHANGE: BLUR/UNBLUR THUMBNAIL ====================
    
    // 1. Toggle blur on click
    if (cvThumbnail) {
      cvThumbnail.addEventListener("click", () => {
        cvThumbnail.classList.toggle("blurred");
      });
    }
  
    // 2. Show a thumbnail if the file is an image, blurred by default
    function showThumbnailIfImage(filename) {
      if (!cvThumbnail) return;
  
      const ext = filename.split(".").pop().toLowerCase();
      const imageExts = ["jpg", "jpeg", "png", "bmp"];
  
      if (imageExts.includes(ext)) {
        cvThumbnail.src = `/thumbnail?filename=${encodeURIComponent(filename)}`;
        cvThumbnail.alt = filename;
        // Add blur by default each time we load a new image
        cvThumbnail.classList.add("blurred");
      } else {
        cvThumbnail.src = "";
        cvThumbnail.alt = "No image preview available.";
        // Remove blur if it's not an image
        cvThumbnail.classList.remove("blurred");
      }
    }
  
    // Initial load
    refreshCVFileList();
  });
  