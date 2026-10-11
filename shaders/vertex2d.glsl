attribute vec4 a_Position;
uniform mat4 u_ViewMatrix;
uniform float u_PointSize;

void main() {
    gl_Position = u_ViewMatrix * a_Position;
    gl_PointSize = u_PointSize;
}
