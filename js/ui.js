/**
 * UI 与交互模块
 */
const UI = {
  config: {
    // 主场景模式
    sceneMode: '2D分形',
    // 2D分形参数
    algorithm: '递归细分',   // 递归细分 / 混沌游戏
    renderMode: '点云模式',
    recursiveDepth: 5,
    ngonSides: 3,
    pointSize2D: 2.0,
    colorScheme2D: '经典红',
    // Mandelbrot参数
    mandelbrotIter: 100,
    mandelbrotColor: '火焰',
    // 3D四面体参数
    tetraDepth: 4,
    tetraRenderMode: '线框模式',
    pointSize3D: 2.0,
    colorScheme3D: '经典红'
  },

  view: {
    x: 0, y: 0, scale: 1.0,
    rotX: 0.3, rotY: 0.5
  },

  colorSchemes: {
    '经典红': [1.0, 0.3, 0.3, 1.0],
    '科技蓝': [0.2, 0.7, 1.0, 1.0],
    '复古金': [1.0, 0.8, 0.2, 1.0]
  },

  // 控制器引用
  controllers: {},

  init: function(onChange) {
    this.onChange = onChange;
    this._buildGUI();
    this._bindMouse();
    this._bindKeyboard();
    this._updateControllerStates();
  },

  _buildGUI: function() {
    const gui = new lil.GUI();

    // 主场景模式
    this.controllers.sceneMode = gui.add(this.config, 'sceneMode', ['2D分形', 'Mandelbrot', '3D四面体'])
       .name('场景模式')
       .onChange(() => {
         this.onChange.sceneMode();
         this._updateControllerStates();
       });

    // ===== 2D分形参数文件夹 =====
    const f2d = gui.addFolder('2D分形参数');
    f2d.open();

    this.controllers.algorithm = f2d.add(this.config, 'algorithm', ['递归细分', '混沌游戏'])
       .name('生成算法')
       .onChange(() => {
         this.onChange.algorithm();
         this._updateControllerStates();
       });

    this.controllers.recursiveDepth = f2d.add(this.config, 'recursiveDepth', 0, 6, 1)
       .name('递归深度')
       .onChange(() => this.onChange.recursiveDepth());

    this.controllers.renderMode = f2d.add(this.config, 'renderMode', ['点云模式', '线框模式', '实体模式'])
       .name('渲染模式')
       .onChange(() => {
         this.onChange.renderMode();
         this._updateControllerStates();
       });

    this.controllers.ngonSides = f2d.add(this.config, 'ngonSides', 3, 8, 1)
       .name('多边形边数')
       .onChange(() => this.onChange.ngonSides());

    this.controllers.pointSize2D = f2d.add(this.config, 'pointSize2D', 1, 8, 0.5)
       .name('点大小')
       .onChange(v => this.onChange.pointSize(v));

    this.controllers.colorScheme2D = f2d.add(this.config, 'colorScheme2D', ['经典红', '科技蓝', '复古金'])
       .name('配色方案')
       .onChange(v => this.onChange.color(v));

    // ===== Mandelbrot参数文件夹 =====
    const fM = gui.addFolder('Mandelbrot参数');
    this.controllers.mandelbrotIter = fM.add(this.config, 'mandelbrotIter', 20, 200, 10)
       .name('最大迭代')
       .onChange(v => this.onChange.mandelbrotIter(v));
    this.controllers.mandelbrotColor = fM.add(this.config, 'mandelbrotColor', ['火焰', '科技蓝', '灰度'])
       .name('配色风格')
       .onChange(v => this.onChange.mandelbrotColor(v));

    // ===== 3D四面体参数文件夹 =====
    const f3d = gui.addFolder('3D四面体参数');
    this.controllers.tetraDepth = f3d.add(this.config, 'tetraDepth', 0, 5, 1)
       .name('递归深度')
       .onChange(() => this.onChange.tetraDepth());
    this.controllers.tetraRenderMode = f3d.add(this.config, 'tetraRenderMode', ['点云模式', '线框模式', '实体模式'])
       .name('渲染模式')
       .onChange(() => {
         this.onChange.tetraRenderMode();
         this._updateControllerStates();
       });
    this.controllers.pointSize3D = f3d.add(this.config, 'pointSize3D', 1, 8, 0.5)
       .name('点大小')
       .onChange(v => this.onChange.pointSize(v));
    this.controllers.colorScheme3D = f3d.add(this.config, 'colorScheme3D', ['经典红', '科技蓝', '复古金'])
       .name('配色方案')
       .onChange(v => this.onChange.color(v));
  },

  // 根据当前模式启用/禁用控制器
  _updateControllerStates: function() {
    const scene = this.config.sceneMode;
    const is2D = scene === '2D分形';
    const isMandel = scene === 'Mandelbrot';
    const is3D = scene === '3D四面体';
    const isRecursive = is2D && this.config.algorithm === '递归细分';
    const isChaos = is2D && this.config.algorithm === '混沌游戏';
    
    // 2D下点云模式判断
    const is2DPointMode = is2D && (
      (isRecursive && this.config.renderMode === '点云模式') || isChaos
    );
    // 3D下点云模式判断
    const is3DPointMode = is3D && this.config.tetraRenderMode === '点云模式';

    // ========== 2D参数 ==========
    this._setControllerEnabled(this.controllers.algorithm, is2D);
    this._setControllerEnabled(this.controllers.recursiveDepth, isRecursive);
    this._setControllerEnabled(this.controllers.renderMode, isRecursive);
    this._setControllerEnabled(this.controllers.ngonSides, isChaos);
    this._setControllerEnabled(this.controllers.pointSize2D, is2DPointMode);
    this._setControllerEnabled(this.controllers.colorScheme2D, is2D);

    // ========== Mandelbrot参数 ==========
    this._setControllerEnabled(this.controllers.mandelbrotIter, isMandel);
    this._setControllerEnabled(this.controllers.mandelbrotColor, isMandel);

    // ========== 3D参数 ==========
    this._setControllerEnabled(this.controllers.tetraDepth, is3D);
    this._setControllerEnabled(this.controllers.tetraRenderMode, is3D);
    this._setControllerEnabled(this.controllers.pointSize3D, is3DPointMode);
    this._setControllerEnabled(this.controllers.colorScheme3D, is3D);
  },

  // 辅助：设置控制器启用/禁用
  _setControllerEnabled: function(controller, enabled) {
    controller.domElement.style.opacity = enabled ? 1 : 0.3;
    controller.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
  },

  _bindMouse: function() {
    const canvas = document.getElementById('glCanvas');
    let dragging = false;
    let lastX = 0, lastY = 0;

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    canvas.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      if (this.config.sceneMode === '3D四面体') {
        this.view.rotY += dx * 0.01;
        this.view.rotX += dy * 0.01;
      } else if (this.config.sceneMode === 'Mandelbrot') {
        this.view.x -= dx / this.view.scale / 200;
        this.view.y += dy / this.view.scale / 200;
      } else {
        this.view.x += dx / 400;
        this.view.y -= dy / 400;
      }

      lastX = e.clientX;
      lastY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => dragging = false);
    canvas.addEventListener('mouseleave', () => dragging = false);

    // 滚轮缩放（所有模式通用）
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      this.view.scale *= factor;
      this.view.scale = Math.max(0.3, Math.min(200, this.view.scale));
    });
  },

  _bindKeyboard: function() {
    document.addEventListener('keydown', e => {
      const scene = this.config.sceneMode;

      // ===== 2D分形：递归细分 1/2/3切换渲染模式 =====
      if (scene === '2D分形' && this.config.algorithm === '递归细分') {
        if (e.code === 'Digit1') {
          e.preventDefault();
          this.config.renderMode = '点云模式';
          this.onChange.renderMode();
          this._updateControllerStates();
          this.controllers.renderMode.updateDisplay();
        }
        else if (e.code === 'Digit2') {
          e.preventDefault();
          this.config.renderMode = '线框模式';
          this.onChange.renderMode();
          this._updateControllerStates();
          this.controllers.renderMode.updateDisplay();
        }
        else if (e.code === 'Digit3') {
          e.preventDefault();
          this.config.renderMode = '实体模式';
          this.onChange.renderMode();
          this._updateControllerStates();
          this.controllers.renderMode.updateDisplay();
        }
      }

      // ===== 2D分形：混沌游戏 空格暂停 =====
      if (scene === '2D分形' && this.config.algorithm === '混沌游戏') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.onChange.spaceToggle();
        }
      }

      // ===== 3D四面体：1/2/3切换渲染模式 =====
      if (scene === '3D四面体') {
        if (e.code === 'Digit1') {
          e.preventDefault();
          this.config.tetraRenderMode = '点云模式';
          this.onChange.tetraRenderMode();
          this._updateControllerStates();
          this.controllers.tetraRenderMode.updateDisplay();
        }
        else if (e.code === 'Digit2') {
          e.preventDefault();
          this.config.tetraRenderMode = '线框模式';
          this.onChange.tetraRenderMode();
          this._updateControllerStates();
          this.controllers.tetraRenderMode.updateDisplay();
        }
        else if (e.code === 'Digit3') {
          e.preventDefault();
          this.config.tetraRenderMode = '实体模式';
          this.onChange.tetraRenderMode();
          this._updateControllerStates();
          this.controllers.tetraRenderMode.updateDisplay();
        }
      }
    });
  }
};
