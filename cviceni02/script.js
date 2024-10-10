// Callback function called, when file is "opened"
function handleFileSelect(item, elementName) {
  var files = item.files;

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

  // Get the picked RGB value from the color picker
  var pickedColor = document.getElementById("bgColor").value;
  var rPicked = parseInt(pickedColor.substr(1, 2), 16);
  var gPicked = parseInt(pickedColor.substr(3, 2), 16);
  var bPicked = parseInt(pickedColor.substr(5, 2), 16);

  // Convert picked RGB to HSV
  var hsvPicked = rgbToHsv(rPicked, gPicked, bPicked);
  var pickedHue = hsvPicked[0]; // Hue of the picked color
  var pickedSaturation = hsvPicked[1]; // Saturation of the picked color

  let sensitivityPercentage = Number(
    document.getElementById("tolerance").value
  );

  // Adjust thresholds based on sensitivityPercentage
  var hueRange = 120 * (sensitivityPercentage / 100); // 120 is a common range for hues
  var minHue = pickedHue - hueRange / 2;
  var maxHue = pickedHue + hueRange / 2;

  var minSaturation = pickedSaturation * (sensitivityPercentage / 100);

  for (var pixelIndex = 0; pixelIndex < personData.length; pixelIndex += 4) {
    var r = personData[pixelIndex + 0];
    var g = personData[pixelIndex + 1];
    var b = personData[pixelIndex + 2];
    var alpha = personData[pixelIndex + 3] / 255.0; // Normalize to 0-1 range

    // Get the grayscale value of the logo pixel
    var logoR = logoData[pixelIndex + 0];
    var logoG = logoData[pixelIndex + 1];
    var logoB = logoData[pixelIndex + 2];
    var logoAlpha = logoData[pixelIndex + 3] / 255.0; // Normalize to 0-1 range

    // Convert the RGB values of the person pixel to HSV
    var hsv = rgbToHsv(r, g, b);
    var hue = hsv[0],
      saturation = hsv[1];

    // Calculate grayscale for logo
    let gray = 0.299 * logoR + 0.587 * logoG + 0.114 * logoB;

    // Apply thresholding for person pixels
    var gValue = personData[pixelIndex + 1] / (personData[pixelIndex + 0] + personData[pixelIndex + 1] + personData[pixelIndex + 2]);
    var precision = document.getElementById("precision").value / 100;
    if (gValue > precision) {
      personData[pixelIndex + 3] = 0; // Set alpha to 0 for thresholded pixels
    }

    // If the logo pixel has opacity, render the logo in grayscale
    if (logoAlpha > 0) {
      resultData[pixelIndex + 0] = gray;
      resultData[pixelIndex + 1] = gray;
      resultData[pixelIndex + 2] = gray;
      resultData[pixelIndex + 3] = logoAlpha * 255;
    } else {
      // If the pixel is part of the detected color range
      if (hue >= minHue && hue <= maxHue && saturation >= minSaturation) {
        // Use background pixel data
        resultData[pixelIndex + 0] = backgroundData[pixelIndex + 0];
        resultData[pixelIndex + 1] = backgroundData[pixelIndex + 1];
        resultData[pixelIndex + 2] = backgroundData[pixelIndex + 2];
        resultData[pixelIndex + 3] = 255; // Fully opaque
      } else {
        // Not a green screen pixel, use the person image data and blend with background
        resultData[pixelIndex + 0] = r * alpha + backgroundData[pixelIndex + 0] * (1 - alpha);
        resultData[pixelIndex + 1] = g * alpha + backgroundData[pixelIndex + 1] * (1 - alpha);
        resultData[pixelIndex + 2] = b * alpha + backgroundData[pixelIndex + 2] * (1 - alpha);
        resultData[pixelIndex + 3] = alpha * 255; // Convert back to 0-255 range
      }
    }
  }
}

// Function to convert RGB to HSV
function rgbToHsv(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    v = max;
  var d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}
