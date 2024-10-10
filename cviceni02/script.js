// Callback function called, when file is "opened"
function handleFileSelect(item, elementName) {
    var files = item.files;

    console.log(files);

    for (var i = 0; i < files.length; i++) {
        console.log(files[i], files[i].name, files[i].size, files[i].type);

        // Only process image files.
        if (!files[i].type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure for loading image to memory
        reader.onload = (function(file) {
            return function(evt) {
                var srcImg = new Image();
                srcImg.src = evt.target.result;

                srcImg.onload = function() {
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
                    convertButton.addEventListener('click', convertImage, false);
                }
            }
        })(files[i]);

        reader.readAsDataURL(files[i]);

        break;
    };
};


// Callback function called, when clicked at Convert button
function convertImage() {
    var personCanvas = document.getElementById("person");
    var personContext = personCanvas.getContext("2d");
    var canvasHeight = personCanvas.height;
    var canvasWidth = personCanvas.width;

    var personImageData = personContext.getImageData(0, 0, canvasWidth, canvasHeight);
    var backgroundImageData = document.getElementById("background").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);
    var logoImageData = document.getElementById("logo").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);
    var resultImageData = document.getElementById("result").getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight);

    convertImageData(personImageData, backgroundImageData, logoImageData, resultImageData);

    document.getElementById("result").getContext("2d").putImageData(resultImageData, 0, 0);
};

// Function for converting raw data of image
function convertImageData(personImageData, backgroundImageData, logoImageData, resultImageData) {
    var personData = personImageData.data;
    var backgroundData = backgroundImageData.data;
    var logoData = logoImageData.data;
    var resultData = resultImageData.data;
    //nove promenne
    var prahPersonData=personImageData.data;
    var gsLogoData=logoImageData.data;

    // prahování
    var red, green, blue, g, gsVal;
    var precision = document.getElementById("precision").value/100;
    for (var pixelIndex = 0; pixelIndex < personData.length; pixelIndex += 4) {
        g=personData[pixelIndex+1]/(personData[pixelIndex+0]+personData[pixelIndex+1]+personData[pixelIndex+2]);
        //console.log(g)
        if (g>precision) {
            prahPersonData[pixelIndex+3]=0;
        }
        //logo to grayscale
        gsVal=((logoData[pixelIndex+0]*0.3)+(logoData[pixelIndex+1]*0.59)+(logoData[pixelIndex+2]*0.11));
        logoData[pixelIndex+0]=gsVal;
        logoData[pixelIndex+1]=gsVal;
        logoData[pixelIndex+2]=gsVal;
        

        //console.log(red, green, blue, alpha);
        if (gsLogoData[pixelIndex+3]>0) {
            red=gsLogoData[pixelIndex+0];
            green=gsLogoData[pixelIndex+1];
            blue=gsLogoData[pixelIndex+2];
        } else if (prahPersonData[pixelIndex+3]>0) {
            red=prahPersonData[pixelIndex+0];
            green=prahPersonData[pixelIndex+1];
            blue=prahPersonData[pixelIndex+2];
        } else {
            red=backgroundData[pixelIndex+0];
            green=backgroundData[pixelIndex+1];
            blue=backgroundData[pixelIndex+2];
        }

        resultData[pixelIndex + 0] = red;
        resultData[pixelIndex + 1] = green;
        resultData[pixelIndex + 2] = blue;
        resultData[pixelIndex + 3] = 255;
    }
}