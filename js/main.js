// ========== 全局变量 ==========
let gl, canvas;
let program2D, programMandel, program3D;
let currentProgram;
let currentPrimitive;
let currentVertexCount = 0;
let bufferId;
let mandelQuadBuffer;

// 混沌游戏状态
let chaosRunning = false;
let chaosPaused = false;
let chaosCount = 0;
let chaosData = null;
const CHAOS_TOTAL = 5000;
const CHAOS_PER_FRAME = 20;

// 矩阵
const viewMatrix = mat4.create();
const modelMatrix = mat4.create();
const projMatrix = mat4.create();

// ========== 初始化 ==========
function init() {
  canvas = document.getElementById('glCanvas');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert('WebGL 初始化失败'); return; }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.07, 0.07, 0.07, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // ========== 渲染质量优化 ==========
  gl.enable(gl.POINT_SMOOTH);    // 点平滑：方形点变圆形，边缘抗锯齿
  gl.enable(gl.LINE_SMOOTH);     // 线平滑：线框边缘抗锯齿，无锯齿
  gl.enable(gl.CULL_FACE);       // 背面剔除：3D实体只画正面，更立体、性能更好
  gl.cullFace(gl.BACK);          // 指定剔除背面
  gl.enable(gl.BLEND);           // 混合：配合平滑，让点/线的半透明边缘更自然
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // 加载三套着色器
  program2D = initShaders(gl, 'shaders/vertex2d.glsl', 'shaders/fragment2d.glsl');
  programMandel = initShaders(gl, 'shaders/mandelbrot_vert.glsl', 'shaders/mandelbrot_frag.glsl');
  program3D = initShaders(gl, 'shaders/vertex3d.glsl', 'shaders/fragment3d.glsl');

  // 创建顶点缓冲
  bufferId = gl.createBuffer();
  mandelQuadBuffer = gl.createBuffer();

  // 初始化 UI 并绑定回调
  UI.init({
    sceneMode: switchSceneMode,
    algorithm: switchAlgorithm,
    recursiveDepth: update2DRecursive,
    renderMode: update2DRecursive,
    ngonSides: resetChaos,
    pointSize: updateCurrentPointSize,
    color: updateCurrentColor,
    mandelbrotIter: updateMandelbrotIter,
    mandelbrotColor: updateMandelbrotColor,
    tetraDepth: updateTetra,
    tetraRenderMode: updateTetra,
    spaceToggle: toggleChaosPause
  });

  switchSceneMode();
  render();
}

// ========== 场景模式切换 ==========
function switchSceneMode() {
  const mode = UI.config.sceneMode;
  
  if (mode === '2D分形') {
    currentProgram = program2D;
    switchAlgorithm();
  } else if (mode === 'Mandelbrot') {
    currentProgram = programMandel;
    initMandelbrot();
  } else if (mode === '3D四面体') {
    currentProgram = program3D;
    mat4.perspective(projMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    updateTetra();
  }
}

// ========== 2D 算法切换 ==========
function switchAlgorithm() {
  if (UI.config.algorithm === '递归细分') {
    chaosRunning = false;
    update2DRecursive();
  } else {
    resetChaos();
  }
}

// ========== 2D 递归细分 ==========
function update2DRecursive() {
  const modeMap = {
    '点云模式': 'points',
    '线框模式': 'lines',
    '实体模式': 'triangles'
  };
  const mode = modeMap[UI.config.renderMode];
  const data = Fractal.generateRecursive(UI.config.recursiveDepth, mode);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  currentVertexCount = data.length / 2;
  
  currentPrimitive = mode === 'points' ? gl.POINTS : 
                     mode === 'lines' ? gl.LINES : gl.TRIANGLES;
  
  gl.useProgram(program2D);
  updateCurrentColor();
  updateCurrentPointSize();
}

// ========== 混沌游戏 ==========
function resetChaos() {
  chaosRunning = true;
  chaosPaused = false;
  chaosCount = 0;
  chaosData = new Float32Array(CHAOS_TOTAL * 2);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, chaosData.byteLength, gl.DYNAMIC_DRAW);
  currentPrimitive = gl.POINTS;
  currentVertexCount = 0;
  
  gl.useProgram(program2D);
  updateCurrentColor();
  updateCurrentPointSize();
}

function toggleChaosPause() {
  chaosPaused = !chaosPaused;
}

function stepChaos() {
  if (chaosPaused || chaosCount >= CHAOS_TOTAL) return;
  
  const n = UI.config.ngonSides;
  const verts = Fractal.getNgonVertices(n);
  
  let px, py;
  if (chaosCount === 0) {
    px = Math.random() * 0.2 - 0.1;
    py = Math.random() * 0.2 - 0.1;
  } else {
    px = chaosData[(chaosCount - 1) * 2];
    py = chaosData[(chaosCount - 1) * 2 + 1];
  }

  for (let i = 0; i < CHAOS_PER_FRAME; i++) {
    if (chaosCount >= CHAOS_TOTAL) break;
    const idx = Math.floor(Math.random() * n) * 2;
    px = (px + verts[idx]) / 2;
    py = (py + verts[idx + 1]) / 2;
    chaosData[chaosCount * 2] = px;
    chaosData[chaosCount * 2 + 1] = py;
    chaosCount++;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, chaosData.subarray(0, chaosCount * 2));
  currentVertexCount = chaosCount;
}

