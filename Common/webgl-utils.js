/**
 * WebGL 工具类，简化版
 */
const WebGLUtils = {
  /**
   * 从 canvas 获取 WebGL 上下文
   * @param {HTMLCanvasElement} canvas 
   * @returns {WebGLRenderingContext | null}
   */
  setupWebGL: function(canvas) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('无法获取 WebGL2 上下文，请检查浏览器支持');
      return null;
    }
    return gl;
  }
};
