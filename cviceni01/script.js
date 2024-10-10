function LoadImage(srcImg, srcContext) {
  let red = [];
  let green = [];
  let blue = [];
  let alpha = [];

  let imgHeight = srcImg.height;
  let imgWidth = srcImg.width;

  let imgData = srcContext.getImageData(0, 0, imgWidth, imgHeight);
  let srcData = imgData.data;

  for (let y = 0; y < imgHeight; y++) {
    for (let x = 0; x < imgWidth; x++) {
      let index = imgData.width * y + x;

      let r = srcData[index * 4];
      let g = srcData[index * 4 + 1];
      let b = srcData[index * 4 + 2];
      let a = srcData[index * 4 + 3];
      red.push(r);
      green.push(g);
      blue.push(b);
      alpha.push(a);
    }
  }
  const ImageData = {
    red: red,
    green: green,
    blue: blue,
    alpha: alpha,
    height: imgHeight,
    width: imgWidth,
    image: srcImg,
  };
  return ImageData;
}
//CANVAS 2
function GrayScaleBT(imgData, canvasId) {
  let dstCanvas = document.getElementById(canvasId);
  let dstContext = dstCanvas.getContext("2d");
  let dstImg = dstContext.createImageData(imgData.width, imgData.height);
  let dstData = dstImg.data;

  let red = imgData.red;
  let green = imgData.green;
  let blue = imgData.blue;
  let alpha = imgData.alpha;

  for (let y = 0; y < imgData.height; y++) {
    for (let x = 0; x < imgData.width; x++) {
      let index = imgData.width * y + x;

      let r = red[index];
      let g = green[index];
      let b = blue[index];
      let a = alpha[index];

      gray = (r + g + b) / 3;

      dstData[index * 4] = gray;
      dstData[index * 4 + 1] = gray;
      dstData[index * 4 + 2] = gray;
      dstData[index * 4 + 3] = a;
    }
  }
  dstContext.putImageData(dstImg, 0, 0);
}
//CANVAS 3
function GrayScale(imgData, canvasId) {
  let dstCanvas = document.getElementById(canvasId);
  let dstContext = dstCanvas.getContext("2d");
  let dstImg = dstContext.createImageData(imgData.width, imgData.height);
  let dstData = dstImg.data;

  let red = imgData.red;
  let green = imgData.green;
  let blue = imgData.blue;
  let alpha = imgData.alpha;

  for (let y = 0; y < imgData.height; y++) {
    for (let x = 0; x < imgData.width; x++) {
      let index = imgData.width * y + x;

      let r = red[index];
      let g = green[index];
      let b = blue[index];
      let a = alpha[index];

      //BT.601
      //Y=0.299R+0.587G+0.114B
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      dstData[index * 4] = gray;
      dstData[index * 4 + 1] = gray;
      dstData[index * 4 + 2] = gray;
      dstData[index * 4 + 3] = a;
    }
  }
  dstContext.putImageData(dstImg, 0, 0);
}
//CANVAS 4
function SeparateRGB(imgData, canvasId) {
  dstCanvas = document.getElementById(canvasId);
  dstContext = dstCanvas.getContext("2d");
  dstImg = dstContext.getImageData(0, 0, imgData.width, imgData.height);
  dstData = dstImg.data;
  let tempCanvas = document.createElement("canvas");
  let tempContext = tempCanvas.getContext("2d");

  tempCanvas.width = imgData.width / 2;
  tempCanvas.height = imgData.height / 2;
  tempContext.drawImage(
    imgData.image,
    0,
    0,
    imgData.width / 2,
    imgData.height / 2
  );
  let smallImageData = tempContext.getImageData(
    0,
    0,
    imgData.width / 2,
    imgData.height / 2
  );
  let smallData = smallImageData.data;

  for (let y = 0; y < imgData.height / 2; y++) {
    for (let x = 0; x < imgData.width / 2; x++) {
      let index = ((imgData.width / 2) * y + x) * 4;
      let red = smallData[index];
      let green = smallData[index + 1];
      let blue = smallData[index + 2];
      let alpha = smallData[index + 3];
      let redIndex = (imgData.width * y + x) * 4;

      dstData[redIndex] = red;
      dstData[redIndex + 1] = 0;
      dstData[redIndex + 2] = 0;
      dstData[redIndex + 3] = alpha;

      let greenIndex = (imgData.width * y + (x + imgData.width / 2)) * 4;
      dstData[greenIndex] = 0;
      dstData[greenIndex + 1] = green;
      dstData[greenIndex + 2] = 0;
      dstData[greenIndex + 3] = alpha;

      let blueIndex = (imgData.width * (y + imgData.height / 2) + x) * 4;
      dstData[blueIndex] = 0;
      dstData[blueIndex + 1] = 0;
      dstData[blueIndex + 2] = blue;
      dstData[blueIndex + 3] = alpha;

      let alphaIndex =
        (imgData.width * (y + imgData.height / 2) + (x + imgData.width / 2)) *
        4;
      dstData[alphaIndex] = alpha;
      dstData[alphaIndex + 1] = alpha;
      dstData[alphaIndex + 2] = alpha;
      dstData[alphaIndex + 3] = 255;
    }
  }
  dstContext.putImageData(dstImg, 0, 0);
}
//CANVAS 5
function ImageToCmyk(imgData, canvasId) {
  dstCanvas = document.getElementById(canvasId);
  dstContext = dstCanvas.getContext("2d");
  dstImg = dstContext.getImageData(0, 0, imgData.width, imgData.height);
  dstData = dstImg.data;
  let tempCanvas = document.createElement("canvas");
  let tempContext = tempCanvas.getContext("2d");

  tempCanvas.width = imgData.width / 2;
  tempCanvas.height = imgData.height / 2;
  tempContext.drawImage(
    imgData.image,
    0,
    0,
    imgData.width / 2,
    imgData.height / 2
  );
  let smallImageData = tempContext.getImageData(
    0,
    0,
    imgData.width / 2,
    imgData.height / 2
  );
  let smallData = smallImageData.data;

  for (let y = 0; y < imgData.height / 2; y++) {
    for (let x = 0; x < imgData.width / 2; x++) {
      let index = ((imgData.width / 2) * y + x) * 4;
      let red = smallData[index];
      let green = smallData[index + 1];
      let blue = smallData[index + 2];
      let alpha = smallData[index + 3];

      let C = 1 - red / 255;
      let M = 1 - green / 255;
      let Y = 1 - blue / 255;

      let K = Math.min(C, M, Y);
      if (K < 1) {
        C = (C - K) / (1 - K);
        M = (M - K) / (1 - K);
        Y = (Y - K) / (1 - K);
      } else {
        C = 0;
        M = 0;
        Y = 0;
      }

      let gray = 255 * K;

      let cIndex = (imgData.width * y + x) * 4;
      dstData[cIndex] = (1 - C) * 255;
      dstData[cIndex + 1] = 255;
      dstData[cIndex + 2] = 255;
      dstData[cIndex + 3] = alpha;

      let mIndex = (imgData.width * y + (x + imgData.width / 2)) * 4;
      dstData[mIndex] = 255;
      dstData[mIndex + 1] = (1 - M) * 255;
      dstData[mIndex + 2] = 255;
      dstData[mIndex + 3] = alpha;

      let yIndex = (imgData.width * (y + imgData.height / 2) + x) * 4;
      dstData[yIndex] = 255;
      dstData[yIndex + 1] = 255;
      dstData[yIndex + 2] = (1 - Y) * 255;
      dstData[yIndex + 3] = alpha;

      let kIndex =
        (imgData.width * (y + imgData.height / 2) + (x + imgData.width / 2)) *
        4;
      black = (1 - K) * 255;
      dstData[kIndex] = black;
      dstData[kIndex + 1] = black;
      dstData[kIndex + 2] = black;
      dstData[kIndex + 3] = alpha;
    }
  }

  dstContext.putImageData(dstImg, 0, 0);
}

window.onload = function () {
  /* Load source image */
  let srcCanvas = document.getElementById("src");
  let srcContext = srcCanvas.getContext("2d");
  let srcImg = new Image();
  srcImg.src = "./lena.png";

  srcImg.onload = function () {
    srcContext.drawImage(srcImg, 0, 0);
    const sourceImage = LoadImage(srcImg, srcContext);

    GrayScaleBT(sourceImage, "canvas1");

    GrayScaleBT(sourceImage, "canvas2");

    SeparateRGB(sourceImage, "canvas3");

    ImageToCmyk(sourceImage, "canvas4");
  };
};
