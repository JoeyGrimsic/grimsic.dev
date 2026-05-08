const zone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input");
const statusBox = document.getElementById("status-box");
const statusText = document.getElementById("status-text");
const statusIcon = document.getElementById("status-icon");
const progressBar = document.getElementById("progress-bar");
const resultSection = document.getElementById("result-section");
const resultFilename = document.getElementById("result-filename");
const resultModel = document.getElementById("result-model");
const resultText = document.getElementById("result-text");
const analyzeAnother = document.getElementById("analyze-another");

zone.addEventListener("click", () => fileInput.click());
zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
fileInput.addEventListener("change", () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
zone.addEventListener("drop", (e) => {
  e.preventDefault();
  zone.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

analyzeAnother.addEventListener("click", reset);

function reset() {
  fileInput.value = "";
  statusBox.classList.add("hidden");
  resultSection.classList.add("hidden");
  zone.classList.remove("hidden");
  progressBar.style.width = "0%";
}

function setStatus(icon, text, progress) {
  statusIcon.textContent = icon;
  statusText.textContent = text;
  if (progress !== undefined) progressBar.style.width = progress + "%";
}

async function handleFile(file) {
  zone.classList.add("hidden");
  statusBox.classList.remove("hidden");
  resultSection.classList.add("hidden");
  setStatus("⏳", "Requesting upload URL…", 10);

  let fileId;
  try {
    const res = await fetch("/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, content_type: file.type }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get upload URL");
    }
    const data = await res.json();
    fileId = data.file_id;

    setStatus("⬆️", "Uploading to Cloud Storage…", 35);
    await uploadToGCS(data.upload_url, file);

    setStatus("🧠", "Analyzing with Vertex AI…", 65);
    const analysis = await pollResults(fileId);

    setStatus("✅", "Analysis complete", 100);
    setTimeout(() => showResult(file.name, analysis), 300);

  } catch (err) {
    setStatus("❌", err.message || "Something went wrong", 0);
  }
}

function uploadToGCS(signedUrl, file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`GCS upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

async function pollResults(fileId, maxAttempts = 30, interval = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval);
    const res = await fetch(`/results/${fileId}`);
    if (!res.ok) throw new Error("Failed to fetch results");
    const data = await res.json();
    if (data.status === "complete") return data;
    if (data.status === "error") throw new Error(data.error || "Analysis failed");
  }
  throw new Error("Analysis timed out");
}

function showResult(filename, data) {
  statusBox.classList.add("hidden");
  resultFilename.textContent = filename;
  resultModel.textContent = data.model || "Gemini";
  resultText.textContent = data.analysis;
  resultSection.classList.remove("hidden");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
