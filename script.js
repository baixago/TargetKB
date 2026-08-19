"use strict";

/* =========================================
   TargetKB - Image Compression Tool
   Browser-side image processing
========================================= */

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


/* =========================================
   Variables
========================================= */

let selectedFile = null;
let selectedTarget = 51200;
let compressedUrl = null;


/* =========================================
   File Selection
========================================= */

imageInput.addEventListener("change", function () {

  const file = imageInput.files[0];

  if (!file) {
    resetSelection();
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    resetSelection();

    fileMessage.textContent =
      "Please choose a JPG, PNG or WebP image.";

    showStatus(
      "Unsupported image format.",
      "error"
    );

    return;
  }

  selectedFile = file;

  fileMessage.textContent =
    `${file.name} • ${formatBytes(file.size)}`;

  compressButton.disabled = false;

  showStatus(
    "Image selected. Choose a target size and compress.",
    "info"
  );

  showOriginalPreview(file);
});


/* =========================================
   Target Size Buttons
========================================= */

targetButtons.forEach(function (button) {

  button.addEventListener("click", function () {

    targetButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedTarget =
      Number(button.dataset.target);

    if (selectedTarget === 0) {

      showStatus(
        "Best Quality selected.",
        "info"
      );

    } else {

      showStatus(
        `Target size selected: ${formatBytes(selectedTarget)}`,
        "info"
      );
    }
  });
});


/* =========================================
   Compress Button
========================================= */

compressButton.addEventListener("click", async function () {

  if (!selectedFile) {

    showStatus(
      "Please choose an image first.",
      "error"
    );

    return;
  }

  compressButton.disabled = true;

  showStatus(
    "Compressing image...",
    "info"
  );

  try {

    const result =
      await compressImage(
        selectedFile,
        selectedTarget
      );

    displayResult(
      result.blob,
      result.width,
      result.height
    );

    showStatus(
      "Compression completed successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showStatus(
      "Something went wrong while compressing the image.",
      "error"
    );

  } finally {

    compressButton.disabled = false;
  }
});


/* =========================================
   Load Image
========================================= */

function loadImage(file) {

  return new Promise(function (resolve, reject) {

    const img = new Image();

    const url =
      URL.createObjectURL(file);

    img.onload = function () {

      URL.revokeObjectURL(url);

      resolve(img);
    };

    img.onerror = function () {

      URL.revokeObjectURL(url);

      reject(
        new Error("Unable to load image.")
      );
    };

    img.src = url;
  });
}


/* =========================================
   Main Compression Function
========================================= */

async function compressImage(file, targetSize) {

  const image =
    await loadImage(file);

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext("2d", {
      alpha: true
    });

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  /*
    White background is used for JPEG
    because JPEG does not support transparency.
  */

  const outputType =
    file.type === "image/png"
      ? "image/png"
      : "image/jpeg";

  if (outputType === "image/jpeg") {

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );


  /* -----------------------------------------
     Best Quality
  ----------------------------------------- */

  if (targetSize === 0) {

    const blob =
      await canvasToBlob(
        canvas,
        outputType,
        0.92
      );

    return {
      blob: blob,
      width: width,
      height: height
    };
  }


  /* -----------------------------------------
     If original is already smaller
  ----------------------------------------- */

  if (file.size <= targetSize) {

    return {
      blob: file,
      width: width,
      height: height
    };
  }


  /* -----------------------------------------
     Binary search JPEG quality
  ----------------------------------------- */

  let low = 0.05;
  let high = 0.95;

  let bestBlob = null;

  for (let i = 0; i < 12; i++) {

    const quality =
      (low + high) / 2;

    const blob =
      await canvasToBlob(
        canvas,
        "image/jpeg",
        quality
      );

    if (blob.size <= targetSize) {

      bestBlob = blob;

      low = quality;

    } else {

      high = quality;
    }
  }


  /* -----------------------------------------
     If quality compression is not enough,
     reduce dimensions gradually.
  ----------------------------------------- */

  if (!bestBlob || bestBlob.size > targetSize) {

    return await resizeUntilTarget(
      image,
      targetSize
    );
  }


  return {
    blob: bestBlob,
    width: width,
    height: height
  };
}


/* =========================================
   Resize Until Target
========================================= */

