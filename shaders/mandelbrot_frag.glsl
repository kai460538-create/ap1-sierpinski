precision highp float;
varying vec2 v_Coord;
uniform vec2 u_Center;
uniform float u_Zoom;
uniform int u_MaxIter;
uniform int u_ColorMode;

// 配色映射
vec3 palette(float t) {
    if (u_ColorMode == 0) {
        // 经典火焰
        return vec3(
            0.5 + 0.5 * cos(3.0 + t * 6.28318 + 0.0),
            0.5 + 0.5 * cos(3.0 + t * 6.28318 + 0.6),
            0.5 + 0.5 * cos(3.0 + t * 6.28318 + 1.0)
        );
    } else if (u_ColorMode == 1) {
        // 科技蓝
        return vec3(0.0, 0.3 + t * 0.7, 1.0);
    } else {
        // 灰度
        return vec3(t);
    }
}

void main() {
    vec2 c = u_Center + v_Coord / u_Zoom;
    vec2 z = vec2(0.0);
    int iter = 0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= u_MaxIter) break;
        if (dot(z, z) > 4.0) break;
        float temp = z.x * z.x - z.y * z.y + c.x;
        z.y = 2.0 * z.x * z.y + c.y;
        z.x = temp;
        iter++;
    }
    
    if (iter >= u_MaxIter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float t = float(iter) / float(u_MaxIter);
        gl_FragColor = vec4(palette(sqrt(t)), 1.0);
    }
}
