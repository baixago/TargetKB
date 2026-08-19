"use strict";

const imageInput = document.getElementById("imageInput");
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
let selectedTarget = 51200;
let compressedUrl = null;


/* -----------------------------
   File selection
----------------------------- */

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    selectedFile = null;
    compressButton.disabled = true;
    fileMessage.textContent = "No image selected yet.";
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    selectedFile = null;
    compressButton.disabled = true;
    fileMessage.textContent =
      "Please choose a JPG, PNG or WebP image.";
    return;
  }

  selectedFile = file;

  fileMessage.textContent =
    `${file.name} • ${formatBytes(file.size)}`;

  compressButton.disabled = false;

  resultSection.hidden = true;
  statusMessage.textContent = "";

  if (compressedUrl) {
    URL.revokeObjectURL(compressedUrl);
    compressedUrl = null;
  }
});


/* -----------------------------
   Target size buttons
----------------------------- */

targetButtons.forEach(function (button) {

  button.addEventListener("click", function () {

    targetButtons.forEach(function (item) {
      item.classList.remove("active");
    });

    button.classList.add("active");

    selectedTarget = Number(button.dataset.target);

    if (selectedTarget === 0) {
      statusMessage.textContent =
        "Best Quality selected.";
    } else {
      statusMessage.textContent =
        `Target size selected: ${formatBytes(selectedTarget)}`;
    }
  });

});


/* -----------------------------
   Compress button
----------------------------- */

compressButton.addEventListener("click", async function () {

  if (!selectedFile) {
    statusMessage.textContent =
      "Please choose an image first.";
    return;
  }

  compressButton.disabled = true;
  statusMessage.textContent =
    "Compressing image...";

  try {

    const result = await compressImage(
      selectedFile,
      selectedTarget
    );

    showResult(result);

    statusMessage.textContent =
      "Compression completed successfully.";

  } catch (error) {

    console.error(error);

    statusMessage.textContent =
      "Something went wrong while compressing the image.";

  } finally {

    compressButton.disabled = false;

  }

});


/* -----------------------------
   Main compression function
----------------------------- */

async function compressImage(file, targetSize) {

  const image = await loadImage(file);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  /*
    Keep very large images manageable
    while preserving aspect ratio.
  */

  const maxDimension = 2400;

  if (width > maxDimension || height > maxDimension) {

    const scale =
      Math.min(maxDimension / width, maxDimension / height);

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  /*
    Best Quality mode
  */

  if (targetSize === 0) {

    const blob = await canvasToBlob(
      canvas,
      "image/jpeg",
      0.92
    );

    return {
      blob: blob,
      type: "image/jpeg"
    };
  }

  /*
    Try to reach the requested target size.
  */

  let quality = 0.92;
  let blob = await canvasToBlob(
    canvas,
    "image/jpeg",
    quality
  );

  /*
    If already smaller than target,
    use the high quality result.
  */

  if (blob.size <= targetSize) {

    return {
      blob: blob,
      type: "image/jpeg"
    };
  }

  /*
    Binary search for the best JPEG quality.
  */

  let minQuality = 0.05;
  let maxQuality = 0.92;

  let bestBlob = blob;

  for (let i = 0; i < 12; i++) {

    quality =
      (minQuality + maxQuality) / 2;

    const currentBlob =
      await canvasToBlob(
        canvas,
        "image/jpeg",
        quality
      );

    if (currentBlob.size <= targetSize) {

      bestBlob = currentBlob;
      minQuality = quality;

    } else {

      maxQuality = quality;
    }
  }

  /*
    If the image is still larger than target,
    gradually reduce dimensions.
  */

  if (bestBlob.size > targetSize) {

    let scale = 0.9;

    for (let i = 0; i < 8; i++) {

      const newWidth =
        Math.max(
          320,
          Math.round(width * scale)
        );

      const newHeight =
        Math.max(
          320,
          Math.round(height * scale)
        );

      canvas.width = newWidth;
      canvas.height = newHeight;

      context.clearRect(
        0,
        0,
        newWidth,
        newHeight
      );

      context.drawImage(
        image,
        0,
        0,
        newWidth,
        newHeight
      );

      const currentBlob =
        await canvasToBlob(
          canvas,
          "image/jpeg",
          0.75
        );

      if (currentBlob.size <= targetSize) {

        bestBlob = currentBlob;
        break;
      }

      scale *= 0.85;
    }
  }

  return {
    blob: bestBlob,
    type: "image/jpeg"
  };
}


/* -----------------------------
   Canvas to Blob helper
----------------------------- */

function canvasToBlob(
  canvas,
  type,
  quality
) {

  return new Promise(function (resolve, reject) {

    canvas.toBlob(
      function (blob) {

        if (!blob) {
          reject(
            new Error("Unable to create image.")
          );
          return;
        }

        resolve(blob);

      },
      type,
      quality
    );

  });
}


/* -----------------------------
   Load image
----------------------------- */

function loadImage(file) {

  return new Promise(function (resolve, reject) {

    const url =
      URL.createObjectURL(file);

    const image =
      new Image();

    image.onload = function () {

      URL.revokeObjectURL(url);

      resolve(image);
    };

    image.onerror = function () {

      URL.revokeObjectURL(url);

      reject(
        new Error("Unable to load image.")
      );
    };

    image.src = url;

  });
}


/* -----------------------------
   Show result
----------------------------- */

function showResult(result) {

  if (compressedUrl) {

    URL.revokeObjectURL(
      compressedUrl
    );
  }

  compressedUrl =
    URL.createObjectURL(
      result.blob
    );

  /*
    Original preview
  */

  originalPreview.src =
    URL.createObjectURL(
      selectedFile
    );

  /*
    Compressed preview
  */

  compressedPreview.src =
    compressedUrl;

  /*
    File information
  */

  originalInfo.textContent =
    `${selectedFile.name} • ${formatBytes(selectedFile.size)}`;

  compressedInfo.textContent =
    `Compressed JPEG • ${formatBytes(result.blob.size)}`;

  /*
    Saved percentage
  */

  const saved =
    Math.max(
      0,
      ((selectedFile.size - result.blob.size)
        / selectedFile.size) * 100
    );

  savedPercentage.textContent =
    `${saved.toFixed(1)}%`;

  /*
    Quality message
  */

  if (selectedTarget === 0) {

    qualityMessage.textContent =
      "Best Quality mode was used.";

  } else if (result.blob.size <= selectedTarget) {

    qualityMessage.textContent =
      `Target reached: ${formatBytes(selectedTarget)} or smaller.`;

  } else {

    qualityMessage.textContent =
      "The closest practical size was created while preserving image quality.";
  }

  /*
    Download
  */

  downloadButton.href =
    compressedUrl;

  downloadButton.download =
    createDownloadName(
      selectedFile.name
    );

  resultSection.hidden =
    false;

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* -----------------------------
   File size formatting
----------------------------- */

function formatBytes(bytes) {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {

    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


/* -----------------------------
   Download filename
----------------------------- */

function createDownloadName(filename) {

  const cleanName =
    filename.replace(
      /\.[^/.]+$/,
      ""
    );

  return `${cleanName}-compressed.jpg`;
}


/* -----------------------------
   Default selection
----------------------------- */

if (targetButtons.length > 0) {

  targetButtons[0].classList.add("active");
                                                  }
