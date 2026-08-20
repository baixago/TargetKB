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


/* =========================
   TARGET BUTTONS
========================= */

targetButtons.forEach(function(button) {

  button.addEventListener("click", function() {

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

  imageInput.click();

});


/* =========================
   DRAG & DROP
========================= */

["dragenter", "dragover"].forEach(function(eventName) {

  uploadBox.addEventListener(eventName, function(event) {

    event.preventDefault();

    uploadBox.style.borderColor = "#2f6fed";
    uploadBox.style.background = "#f0f5ff";

  });

});


["dragleave", "drop"].forEach(function(eventName) {

  uploadBox.addEventListener(eventName, function(event) {

    event.preventDefault();

    uploadBox.style.borderColor = "";
    uploadBox.style.background = "";

  });

});


uploadBox.addEventListener("drop", function(event) {

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


  compressButton.disabled = true;
  compressButton.textContent = "Compressing...";

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

      qualityMessage.textContent =
        "Target size reached while preserving the best practical quality.";

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


  compressButton.disabled = false;
  compressButton.textContent = "Compress Image";

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
   COMPRESSION ENGINE
========================= */

async function compressImage(file, target) {

  const image =
    await loadImage(file);


  const canvas =
    document.createElement("canvas");


  const context =
    canvas.getContext("2d");


  let scale = 1;
  let quality = 0.88;
  let blob = null;


  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;


  for (let attempt = 0; attempt < 25; attempt++) {

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


    blob =
      await canvasToBlob(
        canvas,
        quality
      );


    if (blob.size <= target) {

      return blob;

    }


    if (quality > 0.35) {

      quality -= 0.055;

    } else {

      scale *= 0.86;


      canvas.width =
        Math.max(
          250,
          Math.round(
            image.naturalWidth * scale
          )
        );


      canvas.height =
        Math.max(
          250,
          Math.round(
            image.naturalHeight * scale
          )
        );


      quality = 0.78;

    }

  }


  return blob;

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
