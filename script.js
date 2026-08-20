const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");

const fileMessage = document.getElementById("fileMessage");
const compressButton = document.getElementById("compressButton");

const statusMessage = document.getElementById("statusMessage");

const targetButtons = document.querySelectorAll(".target-button");

const customBox = document.getElementById("customBox");
const customSize = document.getElementById("customSize");

const resultSection = document.getElementById("resultSection");

const originalPreview =
  document.getElementById("originalPreview");

const compressedPreview =
  document.getElementById("compressedPreview");

const originalInfo =
  document.getElementById("originalInfo");

const compressedInfo =
  document.getElementById("compressedInfo");

const savedPercentage =
  document.getElementById("savedPercentage");

const qualityMessage =
  document.getElementById("qualityMessage");

const downloadButton =
  document.getElementById("downloadButton");


let selectedFile = null;
let targetSize = 51200;
let compressedUrl = null;


/* =========================
   TARGET BUTTONS
========================= */

targetButtons.forEach(function(button) {

  button.addEventListener("click", function() {

    targetButtons.forEach(function(item) {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const target = button.dataset.target;

    if (target === "custom") {

      customBox.classList.add("show");

      updateCustomTarget();

    } else {

      customBox.classList.remove("show");

      targetSize = Number(target);

    }

  });

});


/* =========================
   CUSTOM SIZE
========================= */

customSize.addEventListener("input", function() {
  updateCustomTarget();
});


function updateCustomTarget() {

  const value = Number(customSize.value);

  if (value > 0) {

    targetSize = value * 1024;

  }

}


/* =========================
   FILE SELECT
========================= */

imageInput.addEventListener("change", function(event) {

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

    showError(
      "Please select a JPG, PNG or WebP image."
    );

    return;
  }


  selectedFile = file;

  fileMessage.textContent =
    file.name + " • " + formatBytes(file.size);


  compressButton.disabled = false;

  resultSection.hidden = true;

  statusMessage.textContent = "";

  originalPreview.src =
    URL.createObjectURL(file);

}


/* =========================
   DRAG & DROP
========================= */

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

  const file =
    event.dataTransfer.files[0];

  selectFile(file);

});


/* =========================
   COMPRESS
========================= */

compressButton.addEventListener("click", async function() {

  if (!selectedFile) {

    showError(
      "Please choose an image first."
    );

    return;
  }


  const activeButton =
    document.querySelector(".target-button.active");


  if (
    activeButton &&
    activeButton.dataset.target === "custom"
  ) {

    const customValue =
      Number(customSize.value);


    if (!customValue || customValue <= 0) {

      showError(
        "Please enter a valid target size."
      );

      return;
    }


    targetSize =
      customValue * 1024;

  }


  compressButton.disabled = true;

  compressButton.textContent =
    "Compressing...";


  statusMessage.textContent =
    "Optimizing your image...";

  statusMessage.className =
    "status-message";


  try {

    const blob =
      await compressImage(
        selectedFile,
        targetSize
      );


    if (compressedUrl) {

      URL.revokeObjectURL(
        compressedUrl
      );

    }


    compressedUrl =
      URL.createObjectURL(blob);


    compressedPreview.src =
      compressedUrl;


    originalInfo.textContent =
      "Original: " +
      formatBytes(selectedFile.size);


    compressedInfo.textContent =
      "Compressed: " +
      formatBytes(blob.size);


    const saved =
      Math.max(
        0,
        Math.round(
          (1 - blob.size / selectedFile.size) * 100
        )
      );


    savedPercentage.textContent =
      saved + "%";


    if (blob.size <= targetSize) {

      qualityMessage.textContent =
        "Target size reached while preserving the best possible quality.";

      statusMessage.textContent =
        "Compression complete.";

      statusMessage.className =
        "status-message success";

    } else {

      qualityMessage.textContent =
        "The selected target was very small. The closest practical result was created.";

      statusMessage.textContent =
        "Compression complete with the closest practical result.";

    }


    downloadButton.href =
      compressedUrl;


    downloadButton.download =
      "targetkb-compressed.jpg";


    resultSection.hidden = false;


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

  compressButton.textContent =
    "Compress Image";

});


/* =========================
   LOAD IMAGE
========================= */

function loadImage(file) {

  return new Promise(function(resolve, reject) {

    const image =
      new Image();

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
   CANVAS TO BLOB
========================= */

function canvasToBlob(
  canvas,
  quality
) {

  return new Promise(function(resolve, reject) {

    canvas.toBlob(
      function(blob) {

        if (blob) {

          resolve(blob);

        } else {

          reject(
            new Error(
              "Could not create image"
            )
          );

        }

      },
      "image/jpeg",
      quality
    );

  });

}


/* =========================
   IMAGE COMPRESSION
========================= */

async function compressImage(
  file,
  target
) {

  const image =
    await loadImage(file);


  const canvas =
    document.createElement("canvas");


  const context =
    canvas.getContext("2d");


  let quality = 0.90;

  let scale = 1;

  let blob = null;


  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;


  function drawImage() {

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

  }


  drawImage();


  for (
    let attempt = 0;
    attempt < 30;
    attempt++
  ) {

    blob =
      await canvasToBlob(
        canvas,
        quality
      );


    if (blob.size <= target) {

      return blob;

    }


    if (quality > 0.30) {

      quality -= 0.04;

    } else {

      scale *= 0.86;


      canvas.width =
        Math.max(
          300,
          Math.round(
            image.naturalWidth * scale
          )
        );


      canvas.height =
        Math.max(
          300,
          Math.round(
            image.naturalHeight * scale
          )
        );


      drawImage();


      quality = 0.78;

    }

  }


  return blob;

}


/* =========================
   FORMAT BYTES
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


/* =========================
   ERROR
========================= */

function showError(message) {

  statusMessage.textContent =
    message;

  statusMessage.className =
    "status-message error";

}
