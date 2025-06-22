const grid = document.getElementById("grid"),
  scoreDisplay = document.getElementById("score"),
  startButton = document.getElementById("start-button"),
  message = document.getElementById("game-over-message"),
  w = 12,
  h = window.innerWidth > 768 ? 24 : 20,
  size = 25;
const colors = [
  "color-orange",
  "color-red",
  "color-purple",
  "color-yellow",
  "color-cyan",
  "color-green",
  "color-blue",
];
const shapes = [
  [
    [1, w + 1, w * 2 + 1, 2],
    [w, w + 1, w + 2, w * 2 + 2],
    [1, w + 1, w * 2 + 1, w * 2],
    [w, w * 2, w * 2 + 1, w * 2 + 2],
  ],
  [
    [0, w, w + 1, w * 2 + 1],
    [w + 1, w + 2, w * 2, w * 2 + 1],
  ],
  [
    [1, w, w + 1, w + 2],
    [1, w + 1, w + 2, w * 2 + 1],
    [w, w + 1, w + 2, w * 2 + 1],
    [1, w, w + 1, w * 2 + 1],
  ],
  Array(4).fill([0, 1, w, w + 1]),
  [
    [1, w + 1, w * 2 + 1, w * 3 + 1],
    [w, w + 1, w + 2, w + 3],
  ],
  [
    [1, 2, w, w + 1],
    [0, w, w + 1, w * 2 + 1],
  ],
  [
    [1, w + 1, w * 2 + 1, w * 2],
    [w, w + 1, w + 2, w * 2 + 2],
    [1, w + 1, w * 2 + 1, 2],
    [w, w * 2, w * 2 + 1, w * 2 + 2],
  ],
];
let pos = 4,
  rot = 0,
  idx = 0,
  shape = [],
  color = "",
  score = 0,
  timer = null,
  blocks = [],
  settled = [];
function arraySome(arr, cb) {
  for (let i = 0; i < arr.length; i++) if (cb(arr[i], i, arr)) return true;
  return false;
}
function spawn() {
  pos = 4;
  rot = 0;
  idx = Math.floor(Math.random() * shapes.length);
  shape = shapes[idx][rot];
  color = colors[idx];
  blocks = [];
  for (let i = 0; i < shape.length; i++) {
    let b = document.createElement("div");
    b.className = `block tetromino ${color}`;
    grid.appendChild(b);
    blocks.push(b);
  }
  render();
}
function render() {
  for (let j = 0; j < shape.length; j++) {
    let p = pos + shape[j],
      x = p % w,
      y = Math.floor(p / w);

    const block = blocks[j];
    const newTransform = `translate(${x * size}px,${y * size}px)`;

    const prevTransform =
      block.style.transform || `translate(${x * size}px,${y * size}px)`;

    if (prevTransform !== newTransform) {
      block.animate(
        [{ transform: prevTransform }, { transform: newTransform }],
        {
          duration: 40,
          easing: "ease-out",
          fill: "forwards",
        }
      ).onfinish = () => {
        block.style.transform = newTransform;
      };
    } else {
      block.style.transform = newTransform;
    }
  }
}

function collide(offset = 0) {
  return arraySome(shape, (i) => {
    let p = pos + i + offset,
      x = p % w,
      y = Math.floor(p / w);
    if (x < 0 || x >= w || y >= h) return true;
    for (let k = 0; k < settled.length; k++)
      if (settled[k].x === x && settled[k].y === y) return true;
    return false;
  });
}
function freeze() {
  for (let j = 0; j < shape.length; j++) {
    let p = pos + shape[j],
      x = p % w,
      y = Math.floor(p / w);
    blocks[j].classList.add("taken");
    settled.push({ x, y, el: blocks[j] });
  }
  clearRows();
  spawn();
}
function clearRows() {
  let rowsCleared = 0;

  for (let y = h - 1; y >= 0; y--) {
    let row = settled.filter((b) => b.y === y);

    if (row.length === w) {
      row.forEach((b) => {
        b.el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 200,
          fill: "forwards",
        }).onfinish = () => {
          grid.removeChild(b.el);
        };
      });

      settled = settled.filter((b) => b.y !== y);

      for (let i = 0; i < settled.length; i++) {
        if (settled[i].y < y) {
          settled[i].y++;
          const newY = settled[i].y * size;
          settled[i].el.animate(
            [
              { transform: settled[i].el.style.transform },
              { transform: `translate(${settled[i].x * size}px,${newY}px)` },
            ],
            {
              duration: 150,
              easing: "ease-in-out",
              fill: "forwards",
            }
          ).onfinish = () => {
            settled[i].el.style.transform = `translate(${
              settled[i].x * size
            }px,${newY}px)`;
          };
        }
      }

      rowsCleared++;
      y++;
    }
  }

  if (rowsCleared) {
    score += rowsCleared * 10;
    scoreDisplay.textContent = score;
  }
}

function move(dx) {
  if (!collide(dx)) {
    pos += dx;
    render();
  }
}
function down() {
  if (!collide(w)) {
    pos += w;
    render();
  } else {
    freeze();
    if (collide(0)) gameOver();
  }
}
function rotate() {
  let nextRot = (rot + 1) % shapes[idx].length,
    nextShape = shapes[idx][nextRot];
  if (
    !arraySome(nextShape, (i) => {
      let p = pos + i,
        x = p % w,
        y = Math.floor(p / w);
      if (x < 0 || x >= w || y >= h) return true;
      for (let k = 0; k < settled.length; k++)
        if (settled[k].x === x && settled[k].y === y) return true;
      return false;
    })
  ) {
    shape = nextShape;
    rot = nextRot;
    render();
  }
}
function gameOver() {
  clearInterval(timer);
  startButton.disabled = false;
  message.textContent = "Game Over";
  startButton.innerHTML = "Reload";
  startButton.onclick = () => location.reload();
  document.removeEventListener("keydown", keys);
  for (let i = 0; i < controls.length; i++) {
    let btn = document.getElementById(controls[i].id);
    btn.removeEventListener("click", controls[i].handler);
  }
}
const keys = (e) => {
  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowDown") down();
  if (e.key === "ArrowUp" || e.key === " ") rotate();
};
document.addEventListener("keydown", keys);
startButton.onclick = () => {
  grid.innerHTML = "";
  startButton.disabled = true;
  startButton.innerHTML = "Playing...";
  settled = [];
  message.textContent = "";
  score = 0;
  scoreDisplay.textContent = "0";
  spawn();
  clearInterval(timer);
  timer = setInterval(down, 500);
};
const controls = [
  { id: "left", handler: () => move(-1) },
  { id: "right", handler: () => move(1) },
  { id: "down", handler: down },
  { id: "rotate", handler: rotate },
];
for (let i = 0; i < controls.length; i++) {
  document
    .getElementById(controls[i].id)
    .addEventListener("click", controls[i].handler);
}
