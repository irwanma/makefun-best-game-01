// NEONFALL input: one small state object the whole game reads — held keys,
// the pointer in arena coordinates, and edge-triggered presses for menus.

export function createInput(canvas, view) {
  const input = {
    keysDown: new Set(),
    pressed: new Set(),
    pointerX: view.width / 2,
    pointerY: view.height / 3,
    pointerDown: false,
    clicks: [],
  };

  const toArena = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (view.width / rect.width),
      y: (event.clientY - rect.top) * (view.height / rect.height),
    };
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keysDown.add(event.code);
  });
  window.addEventListener('keyup', (event) => input.keysDown.delete(event.code));
  window.addEventListener('blur', () => { input.keysDown.clear(); input.pointerDown = false; });

  canvas.addEventListener('pointermove', (event) => {
    const point = toArena(event);
    input.pointerX = point.x;
    input.pointerY = point.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toArena(event);
    input.pointerX = point.x;
    input.pointerY = point.y;
    input.pointerDown = true;
    input.clicks.push(point);
  });
  window.addEventListener('pointerup', () => { input.pointerDown = false; });

  input.wasPressed = (code) => input.pressed.has(code);
  input.endFrame = () => { input.pressed.clear(); input.clicks.length = 0; };
  input.moveAxis = () => {
    const left = input.keysDown.has('KeyA') || input.keysDown.has('ArrowLeft');
    const right = input.keysDown.has('KeyD') || input.keysDown.has('ArrowRight');
    const up = input.keysDown.has('KeyW') || input.keysDown.has('ArrowUp');
    const down = input.keysDown.has('KeyS') || input.keysDown.has('ArrowDown');
    return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
  };
  return input;
}