// ========== Mandelbrot ==========
function initMandelbrot() {
  const quad = new Float32Array([
    -1, -1,  1, -1, -1,  1,
    -1,  1,  1, -1,  1,  1
  ]);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, mandelQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  
  currentVertexCount = 6;
  currentPrimitive = gl.TRIANGLES;
  
  gl.useProgram(programMandel);
  updateMandelbrotIter(UI.config.mandelbrotIter);
  updateMandelbrotColor(UI.config.mandelbrotColor);
}

function updateMandelbrotIter(v) {
  gl.useProgram(programMandel);
  gl.uniform1i(gl.getUniformLocation(programMandel, 'u_MaxIter'), v);
}

function updateMandelbrotColor(v) {
  gl.useProgram(programMandel);
  const idx = v === '火焰' ? 0 : v === '科技蓝' ? 1 : 2;
  gl.uniform1i(gl.getUniformLocation(programMandel, 'u_ColorMode'), idx);
}

// ========== 3D 四面体 ==========
function updateTetra() {
  const modeMap = {
    '点云模式': 'points',
    '线框模式': 'lines',
    '实体模式': 'triangles'
  };
  const mode = modeMap[UI.config.tetraRenderMode];
  const data = Fractal.generateTetraGasket(UI.config.tetraDepth, mode);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  currentVertexCount = data.length / 3;
  
  currentPrimitive = mode === 'points' ? gl.POINTS : 
                     mode === 'lines' ? gl.LINES : gl.TRIANGLES;
  
  gl.useProgram(program3D);
  updateCurrentColor();
  updateCurrentPointSize();
}

// ========== 通用：更新当前场景的颜色 ==========
function updateCurrentColor() {
  const scene = UI.config.sceneMode;
  let colorName;
  
  if (scene === '2D分形') {
    colorName = UI.config.colorScheme2D;
  } else if (scene === '3D四面体') {
    colorName = UI.config.colorScheme3D;
  } else {
    return; // Mandelbrot 不用这个
  }
  
  const color = UI.colorSchemes[colorName];
  const loc = gl.getUniformLocation(currentProgram, 'u_Color');
  if (loc) gl.uniform4f(loc, color[0], color[1], color[2], color[3]);
}

// ========== 通用：更新当前场景的点大小 ==========
function updateCurrentPointSize() {
  const scene = UI.config.sceneMode;
  let size;
  
  if (scene === '2D分形') {
    size = UI.config.pointSize2D;
  } else if (scene === '3D四面体') {
    size = UI.config.pointSize3D;
  } else {
    return;
  }
  
  const loc = gl.getUniformLocation(currentProgram, 'u_PointSize');
  if (loc) gl.uniform1f(loc, size);
}

// ========== 矩阵更新 ==========
function updateMatrices() {
  const scene = UI.config.sceneMode;
  
  if (scene === 'Mandelbrot') {
    const locCenter = gl.getUniformLocation(programMandel, 'u_Center');
    const locZoom = gl.getUniformLocation(programMandel, 'u_Zoom');
    gl.useProgram(programMandel);
    gl.uniform2f(locCenter, UI.view.x, UI.view.y);
    gl.uniform1f(locZoom, UI.view.scale);
  } else if (scene === '3D四面体') {
    // 模型矩阵：旋转 + 缩放
    mat4.identity(modelMatrix);
    mat4.rotateX(modelMatrix, modelMatrix, UI.view.rotX);
    mat4.rotateY(modelMatrix, modelMatrix, UI.view.rotY);
    mat4.scale(modelMatrix, modelMatrix, [UI.view.scale, UI.view.scale, UI.view.scale]);
    
    // 视图矩阵：相机后退
    mat4.identity(viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, -3]);
    
    gl.useProgram(program3D);
    gl.uniformMatrix4fv(gl.getUniformLocation(program3D, 'u_ModelMatrix'), false, modelMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program3D, 'u_ViewMatrix'), false, viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program3D, 'u_ProjMatrix'), false, projMatrix);
  } else {
    // 2D 视图矩阵
    mat4.identity(viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, [UI.view.x, UI.view.y, 0]);
    mat4.scale(viewMatrix, viewMatrix, [UI.view.scale, UI.view.scale, 1]);
    
    gl.useProgram(program2D);
    gl.uniformMatrix4fv(gl.getUniformLocation(program2D, 'u_ViewMatrix'), false, viewMatrix);
  }
}

// ========== 渲染循环 ==========
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // 混沌游戏逐帧生成
  if (UI.config.sceneMode === '2D分形' && UI.config.algorithm === '混沌游戏' && chaosRunning) {
    stepChaos();
  }
  
  updateMatrices();
  
  // 绑定顶点缓冲
  if (UI.config.sceneMode === 'Mandelbrot') {
    gl.bindBuffer(gl.ARRAY_BUFFER, mandelQuadBuffer);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  }
  
  // 设置顶点属性步长
  const stride = UI.config.sceneMode === '3D四面体' ? 3 : 2;
  const a_Pos = gl.getAttribLocation(currentProgram, 'a_Position');
  gl.vertexAttribPointer(a_Pos, stride, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Pos);
  
  // 绘制
  if (currentVertexCount > 0) {
    gl.drawArrays(currentPrimitive, 0, currentVertexCount);
  }
  
  requestAnimationFrame(render);
}

// 启动
window.onload = init;
