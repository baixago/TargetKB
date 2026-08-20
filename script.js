const imageInput = document.getElementById("imageInput");
const uploadBox = document.querySelector(".upload-box");
const fileMessage = document.getElementById("fileMessage");

const compressButton = document.getElementById("compressButton");
const statusMessage = document.getElementById("statusMessage");

const targetButtons = document.querySelectorAll(".target-button");

const resultSection = document.getElementById("resultSection");
const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");

const originalInfo = document.getElementById("originalInfo");
const compressedInfo = document.getElementById("compressedInfo");

const savedPercentage = document.getElementById("savedPercentage");
const qualityMessage = document.getElementById("qualityMessage");

const downloadButton = document.getElementById("downloadButton");

let selectedFile = null;
let targetSize = 51200; // 50 KB
let currentDownloadUrl = null;


// =========================
// TARGET BUTTONS
// =========================

targetButtons.forEach((button) => {
  button.addEventListener("click", () => {

    targetButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const target = button.dataset.target;

    if (target === "custom") {
      showCustomInput();
      return;
    }

    targetSize = Number(target);

    hideCustomInput();

    setStatus(
      `Target size selected: ${formatBytes(targetSize)}`,
      "success"
    );
  });
});


// =========================
// CUSTOM INPUT
// =========================

function showCustomInput() {

  let existing = document.getElementById("customTargetBox");

  if (existing) {
    existing.hidden = false;
    existing.querySelector("input").focus();
    return;
  }

  const box = document.createElement("div");

  box.id = "customTargetBox";
  box.className = "custom-target-box";

  box.innerHTML = `
    <label for="customTargetInput">
      Enter target size
    </label>

    <div class="custom-target-row">
      <input
        id="customTargetInput"
        type="number"
        min="2"
        max="50000"
        step="1"
        placeholder="75"
        inputmode="numeric"
      />

      <span>KB</span>
    </div>

    <small>
      Example: 75 KB, 150 KB, 250 KB or 500 KB
    </small>

    <p id="customError" class="custom-error"></p>
  `;

  const optionsSection = document.querySelector(".options-section");

  optionsSection.appendChild(box);

  const input = document.getElementById("customTargetInput");

  input.addEventListener("input", () => {

    const value = Number(input.value);
    const error = document.getElementById("customError");

    if (!value || value < 2) {

      error.textContent = "Please enter at least 2 KB.";
      targetSize = 0;
      return;
    }

    if (value > 50000) {

      error.textContent = "Maximum target size is 50,000 KB.";
      targetSize = 0;
      return;
    }

    error.textContent = "";

    targetSize = Math.round(value * 1024);

    setStatus(
      `Custom target selected: ${value} KB`,
      "success"
    );
  });

  input.focus();
}


function hideCustomInput() {

  const box = document.getElementById("customTargetBox");

  if (box) {
    box.hidden = true;
  }
}


// =========================
// IMAGE SELECT
// =========================

imageInput.addEventListener("change", (event) => {

  const file = event.target.files[0];

  selectFile(file);
});


function selectFile(file) {

  if (!file) {
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    setStatus(
      "Please choose a JPG, PNG or WebP image.",
      "error"
    );

    return;
  }

  selectedFile = file;

  fileMessage.textContent =
    `${file.name} • ${formatBytes(file.size)}`;

  compressButton.disabled = false;

  resultSection.hidden = true;

  setStatus(
    "Image selected. Choose your target size.",
    "success"
  );

  originalPreview.src = URL.createObjectURL(file);

  originalInfo.textContent =
    `Original: ${formatBytes(file.size)}`;
}


// =========================
// DRAG & DROP
// =========================

["dragenter", "dragover"].forEach((eventName) => {

  uploadBox.addEventListener(eventName, (event) => {

    event.preventDefault();

    uploadBox.classList.add("dragging");
  });
});


["dragleave", "drop"].forEach((eventName) => {

  uploadBox.addEventListener(eventName, (event) => {

    event.preventDefault();

    uploadBox.classList.remove("dragging");
  });
});


uploadBox.addEventListener("drop", (event) => {

  const file = event.dataTransfer.files[0];

  selectFile(file);
});


// =========================
// COMPRESS BUTTON
// =========================

