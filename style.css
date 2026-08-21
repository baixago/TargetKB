const imageInput = document.getElementById("imageInput");

const uploadBox = document.getElementById("uploadBox");
const uploadInitial = document.getElementById("uploadInitial");
const uploadSelected = document.getElementById("uploadSelected");

const selectedPreview = document.getElementById("selectedPreview");
const selectedInfo = document.getElementById("selectedInfo");
const changeImageButton = document.getElementById("changeImageButton");

const targetButtons = document.querySelectorAll(".target-button");

const customBox = document.getElementById("customBox");
const customSize = document.getElementById("customSize");

const compressButton = document.getElementById("compressButton");
const statusMessage = document.getElementById("statusMessage");

const resultSection = document.getElementById("resultSection");

const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");

const originalInfo = document.getElementById("originalInfo");
const compressedInfo = document.getElementById("compressedInfo");

const savedPercentage = document.getElementById("savedPercentage");
const qualityMessage = document.getElementById("qualityMessage");

const downloadButton = document.getElementById("downloadButton");


let selectedFile = null;
let targetSize = 51200;
let currentDownloadUrl = null;
let isCompressing = false;


/* =========================
   TARGET BUTTONS
========================= */

targetButtons.forEach(function(button) {

  button.addEventListener("click", function() {

    if (isCompressing) {
      return;
    }

    targetButtons.forEach(function(item) {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const value = button.dataset.target;

    if (value === "custom") {

      customBox.classList.remove("hidden");

      targetSize = null;

      customSize.focus();

    } else {

      customBox.classList.add("hidden");

      targetSize = Number(value);

    }

    resultSection.classList.add("hidden");

  });

});


/* =========================
   CUSTOM SIZE
========================= */

customSize.addEventListener("input", function() {

  const kb = Number(customSize.value);

  if (kb >= 10) {
    targetSize = kb * 1024;
  } else {
    targetSize = null;
  }

});


/* =========================
   IMAGE SELECT
========================= */

imageInput.addEventListener("change", function(event) {

  if (isCompressing) {
    return;
  }

  const file = event.target.files[0];

  if (file) {
    selectFile(file);
  }

});


function selectFile(file) {

  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {

    showError("Please select a JPG, PNG or WebP image.");

    return;
  }


  selectedFile = file;


  /* Show thumbnail */

  const previewUrl = URL.createObjectURL(file);

  selectedPreview.src = previewUrl;


  /* Show friendly upload state */

  uploadInitial.classList.add("hidden");
  uploadSelected.classList.remove("hidden");


  selectedInfo.textContent =
    "Original size: " + formatBytes(file.size);


  compressButton.disabled = false;

  resultSection.classList.add("hidden");

  showSuccess("Image selected and ready to compress.");

}


/* =========================
   CHANGE IMAGE
========================= */

changeImageButton.addEventListener("click", function(event) {

  event.preventDefault();
  event.stopPropagation();

  if (isCompressing) {
    return;
  }

  imageInput.click();

});


/* =========================
   DRAG & DROP
========================= */

["dragenter", "dragover"].forEach(function(eventName) {

  uploadBox.addEventListener(eventName, function(event) {

    event.preventDefault();

    uploadBox.classList.add("drag-active");

  });

});


["dragleave", "drop"].forEach(function(eventName) {

  uploadBox.addEventListener(eventName, function(event) {

    event.preventDefault();

    uploadBox.classList.remove("drag-active");

  });

});


uploadBox.addEventListener("drop", function(event) {

  if (isCompressing) {
    return;
  }

  const file = event.dataTransfer.files[0];

  if (file) {
    selectFile(file);
  }

});


/* =========================
   COMPRESS
========================= */

compressButton.addEventListener("click", async function() {

  if (!selectedFile) {

    showError("Please choose an image first.");

    return;
  }


  if (!targetSize || targetSize < 10 * 1024) {

    showError("Please enter a target size of at least 10 KB.");

    return;
  }


  isCompressing = true;

  compressButton.disabled = true;
  compressButton.textContent = "Compressing...";

  uploadBox.classList.add("is-busy");
  document.querySelector(".options-section").classList.add("is-busy");

  statusMessage.className = "status-message";
  statusMessage.textContent = "Working on your image...";


  try {

    const blob = await compressImage(
      selectedFile,
      targetSize
    );


    if (currentDownloadUrl) {
      URL.revokeObjectURL(currentDownloadUrl);
    }


    currentDownloadUrl =
      URL.createObjectURL(blob);


    /* Preview */

    originalPreview.src =
      URL.createObjectURL(selectedFile);

    compressedPreview.src =
      currentDownloadUrl;


    /* Information */

    originalInfo.textContent =
      "Original: " +
      formatBytes(selectedFile.size);


    compressedInfo.textContent =
      "Compressed: " +
      formatBytes(blob.size);


    const saved = Math.max(
      0,
      Math.round(
        (1 - blob.size / selectedFile.size) * 100
      )
    );


    savedPercentage.textContent =
      saved + "%";


    if (blob.size <= targetSize) {

      const gapPercent =
        ((targetSize - blob.size) / targetSize) * 100;

      if (gapPercent <= 15) {

        qualityMessage.textContent =
          "Landed right at your target size, at the best quality possible.";

      } else {

        qualityMessage.textContent =
          "Target size reached. The image compressed further than requested because that was the closest quality step available.";

      }

    } else {

      qualityMessage.textContent =
        "The image could not reach the selected target without excessive quality loss. Try a larger target.";

    }


    downloadButton.href =
      currentDownloadUrl;

    downloadButton.download =
      "targetkb-compressed.jpg";


    resultSection.classList.remove("hidden");


    statusMessage.className =
      "status-message success";

    statusMessage.textContent =
      "Compression complete.";


    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  } catch (error) {

    console.error(error);

    showError(
      "Compression failed. Please try another image."
    );

  }


  isCompressing = false;

  compressButton.disabled = false;
  compressButton.textContent = "Compress Image";

  uploadBox.classList.remove("is-busy");
  document.querySelector(".options-section").classList.remove("is-busy");

});


/* =========================
   IMAGE LOADING
========================= */

function loadImage(file) {

  return new Promise(function(resolve, reject) {

    const image = new Image();

    const url =
      URL.createObjectURL(file);


    image.onload = function() {

      URL.revokeObjectURL(url);

      resolve(image);

    };


    image.onerror = function() {

      URL.revokeObjectURL(url);

      reject(
        new Error("Could not load image")
      );

    };


    image.src = url;

  });

}


/* =========================
   CANVAS TO JPEG
========================= */

function canvasToBlob(canvas, quality) {

  return new Promise(function(resolve, reject) {

    canvas.toBlob(
      function(blob) {

        if (blob) {

          resolve(blob);

        } else {

          reject(
            new Error("Could not create image")
          );

        }

      },
      "image/jpeg",
      quality
    );

  });

}


/* =========================
   FIND BEST QUALITY AT A GIVEN RESOLUTION
   Binary search converges tightly on the
   largest blob that is still <= target,
   instead of stepping down in coarse jumps.
========================================= */

async function findBestQualityForTarget(canvas, target) {

  let low = 0.05;
  let high = 0.95;

  /*
    If even the lowest quality is still
    above target, this resolution cannot
    reach the target — the caller should
    shrink the canvas and try again.
  */

  const lowestBlob =
    await canvasToBlob(canvas, low);

  if (lowestBlob.size > target) {
    return null;
  }

  let bestBlob = lowestBlob;

  for (let i = 0; i < 10; i++) {

    const quality = (low + high) / 2;

    const blob =
      await canvasToBlob(canvas, quality);

    if (blob.size <= target) {

      bestBlob = blob;
      low = quality;

    } else {

      high = quality;

    }

  }

  return bestBlob;

}


/* =========================
   COMPRESSION ENGINE
========================= */

async function compressImage(file, target) {

  const image =
    await loadImage(file);


  /*
    Phone camera photos are often 3000-5000px
    wide. Running the quality binary search at
    full resolution makes every toBlob() call
    slow. Start from a capped working size —
    it has no visible effect on a 50-500 KB
    JPEG since that resolution already exceeds
    what the target file size can hold.
  */

  const MAX_DIMENSION = 1600;

  const longestSide =
    Math.max(image.naturalWidth, image.naturalHeight);

  let scale =
    longestSide > MAX_DIMENSION
      ? MAX_DIMENSION / longestSide
      : 1;


  for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt++) {

    const canvas =
      document.createElement("canvas");

    canvas.width =
      Math.max(
        60,
        Math.round(image.naturalWidth * scale)
      );

    canvas.height =
      Math.max(
        60,
        Math.round(image.naturalHeight * scale)
      );

    const context =
      canvas.getContext("2d");

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );


    const found =
      await findBestQualityForTarget(
        canvas,
        target
      );

    if (found) {
      return found;
    }


    /*
      Even the lowest JPEG quality at this
      resolution is still above target —
      shrink the canvas and try the binary
      search again at a smaller size.
    */

    scale *= 0.82;

  }


  /*
    Fallback if 8 shrink attempts were not
    enough (extremely small target size).
    Return the smallest, lowest quality
    version so the user still gets a file.
  */

  const fallbackCanvas =
    document.createElement("canvas");

  fallbackCanvas.width =
    Math.max(
      40,
      Math.round(image.naturalWidth * scale)
    );

  fallbackCanvas.height =
    Math.max(
      40,
      Math.round(image.naturalHeight * scale)
    );

  const fallbackContext =
    fallbackCanvas.getContext("2d");

  fallbackContext.drawImage(
    image,
    0,
    0,
    fallbackCanvas.width,
    fallbackCanvas.height
  );

  return await canvasToBlob(fallbackCanvas, 0.4);

}


/* =========================
   HELPERS
========================= */

function formatBytes(bytes) {

  if (bytes < 1024) {

    return bytes + " B";

  }


  if (bytes < 1024 * 1024) {

    return (
      (bytes / 1024).toFixed(1) +
      " KB"
    );

  }


  return (
    (bytes / (1024 * 1024)).toFixed(2) +
    " MB"
  );

}


function showError(message) {

  statusMessage.className =
    "status-message error";

  statusMessage.textContent =
    message;

}


function showSuccess(message) {

  statusMessage.className =
    "status-message success";

  statusMessage.textContent =
    message;

}
