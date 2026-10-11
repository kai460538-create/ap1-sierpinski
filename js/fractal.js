/**
 * 分形算法模块
 */
const Fractal = {
  // ========== 2D 递归细分 Sierpinski ==========
  generateRecursive: function(depth, mode) {
    const out = [];
    this._subdivide2D(-0.8, -0.8, 0.8, -0.8, 0.0, 0.8, depth, mode, out);
    return new Float32Array(out);
  },

  _subdivide2D: function(x1, y1, x2, y2, x3, y3, depth, mode, out) {
    if (depth === 0) {
      if (mode === 'points') {
        out.push(x1, y1, x2, y2, x3, y3);
      } else if (mode === 'lines') {
        out.push(x1, y1, x2, y2);
        out.push(x2, y2, x3, y3);
        out.push(x3, y3, x1, y1);
      } else if (mode === 'triangles') {
        out.push(x1, y1, x2, y2, x3, y3);
      }
      return;
    }

    const mx1 = (x1 + x2) / 2, my1 = (y1 + y2) / 2;
    const mx2 = (x2 + x3) / 2, my2 = (y2 + y3) / 2;
    const mx3 = (x3 + x1) / 2, my3 = (y3 + y1) / 2;

    this._subdivide2D(x1, y1, mx1, my1, mx3, my3, depth - 1, mode, out);
    this._subdivide2D(mx1, my1, x2, y2, mx2, my2, depth - 1, mode, out);
    this._subdivide2D(mx3, my3, mx2, my2, x3, y3, depth - 1, mode, out);
  },

  // ========== 正 n 边形顶点计算（顶点朝上，正方向） ==========
  getNgonVertices: function(n, radius = 0.8) {
    const verts = [];
    for (let i = 0; i < n; i++) {
      // 从正上方开始，顺时针排列，保证三角形和递归方向一致
      const angle = Math.PI / 2 - i * 2 * Math.PI / n;
      verts.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    return verts;
  },

  // ========== n 边形混沌游戏 ==========
  generateChaosNgon: function(n, totalPoints) {
    const verts = this.getNgonVertices(n);
    const points = new Float32Array(totalPoints * 2);
    let px = Math.random() * 0.5 - 0.25;
    let py = Math.random() * 0.5 - 0.25;

    for (let i = 0; i < totalPoints; i++) {
      const idx = Math.floor(Math.random() * n) * 2;
      px = (px + verts[idx]) / 2;
      py = (py + verts[idx + 1]) / 2;
      points[i * 2] = px;
      points[i * 2 + 1] = py;
    }
    return points;
  },

  // ========== 3D 四面体 Gasket（支持三种渲染模式） ==========
  generateTetraGasket: function(depth, mode = 'lines') {
    const out = [];
    // 正四面体顶点（中心在原点，顶点朝上）
    const v = [
       0.0,  0.8,  0.0,   // 上顶点
      -0.7, -0.3,  0.5,   // 左下前
       0.7, -0.3,  0.5,   // 右下前
       0.0, -0.3, -0.7    // 后顶点
    ];
    this._subdivideTetra(v, depth, mode, out);
    return new Float32Array(out);
  },

  _subdivideTetra: function(v, depth, mode, out) {
    if (depth === 0) {
      if (mode === 'points') {
        // 点云模式：四个顶点
        for (let i = 0; i < 4; i++) {
          out.push(v[i*3], v[i*3+1], v[i*3+2]);
        }
      } else if (mode === 'lines') {
        // 线框模式：6条边
        const edges = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
        for (const e of edges) {
          out.push(v[e[0]*3], v[e[0]*3+1], v[e[0]*3+2]);
          out.push(v[e[1]*3], v[e[1]*3+1], v[e[1]*3+2]);
        }
      } else if (mode === 'triangles') {
        // 实体模式：四个面
        const faces = [[0,1,2],[0,2,3],[0,3,1],[1,3,2]];
        for (const f of faces) {
          out.push(v[f[0]*3], v[f[0]*3+1], v[f[0]*3+2]);
          out.push(v[f[1]*3], v[f[1]*3+1], v[f[1]*3+2]);
          out.push(v[f[2]*3], v[f[2]*3+1], v[f[2]*3+2]);
        }
      }
      return;
    }

    // 计算6条边中点
    function mid(a, b) {
      return [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
        (a[2] + b[2]) / 2
      ];
    }

    const v0 = [v[0], v[1], v[2]];
    const v1 = [v[3], v[4], v[5]];
    const v2 = [v[6], v[7], v[8]];
    const v3 = [v[9], v[10], v[11]];

    const m01 = mid(v0, v1);
    const m02 = mid(v0, v2);
    const m03 = mid(v0, v3);
    const m12 = mid(v1, v2);
    const m13 = mid(v1, v3);
    const m23 = mid(v2, v3);

    // 递归四个角的小四面体
    this._subdivideTetra([...v0, ...m01, ...m02, ...m03].flat(), depth - 1, mode, out);
    this._subdivideTetra([...m01, ...v1, ...m12, ...m13].flat(), depth - 1, mode, out);
    this._subdivideTetra([...m02, ...m12, ...v2, ...m23].flat(), depth - 1, mode, out);
    this._subdivideTetra([...m03, ...m13, ...m23, ...v3].flat(), depth - 1, mode, out);
  }
};
