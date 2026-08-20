const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const compressBtn = document.getElementById("compressBtn");
const result = document.getElementById("result");
const preview = document.getElementById("preview");
const resultText = document.getElementById("resultText");
const downloadBtn = document.getElementById("downloadBtn");
const sizeButtons = document.querySelectorAll(".size-button");

let selectedFile = null;
let targetSize = 51200;
let currentUrl = null;

sizeButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    sizeButtons.forEach(function(item) {
      item.classList.remove("active");
    });

    button.classList.add("active");
    targetSize = Number(button.dataset.size);
  });
});

imageInput.addEventListener("change", function(event) {
  selectFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach(function(eventName) {
  dropZone.addEventListener(eventName, function(event) {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach(function(eventName) {
  dropZone.addEventListener(eventName, function(event) {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", function(event) {
  selectFile(event.dataTransfer.files[0]);
});

function selectFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please select a JPG, PNG or WebP image.");
    return;
  }

  selectedFile = file;
  fileName.textContent =
    file.name + " • " + formatBytes(file.size);

  result.style.display = "none";
}

compressBtn.addEventListener("click", async function() {
  if (!selectedFile) {
    alert("Please choose an image first.");
    return;
  }

  compressBtn.disabled = true;
  compressBtn.textContent = "Compressing...";

  try {
    const blob = await compressImage(selectedFile, targetSize);

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    currentUrl = URL.createObjectURL(blob);
    preview.src = currentUrl;

    const saved = Math.max(
      0,
      Math.round((1 - blob.size / selectedFile.size) * 100)
    );

    resultText.textContent =
      "Original: " + formatBytes(selectedFile.size) +
      " • Compressed: " + formatBytes(blob.size) +
      " • Saved: " + saved + "%";

    downloadBtn.href = currentUrl;
    downloadBtn.download = "targetkb-compressed.jpg";
    result.style.display = "block";
  } catch (error) {
    alert("Compression failed. Please try another image.");
  }

  compressBtn.disabled = false;
  compressBtn.textContent = "Compress Image";
});

function loadImage(file) {
  return new Promise(function(resolve, reject) {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = function() {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise(function(resolve, reject) {
    canvas.toBlob(
      function(blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not create image"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

async function compressImage(file, target) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  let quality = 0.86;
  let scale = 1;
  let blob = null;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (target === 0) {
    return canvasToBlob(canvas, 0.92);
  }

  for (let attempt = 0; attempt < 18; attempt++) {
    blob = await canvasToBlob(canvas, quality);

    if (blob.size <= target) {
      return blob;
    }

    if (quality > 0.35) {
      quality -= 0.055;
    } else {
      scale *= 0.84;

      canvas.width = Math.max(
        300,
        Math.round(image.naturalWidth * scale)
      );

      canvas.height = Math.max(
        300,
        Math.round(image.naturalHeight * scale)
      );

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      quality = 0.78;
    }
  }

  return blob;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  return (bytes / 1024).toFixed(1) + " KB";
 }
