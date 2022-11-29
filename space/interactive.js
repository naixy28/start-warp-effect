export function init() {
  var canvas = document.querySelector("#hyperspeed-canvas"),
    ctx = canvas.getContext("2d"),
    fl = 300,
    count = 500,
    points = [],
    startSpeed = 0,
    tick = 0,
    width,
    height,
    bounds,
    vp,
    mouse,
    canvasOffset;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function norm(val, min, max) {
    return (val - min) / (max - min);
  }

  function resetPoint(p, init) {
    p.z = init ? rand(0, bounds.z.max) : bounds.z.max;
    p.x = rand(bounds.x.min, bounds.x.max) / (fl / (fl + p.z));
    p.y = rand(bounds.y.min, bounds.y.max) / (fl / (fl + p.z));

    p.vz = rand(-1, -10) + startSpeed;
    p.az = 0;
    p.s = 0;
    p.sx = 0;
    p.sy = 0;
    p.osx = p.sx;
    p.osy = p.sy;
    p.hue = rand(120, 200);
    p.lightness = rand(70, 100);
    p.alpha = 0;
    return p;
  }

  function create() {
    vp = {
      x: width / 2,
      y: height / 2,
    };
    mouse = {
      x: vp.x,
      y: vp.y,
      down: false,
    };
    bounds = {
      x: { min: -vp.x, max: width - vp.x },
      y: { min: -vp.y, max: height - vp.y },
      z: { min: -fl, max: 1000 },
    };
  }

  function update() {
    if (mouse.down) {
      if (startSpeed > -30) {
        startSpeed -= 0.1;
      } else {
        startSpeed = -30;
      }
    } else {
      if (startSpeed < 0) {
        startSpeed += 1;
      } else {
        startSpeed = 0;
      }
    }

    vp.x += (width / 2 - (mouse.x - width / 2) - vp.x) * 0.025;
    vp.y += (height / 2 - (mouse.y - height / 2) - vp.y) * 0.025;

    if (points.length < count) {
      points.push(resetPoint({}));
    }
    var i = points.length;
    while (i--) {
      var p = points[i];
      p.vz += p.az;
      p.z += p.vz;
      if (mouse.down) {
        p.az = -0.5;
      }
      if (p.z > bounds.z.max || p.z < bounds.z.min) {
        resetPoint(p);
      }
      p.osx = p.sx;
      p.osy = p.sy;
    }
  }

  function render() {
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(vp.x, vp.y);
    var i = points.length;
    while (i--) {
      var p = points[i];
      p.s = fl / (fl + p.z);
      p.sx = p.x * Math.sqrt(p.s);
      p.sy = p.y * Math.sqrt(p.s);
      // console.log(p.s, p.sx, p.sy);
      p.alpha = (bounds.z.max - p.z) / (bounds.z.max / 2);
      ctx.beginPath();
      // ctx.moveTo(p.x, p.y);
      // ctx.lineTo(p.sx, p.sy);
      // ctx.lineTo(p.osx, p.osy);
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.osx, p.osy);
      ctx.lineWidth = 2;
      ctx.strokeStyle =
        "hsla(" + p.hue + ", 100%, " + p.lightness + "%, " + p.alpha + ")";
      ctx.stroke();
    }
    ctx.restore();
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    canvasOffset = { x: canvas.offsetLeft, y: canvas.offsetTop };
  }

  function mousemove(e) {
    mouse.x = e.pageX - canvasOffset.x;
    mouse.y = e.pageY - canvasOffset.y;
  }

  function mousedown() {
    mouse.down = true;
  }

  function mouseup() {
    mouse.down = false;
  }

  function loop() {
    requestAnimationFrame(loop);
    update();
    render();
    tick++;
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("mousemove", mousemove);
  canvas.addEventListener("mousedown", mousedown);
  canvas.addEventListener("mouseup", mouseup);
  // document.body.appendChild(canvas);
  resize();
  create();
  loop();
}
