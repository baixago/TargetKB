const imageInput = document.getElementById("imageInput");
const uploadBox = document.querySelector(".upload-box");
const fileMessage = document.getElementById("fileMessage");
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

const targetButtons = document.querySelectorAll(".target-button");

let selectedFile = null;
let targetSize = 51200;
let compressedUrl = null;


/* =========================
   TARGET SIZE
========================= */

targetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    targetButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    targetSize = Number(button.dataset.target);

    // Custom button will be handled separately later.
    if (targetSize === 0) {
      statusMessage.textContent =
        "Best quality mode selected.";
    } else {
      statusMessage.textContent =
        `Target size selected: ${formatBytes(targetSize)}`;
    }

    statusMessage.className = "status-message";
  });
});


/* =========================
   FILE SELECT
========================= */

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (file) {
    selectFile(file);
  }
});


function selectFile(file) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    fileMessage.textContent =
      "Please choose a JPG, PNG or WebP image.";

    statusMessage.textContent =
      "Unsupported image format.";

    statusMessage.className =
      "status-message error";

    return;
  }

  selectedFile = file;

  fileMessage.textContent =
    `${file.name} • ${formatBytes(file.size)}`;

  compressButton.disabled = false;

  statusMessage.textContent =
    "Image ready to compress.";

  statusMessage.className =
    "status-message";

  resultSection.hidden = true;

  originalPreview.src =
    URL.createObjectURL(file);

  originalInfo.textContent =
    `Original: ${formatBytes(file.size)}`;
}


/* =========================
   DRAG & DROP
========================= */

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

  if (file) {
    selectFile(file);
  }
});


/* =========================
   COMPRESS
========================= */

compressButton.addEventListener("click", async () => {
  if (!selectedFile) {
    statusMessage.textContent =
      "Please choose an image first.";

    statusMessage.className =
      "status-message error";

    return;
  }

  compressButton.disabled = true;
  compressButton.textContent = "Compressing...";

  statusMessage.textContent =
    "Compressing your image...";

  statusMessage.className =
    "status-message";

  try {
    const blob = await compressImage(
      selectedFile,
      targetSize
    );

    showResult(blob);

    statusMessage.textContent =
      "Compression completed successfully.";

    statusMessage.className =
      "status-message success";

  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      "Compression failed. Please try another image.";

    statusMessage.className =
      "status-message error";
  }

  compressButton.disabled = false;
  compressButton.textContent =
    "Compress Image";
});


/* =========================
   LOAD IMAGE
========================= */

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
        new Error("Could not load image")
      );
    };

    image.src = url;
  });
}


/* =========================
   CANVAS → JPEG
========================= */

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
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
  const image = await loadImage(file);

  const canvas =
    document.createElement("canvas");

  const context =
    canvas.getContext("2d");

  let scale = 1;
  let quality = 0.88;

  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );


  /* Best Quality */

  if (target === 0) {
    return canvasToBlob(
      canvas,
      0.92
    );
  }


  /* Try different qualities */

  for (let attempt = 0; attempt < 20; attempt++) {

    const blob =
      await canvasToBlob(
        canvas,
        quality
      );

    if (blob.size <= target) {
      return blob;
    }


    /* Reduce quality first */

    if (quality > 0.35) {

      quality -= 0.05;

    } else {

      /* Then reduce dimensions */

      scale *= 0.85;

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

      quality = 0.78;
    }
  }


  /* Return best attempt */

  return canvasToBlob(
    canvas,
    Math.max(quality, 0.35)
  );
}


/* =========================
   SHOW RESULT
========================= */

function showResult(blob) {

  if (compressedUrl) {
    URL.revokeObjectURL(
      compressedUrl
    );
  }

  compressedUrl =
    URL.createObjectURL(blob);


  originalPreview.src =
    URL.createObjectURL(
      selectedFile
    );

  compressedPreview.src =
    compressedUrl;


  originalInfo.textContent =
    `Original: ${formatBytes(
      selectedFile.size
    )}`;


  compressedInfo.textContent =
    `Compressed: ${formatBytes(
      blob.size
    )}`;


  const saved =
    Math.max(
      0,
      Math.round(
        (1 - blob.size / selectedFile.size) * 100
      )
    );


  savedPercentage.textContent =
    `${saved}%`;


  if (blob.size <= targetSize) {

    qualityMessage.textContent =
      `Target reached: ${formatBytes(
        blob.size
      )}`;

  } else {

    qualityMessage.textContent =
      `Best practical result: ${formatBytes(
        blob.size
      )}`;

  }


  downloadButton.href =
    compressedUrl;

  downloadButton.download =
    "targetkb-compressed.jpg";


  resultSection.hidden =
    false;


  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================
   FORMAT FILE SIZE
========================= */

function formatBytes(bytes) {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}
