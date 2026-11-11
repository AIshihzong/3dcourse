/* The story's look: the scene is drawn into a float buffer, bright parts bloom, then one grade pass adds a soft vignette,
   a cool-shadow / warm-light split tone and a little grain before tone mapping. */
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

const Grade = {
  uniforms: {tDiffuse: {value: null}, uT: {value: 0}, uVig: {value: .34}, uAspect: {value: 1.6}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uVig, uAspect; varying vec2 vUv;
    float h(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      float l = dot(col, vec3(.2126, .7152, .0722));
      col *= mix(vec3(.93, .97, 1.1), vec3(1.05, 1.0, .94), smoothstep(.03, .7, l));
      col = mix(vec3(l), col, 1.1);
      vec2 q = (vUv - .5) * vec2(min(uAspect, 1.6) / 1.6, 1.);
      col *= 1. - uVig * smoothstep(.28, .95, length(q) * 1.45);
      col += (h(vUv * 917. + fract(uT) * 31.) - .5) * .012 * (.4 + l);
      gl_FragColor = vec4(max(col, 0.), c.a);
    }`,
};

export function createPost(renderer, scene, camera, {lite = false} = {}) {
  const rt = new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: lite ? 2 : 4});
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .7, .8, .86);
  composer.addPass(bloom);
  const grade = new ShaderPass(Grade); composer.addPass(grade);
  composer.addPass(new OutputPass());
  /* if frames run slow, draw the scene at a lower resolution rather than stutter */
  let t = 0, scale = 1, acc = 0, n = -30, last = 0, w = 4, h = 4;
  const auto = !navigator.webdriver;
  const apply = () => { composer.setPixelRatio(renderer.getPixelRatio() * scale); composer.setSize(w, h); grade.uniforms.uAspect.value = w / h; };
  return {
    bloom,
    setSize(nw, nh) { w = nw; h = nh; apply(); },
    render(dt) {
      const now = performance.now(), d = now - last; last = now;
      if (d < 250 && ++n > 0) { acc += d; if (n >= 45) { if (auto && acc / n > 30 && scale > .55) { scale *= .8; apply(); } acc = 0; n = 0; } }
      t += dt; grade.uniforms.uT.value = t; composer.render(dt);
    },
  };
}
