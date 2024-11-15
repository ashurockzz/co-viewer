// Initial Setup
SERVER_IP="192.168.255.161";
const socket = io(`http://${SERVER_IP}:5000`); // Connect to server
let pdfDoc = null;
let pageNum = 1;
let totalPages = 0;
let role = null;
let isRendering = false;

// DOM Elements
const viewerContainer = document.getElementById("viewer-container");
const canvas = document.getElementById("pdf-render");
const ctx = canvas.getContext("2d");
const pageInfo = document.getElementById("page-info");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const jumpPageInput = document.getElementById("jump-page");
const pdfInput = document.getElementById("pdf-input");

// Function to Set Role (Teacher/Student)
function setRole(selectedRole) {
  role = selectedRole;
  viewerContainer.style.display = "block";
  document.body.querySelector("h3").style.display = "none"; // Hide role selection UI

  if (role === "Student") {
    prevButton.disabled = true;
    nextButton.disabled = true;

    // Listen for page updates from teacher
    socket.on("pageUpdate", (newPageNum) => {
      if (pageNum !== newPageNum) {
        pageNum = newPageNum;
        renderPage(pageNum);
      }
    });
  }
}

// Function to Render a Page
async function renderPage(num) {
  isRendering = true;

  // Get the page
  const page = await pdfDoc.getPage(num);

  // Set canvas dimensions based on page
  const viewport = page.getViewport({ scale: 1.5 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Render the page
  await page.render({ canvasContext: ctx, viewport }).promise;
  isRendering = false;

  // Update page info
  pageInfo.textContent = `Page ${num} of ${totalPages}`;
  prevButton.disabled = num <= 1;
  nextButton.disabled = num >= totalPages;
}

// Function to Load PDF Document
async function loadPdf(pdfUrl) {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  pdfDoc = await loadingTask.promise;
  totalPages = pdfDoc.numPages;

  // Initial page render
  renderPage(pageNum);
}

// Function to Jump to a Specific Page (Teacher Only)
function jumpToPage() {
  const targetPage = parseInt(jumpPageInput.value);
  if (targetPage >= 1 && targetPage <= totalPages) {
    pageNum = targetPage;
    renderPage(pageNum);

    if (role === "Teacher") {
      socket.emit("pageChange", pageNum); // Emit page update for students
    }
  }
}

// Page Navigation Controls for Teacher
function nextPage() {
  if (pageNum >= totalPages || isRendering) return;
  pageNum++;
  renderPage(pageNum);

  if (role === "Teacher") {
    socket.emit("pageChange", pageNum); // Emit page update for students
  }
}

function prevPage() {
  if (pageNum <= 1 || isRendering) return;
  pageNum--;
  renderPage(pageNum);

  if (role === "Teacher") {
    socket.emit("pageChange", pageNum); // Emit page update for students
  }
}

// Handle PDF File Input for Teacher (Change PDF)
function loadNewPdf(event) {
  const file = event.target.files[0];
  if (file) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const arrayBuffer = this.result;
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      loadingTask.promise.then((doc) => {
        pdfDoc = doc;
        totalPages = doc.numPages;
        pageNum = 1;
        renderPage(pageNum);
      });
    };
    fileReader.readAsArrayBuffer(file);
  }
}

// Load PDF on page load
window.onload = () => loadPdf(`http://${SERVER_IP}:5000/sample.pdf`);