compressButton.addEventListener("click", async () => {

  if (!selectedFile) {

    setStatus(
      "Please choose an image first.",
      "error"
    );

    return;
  }

  if (!targetSize || targetSize < 2048) {

    setStatus(
      "Please choose a valid target size.",
      "error"
    );

    return;
  }

  compressButton.disabled = true;
  compressButton.textContent = "Compressing...";

  setStatus(
    "Compressing your image...",
    ""
  );

  try {

    const result = await compressImage(
      selectedFile,
      targetSize
    );

    if (currentDownloadUrl) {

      URL.revokeObjectURL(currentDownloadUrl);
    }

    currentDownloadUrl =
      URL.createObjectURL(result.blob);

    compressedPreview.src =
      currentDownloadUrl;

    originalInfo.textContent =
      `Original: ${formatBytes(selectedFile.size)}`;

    compressedInfo.textContent =
      `Compressed: ${formatBytes(result.blob.size)}`;

    const saved = Math.max(
      0,
      Math.round(
        (1 - result.blob.size / selectedFile.size) * 100
      )
    );

    savedPercentage.textContent =
      `${saved}%`;

    if (result.blob.size <= targetSize) {

      qualityMessage.textContent =
        `Target reached: ${formatBytes(result.blob.size)}.`;

    } else {

      qualityMessage.textContent =
        `Best practical result: ${formatBytes(result.blob.size)}.`;
    }

    downloadButton.href =
      currentDownloadUrl;

    downloadButton.download =
      `targetkb-${getBaseName(selectedFile.name)}.jpg`;

    resultSection.hidden = false;

    setStatus(
      "Compression complete!",
      "success"
    );

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {

    console.error(error);

    setStatus(
      "Compression failed. Please try another image.",
      "error"
    );

  } finally {

    compressButton.disabled = false;
    compressButton.textContent = "Compress Image";
  }
});


// =========================
// IMAGE LOADER
// =========================

function loadImage(file) {

  return new Promise((resolve, reject) => {

    const image = new Image();

    const url =
      URL.createObjectURL(file);

    image.onload = () => {

      URL.revokeObjectURL(url);

      resolve(image);
    };

    image.onerror = () => {

      URL.revokeObjectURL(url);

      reject(
        new Error("Image could not be loaded.")
      );
    };

    image.src = url;
  });
}


// =========================
// CANVAS → JPEG
// =========================

function canvasToBlob(canvas, quality) {

  return new Promise((resolve, reject) => {

    canvas.toBlob(
      (blob) => {

        if (blob) {

          resolve(blob);

        } else {

          reject(
            new Error("Could not create image.")
          );
        }
      },
      "image/jpeg",
      quality
    );
  });
}


// =========================
// MAIN COMPRESSION
// =========================

async function compressImage(file, target) {

  const image =
    await loadImage(file);

  let scale = 1;

  let canvas =
    document.createElement("canvas");

  let context =
    canvas.getContext("2d");

  let bestBlob = null;

  let bestDifference = Infinity;


  // Try different image dimensions
  for (let scaleAttempt = 0; scaleAttempt < 12; scaleAttempt++) {

    canvas.width =
      Math.max(
        300,
        Math.round(image.naturalWidth * scale)
      );

    canvas.height =
      Math.max(
        300,
        Math.round(image.naturalHeight * scale)
      );

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );


    // Binary search for best JPEG quality
    let low = 0.05;
    let high = 0.95;

    let localBest = null;


    for (let i = 0; i < 9; i++) {

      const quality =
        (low + high) / 2;

      const blob =
        await canvasToBlob(
          canvas,
          quality
        );

      const difference =
        Math.abs(blob.size - target);


      if (
        !localBest ||
        difference < localBest.difference
      ) {

        localBest = {
          blob: blob,
          difference: difference
        };
      }


      if (blob.size > target) {

        high = quality;

      } else {

        low = quality;
      }
    }


    if (
      localBest &&
      localBest.difference < bestDifference
    ) {

      bestBlob =
        localBest.blob;

      bestDifference =
        localBest.difference;
    }


    // Target reached
    if (
      localBest &&
      localBest.blob.size <= target
    ) {

      return {
        blob: localBest.blob
      };
    }


    // Reduce dimensions if still too large
    scale *= 0.84;
  }


  if (!bestBlob) {

    throw new Error(
      "Compression failed."
    );
  }


  return {
    blob: bestBlob
  };
}


// =========================
// STATUS MESSAGE
// =========================

function setStatus(message, type) {

  statusMessage.textContent =
    message;

  statusMessage.className =
    "status-message";

  if (type) {

    statusMessage.classList.add(type);
  }
}


// =========================
// FORMAT BYTES
// =========================

function formatBytes(bytes) {

  if (bytes < 1024) {

    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {

    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}


// =========================
// FILE NAME
// =========================

function getBaseName(filename) {

  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 60);
}


// =========================
// INITIAL STATE
// =========================

// 50 KB selected by default
targetButtons.forEach((button, index) => {

  if (index === 0) {

    button.classList.add("active");
  }
});

compressButton.disabled = true;
