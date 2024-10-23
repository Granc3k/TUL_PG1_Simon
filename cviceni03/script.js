// Bayerovy matice pro dithering
const matrices = {
  "2x2": [
    [0, 2],
    [3, 1],
  ],
  "4x4": [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ],
  "8x8": [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ],
};

document.getElementById("kValue").addEventListener("input", function () {
  document.getElementById("kDisplay").innerText = this.value;
});

// Callback function called, when file is "opened"
function handleFileSelect(item) {
  var files = item.files;

  for (var i = 0; i < files.length; i++) {
    if (!files[i].type.match("image.*")) {
      continue;
    }

    var reader = new FileReader();

    reader.onload = (function (file) {
      return function (evt) {
        var srcImg = new Image();
        srcImg.src = evt.target.result;

        srcImg.onload = function () {
          var srcCanvas = document.getElementById("src");
          var srcContext = srcCanvas.getContext("2d");

          // zmeneni velikosti canvasu na velikost obrazku
          srcCanvas.height = srcImg.height;
          srcCanvas.width = srcImg.width;

          // print obrazku na canvas
          srcContext.drawImage(srcImg, 0, 0);

          // nastaveni ostatnich canvasu
          for (var i = 1; i <= 3; i++) {
            var outputCanvas = document.getElementById("outputCanvas" + i);
            outputCanvas.height = srcImg.height;
            outputCanvas.width = srcImg.width;
          }

          var convertButton = document.getElementById("convert");
          convertButton.disabled = false;
          convertButton.addEventListener("click", convertImage, false);
        };
      };
    })(files[i]);

    reader.readAsDataURL(files[i]);

    break;
  }
}

// Callback pro konverzi obrazu pri kliknuti na tlacitko Convert
function convertImage() {
  var srcCanvas = document.getElementById("src");
  var srcContext = srcCanvas.getContext("2d");
  var canvasHeight = srcCanvas.height;
  var canvasWidth = srcCanvas.width;

  // load puvodnich obrazovych dat
  var srcImageData = srcContext.getImageData(0, 0, canvasWidth, canvasHeight);

  // getne aktualni nastaveni z UI
  var matrixSelect = document.getElementById("matrixSelect").value;
  var kValue = parseFloat(document.getElementById("kValue").value);

  // vybere choosnutou matici a ostatni pro dynamicky print na canvasy
  var selectedMatrix = matrices[matrixSelect];
  var otherMatrices = Object.keys(matrices).filter(
    (key) => key !== matrixSelect
  );

  // check, ze jsou vsechny matice v poradku
  var matricesOrder = [matrixSelect, ...otherMatrices];

  // aktualizace popisku
  for (var i = 1; i <= 3; i++) {
    var matrixKey = matricesOrder[i - 1];
    var label = document.getElementById("label" + i);
    label.innerText = "Výstup pro matici " + matrixKey;
  }

  // vytvoreni vystupu pro kazdou matici
  for (var i = 1; i <= 3; i++) {
    var outputCanvas = document.getElementById("outputCanvas" + i);
    var outputContext = outputCanvas.getContext("2d");

    // vytvoreni nove kopie obrazovych dat pro kazdou matici
    var outputImageData = new ImageData(
      new Uint8ClampedArray(srcImageData.data),
      canvasWidth,
      canvasHeight
    );

    // getne aktualni matici na zaklade indexu
    var matrixKey = matricesOrder[i - 1];
    var matrix = matrices[matrixKey];
    var matrixSize = matrix.length;

    // provedeni konverze na zaklade aktualni matice a hodnoty k
    convertImageData(outputImageData, matrixSize, matrix, kValue);

    // print na canvas
    outputContext.putImageData(outputImageData, 0, 0);
  }
}

// funkce pro konverzi obrazku do grayscalu
function convertImageData(imgData, matrixSize, matrix, k) {
  var rawData = imgData.data;

  for (var y = 0; y < imgData.height; y++) {
    for (var x = 0; x < imgData.width; x++) {
      var pixelIndex = (imgData.width * y + x) * 4;
      var red = rawData[pixelIndex + 0];
      var green = rawData[pixelIndex + 1];
      var blue = rawData[pixelIndex + 2];
      var alpha = rawData[pixelIndex + 3];

      // konverze BT.601
      var gray = 0.299 * red + 0.587 * green + 0.114 * blue;

      // normalizace matice do rozsahu 0-255 a aplikace hodnoty k z UI
      var threshold =
        (matrix[y % matrixSize][x % matrixSize] / (matrixSize * matrixSize)) *
        255 *
        k;

      // Aplikace prahovani (thresholding)
      if (gray > threshold) {
        gray = 255;
      } else {
        gray = 0;
      }

      rawData[pixelIndex + 0] = gray; // red
      rawData[pixelIndex + 1] = gray; // green
      rawData[pixelIndex + 2] = gray; // blue
      rawData[pixelIndex + 3] = alpha; // alpha (zustane stejna)
    }
  }
}
