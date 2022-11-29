export function init() {
  /**
   * Easing function used to animate going in and out of hyperspeed
   * from http://easings.net/#easeInOutQuart
   * @param  Number t current time
   * @param  Number b beginning value
   * @param  Number c change in value
   * @param  Number d duration
   * @return Number
   */
  var easeInOutQuart = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t * t + b;
    return (-c / 2) * ((t -= 2) * t * t * t - 2) + b;
  };

  document.getElementById("hyperspeed-canvas").style.width =
    window.innerWidth + "px";
  document.getElementById("hyperspeed-canvas").style.height =
    window.innerHeight + "px";

  /**
   * StarField object
   * @param Number pointSize how big are the stars
   * @param Number numStars  how many stars are there
   */
  var StarField = function (pointSize, numStars, speed) {
    this.pointSize = pointSize;
    this.numStars = numStars;
    this.speed = speed;
    this.lineLength = 0.0;

    var timers = {
      speed: 0,
      lineLength: 0,
    };

    var animateProperty = function (property, to, duration) {
      window.cancelAnimationFrame(timers[property]);
      var self = this;
      var start = new Date().getTime();
      var from = self[property];
      var animate = function () {
        var dt = new Date().getTime() - start;
        if (dt >= duration) {
          self[property] = to;
        } else {
          self[property] = easeInOutQuart(dt, from, to - from, duration);
          timers[property] = window.requestAnimationFrame(animate);
        }
      };
      animate();
    };

    this.animateSpeed = function (to, duration) {
      return animateProperty.call(this, "speed", to, duration);
    };
    this.animateLineLength = function (to, duration) {
      return animateProperty.call(this, "lineLength", to, duration);
    };
  };

  /**
   * gets the verticies array
   * @param  Scene scene
   * @return Float32Array
   */
  StarField.prototype.getVertices = function (scene) {
    if (this.vertices) {
      return this.vertices;
    }
    var vertices = [];
    var tmpVertex = [];
    var ratio = scene.canvas.width / scene.canvas.height;
    for (var i = 0; i < this.numStars; i++) {
      tmpVertex = [
        (Math.random() * 2 - 1) * ratio,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ];
      vertices.push(tmpVertex[0], tmpVertex[1], tmpVertex[2]);
      vertices.push(tmpVertex[0], tmpVertex[1], tmpVertex[2] + this.lineLength);
    }
    this.vertices = new Float32Array(vertices);
    return this.vertices;
  };

  /**
   * Scene object
   * @param Node canvas
   */
  var Scene = function (canvas) {
    this.canvas = canvas;

    this.gl = canvas.getContext("experimental-webgl");
    // Check whether the WebGL context is available or not
    if (!this.gl) {
      console.log("There's no WebGL context available.");
    } else {
      this.init();
    }
  };

  /**
   * Set the viewport to the canvas width and height
   * @return {[type]} [description]
   */
  Scene.prototype.setupViewport = function () {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  /**
   * gets the vertex shader
   */
  Scene.prototype.getVertexShader = function () {
    var gl = this.gl;
    var vertexShaderText;
    var vertexShader;
    if (this.vertexShader) {
      return this.vertexShader;
    }
    vertexShaderText =
      "" +
      "varying float zPos;\n" +
      "attribute vec3 vertexPosition;\n" +
      "attribute float pointSize;\n" +
      "uniform mat4 perspectiveMatrix;\n" +
      "void main(void) {\n" +
      "  zPos = vertexPosition[2];\n" +
      "  gl_PointSize = pointSize * (1.0 - vertexPosition[2]);\n" +
      "  gl_Position = perspectiveMatrix * vec4(vertexPosition, 1.0);\n" +
      "}";
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.log("Couldn't compile the vertex shader");
      gl.deleteShader(vertexShader);
      this.gl = gl;
      return;
    }
    this.gl = gl;
    return vertexShader;
  };

  /**
   * gets the fragment shader
   */
  Scene.prototype.getFragmentShader = function () {
    var fragmentShaderText;
    var fragmentShader;
    var gl = this.gl;
    if (this.fragmentShader) {
      return this.fragmentShader;
    }
    fragmentShaderText =
      "" +
      "#ifdef GL_ES\n" +
      "  precision highp float;\n" +
      "#endif\n" +
      "varying float zPos;\n" +
      "void main(void) {\n" +
      "  gl_FragColor = vec4(1, 1, 1, zPos);\n" +
      "}";
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.log("Couldn't compile the fragment shader");
      gl.deleteShader(fragmentShader);
      this.gl = gl;
      return;
    }
    this.gl = gl;
    return fragmentShader;
  };

  /**
   * Sets up the WebGL shader program
   */
  Scene.prototype.setupShaderProgram = function () {
    var vertexPosition;
    var gl = this.gl;
    var vertexShader = this.getVertexShader();
    var fragmentShader = this.getFragmentShader();

    // Create a shader program.
    gl.program = gl.createProgram();
    gl.attachShader(gl.program, vertexShader);
    gl.attachShader(gl.program, fragmentShader);
    gl.linkProgram(gl.program);
    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS)) {
      console.log("Unable to initialise shaders");
      gl.deleteProgram(gl.program);
      gl.deleteProgram(vertexShader);
      gl.deleteProgram(fragmentShader);
      return;
    }
    // Install the program as part of the current rendering state
    gl.useProgram(gl.program);
    // Get the vertexPosition attribute from the linked shader program
    vertexPosition = gl.getAttribLocation(gl.program, "vertexPosition");
    // Enable the vertexPosition vertex attribute array. If enabled, the array
    // will be accessed an used for rendering when calls are made to commands like
    // gl.drawArrays, gl.drawElements, etc.
    gl.enableVertexAttribArray(vertexPosition);

    // Clear the color buffer (r, g, b, a) with the specified color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the depth buffer. The value specified is clamped to the range [0,1].
    // More info about depth buffers: http://en.wikipedia.org/wiki/Depth_buffer
    gl.clearDepth(1.0);
    // Enable depth testing. This is a technique used for hidden surface removal.
    // It assigns a value (z) to each pixel that represents the distance from this
    // pixel to the viewer. When another pixel is drawn at the same location the z
    // values are compared in order to determine which pixel should be drawn.
    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    // Specify which function to use for depth buffer comparisons. It compares the
    // value of the incoming pixel against the one stored in the depth buffer.
    // Possible values are (from the OpenGL documentation):
    // GL_NEVER - Never passes.
    // GL_LESS - Passes if the incoming depth value is less than the stored depth value.
    // GL_EQUAL - Passes if the incoming depth value is equal to the stored depth value.
    // GL_LEQUAL - Passes if the incoming depth value is less than or equal to the stored depth value.
    // GL_GREATER - Passes if the incoming depth value is greater than the stored depth value.
    // GL_NOTEQUAL - Passes if the incoming depth value is not equal to the stored depth value.
    // GL_GEQUAL - Passes if the incoming depth value is greater than or equal to the stored depth value.
    // GL_ALWAYS - Always passes.
    //gl.depthFunc(gl.LEQUAL);
    this.gl = gl;
  };

  /**
   * Sets up the field of view for the WebGL viewport
   * http://en.wikipedia.org/wiki/Viewing_frustum
   */
  Scene.prototype.setupFieldOfView = function () {
    var gl = this.gl;

    // Define the viewing frustum parameters
    // More info: http://en.wikipedia.org/wiki/Viewing_frustum
    // More info: http://knol.google.com/k/view-frustum
    var fieldOfView = 45.0;
    var aspectRatio = this.canvas.width / this.canvas.height;
    var nearPlane = 1.0;
    var farPlane = 5.0;
    var top = nearPlane * Math.tan((fieldOfView * Math.PI) / 360.0);
    var bottom = -top;
    var right = top * aspectRatio;
    var left = -right;

    //  Create the perspective matrix. The OpenGL function that's normally used for this,
    //  glFrustum() is not included in the WebGL API. That's why we have to do it manually here.
    //  More info: http://www.cs.utk.edu/~vose/c-stuff/opengl/glFrustum.html
    var a = (right + left) / (right - left);
    var b = (top + bottom) / (top - bottom);
    var c = (farPlane + nearPlane) / (farPlane - nearPlane);
    var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane);
    var x = (2 * nearPlane) / (right - left);
    var y = (2 * nearPlane) / (top - bottom);
    var perspectiveMatrix = [x, 0, a, 0, 0, y, b, 0, 0, 0, c, d, 0, 0, -1, 0];

    // Get the location of the "perspectiveMatrix" uniform variable from the
    // shader program
    var uPerspectiveMatrix = gl.getUniformLocation(
      gl.program,
      "perspectiveMatrix"
    );
    gl.uniformMatrix4fv(
      uPerspectiveMatrix,
      false,
      new Float32Array(perspectiveMatrix)
    );

    this.gl = gl;
  };

  /**
   * Initializes the scene
   */
  Scene.prototype.init = function () {
    this.setupViewport();
    this.vertexShader = this.getVertexShader();
    this.fragmentShader = this.getFragmentShader();
    this.setupShaderProgram();
    this.setupFieldOfView();
  };

  /**
   * loads a starfield into a scene
   * @param  StarField starField
   * @return Function function to draw the scene
   */
  Scene.prototype.loadStarField = function (starField) {
    var self = this;
    var gl = this.gl;

    // First create a vertex buffer in which we can store our data.
    var vertexBuffer = gl.createBuffer();

    // Get the vertex position attribute location from the shader program
    var aVertexPosition = gl.getAttribLocation(gl.program, "vertexPosition");

    // Get the point size attribute location from the shader program
    var aPointSize = gl.getAttribLocation(gl.program, "pointSize");

    // get the verticies from the StarField
    var vertices = starField.getVertices(this);

    // get the point size from the StarField
    var pointSize = starField.pointSize;

    // Bind the buffer object to the ARRAY_BUFFER target.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Creates a new data store for the vertices array which is bound to the ARRAY_BUFFER.
    // The third paramater indicates the usage pattern of the data store. Possible values are
    // (from the OpenGL documentation):
    // The frequency of access may be one of these:
    // STREAM - The data store contents will be modified once and used at most a few times.
    // STATIC - The data store contents will be modified once and used many times.
    // DYNAMIC - The data store contents will be modified repeatedly and used many times.
    // The nature of access may be one of these:
    // DRAW - The data store contents are modified by the application, and used as the source for
    //        GL drawing and image specification commands.
    // READ - The data store contents are modified by reading data from the GL, and used to return
    //        that data when queried by the application.
    // COPY - The data store contents are modified by reading data from the GL, and used as the source
    //        for GL drawing and image specification commands.
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    // Clear the color buffer and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Specify the location and format of the vertex position attribute
    gl.vertexAttribPointer(aVertexPosition, 3.0, gl.FLOAT, false, 0, 0);

    // Specify the location and format of the point size attribute
    gl.vertexAttrib1f(aPointSize, pointSize);
    this.gl = gl;

    return function () {
      var midpoint;
      var halfLineLength = starField.lineLength / 2;
      for (var i = 0; i < vertices.length; i += 6) {
        if (vertices[i + 5] < -1) {
          vertices[i + 5] = 0.999;
          vertices[i + 2] = 0.999 - starField.lineLength;
        }
        if (vertices[i + 2] > 1) {
          vertices[i + 2] = -0.999;
          vertices[i + 5] = -0.999 + starField.lineLength;
        }
        midpoint = (vertices[i + 2] + vertices[i + 5]) / 2;
        vertices[i + 2] = midpoint - starField.speed - halfLineLength;
        vertices[i + 5] = midpoint - starField.speed + halfLineLength;
      }
      self.gl.lineWidth(3);
      self.gl.bufferData(self.gl.ARRAY_BUFFER, vertices, self.gl.DYNAMIC_DRAW);

      self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);
      self.gl.drawArrays(self.gl.POINTS, 0, starField.numStars);
      self.gl.drawArrays(self.gl.LINES, 0, starField.numStars);
      self.gl.flush();
    };
  };

  /**
   * initializes the animation loop
   * @param  Function draw
   */
  Scene.prototype.animate = function (draw) {
    var animate = function () {
      window.requestAnimationFrame(animate);
      draw();
    };
    animate();
  };

  // INIT

  var draw;
  var warp;
  var timeouts = [];
  var starField = new StarField(5, 20000, 0.00005);

  var scene = new Scene(document.getElementById("hyperspeed-canvas"));
  var trigger = document.getElementById("js-hpstar-trigger");
  if (scene.gl) {
    draw = scene.loadStarField(starField);
    scene.animate(draw);

    warp = function () {
      for (var i = 0; i < timeouts.length; i++) {
        window.clearTimeout(timeouts[i]);
      }
      timeouts = [];
      starField.animateLineLength(0.5, 3000);
      starField.animateSpeed(0.02, 1000);
      timeouts.push(
        window.setTimeout(function () {
          starField.animateSpeed(0.00005, 500);
          starField.animateLineLength(0, 500);
        }, 4000)
      );
    };

    // scene.canvas.addEventListener('mouseup', warp, false );
    // scene.canvas.addEventListener('touchend', warp, false );
    // $('.hpstar-trigger').click(warp);
    document.addEventListener("mousedown", warp, true);
    document.addEventListener("keydown", function (e) {
      var key = e.which || e.keyCode;
      if (key === 13) {
        // 13 is enter
        warp();
      }
    });
  }
}
