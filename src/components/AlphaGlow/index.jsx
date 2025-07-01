// src/components/AlphaGlow.js
import { Uniform } from 'three';
import { Effect, BlendFunction } from 'postprocessing';
import { wrapEffect } from '@react-three/postprocessing';

const fragmentShader = `
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float offset = 0.008;

    // 5×5 Gaussian kernel weights (separable): center=0.375, neighbor=0.25, outer=0.0625
    float kernel[3];
    kernel[0] = 0.375;   // abs(x)==0
    kernel[1] = 0.25;    // abs(x)==1
    kernel[2] = 0.0625;  // abs(x)==2

    float blurred = 0.0;

    // 5×5 blur
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 shift = vec2(float(x), float(y)) * offset;
        float a = texture(inputBuffer, uv + shift).a;
        float wx = kernel[abs(x)];
        float wy = kernel[abs(y)];
        blurred += a * wx * wy;
      }
    }

    // Knock-out subtraction to isolate only the halo
    float original = texture(inputBuffer, uv).a;
    float glowOnly = max(blurred - original, 0.0);

    // Darker green tint
    vec3 glow = vec3(0.0, glowOnly * 0.04, glowOnly * 0.01);

    // Output glow fringe, preserving transparency
    outputColor = vec4(glow, glowOnly);
  }
`;

class AlphaGlowImpl extends Effect {
  constructor() {
    super('AlphaGlow', fragmentShader, {
      blendFunction: BlendFunction.ADD,
    });
  }
}

const AlphaGlow = wrapEffect(AlphaGlowImpl);
export default AlphaGlow;
