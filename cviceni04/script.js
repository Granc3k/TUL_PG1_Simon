let srcImageData = null; // global variable pro uchovani dat

function handleFileSelect(item) {
  var files = item.files;

  for (var i = 0; i < files.length; i++) {
    if (!files[i].type.match("image.*")) continue;

    var reader = new FileReader();
    reader.onload = (function (file) {
      return function (evt) {
        var srcImg = new Image();
        srcImg.src = evt.target.result;
        srcImg.onload = function () {
          var srcCanvas = document.getElementById("src");
          var srcContext = srcCanvas.getContext("2d");
          var histCanvas = document.getElementById("histogram");

          // load a print histogramu
          srcContext.drawImage(srcImg, 0, 0, srcCanvas.width, srcCanvas.height);

          // savnuti obrazovych dat
          srcImageData = srcContext.getImageData(
            0,
            0,
            srcCanvas.width,
            srcCanvas.height
          );

          // vytvoreni a print histogramu
          updateHistogram();
        };
      };
    })(files[i]);

    reader.readAsDataURL(files[i]);
    break;
  }
}

// vypocet histogramu
function calculateHistogram(imageData, channel) {
  var srcData = imageData.data;
  var histogram = new Array(256).fill(0);

  for (var i = 0; i < srcData.length; i += 4) {
    var value;

    if (channel === "red") {
      value = srcData[i];
    } else if (channel === "green") {
      value = srcData[i + 1];
    } else if (channel === "blue") {
      value = srcData[i + 2];
    } else if (channel === "gray") {
      value =
        0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2];
    }

    histogram[Math.floor(value)]++;
  }

  return histogram;
}

// update histogramu po zmene moznosti vykresleni
function updateHistogram() {
  if (!srcImageData) return;

  var histCanvas = document.getElementById("histogram");
  var histContext = histCanvas.getContext("2d");

  // getnuti moznosti printu
  var channel = document.getElementById("channel").value;

  if (channel === "all") {
    // print vsech kanalu
    drawAllHistograms(histContext);
  } else {
    // vypocet a print jednoho kanalu
    var histogram = calculateHistogram(srcImageData, channel);
    drawHistogram(histogram, histContext, channel);
  }
}

// print histogramu
function drawHistogram(histogram, context, channel) {
  context.clearRect(0, 0, 256, 256);
  var color;

  switch (channel) {
    case "red":
      color = "red";
      break;
    case "green":
      color = "green";
      break;
    case "blue":
      color = "blue";
      break;
    case "gray":
      color = "gray";
      break;
  }

  var maxCount = Math.max(...histogram);
  context.fillStyle = color;

  for (var i = 0; i < histogram.length; i++) {
    var barHeight = (histogram[i] / maxCount) * 256;
    context.fillRect(i, 256 - barHeight, 1, barHeight);
  }
}

// print vsech histogramu do jednoho
function drawAllHistograms(context) {
  context.clearRect(0, 0, 256, 256);
  var colors = ["red", "green", "blue", "gray"];
  var maxCounts = [];

  // vypocet histogramu pro všechny kanaly
  var redHist = calculateHistogram(srcImageData, "red");
  var greenHist = calculateHistogram(srcImageData, "green");
  var blueHist = calculateHistogram(srcImageData, "blue");
  var grayHist = calculateHistogram(srcImageData, "gray");

  var histograms = [redHist, greenHist, blueHist, grayHist];

  // Najít maximální hodnotu pro každý histogram, aby se daly normalizovat
  for (var h of histograms) {
    maxCounts.push(Math.max(...h));
  }

  // nastaveni aplhy pro pruhlednost
  context.globalAlpha = 0.8;

  // print kazdeho kanalu
  for (var i = 0; i < histograms.length; i++) {
    var histogram = histograms[i];
    var color = colors[i];
    context.fillStyle = color;

    for (var j = 0; j < histogram.length; j++) {
      var barHeight = (histogram[j] / maxCounts[i]) * 256;
      context.fillRect(j, 256 - barHeight, 1, barHeight);
    }
  }

  // vraceni puvodni hodnoty pruhlednosti
  context.globalAlpha = 1.0;
}
