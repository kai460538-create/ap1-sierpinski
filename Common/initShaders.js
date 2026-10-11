/**
 * 加载并初始化着色器程序
 * @param {WebGLRenderingContext} gl WebGL上下文
 * @param {string} vertexPath 顶点着色器文件路径
 * @param {string} fragmentPath 片元着色器文件路径
 * @returns {WebGLProgram} 链接好的着色器程序
 */
function initShaders(gl, vertexPath, fragmentPath) {
  // 同步加载着色器文件
  function loadShaderFile(path) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, false); // 同步请求，Live Server 环境下可用
    xhr.send(null);
    if (xhr.status !== 200) {
      console.error(`加载着色器失败: ${path}, 状态码: ${xhr.status}`);
      return null;
    }
    return xhr.responseText;
  }

  // 创建并编译单个着色器
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexSource = loadShaderFile(vertexPath);
  const fragmentSource = loadShaderFile(fragmentPath);
  if (!vertexSource || !fragmentSource) return null;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  // 创建程序并链接着色器
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('着色器程序链接失败:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
