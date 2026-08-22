/* TargetKB script.js — v14 (keyboard accessibility on upload box) */

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
const compressHint = document.getElementById("compressHint");
const statusMessage = document.getElementById("statusMessage");

const resultSection = document.getElementById("resultSection");

const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");

const originalInfo = document.getElementById("originalInfo");
const compressedInfo = document.getElementById("compressedInfo");

const savedPercentage = document.getElementById("savedPercentage");
const targetInfo = document.getElementById("targetInfo");
const qualityMessage = document.getElementById("qualityMessage");

const downloadButton = document.getElementById("downloadButton");


let selectedFile = null;
let targetSize = 51200;
let currentDownloadUrl = null;
let currentSelectedPreviewUrl = null;
let currentOriginalPreviewUrl = null;
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

  if (kb >= 10 && kb <= 50000) {
    targetSize = kb * 1024;
  } else {
    targetSize = null;
  }

  resultSection.classList.add("hidden");

});


/* =========================
   CLICK ANYWHERE IN BOX
   (upload-box is now a div, not a
   label, so clicking empty space
   needs to open the file picker
   manually — except when tapping
   the Choose Image label itself,
   which already handles it, or
   when an image is already selected)
========================= */

uploadBox.addEventListener("click", function(event) {

  if (isCompressing) {
    return;
  }

  if (!uploadSelected.classList.contains("hidden")) {
    return;
  }

  if (event.target.closest(".choose-button")) {
    return;
  }

  imageInput.value = "";
  imageInput.click();

});


uploadBox.addEventListener("keydown", function(event) {

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  if (event.target.closest(".choose-button, .change-button")) {
    return;
  }

  event.preventDefault();

  uploadBox.click();

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

  if (
    !file ||
    !file.type.match(/^image\/(jpeg|png|webp)$/)
  ) {

    showError("Please select a JPG, PNG or WebP image.");

    return;
  }


  selectedFile = file;


  /* Show thumbnail (revoke old preview URL first to avoid leaks) */

  if (currentSelectedPreviewUrl) {
    URL.revokeObjectURL(currentSelectedPreviewUrl);
  }

  currentSelectedPreviewUrl =
    URL.createObjectURL(file);

  selectedPreview.src = currentSelectedPreviewUrl;


  /* Show friendly upload state */

  uploadInitial.classList.add("hidden");
  uploadSelected.classList.remove("hidden");


  selectedInfo.textContent =
    file.name + " • " + formatBytes(file.size);


  compressButton.disabled = false;

  compressHint.classList.add("hidden");

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

  imageInput.value = "";
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

    if (currentOriginalPreviewUrl) {
      URL.revokeObjectURL(currentOriginalPreviewUrl);
    }

    currentOriginalPreviewUrl =
      URL.createObjectURL(selectedFile);

    originalPreview.src =
      currentOriginalPreviewUrl;

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


    targetInfo.textContent =
      formatBytes(targetSize);


    const keptOriginal = (blob === selectedFile);


    if (keptOriginal) {

      qualityMessage.textContent =
        "Your image was already smaller than the target size, so it was kept unchanged.";

    } else if (blob.size <= targetSize) {

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
      keptOriginal
        ? selectedFile.name
        : "targetkb-compressed.jpg";


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

async function findBestQualityForTarget(canvas, target, onProgress) {

  let low = 0.05;
  let high = 0.99;

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

  for (let i = 0; i < 12; i++) {

    if (onProgress) {
      onProgress(i + 1, 12);
    }

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

  /*
    If the original is already at or under
    the target, re-encoding it as JPEG only
    risks degrading quality for no benefit —
    keep the original file untouched.
  */

  if (file.size <= target) {
    return file;
  }


  const image =
    await loadImage(file);


  /*
    Quality alone gives fine, continuous control
    over file size, so the binary search below
    can land within a few KB of the target on its
    own without needing to touch resolution at all
    — as long as the canvas isn't too large to
    search through quickly.

    In earlier testing, running that search at
    full native resolution (uncapped) gave very
    accurate results but took 20-30+ seconds on
    typical 12MP+ phone photos, since each quality
    check has to re-encode the full-size image.

    3200px is a deliberate speed/accuracy trade-off,
    not just a crash-safety fallback: any photo
    with a longer side above 3200px is downscaled
    to 3200px BEFORE the quality search runs, which
    keeps compression fast. Resolution is reduced
    further, in a second pass, only if even the
    lowest JPEG quality at 3200px is still above
    the target.

    Tested results at this cap were still close to
    target (e.g. 500KB target → ~445KB, 750KB target
    → ~695KB) while keeping compression to a few
    seconds — a better trade-off for this tool than
    native-resolution accuracy at 20-30+ second
    wait times.
  */

  const MAX_DIMENSION = 3200;

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

    /*
      JPEG has no alpha channel. Without this,
      transparent areas in a PNG or WebP source
      render as black once encoded as JPEG.
    */

    context.fillStyle = "#ffffff";

    context.fillRect(
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


    const found =
      await findBestQualityForTarget(
        canvas,
        target,
        function(step, totalSteps) {
          statusMessage.textContent =
            "Working on your image... (" + step + "/" + totalSteps + ")";
        }
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

  fallbackContext.fillStyle = "#ffffff";

  fallbackContext.fillRect(
    0,
    0,
    fallbackCanvas.width,
    fallbackCanvas.height
  );

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
