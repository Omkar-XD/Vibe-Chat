"use client"

import React, { useEffect, useRef } from "react"

/* ---------------------------
   Shader Source (unchanged)
--------------------------- */
const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(in vec2 p){vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f); float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.; mat2 m=mat2(1.,-.5,.2,1.2); for(int i=0;i<5;i++){t+=a*noise(p); p*=2.*m; a*=.5;} return t;}
float clouds(vec2 p){ float d=1., t=.0; for(float i=.0;i<3.; i++){ float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p); t=mix(t,d,a); d=a; p*=2./(i+1.);} return t; }
void main(void){
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.; i<12.; i++){
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`

/* ---------------------------
   Minimal WebGL2 Renderer
--------------------------- */
class SimpleWebGL {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  program: WebGLProgram | null = null
  buffer: WebGLBuffer | null = null

  private vertexSrc = `#version 300 es
  in vec2 position;
  void main(){ gl_Position = vec4(position,0.0,1.0); }`

  private vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2")
    if (!gl) throw new Error("WebGL2 not supported")
    this.canvas = canvas
    this.gl = gl
  }

  compile(type: number, src: string) {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, src)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const err = this.gl.getShaderInfoLog(shader)
      this.gl.deleteShader(shader)
      throw new Error("Shader compile error: " + err)
    }
    return shader
  }

  setup(fragmentSrc: string) {
    const gl = this.gl

    if (this.program) gl.deleteProgram(this.program)

    const vs = this.compile(gl.VERTEX_SHADER, this.vertexSrc)
    const fs = this.compile(gl.FRAGMENT_SHADER, fragmentSrc)

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program link error: " + gl.getProgramInfoLog(program))
    }

    this.program = program

    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW)

    const pos = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  }

  render(timeMs: number) {
    const gl = this.gl
    if (!this.program) return

    const dpr = window.devicePixelRatio || 1
    const w = Math.floor(this.canvas.clientWidth * dpr)
    const h = Math.floor(this.canvas.clientHeight * dpr)

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      gl.viewport(0, 0, w, h)
    }

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)

    const resLoc = gl.getUniformLocation(this.program, "resolution")
    const timeLoc = gl.getUniformLocation(this.program, "time")

    if (resLoc) gl.uniform2f(resLoc, this.canvas.width, this.canvas.height)
    if (timeLoc) gl.uniform1f(timeLoc, timeMs * 1e-3)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose() {
    try {
      if (this.program) this.gl.deleteProgram(this.program)
      if (this.buffer) this.gl.deleteBuffer(this.buffer)
    } catch {}
  }
}

/* ---------------------------
   Shader Component
--------------------------- */
export function ShaderAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<SimpleWebGL | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      rendererRef.current = new SimpleWebGL(canvas)
      rendererRef.current.setup(defaultShaderSource)
    } catch (err) {
      console.error("Shader failed:", err)
      return
    }

    const loop = (t: number) => {
      rendererRef.current?.render(t)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rendererRef.current?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  )
}

/* Support both import styles */
export default ShaderAnimation

