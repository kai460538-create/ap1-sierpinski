attribute vec4 a_Position;
varying vec2 v_Coord;

void main() {
    v_Coord = a_Position.xy;
    gl_Position = a_Position;
}
