// Callback function called, when file is "opened"
function handleFileSelect(item, elementName) {
  var files = item.files;

  console.log(files);

  for (var i = 0; i < files.length; i++) {
    console.log(files[i], files[i].name, files[i].size, files[i].type);

    // Only process image files.
    if (!files[i].type.match("image.*")) {
      continue;
    }

    var reader = new FileReader();

    // Closure for loading image to memory
    reader.onload = (function (file) {
      return function (evt) {
        var srcImg = new Image();
        srcImg.src = evt.target.result;

        srcImg.onload = function () {
          var srcCanvas = document.getElementById(elementName);
          var srcContext = srcCanvas.getContext("2d");

          // Change size of canvas
          srcCanvas.height = srcImg.height;
          srcCanvas.width = srcImg.width;

          srcContext.drawImage(srcImg, 0, 0);

          var dstCanvas = document.getElementById("result");
          dstCanvas.height = srcImg.height;
          dstCanvas.width = srcImg.width;

          var convertButton = document.getElementById("convert");
          // Enabled button
          convertButton.disabled = false;
          // Add callback
          convertButton.addEventListener("click", convertImage, false);
        };
      };
    })(files[i]);

    reader.readAsDataURL(files[i]);

    break;
  }
}

// Callback function called, when clicked at Convert button
function convertImage() {
  var personCanvas = document.getElementById("person");
  var personContext = personCanvas.getContext("2d");
  var canvasHeight = personCanvas.height;
  var canvasWidth = personCanvas.width;

  var personImageData = personContext.getImageData(
    0,
    0,
    canvasWidth,
    canvasHeight
  );
  var backgroundImageData = document
    .getElementById("background")
    .getContext("2d")
    .getImageData(0, 0, canvasWidth, canvasHeight);
  var logoImageData = document
    .getElementById("logo")
    .getContext("2d")
    .getImageData(0, 0, canvasWidth, canvasHeight);
  var resultImageData = document
    .getElementById("result")
    .getContext("2d")
    .getImageData(0, 0, canvasWidth, canvasHeight);

  convertImageData(
    personImageData,
    backgroundImageData,
    logoImageData,
    resultImageData
  );

  document
    .getElementById("result")
    .getContext("2d")
    .putImageData(resultImageData, 0, 0);
}

//calculate color distance (difference) between two colors
function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    (r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2)
  );
}

// Helper function to get logo data without alpha channel
function getLogoData(logoImageData) {
  var logoData = logoImageData.data;
  var logoWidth = logoImageData.width;
  var logoHeight = logoImageData.height;

  var newWidth = 100; // Desired width of logo in result
  var newHeight = 100; // Desired height of logo in result

  // Create a new canvas for logo extraction
  var logoCanvas = document.createElement("canvas");
  var logoContext = logoCanvas.getContext("2d");
  logoCanvas.width = logoWidth;
  logoCanvas.height = logoHeight;

  logoContext.putImageData(logoImageData, 0, 0);

  // Find the bounding box of the non-transparent pixels
  var minX = logoWidth,
    minY = logoHeight,
    maxX = 0,
    maxY = 0;
  for (var y = 0; y < logoHeight; y++) {
    for (var x = 0; x < logoWidth; x++) {
      var index = (y * logoWidth + x) * 4;
      if (logoData[index + 3] > 0) {
        // Check alpha channel
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Calculate logo width and height
  var logoWidthActual = maxX - minX + 1;
  var logoHeightActual = maxY - minY + 1;

  // Extract the non-transparent portion of the logo
  var extractedLogoData = logoContext.getImageData(
    minX,
    minY,
    logoWidthActual,
    logoHeightActual
  );

  // Create a new canvas to resize the logo to desired dimensions
  var resizedLogoCanvas = document.createElement("canvas");
  resizedLogoCanvas.width = newWidth;
  resizedLogoCanvas.height = newHeight;
  var resizedLogoContext = resizedLogoCanvas.getContext("2d");

  // Draw the extracted logo on the resized canvas
  resizedLogoContext.putImageData(extractedLogoData, 0, 0);
  resizedLogoContext.drawImage(resizedLogoCanvas, 0, 0, newWidth, newHeight);

  return resizedLogoCanvas;
}

// Function for converting raw data of image with alpha blending and keying
function convertImageData(
  personImageData,
  backgroundImageData,
  logoImageData,
  resultImageData
) {
  var personData = personImageData.data;
  var backgroundData = backgroundImageData.data;
  var logoData = logoImageData.data;
  var resultData = resultImageData.data;
  var precision = document.getElementById("precision").value / 100;

  // selected key color
  var keyColorInput = document.getElementById("keyColor").value;
  var keyRed = parseInt(keyColorInput.slice(1, 3), 16);
  var keyGreen = parseInt(keyColorInput.slice(3, 5), 16);
  var keyBlue = parseInt(keyColorInput.slice(5, 7), 16);

  //through each pixel
  for (var pixelIndex = 0; pixelIndex < personData.length; pixelIndex += 4) {
    var red = personData[pixelIndex + 0];
    var green = personData[pixelIndex + 1];
    var blue = personData[pixelIndex + 2];
    var alpha = personData[pixelIndex + 3];

    // color distance between the current pixel and the key color
    var dist = colorDistance(red, green, blue, keyRed, keyGreen, keyBlue);

    // Remove background if the color is close to the key color
    if (dist < 255 * precision) {
      personData[pixelIndex + 3] = 0; // sets pixel fully transparent
    }

    // Grayscale for logo
    var gsVal =
      logoData[pixelIndex + 0] * 0.3 +
      logoData[pixelIndex + 1] * 0.59 +
      logoData[pixelIndex + 2] * 0.11;
    logoData[pixelIndex + 0] = gsVal;
    logoData[pixelIndex + 1] = gsVal;
    logoData[pixelIndex + 2] = gsVal;

    // Alpha blending
    var alphaPerson = personData[pixelIndex + 3] / 255;
    var alphaBackground = 1 - alphaPerson;

    // Blend foreground and background
    red = Math.round(
      personData[pixelIndex + 0] * alphaPerson +
        backgroundData[pixelIndex + 0] * alphaBackground
    );
    green = Math.round(
      personData[pixelIndex + 1] * alphaPerson +
        backgroundData[pixelIndex + 1] * alphaBackground
    );
    blue = Math.round(
      personData[pixelIndex + 2] * alphaPerson +
        backgroundData[pixelIndex + 2] * alphaBackground
    );

    // Check for logo to draw on top
    if (logoData[pixelIndex + 3] > 0) {
      red = logoData[pixelIndex + 0];
      green = logoData[pixelIndex + 1];
      blue = logoData[pixelIndex + 2];
    }

    // Write to the resulting image
    resultData[pixelIndex + 0] = red;
    resultData[pixelIndex + 1] = green;
    resultData[pixelIndex + 2] = blue;
    resultData[pixelIndex + 3] = 255;
  }

  // Add logo to the result in the top right corner
  var logoCanvas = getLogoData(logoImageData);
  
  // Draw the resized logo in the top right corner of the result
  var logoWidth = 100; // Size of logo
  var logoHeight = 100;
  var logoX = resultImageData.width - logoWidth; // Position in result
  var logoY = 0;

  // Draw the logo onto the result canvas
  var resultCanvas = document.getElementById("result");
  var resultContext = resultCanvas.getContext("2d");
  resultContext.drawImage(logoCanvas, logoX, logoY, logoWidth, logoHeight);
}
