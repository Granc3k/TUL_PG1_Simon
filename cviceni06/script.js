window.onload = function () {
  var gl = document
    .getElementById("webgl_canvas")
    .getContext("experimental-webgl");

  // Creatnutí vertex shaderu
  var vertexShaderCode = document.querySelector("#vs").textContent;
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "Kompilace vertex shaderu selhala:",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }

  // Creatnutí fragment shaderu
  var fragmentShaderCode = document.querySelector("#fs").textContent;
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "Kompilace fragment shaderu selhala:",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }

  // Creatnutí programu
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Linkování programu selhalo:", gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Funkce pro generování vrcholů, normál a texturových souřadnic koule
  function generateSphere(radius, latitudeBands, longitudeBands) {
    var vertices = [];
    var normals = [];
    var uvs = [];
    var indices = [];

    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = (latNumber * Math.PI) / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = (longNumber * 2 * Math.PI) / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - longNumber / longitudeBands;
        var v = 1 - latNumber / latitudeBands;

        normals.push(x);
        normals.push(y);
        normals.push(z);
        uvs.push(u);
        uvs.push(v);
        vertices.push(radius * x);
        vertices.push(radius * y);
        vertices.push(radius * z);
      }
    }

    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = latNumber * (longitudeBands + 1) + longNumber;
        var second = first + longitudeBands + 1;
        indices.push(first);
        indices.push(second);
        indices.push(first + 1);

        indices.push(second);
        indices.push(second + 1);
        indices.push(first + 1);
      }
    }

    return {
      vertices: vertices,
      normals: normals,
      uvs: uvs,
      indices: indices,
    };
  }

  var sphereData;
  var modelMatrix = mat4.create();
  var viewMatrix = mat4.create();
  var projMatrix = mat4.create();
  var normalMatrix = mat3.create();
  var texture;

  function updateSphere() {
    var verticalSegments = parseInt(
      document.getElementById("verticalSegments").value
    );
    var horizontalSegments = parseInt(
      document.getElementById("horizontalSegments").value
    );
    var sphereSize = parseFloat(document.getElementById("sphereSize").value);
    sphereData = generateSphere(
      sphereSize,
      verticalSegments,
      horizontalSegments
    );

    // Creatnutí bufferu pro pozice vrcholů
    var posLoc = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(posLoc);
    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(sphereData.vertices),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // Creatnutí bufferu pro UV souřadnice
    var uvLoc = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLoc);
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(sphereData.uvs),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    // Creatnutí bufferu pro normály vrcholů
    var normalLoc = gl.getAttribLocation(program, "normal");
    gl.enableVertexAttribArray(normalLoc);
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(sphereData.normals),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, true, 0, 0);

    // Creatnutí indexového bufferu
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(sphereData.indices),
      gl.STATIC_DRAW
    );

    // Creatnutí a loadnutí textury
    var image = new Image();
    image.src = "./globe_texture.jpg";
    image.onload = function () {
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      var samplerLoc = gl.getUniformLocation(program, "sampler");
      gl.uniform1i(samplerLoc, 0); // nula odpovídá gl.TEXTURE0
    };

    // Creatnutí matice modelu
    mat4.identity(modelMatrix);
    mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(0.8, 0.8, 0.8));
    var modelLocation = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

    // Creatnutí matice pohledu
    mat4.identity(viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -5));
    var viewLocation = gl.getUniformLocation(program, "viewMatrix");
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

    // Creatnutí matice projekce
    mat4.perspective(projMatrix, Math.PI / 3, 1, 0.1, 100);
    var projLocation = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projLocation, false, projMatrix);

    // Creatnutí matice pro transformaci normálových vektorů
    mat3.normalFromMat4(normalMatrix, modelMatrix);
    var normalLocation = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalLocation, false, normalMatrix);

    // Povolení testu hloubky
    gl.enable(gl.DEPTH_TEST);
  }

  document
    .getElementById("updateButton")
    .addEventListener("click", function () {
      updateSphere();
    });

  // Počáteční generování koule
  updateSphere();

  // Creatnutí polyfillu pro securnutí funkčnosti v moderních prohlížečích
  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (cb) {
      setTimeout(cb, 1000 / 60);
    };

  var render = function () {
    mat4.rotateX(modelMatrix, modelMatrix, 0.005);
    mat4.rotateY(modelMatrix, modelMatrix, 0.01);
    var modelLocation = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

    mat3.normalFromMat4(normalMatrix, modelMatrix);
    var normalLocation = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalLocation, false, normalMatrix);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(
      gl.TRIANGLES,
      sphereData.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
    requestAnimationFrame(render);
  };

  render();
};