async function resizeUntilTarget(
  image,
  targetSize
) {

  let scale = 0.9;

  let bestBlob = null;
  let bestWidth = image.naturalWidth;
  let bestHeight = image.naturalHeight;

  for (let attempt = 0; attempt < 12; attempt++) {

    const width =
      Math.max(
        1,
        Math.round(
          image.naturalWidth * scale
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          image.naturalHeight * scale
        )
      );

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx =
      canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob =
      await canvasToBlob(
        canvas,
        "image/jpeg",
        0.82
      );

    if (blob.size <= targetSize) {

      bestBlob = blob;

      bestWidth = width;
      bestHeight = height;

      break;
    }

    scale *= 0.82;
  }


  if (!bestBlob) {

    const canvas =
      document.createElement("canvas");

    canvas.width =
      Math.max(
        1,
        Math.round(
          image.naturalWidth * 0.35
        )
      );

    canvas.height =
      Math.max(
        1,
        Math.round(
          image.naturalHeight * 0.35
        )
      );

    const ctx =
      canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    bestBlob =
      await canvasToBlob(
        canvas,
        "image/jpeg",
        0.65
      );

    bestWidth = canvas.width;
    bestHeight = canvas.height;
  }


  return {
    blob: bestBlob,
    width: bestWidth,
    height: bestHeight
  };
}


/* =========================================
   Canvas → Blob
========================================= */

function canvasToBlob(
  canvas,
  type,
  quality
) {

  return new Promise(function (
    resolve,
    reject
  ) {

    canvas.toBlob(
      function (blob) {

        if (!blob) {

          reject(
            new Error(
              "Image compression failed."
            )
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


/* =========================================
   Display Original Preview
========================================= */

function showOriginalPreview(file) {

  const url =
    URL.createObjectURL(file);

  originalPreview.src = url;

  originalInfo.textContent =
    `${formatBytes(file.size)} • ${file.type}`;

  resultSection.hidden = false;

  /*
    Hide compressed preview until
    compression is completed.
  */

  compressedPreview.removeAttribute("src");

  compressedInfo.textContent =
    "Compressed file information";

  savedPercentage.textContent =
    "0%";

  qualityMessage.textContent =
    "Compress the image to see the result.";

  downloadButton.removeAttribute("href");
}


/* =========================================
   Display Compression Result
========================================= */

function displayResult(
  blob,
  width,
  height
) {

  if (compressedUrl) {

    URL.revokeObjectURL(
      compressedUrl
    );
  }

  compressedUrl =
    URL.createObjectURL(blob);

  compressedPreview.src =
    compressedUrl;

  compressedInfo.textContent =
    `${formatBytes(blob.size)} • ${width} × ${height}`;

  const originalSize =
    selectedFile.size;

  const saved =
    Math.max(
      0,
      ((originalSize - blob.size) /
        originalSize) *
        100
    );

  savedPercentage.textContent =
    `${saved.toFixed(1)}%`;

  if (blob.size <= selectedTarget && selectedTarget > 0) {

    qualityMessage.textContent =
      `Target achieved: ${formatBytes(blob.size)}.`;
  }

  else if (
    selectedTarget > 0 &&
    selectedFile.size <= selectedTarget
  ) {

    qualityMessage.textContent =
      "The original image was already below your target size.";
  }

  else {

    qualityMessage.textContent =
      "Compressed image generated successfully.";
  }


  /*
    Download filename
  */

  const originalName =
    selectedFile.name
      .replace(/\.[^/.]+$/, "");

  downloadButton.href =
    compressedUrl;

  downloadButton.download =
    `${originalName}-compressed.jpg`;

  resultSection.hidden = false;

  /*
    Scroll to result
  */

  setTimeout(function () {

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 100);
}


/* =========================================
   Status Message
========================================= */

function showStatus(
  message,
  type
) {

  statusMessage.textContent =
    message;

  statusMessage.className =
    "status-message";

  if (type === "success") {

    statusMessage.classList.add(
      "success"
    );

  } else if (type === "error") {

    statusMessage.classList.add(
      "error"
    );

  } else {

    statusMessage.classList.add(
      "info"
    );
  }
}


/* =========================================
   Format Bytes
========================================= */

function formatBytes(bytes) {

  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  const value =
    bytes /
    Math.pow(1024, index);

  return (
    value.toFixed(
      index === 0 ? 0 : 2
    ) +
    " " +
    units[index]
  );
}


/* =========================================
   Reset
========================================= */

function resetSelection() {

  selectedFile = null;

  compressButton.disabled = true;

  fileMessage.textContent =
    "No image selected yet.";

  statusMessage.textContent =
    "";

  resultSection.hidden = true;
}


/* =========================================
   Initial State
========================================= */

const firstTargetButton =
  document.querySelector(
    '.target-button[data-target="51200"]'
  );

if (firstTargetButton) {

  firstTargetButton.classList.add(
    "active"
  );
}
