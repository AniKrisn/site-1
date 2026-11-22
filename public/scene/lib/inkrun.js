import * as e from "./ink.js";
import { describe as t, loop as n, params as r } from "scene";
// \0rolldown/runtime.js
var i = Object.create, a = Object.defineProperty, o = Object.getOwnPropertyDescriptor, s = Object.getOwnPropertyNames, c = Object.getPrototypeOf, l = Object.prototype.hasOwnProperty, u = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), d = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = s(t), c = 0, u = i.length, d; c < u; c++) d = i[c], !l.call(e, d) && d !== n && a(e, d, {
		get: ((e) => t[e]).bind(null, d),
		enumerable: !(r = o(t, d)) || r.enumerable
	});
	return e;
}, f = (e, t, n) => (n = e == null ? {} : i(c(e)), d(t || !e || !e.__esModule || !l.call(e, "default") ? a(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), p = "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}", m = "#version 300 es\nprecision highp float;precision highp int;\nuniform highp sampler2D u_matData,u_matSource,u_matBones,u_matBase;\nuniform int u_matRows,u_matCount;uniform bool u_matHasBase,u_matOrtho,u_matLiveLight;\nuniform vec3 u_matEye,u_matView,u_matLight;uniform float u_matTime;\nout vec4 color;\nvec4 setting(int id,int slot){int q=id*9+slot;return texelFetch(u_matData,ivec2(q%1024,u_matRows+q/1024),0);}\nvec3 unit(vec3 a,vec3 fallback){float l=length(a);return l>1e-8?a/l:fallback;}\nmat3 bone(int id,out vec3 translation){int i=id*3;ivec2 p=ivec2(i%768,i/768);vec4 a=texelFetch(u_matBones,p,0),b=texelFetch(u_matBones,p+ivec2(1,0),0),c=texelFetch(u_matBones,p+ivec2(2,0),0);translation=vec3(a.w,b.w,c.w);return transpose(mat3(a.xyz,b.xyz,c.xyz));}\nfloat lobe(vec4 p,vec3 n,vec3 t,vec3 b,vec3 v,vec3 light,float visibility,float steps){\n vec3 h=unit(v+light,n);float nt=dot(n,h);if(dot(n,light)<=0.0||nt<=0.0)return 0.0;\n float ht=dot(t,h),hb=dot(b,h),c=cos(p.w),s=sin(p.w);\n float response=exp(-pow((ht*c+hb*s)/nt/max(.001,p.x),2.0))*exp(-pow((hb*c-ht*s)/nt/max(.001,p.y),2.0));\n float w=clamp(response*p.z*visibility,0.0,1.0);return steps>1.0?floor(w*steps+.5)/steps:w;\n}\nvoid main(){ivec2 pixel=ivec2(gl_FragCoord.xy);int i=pixel.x+pixel.y*512;\n vec4 previous=u_matHasBase?texelFetch(u_matBase,pixel,0):vec4(1,1,1,0);\n if(i>=u_matCount){color=vec4(0);return;}\n vec4 normal=texelFetch(u_matData,ivec2(pixel.x*2,pixel.y),0),axis=texelFetch(u_matData,ivec2(pixel.x*2+1,pixel.y),0);\n int id=int(normal.w)-1;ivec2 source=ivec2(pixel.x*4,pixel.y);\n vec4 at=texelFetch(u_matSource,source,0),shape=texelFetch(u_matSource,source+ivec2(2,0),0),animation=texelFetch(u_matSource,source+ivec2(3,0),0);\n int flags=int(shape.w),kind=flags&15;\n if(id<0||at.w<=0.0||(flags&(32768|32))!=0){color=previous;return;}\n vec3 position=at.xyz,n=normal.xyz,t=axis.xyz;mat3 transform=mat3(1);\n float ph=animation.x,sp=animation.y,rg=animation.z,ex=animation.w,time=u_matTime;\n if(kind==5){float a=time*sp,c=cos(a),s=sin(a);transform=mat3(c,0,-s,0,1,0,s,0,c);position=transform*position;}\n else if(kind==12||kind==13){vec3 move;transform=bone(int(ph+.5),move);vec3 p=transform*position+move;\n  if(rg>0.0){vec3 move2;mat3 second=bone(int(sp+.5),move2);p=mix(p,second*position+move2,rg);transform=transform*(1.0-rg)+second*rg;}\n  position=p;if(kind==13){position.x+=.022*sin(time*1.9+position.y*1.3+position.z*.9+1.0);position.y+=.0132*sin(time*2.47+position.x*1.1+1.0);}}\n else if(kind==6)position.y+=sin(time*sp+ph)*rg;\n else if(kind==8){float f=.2+.8*abs(sin(time*sp+ph));position.x=rg+(position.x-rg)*f;position.z=ex+(position.z-ex)*f;position.y+=.14*sin(time*sp*.31+ph);}\n else if(kind==9)position.xz*=1.0+rg*sin(time*sp+ph-position.y*ex);\n else if(kind==10){float q=length(position.xz),w=min(1.0,q*.22);position.y+=rg*w*sin(time*sp+ph-q*ex);position.xz+=rg*.6*w*vec2(-position.z,position.x)/max(q,.01)*sin(time*sp*.7+ph-q*ex*.6);}\n else if(kind==14){float spread=rg*max(0.0,position.y-ex);position.x+=spread*sin(time*sp+ph);position.z+=spread*.6*sin(time*sp*.73+ph*1.7);}\n else if(kind==2||kind==3||kind==15){float phase=fract(time*sp/max(rg,.000001)+ph);position.y+=(kind==3?1.0:-1.0)*phase*rg;\n  if(kind==3)position.x+=sin(phase*7.0+ph*50.0)*.25*phase;\n  if(kind==15){position.x+=sin(phase*11.0+ph*40.0)*ex;position.z+=cos(phase*7.0+ph*23.0)*ex*.6;}}\n else if(kind==11){position.x+=rg*sin(time*sp+position.y*1.3+position.z*.9+ph);position.y+=rg*.6*sin(time*sp*1.3+position.x*1.1+ph);}\n if(abs(determinant(transform))>1e-8)n=transpose(inverse(transform))*n;t=transform*t;\n n=unit(n,vec3(0,1,0));t-=n*dot(t,n);t=unit(t,unit(cross(abs(n.x)<.8?vec3(1,0,0):vec3(0,1,0),n),vec3(1,0,0)));\n vec3 b=cross(n,t),v=unit(u_matOrtho?u_matView:u_matEye-position,n),light=unit(u_matLiveLight?u_matLight:setting(id,8).xyz,vec3(0,1,0));\n float packed=texelFetch(u_matSource,source+ivec2(1,0),0).w;\n vec3 original=vec3(mod(packed,256.0),mod(floor(packed/256.0),256.0),floor(packed/65536.0))/255.0;\n vec3 rgb=min(vec3(1),original*(previous.w>0.0?previous.rgb:vec3(1)));\n vec4 diffuse=setting(id,0);rgb*=mix(vec3(1),diffuse.rgb,diffuse.a);\n vec4 sky=setting(id,3),horizon=setting(id,4),ground=setting(id,5);\n float nv=clamp(dot(n,v),0.0,1.0),up=n.y*2.0*nv-v.y,q=clamp(abs(up)/.8,0.0,1.0);q=q*q*(3.0-2.0*q);\n vec3 reflected=mix(horizon.rgb,up<0.0?ground.rgb:sky.rgb,q);\n float reflection=clamp((horizon.a+(1.0-horizon.a)*pow(1.0-nv,ground.a))*sky.a,0.0,1.0);\n rgb=mix(rgb,reflected,reflection);\n vec4 spec=setting(id,1),specColor=setting(id,2),coat=setting(id,6),coatColor=setting(id,7);\n rgb=mix(rgb,specColor.rgb,lobe(spec,n,t,b,v,light,axis.w,specColor.a));\n rgb=mix(rgb,coatColor.rgb,lobe(coat,n,t,b,v,light,axis.w,coatColor.a));\n color=vec4(rgb/max(original,vec3(.00001)),1);\n}";
function h(e, t, n, r, i) {
	let a = i.KIT, o = i.MaterialControls ?? a?.material, s = i.SurfaceLook ?? a?.surface, c = (e) => !!e.surfaces?.some((e) => e.settings?.materialControls);
	if (!o || !s) return {
		has: () => !1,
		compose: (e, t, n, r, i) => i
	};
	let l, u, d, f, h, g, _, v, y, b, x, S, C, w, T, E, D = [], O, k;
	function A(e, t) {
		if (e === void 0) return t;
		if (Array.isArray(e)) return e;
		let n = typeof e == "string" ? parseInt(e.slice(1), 16) : l.pal[e];
		return [
			n >>> 16 & 255,
			n >> 8 & 255,
			n & 255
		].map((e) => e / 255);
	}
	function j(e) {
		let { settings: t, light: n } = e, r = t.layers ?? {}, i = [
			"control-diffuse",
			"control-reflection",
			"control-specular",
			"control-coating"
		], a = s.prepare({
			...t,
			layers: Object.fromEntries(i.map((e) => [e, r[e]]))
		}, l.pal, n, l.surfaceEffects, { paletteRoles: l.paletteRoles }), o = (e) => a.layers.find((t) => t.id === e), c = o(i[0]), u = o(i[1]), d = o(i[2]), f = o(i[3]);
		if (a.layers.some((e) => e.mask || e.drive || e.spatialMask)) throw Error("Native material-control slots do not accept masks or signal drives; add them as separate surface layers");
		return [
			...A(c?.color, [
				1,
				1,
				1
			]),
			c?.strength ?? 0,
			...d?.roughness ?? [.45, .45],
			d?.strength ?? 0,
			d?.rotation ?? 0,
			...A(d?.color, [
				1,
				1,
				1
			]),
			d?.steps ?? t.steps ?? 0,
			...A(u?.sky, [
				.6,
				.78,
				.97
			]),
			u?.strength ?? 0,
			...A(u?.horizon, [
				.86,
				.91,
				.97
			]),
			u?.f0 ?? .04,
			...A(u?.ground, [
				.21,
				.23,
				.28
			]),
			u?.power ?? 5,
			...f?.roughness ?? [.12, .12],
			f?.strength ?? 0,
			f?.rotation ?? 0,
			...A(f?.color, [
				1,
				1,
				1
			]),
			f?.steps ?? t.steps ?? 0,
			...n ?? [
				0,
				1,
				0
			],
			0
		];
	}
	function M(e, t) {
		let i = t.materialRevision ?? e.materialRevision, o = l !== e || u !== e.data || d !== e.count || _?.length !== e.surfaces.length || f !== e.surfaceData || h !== e.surfaces || g !== i || _?.some((t, n) => t !== e.surfaces[n].settings);
		if (o) {
			l = e, u = e.data, d = e.count, f = e.surfaceData, h = e.surfaces, g = i, _ = h.map((e) => e.settings), x = Math.ceil(e.count / 512), v = new Float32Array((x + Math.ceil(h.length * 9 / 1024)) * 4096), b = [], h.forEach((e, t) => {
				e.settings?.materialControls && v.set(j(e), x * 4096 + t * 36);
			});
			for (let t = 0; t < e.count; t++) h[f?.[t * 8] - 1]?.settings?.materialControls && b.push(t);
			S ??= n.table(1024, 31, r);
		}
		if (o || e.anim?.rig || t.changedRows?.length !== 0) {
			let t = e.anim?.rig, n = e.rest ?? e.anim?.base ?? e.data, r = /* @__PURE__ */ new Map();
			for (let e of b) {
				let i = e * 8, o = f[i] - 1, s = h[o].settings, c = [
					0,
					1,
					2
				].map((t) => (n[e * 16 + t] - (s.origin?.[t] ?? 0)) / (s.scale ?? 1)), l = Array.from(f.subarray(i + 1, i + 4)), u = f[i + 5] || f[i + 6] || f[i + 7] ? Array.from(f.subarray(i + 5, i + 8)) : s.direction ?? [
					1,
					0,
					0
				], d = {
					x: [
						1,
						0,
						0
					],
					y: [
						0,
						1,
						0
					],
					z: [
						0,
						0,
						1
					]
				};
				if (typeof u == "string") u = d[u] ?? d.x;
				else if (typeof u == "function") u = u(c, l);
				else if (u.type === "circular") u = a.V.cross(d[u.axis] ?? d.y, c);
				else if (u.type === "weave") {
					let e = d[u.along] ?? (Array.isArray(u.along) ? u.along : d.x), t = d[u.across] ?? (Array.isArray(u.across) ? u.across : d.y), n = u.scale ?? .2;
					u = Math.floor(a.V.dot(e, c) / n) + Math.floor(a.V.dot(t, c) / n) & 1 ? e : t;
				} else Array.isArray(u) || (u = d.x);
				if (!Array.isArray(u) || u.length !== 3 || !u.every(Number.isFinite)) throw TypeError("Material direction must produce finite XYZ");
				let p = t?.free?.[e] ? 0 : t?.bid?.[e];
				if (p) {
					let e = r.get(p);
					if (!e) {
						let n = t.M.subarray(p * 12, p * 12 + 9);
						e = {
							A: n,
							normal: Math.abs(a.M.det(n)) > 1e-8 ? a.M.tr(a.M.inv(n)) : a.M.id()
						}, r.set(p, e);
					}
					l = a.M.app(e.normal, l), u = a.M.app(e.A, u);
				}
				v.set([
					...l,
					o + 1,
					...u,
					f[i + 4]
				], i);
			}
			S.upload(v);
		} else S.bind();
	}
	function N(r, i, a, o, u) {
		if (i.materialControls === !1 || !r.count || !c(r)) return u;
		if (!E && !e.getExtension("EXT_color_buffer_float")) throw Error("Native material controls require EXT_color_buffer_float");
		try {
			M(r, i);
		} catch (e) {
			throw l = null, e;
		}
		E ??= t.program(p, m), T ??= t.allocate("VertexArray"), C ??= t.texture(), w ??= t.texture(), u || (n.textureUnit(21, w), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, 1, 1, 0, e.RGBA, e.FLOAT, new Float32Array([
			1,
			1,
			1,
			0
		])));
		let d = [512, Math.ceil(r.count / 512)];
		(D[0] !== d[0] || D[1] !== d[1]) && (n.textureUnit(31, C), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, ...d, 0, e.RGBA, e.FLOAT, null), D = d, S.bind());
		let f = y ??= t.allocate("Framebuffer");
		if (e.bindFramebuffer(e.FRAMEBUFFER, f), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, C, 0), e.drawBuffers([e.COLOR_ATTACHMENT0]), e.checkFramebufferStatus(e.FRAMEBUFFER) !== e.FRAMEBUFFER_COMPLETE) throw Error("Material finish framebuffer is incomplete");
		k !== r.surfaceLight && (k = r.surfaceLight, O = k ? s.prepareLightTrack(k) : null);
		let h = i.materialLight ?? O?.(o);
		if (h && (!Array.isArray(h) || h.length !== 3 || !h.every(Number.isFinite) || Math.hypot(...h) < 1e-8)) throw TypeError("Material light needs a nonzero finite XYZ direction");
		return e.viewport(0, 0, ...D), e.disable(e.BLEND), e.disable(e.DEPTH_TEST), e.disable(e.SCISSOR_TEST), e.colorMask(!0, !0, !0, !0), e.bindVertexArray(T), e.useProgram(E.p), E.set({
			u_matData: 31,
			u_matSource: 0,
			u_matBones: 4,
			u_matBase: 21,
			u_matRows: x,
			u_matCount: r.count,
			u_matHasBase: u,
			u_matEye: a.eye,
			u_matView: [
				a.view[2],
				a.view[6],
				a.view[10]
			],
			u_matOrtho: a.ortho,
			u_matTime: o,
			u_matLight: h ?? [
				0,
				1,
				0
			],
			u_matLiveLight: !!h
		}), e.drawArrays(e.TRIANGLES, 0, 3), e.bindFramebuffer(e.FRAMEBUFFER, null), n.textureUnit(21, C), !0;
	}
	return {
		has: c,
		compose: N
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/light-emitters.mjs
var g = "\nuniform highp sampler2D u_eData,u_eCookies;\nuniform highp sampler3D u_eShadow;\nuniform int u_eCount,u_eFogCount,u_ePick;\nuniform vec3 u_eShadowMin,u_eShadowSize;\nuniform float u_eShadowStep,u_eAmbient;\nuniform vec4 u_eSun;\nuniform vec3 u_eSunColor;\nvec4 eRow(int light,int row){return texelFetch(u_eData,ivec2(light*11+row,0),0);}\nvec3 eLinear(vec3 s){return mix(s/12.92,pow((s+.055)/1.055,vec3(2.4)),step(vec3(.04045),s));}\nvec3 eSRGB(vec3 s){s=max(s,vec3(0));return mix(s*12.92,1.055*pow(s,vec3(1.0/2.4))-.055,step(vec3(.0031308),s));}\nfloat eShadow(vec3 p,vec3 toLight,float stop,float bias){\n  if(u_eShadowStep<=0.0)return 1.0;\n  float t=max(bias,u_eShadowStep*.12);\n  for(int k=0;k<40;k++){\n    if(t>=stop-bias)return 1.0;\n    vec3 uv=((p+toLight*t-u_eShadowMin)/u_eShadowStep+.5)/u_eShadowSize;\n    if(any(lessThan(uv,vec3(0)))||any(greaterThan(uv,vec3(1)))){t+=u_eShadowStep;continue;}\n    float d=texture(u_eShadow,uv).r;\n    if(d<max(.0015,u_eShadowStep*.025))return 0.0;\n    t+=max(u_eShadowStep*.12,d*.8);\n  }\n  return 1.0;\n}\nvec3 eCookie(int i,vec3 p){\n  vec4 region=eRow(i,6);if(region.z<=0.0)return vec3(1);\n  vec4 at=eRow(i,0),n=eRow(i,1),u=eRow(i,7),v=eRow(i,8),move=eRow(i,9);\n  vec3 delta=at.xyz-p;float forward=-dot(delta,n.xyz);if(forward<=0.0)return vec3(0);\n  vec2 uv=vec2(.5-dot(delta,u.xyz)/forward,.5-dot(delta,v.xyz)/forward);\n  if(any(lessThan(uv,vec2(0)))||any(greaterThanEqual(uv,vec2(1))))return vec3(0);\n  uv=(uv-.5)*move.zw+.5+move.xy;if(v.w>.5)uv=fract(uv);\n  if(any(lessThan(uv,vec2(0)))||any(greaterThanEqual(uv,vec2(1))))return vec3(0);\n  if(u.w<.5)return texelFetch(u_eCookies,ivec2(region.xy+floor(uv*region.zw)),0).rgb;\n  vec2 q=uv*region.zw-.5,f=fract(q);ivec2 a=ivec2(floor(q)),lo=ivec2(region.xy),hi=ivec2(region.zw)-1;\n  return mix(mix(texelFetch(u_eCookies,lo+clamp(a,ivec2(0),hi),0).rgb,texelFetch(u_eCookies,lo+clamp(a+ivec2(1,0),ivec2(0),hi),0).rgb,f.x),mix(texelFetch(u_eCookies,lo+clamp(a+ivec2(0,1),ivec2(0),hi),0).rgb,texelFetch(u_eCookies,lo+clamp(a+ivec2(1),ivec2(0),hi),0).rgb,f.x),f.y);\n}\nvec2 eDisk(vec2 a){if(a.x==0.0&&a.y==0.0)return vec2(0);bool wide=abs(a.x)>abs(a.y);float r=wide?a.x:a.y,angle=.78539816339*(wide?a.y/a.x:2.0-a.x/a.y);return r*vec2(cos(angle),sin(angle));}\nvec3 eLighting(vec3 p,vec3 normal,bool fog,vec3 viewRay){\n  vec3 sum=vec3(0);\n  for(int i=0;i<32;i++){\n    if(i>=u_eCount||(fog&&i>=u_eFogCount))break;if(u_ePick>0&&i!=u_ePick-1)continue;\n    vec4 c=eRow(i,4),params=eRow(i,5);float power=fog?c.w:params.x;if(power<=0.0)continue;\n    vec4 at=eRow(i,0),n=eRow(i,1),u=eRow(i,2),v=eRow(i,3);\n    if(distance(p,at.xyz)>at.w+length(vec2(u.w,v.w)))continue;\n    vec3 transmission=eCookie(i,p);if(max(transmission.r,max(transmission.g,transmission.b))<=0.0)continue;\n    int type=int(n.w),grid=fog?1:int(params.y);float total=0.0,lit=0.0;\n    for(int j=0;j<64;j++){\n      int count=type==2?grid:type>=3?1:grid*grid;if(j>=count)break;\n      vec2 q=vec2(2.0*(float(j%grid)+.5)/float(grid)-1.0,2.0*(float(j/grid)+.5)/float(grid)-1.0);\n      if(type==1)q=eDisk(q);if(type==2)q.y=0.0;\n      vec3 sampleAt=at.xyz+(type<3?q.x*(type==2?max(0.0,u.w-v.w):u.w)*u.xyz+q.y*v.w*v.xyz:vec3(0));\n      vec3 delta=sampleAt-p;float d=length(delta);if(d<=params.w||d>=at.w)continue;vec3 dir=delta/d;\n      float facing=-dot(dir,n.xyz),receive=fog?1.0:max(0.0,dot(normal,dir));\n      float angular=type>=3?1.0:type==2?1.0:max(0.0,params.z>=2.0?abs(facing):facing);\n      if(type==3){float outer=u.w,inner=v.w;if(facing<outer)continue;float edge=inner==outer?1.0:clamp((facing-outer)/(inner-outer),0.0,1.0);angular*=edge*edge*(3.0-2.0*edge);}\n      float amount=receive*angular*pow(1.0-d/at.w,2.0);total+=amount;\n      bool shadows=mod(params.z,2.0)>.5&&(!fog||eRow(i,10).y>.5);\n      float visible=shadows?eShadow(p+(fog?vec3(0):normal*params.w),dir,d,params.w):1.0;\n      lit+=amount*visible;\n    }\n    float count=float(type==2?grid:type>=3?1:grid*grid),visibility=total>0.0?lit/total:0.0;\n    float steps=eRow(i,10).x;\n    if(steps>1.0)lit=total*floor(visibility*(steps-1.0)+.5)/(steps-1.0);\n    sum+=(fog?eSRGB(c.rgb):c.rgb)*transmission*(power*lit/max(count,1.0));\n  }\n  return sum;\n}\nvec3 ePaint(vec3 rgb,vec3 p,vec3 n){return eSRGB(min(vec3(1),eLinear(rgb)*(vec3(1)+eLighting(p,n,false,vec3(0)))));}\n", _ = (e, t) => e?.length === t.length && t.every((t, n) => t === e[n]), v = [
	1,
	1,
	1
];
function y(e, t, { table: n, textureUnit: r }, i, a) {
	let o = a.KIT, s = a.AreaLights ?? o?.areaLights, c = a.LightCookies ?? o?.lightCookies;
	if (!s || !c) return {
		prepare: () => null,
		compose: (e, t, n, r, i) => i,
		fog: () => {}
	};
	let l = n(352, 26, i), u = n(1024, 28, i), d = t.texture();
	r(25, d), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, 1, 1, 0, e.RGBA, e.FLOAT, new Float32Array([
		1,
		1,
		1,
		0
	]));
	let f = t.texture(), p = t.allocate("Texture"), m = t.texture(), h = t.allocate("Framebuffer"), y = t.allocate("VertexArray"), b = t.allocate("Texture"), x, S = [];
	e.activeTexture(e.TEXTURE0 + 30), e.bindTexture(e.TEXTURE_2D_ARRAY, b);
	for (let t of [e.TEXTURE_MIN_FILTER, e.TEXTURE_MAG_FILTER]) e.texParameteri(e.TEXTURE_2D_ARRAY, t, e.NEAREST);
	let C, w, T, E, D = [], O, k = [], A, j, M, N, P, F, I, L = t.allocate("Texture"), R = t.allocate("Framebuffer"), z, B = [], V, H;
	e.activeTexture(e.TEXTURE0 + 25), e.bindTexture(e.TEXTURE_3D, L);
	for (let t of [e.TEXTURE_MIN_FILTER, e.TEXTURE_MAG_FILTER]) e.texParameteri(e.TEXTURE_3D, t, e.LINEAR);
	for (let t of [
		e.TEXTURE_WRAP_S,
		e.TEXTURE_WRAP_T,
		e.TEXTURE_WRAP_R
	]) e.texParameteri(e.TEXTURE_3D, t, e.CLAMP_TO_EDGE);
	e.texImage3D(e.TEXTURE_3D, 0, e.RGBA16F, 1, 1, 1, 0, e.RGBA, e.FLOAT, new Float32Array([
		.35,
		.35,
		.35,
		1
	]));
	let ee = /* @__PURE__ */ new WeakMap(), te = /* @__PURE__ */ new WeakMap(), U = 1, ne, re, ie, W = !1, ae;
	e.activeTexture(e.TEXTURE0 + 29), e.bindTexture(e.TEXTURE_3D, p);
	for (let t of [e.TEXTURE_MIN_FILTER, e.TEXTURE_MAG_FILTER]) e.texParameteri(e.TEXTURE_3D, t, e.LINEAR);
	for (let t of [
		e.TEXTURE_WRAP_S,
		e.TEXTURE_WRAP_T,
		e.TEXTURE_WRAP_R
	]) e.texParameteri(e.TEXTURE_3D, t, e.CLAMP_TO_EDGE);
	e.texImage3D(e.TEXTURE_3D, 0, e.R16F, 1, 1, 1, 0, e.RED, e.FLOAT, new Float32Array([1e3]));
	function oe(t, n, a, u = !1, d) {
		let m = s.prepare(n.areaLights === !0 ? t.areaLights : n.areaLights ?? t.areaLights, { time: a }), h = n.volumeLighting ?? t.volumeLighting, g = h ? o.atmosphere.lighting(h, t.pal, { time: a }) : null, y = [...g?.point ? [g.point] : [], ...g?.locals ?? []], b = [...m.map((e) => ({
			...e,
			type: e.shape === "rectangle" ? 0 : e.shape === "disk" ? 1 : 2,
			surface: e.intensity,
			volume: n.volumeLocalLights === !1 ? 0 : e.volumeIntensity
		})), ...y.filter((e) => e.intensity || e.surfaceIntensity).map((e) => ({
			...e,
			type: e.direction ? 3 : 4,
			normal: e.direction ?? [
				0,
				0,
				1
			],
			half: [0, 0],
			u: [
				1,
				0,
				0
			],
			v: [
				0,
				1,
				0
			],
			linearRGB: e.rgb.map((e) => e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4),
			surface: e.surfaceIntensity ?? 0,
			volume: n.volumeLocalLights === !1 ? 0 : e.intensity,
			sampleGrid: 1,
			shadows: e.castsShadow,
			bias: .025,
			cookie: e.cookie?.projection
		}))];
		if (b.sort((e, t) => Number(t.volume > 0) - Number(e.volume > 0)), b.length > 32) throw RangeError("Native emitter lighting supports up to 32 active shaped/volume lights");
		if (!b.length && !h?.sun && !t.atmosphere?.some((e) => e.lit)) return null;
		if (!e.getExtension("EXT_color_buffer_float")) throw Error("Native emitter lighting needs EXT_color_buffer_float");
		let x = [...new Set(b.map((e) => e.cookie?.image).filter(Boolean))], S = /* @__PURE__ */ new Map(), E = 0, D = 0, j = 0, M = Math.min(i, 1024);
		for (let e of x) {
			if (e.width > M || e.height > i) throw RangeError("Light cookie exceeds native atlas limits");
			if (E + e.width > M && (E = 0, D += j, j = 0), D + e.height > i) throw RangeError("Light cookie atlas is full");
			S.set(e, [
				E,
				D,
				e.width,
				e.height
			]), E += e.width, j = Math.max(j, e.height);
		}
		let N = Math.max(1, D + j);
		if (r(27, f), !_(O, x)) {
			let t = new Uint8Array(M * N * 4);
			for (let [e, [n, r]] of S) for (let i = 0; i < e.height; i++) t.set(e.data.subarray(i * e.width * 4, (i + 1) * e.width * 4), ((r + i) * M + n) * 4);
			e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, M, N, 0, e.RGBA, e.UNSIGNED_BYTE, t), O = x;
		}
		let P = b.some((e) => e.shadows) ? s.staticSources(t) : [];
		if (g?.shadow?.field) {
			let e = t.radius ?? 10, n = {
				min: [
					-e,
					-e,
					-e
				],
				max: [
					e,
					e,
					e
				]
			}, r = ee.get(g.shadow.field);
			r || (r = {
				distance: g.shadow.field,
				bounds: n
			}, ee.set(g.shadow.field, r)), P.push(r);
		}
		_(k, P) && F === (n.emitterShadowResolution ?? 48) && I === n.emitterShadowRevision || (A = s.shadowField(P, { resolution: n.emitterShadowResolution ?? 48 }), k = P, F = n.emitterShadowResolution ?? 48, I = n.emitterShadowRevision, e.activeTexture(e.TEXTURE0 + 29), e.bindTexture(e.TEXTURE_3D, p), e.texImage3D(e.TEXTURE_3D, 0, e.R16F, ...A?.size ?? [
			1,
			1,
			1
		], 0, e.RED, e.FLOAT, A?.data ?? new Float32Array([1e3]))), e.activeTexture(e.TEXTURE0 + 29), e.bindTexture(e.TEXTURE_3D, p);
		let L = /* @__PURE__ */ new Float32Array(1408);
		b.forEach((e, t) => {
			let r = t * 44, i = e.cookie;
			L.set([
				...e.at,
				e.radius,
				...e.normal,
				e.type,
				...e.u,
				e.type === 3 ? e.outerCos : e.half[0],
				...e.v,
				e.type === 3 ? e.innerCos : e.half[1],
				...e.linearRGB ?? e.rgb,
				e.volume,
				e.surface,
				e.points ? e.shape === "line" ? e.points.length : Math.sqrt(e.points.length) : 1,
				(e.twoSided ? 2 : 0) + +!!e.shadows,
				e.bias ?? .025
			], r), i && !te.has(i.image) && te.set(i.image, U++), i && (L.set(S.get(i.image), r + 24), L.set([
				...i.u,
				+(i.image.filter === "linear"),
				...i.v,
				+!!i.wrap
			], r + 28), L.set([...i.offset, ...i.repeat], r + 36)), L.set([
				e.shadowSteps ?? 0,
				+(n.volumeLocalShadows !== !1),
				i ? te.get(i.image) : 0,
				0
			], r + 40);
		}), l.upload(L);
		let R = {
			u_eData: 26,
			u_eCookies: 27,
			u_eShadow: 29,
			u_eCount: b.length,
			u_ePick: 0,
			u_eFogCount: b.filter((e) => e.volume > 0).length,
			u_eShadowMin: A?.min ?? [
				0,
				0,
				0
			],
			u_eShadowSize: A?.size ?? [
				1,
				1,
				1
			],
			u_eShadowStep: A?.step ?? 0,
			u_eAmbient: g?.ambient ?? .35,
			u_eSun: [...g?.sun?.direction ?? [
				0,
				1,
				0
			], g?.sun?.intensity ?? 0],
			u_eSunColor: g?.sun?.rgb ?? v
		}, z = m.filter((e) => e.intensity && (u ? e.reflection : e.visible) && (e.twoSided || !d || e.normal.reduce((t, n, r) => t + n * (d.eye[r] - e.at[r]), 0) > 0)), B = JSON.stringify(z.map((e) => [
			e.at,
			e.normal,
			e.u,
			e.v,
			e.half,
			e.rgb,
			e.intensity,
			e.shape,
			e.cookie?.image && x.indexOf(e.cookie.image)
		]));
		if (B !== w || T !== O) {
			let e = Math.max(1, z.length * 64), t = new Uint8Array(e * 64 * 4), n = [];
			z.forEach((r, i) => {
				for (let n = 0; n < 64; n++) for (let a = 0; a < 64; a++) {
					let o = 2 * (a + .5) / 64 - 1, s = 1 - 2 * (n + .5) / 64;
					if (r.shape === "disk" ? o * o + s * s > 1 : r.shape === "line" && Math.hypot(Math.max(0, Math.abs(o) * r.half[0] - Math.max(0, r.half[0] - r.half[1])), s * r.half[1]) > r.half[1]) continue;
					let l = r.cookie ? c.sample(r.cookie.image, (o + 1) / 2, (1 - s) / 2) : v, u = (n * e + i * 64 + a) * 4;
					for (let e = 0; e < 3; e++) t[u + e] = Math.round(255 * r.rgb[e] * Math.min(1, r.intensity) * l[e]);
					t[u + 3] = 255;
				}
				for (let [e, t] of [
					[0, 0],
					[1, 0],
					[0, 1],
					[0, 1],
					[1, 0],
					[1, 1]
				]) n.push(...r.at.map((n, i) => n + r.u[i] * (e * 2 - 1) * r.half[0] + r.v[i] * (1 - t * 2) * r.half[1]), i * 64 + .5 + e * 63, .5 + t * 63);
			}), C = {
				width: e,
				height: 64,
				pixels: t,
				vertices: Float32Array.from(n)
			}, w = B, T = O;
		}
		return {
			count: b.length,
			shadow: A,
			active: !0,
			surface: b.some((e) => e.surface > 0),
			uniforms: R,
			areas: m,
			rows: L,
			world: t,
			frame: n,
			time: a,
			capture: u,
			display: C?.vertices.length ? C : null
		};
	}
	function se(n, r, i) {
		if (!n) return;
		let a = i.atmosphere === !1 ? [] : (r.atmosphere ?? []).filter((e) => e.lit);
		if (!a.length) return;
		let o = [
			Infinity,
			Infinity,
			Infinity
		], s = [
			-Infinity,
			-Infinity,
			-Infinity
		], c = r.radius ?? 10;
		for (let e of a) {
			let t = e.min, n = e.max;
			!t && e.type === "sphere" && (t = e.at.map((t) => t - e.radius), n = e.at.map((t) => t + e.radius)), !t && e.type === "shaft" && (t = e.from.map((t, n) => Math.min(t, e.to[n]) - e.radius), n = e.from.map((t, n) => Math.max(t, e.to[n]) + e.radius)), t || (t = [
				-c,
				e.bottom ?? -c,
				-c
			], n = [
				c,
				e.top ?? c,
				c
			]);
			for (let e = 0; e < 3; e++) o[e] = Math.min(o[e], t[e]), s[e] = Math.max(s[e], n[e]);
		}
		let l = i.emitterFogResolution ?? 48;
		if (!Number.isSafeInteger(l) || l < 8 || l > 128) throw RangeError("Emitter fog resolution must be 8..128");
		let u = s.map((e, t) => e - o[t]), d = Math.max(...u) / (l - 1), f = u.map((e) => Math.max(2, Math.ceil(e / d - 1e-9) + 1));
		e.activeTexture(e.TEXTURE0 + 25), e.bindTexture(e.TEXTURE_3D, L);
		let p = [
			...o,
			...u,
			l,
			n.shadow,
			...n.uniforms.u_eSun,
			...n.uniforms.u_eSunColor,
			n.uniforms.u_eAmbient
		], m = n.rows.subarray(0, n.uniforms.u_eFogCount * 44);
		if (!_(V, p) || !_(H, m)) {
			V = p, H = m.slice(), _(B, f) || (e.texImage3D(e.TEXTURE_3D, 0, e.RGBA16F, ...f, 0, e.RGBA, e.FLOAT, null), B = f), z ??= t.program("#version 300 es\nprecision highp float;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}", `#version 300 es
precision highp float;${g}
uniform vec3 u_fogMin,u_fogExtent,u_fogSize;uniform int u_fogSlice;out vec4 color;void main(){vec3 p=u_fogMin+vec3(gl_FragCoord.xy-.5,float(u_fogSlice))/(u_fogSize-1.0)*u_fogExtent;vec3 light=vec3(u_eAmbient)+eLighting(p,vec3(0),true,vec3(0));if(u_eSun.w>0.0)light+=u_eSunColor*u_eSun.w*eShadow(p,u_eSun.xyz,20.0,.025);color=vec4(light,1);}`), e.bindFramebuffer(e.FRAMEBUFFER, R), e.drawBuffers([e.COLOR_ATTACHMENT0]), e.viewport(0, 0, f[0], f[1]), e.disable(e.BLEND), e.disable(e.DEPTH_TEST), e.disable(e.SCISSOR_TEST), e.useProgram(z.p), z.set({
				...n.uniforms,
				u_fogMin: o,
				u_fogExtent: u,
				u_fogSize: f
			}), e.bindVertexArray(y);
			for (let t = 0; t < f[2]; t++) e.framebufferTextureLayer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, L, 0, t), z.set({ u_fogSlice: t }), e.drawArrays(e.TRIANGLES, 0, 3);
			e.bindFramebuffer(e.FRAMEBUFFER, null);
		}
		Object.assign(n.uniforms, {
			u_eFogField: 25,
			u_eFogMin: o,
			u_eFogExtent: u,
			u_eFogSize: f
		});
	}
	function G(n, i, a, s, c) {
		if (!n?.surface || !i.count) return c;
		if (ne !== i || re !== i.data || ie !== i.renderMetadata) {
			j = null, re = i.data, W = !i.anim;
			for (let e = 0; e < i.count && W; e++) W = !(Math.round(i.data[e * 16 + 11]) & 15);
			ne = i, ie = i.renderMetadata;
		}
		let l = W && !i.anim && j?.length === i.count * 8 && n.frame.changedRows?.length === 0, f = j?.length === i.count * 8 ? j : new Float32Array(i.count * 8);
		if (!l) {
			let e = o.splatFrames.create(i, a, o.M);
			for (let t = 0; t < i.count; t++) {
				let n = t * 8, r = t * 16, a = e(t), o = a.normal, s = a.position();
				Math.round(i.data[r + 11]) & 15 && (W = !1), f.set([
					...s,
					i.data[r + 3],
					...o ?? [
						0,
						0,
						0
					],
					i.data[r + 7]
				], n), (Math.round(i.data[r + 11]) & 352 || !o) && (f[n + 3] = 0);
			}
		}
		j = f;
		let p = !_(M, f), v = c ? s : null;
		if (!p && _(N, n.rows) && (v === null ? P === null : _(P, v)) && ae === A) return r(21, m), !0;
		p && (u.upload(f), M = f.slice());
		let C = N, w = p || ae !== A;
		N = n.rows.slice(), P = v?.slice() ?? null, ae = A, c || r(21, d);
		let T = [512, Math.max(1, Math.ceil(i.count / 512))], O = "#version 300 es\nprecision highp float;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}";
		x ??= t.program(O, `#version 300 es
precision highp float;${g}
uniform highp sampler2D u_eReceivers;uniform int u_eReceiverCount;out vec4 color;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int i=p.x+p.y*512;if(i>=u_eReceiverCount){color=vec4(0);return;}vec4 at=texelFetch(u_eReceivers,ivec2(p.x*2,p.y),0),n=texelFetch(u_eReceivers,ivec2(p.x*2+1,p.y),0);color=vec4(at.w>0.0?eLighting(at.xyz,normalize(n.xyz),false,vec3(0)):vec3(0),1);}`), E ??= t.program(O, `#version 300 es
precision highp float;${g}
uniform highp sampler2D u_eReceivers,u_eBase;uniform highp sampler2DArray u_eBaked;uniform bool u_eHasBase;uniform int u_eReceiverCount;out vec4 color;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int i=p.x+p.y*512;if(i>=u_eReceiverCount){color=vec4(0);return;}vec4 n=texelFetch(u_eReceivers,ivec2(p.x*2+1,p.y),0),base=u_eHasBase?texelFetch(u_eBase,p,0):vec4(1,1,1,0);vec3 light=vec3(0);for(int j=0;j<32;j++){if(j>=u_eCount)break;light+=texelFetch(u_eBaked,ivec3(p,j),0).rgb;}vec3 rgb=vec3(mod(n.w,256.0),mod(floor(n.w/256.0),256.0),floor(n.w/65536.0))/255.0,lit=eSRGB(min(vec3(1),eLinear(rgb)*(vec3(1)+light)));color=vec4(lit/max(rgb,vec3(.00001))*(base.w>0.0?base.rgb:vec3(1)),1);}`);
		let k = w;
		if (e.activeTexture(e.TEXTURE0 + 30), e.bindTexture(e.TEXTURE_2D_ARRAY, b), !_(S, [...T, n.count])) {
			if (T[0] * T[1] * n.count > 16777216) throw RangeError("Emitter receiver lighting exceeds its texel budget");
			e.texImage3D(e.TEXTURE_2D_ARRAY, 0, e.RGBA16F, ...T, Math.max(1, n.count), 0, e.RGBA, e.FLOAT, null), S = [...T, n.count], k = !0;
		}
		e.bindFramebuffer(e.FRAMEBUFFER, h), e.drawBuffers([e.COLOR_ATTACHMENT0]), e.viewport(0, 0, ...T), e.disable(e.DEPTH_TEST), e.disable(e.BLEND), e.disable(e.SCISSOR_TEST), e.colorMask(!0, !0, !0, !0), e.bindVertexArray(y), e.useProgram(x.p), x.set({
			...n.uniforms,
			u_eReceivers: 28,
			u_eReceiverCount: i.count
		});
		for (let t = 0; t < n.count; t++) (k || !_(C?.subarray(t * 44, t * 44 + 44), n.rows.subarray(t * 44, t * 44 + 44))) && (e.framebufferTextureLayer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, b, 0, t), x.set({ u_ePick: t + 1 }), e.drawArrays(e.TRIANGLES, 0, 3));
		if (!_(D, T)) {
			if (r(30, m), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, ...T, 0, e.RGBA, e.FLOAT, null), e.bindFramebuffer(e.FRAMEBUFFER, h), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, m, 0), e.drawBuffers([e.COLOR_ATTACHMENT0]), e.checkFramebufferStatus(e.FRAMEBUFFER) !== e.FRAMEBUFFER_COMPLETE) throw Error("Emitter lighting target is incomplete");
			D = T;
		}
		return e.bindFramebuffer(e.FRAMEBUFFER, h), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, m, 0), e.viewport(0, 0, ...T), e.disable(e.DEPTH_TEST), e.disable(e.BLEND), e.disable(e.SCISSOR_TEST), e.colorMask(!0, !0, !0, !0), e.useProgram(E.p), E.set({
			...n.uniforms,
			u_eReceivers: 28,
			u_eBaked: 30,
			u_eBase: 21,
			u_eHasBase: +c,
			u_eReceiverCount: i.count
		}), e.bindVertexArray(y), e.drawArrays(e.TRIANGLES, 0, 3), r(21, m), e.bindFramebuffer(e.FRAMEBUFFER, null), !0;
	}
	return {
		prepare: oe,
		compose: G,
		fog: se
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/inspection.mjs
var b = Symbol("inspection depth capture"), x = "#version 300 es\nprecision highp float;\nuniform sampler2D u_depth;\nuniform vec4 u_probes[160];\nuniform vec4 u_states[32];\nout vec4 color;\nvoid main(){\n int i=int(gl_FragCoord.x);float visible=0.0;\n for(int j=0;j<5;j++){\n  if(float(j)>=u_states[i].z)break;\n  vec4 p=u_probes[i*5+j];\n  float depth=texture(u_depth,vec2(p.x,1.0-p.y)).r;\n  visible+=float(u_states[i].y<.5||depth+p.w>=p.z);\n }\n color=vec4(vec3(visible/u_states[i].z*u_states[i].x),1);\n}", S = "#version 300 es\nprecision highp float;\nprecision highp int;\nuniform sampler2D u_scene,u_visibility,u_label,u_font;\nuniform vec2 u_size,u_anchor;\nuniform vec4 u_rect,u_labelRect,u_lens,u_crop,u_ripple;\nuniform vec3 u_color;\nuniform float u_width,u_corner,u_time,u_period;\nuniform int u_slot,u_chars[64],u_count;\nout vec4 color;\nfloat segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;float t=clamp(dot(p-a,d)/max(dot(d,d),.00001),0.0,1.0);return length(p-a-t*d);}\nbool inside(vec2 p,vec4 r){return all(greaterThanEqual(p,r.xy))&&all(lessThan(p,r.xy+r.zw));}\nvoid over(vec3 rgb,float a){color=vec4(rgb*a+color.rgb*(1.0-a),a+color.a*(1.0-a));}\nvoid main(){\n float opacity=texelFetch(u_visibility,ivec2(u_slot,0),0).r;if(opacity<=0.0)discard;\n vec2 p=vec2(gl_FragCoord.x,u_size.y-gl_FragCoord.y);color=vec4(0);\n if(u_lens.z>0.0&&inside(p,u_lens)){\n  vec2 source=floor(u_crop.xy+(p-u_lens.xy)/u_lens.zw*u_crop.zw);\n  over(texture(u_scene,vec2((source.x+.5)/u_size.x,1.0-(source.y+.5)/u_size.y)).rgb,1.0);\n }\n if(u_count>0){\n  float cell=u_ripple.w;vec2 grid=floor(p/cell),center=(grid+.5)*cell;\n  float radius=min(u_ripple.y,mod(u_time,u_period)*u_ripple.x);\n  float wave=max(0.0,1.0-abs(length(center-u_anchor)-radius)/u_ripple.z)*(1.0-radius/u_ripple.y);\n  int ch=int(mod(grid.x*13.0+grid.y*7.0+floor(u_time*7.0),float(u_count)));\n  int index=u_chars[ch];ivec2 pos=ivec2(mod(p,cell)/cell*vec2(6,8));\n  ivec2 texel=ivec2(index%64*6,index/64*8)+pos;\n  float bit=texelFetch(u_font,texel,0).r;over(u_color,bit*wave*.65);\n }\n float line=1e6;vec2 a=u_rect.xy,b=a+u_rect.zw;\n for(int j=0;j<4;j++){\n  vec2 sign=vec2(j%2==0?1:-1,j<2?1:-1),q=vec2(j%2==0?a.x:b.x,j<2?a.y:b.y);\n  line=min(line,segment(p,q,q+vec2(sign.x*min(u_corner,u_rect.z*.5),0)));\n  line=min(line,segment(p,q,q+vec2(0,sign.y*min(u_corner,u_rect.w*.5))));\n }\n vec2 delta=abs(p-u_anchor);\n if((delta.x>=3.0&&delta.x<=7.0&&delta.y<=u_width*.5)||(delta.y>=3.0&&delta.y<=7.0&&delta.x<=u_width*.5))line=0.0;\n line=min(line,segment(p,vec2(b.x,a.y),u_labelRect.xy));\n if(u_lens.z>0.0){\n  vec2 a=u_lens.xy,b=a+u_lens.zw;\n  line=min(line,min(min(segment(p,a,vec2(b.x,a.y)),segment(p,vec2(b.x,a.y),b)),min(segment(p,b,vec2(a.x,b.y)),segment(p,vec2(a.x,b.y),a))));\n }\n if(line<=u_width*.5)over(u_color,1.0);\n if(inside(p,u_labelRect)){\n  vec4 label=texelFetch(u_label,ivec2(p-u_labelRect.xy),0);over(label.rgb,label.a);\n }\n color*=opacity;\n}", C = "#version 300 es\nprecision highp float;\nuniform sampler2D u_scene;\nuniform vec2 u_size;\nout vec4 color;\nvoid main(){color=texture(u_scene,gl_FragCoord.xy/u_size);}";
function w(e, { api: t, program: n, resources: r, target: i, textureUnit: a, fullscreen: o, maxSize: s, viewportLimit: c }) {
	let l = i(), u = i(), d = i(), f = r.texture(), p = r.texture(), m = n(x), h = n(S), g = n(C), _ = /* @__PURE__ */ new Map(), v, y, w = (t, n, r, i, o = e.RGBA) => {
		a(0, t), e.texImage2D(e.TEXTURE_2D, 0, o === e.RED ? e.R8 : e.RGBA8, n, r, 0, o, e.UNSIGNED_BYTE, i);
	};
	return function(n, r, i, x, S, C, T) {
		if (x > Math.min(s, c[0]) || S > Math.min(s, c[1])) throw RangeError("Inspection frame exceeds texture limit");
		l.resize(x, S);
		let E, D = (t, n, r) => {
			E = { camera: r }, d.resize(x, S), a(0, n), e.disable(e.BLEND), e.disable(e.DEPTH_TEST), e.disable(e.SCISSOR_TEST), e.colorMask(!0, !0, !0, !0), o(g, d.framebuffer, x, S, {
				u_scene: 0,
				u_size: [x, S]
			});
		};
		if (T(n, {
			...r,
			[b]: D
		}, x, S, l.framebuffer), !E) throw Error("Inspection could not capture the scene camera");
		let O = t.plan(i, {
			world: n,
			time: r.interfaceTime ?? r.time ?? n.lookSnapshot?.time ?? 0,
			sceneTime: r.time ?? n.lookSnapshot?.time ?? 0,
			width: x,
			height: S,
			camera: E.camera,
			focus: r.inspectionFocus
		});
		if (C || (e.canvas.width !== x && (e.canvas.width = x), e.canvas.height !== S && (e.canvas.height = S)), e.disable(e.BLEND), e.disable(e.DEPTH_TEST), e.disable(e.SCISSOR_TEST), e.colorMask(!0, !0, !0, !0), a(0, l.textures[0]), o(g, C, x, S, {
			u_scene: 0,
			u_size: [x, S]
		}), !O.targets.length) return;
		let k = t.font(i);
		if (v !== k) {
			let t = [...k], n = Math.ceil(t.length / 64) * 8, r = new Uint8Array(384 * n);
			if (y = /* @__PURE__ */ new Map(), t.forEach(([e, t], n) => {
				y.set(e, n);
				for (let e = 0; e < 8; e++) r.set(t.subarray(e * 6, e * 6 + 6), (Math.floor(n / 64) * 8 + e) * 384 + n % 64 * 6);
			}), n > s) throw RangeError("Inspection glyph atlas exceeds texture limit");
			w(p, 384, n, r, e.RED), v = k, _.clear();
		}
		let A = /* @__PURE__ */ new Float32Array(640), j = /* @__PURE__ */ new Float32Array(128);
		O.targets.forEach((e, t) => {
			A.set(e.probes.flat(), t * 20), j[t * 4] = e.coverage, j[t * 4 + 1] = +e.occlusion, j[t * 4 + 2] = e.probes.length;
		}), u.resize(O.targets.length, 1), a(0, d.textures[0]), o(m, u.framebuffer, O.targets.length, 1, {
			u_depth: 0,
			u_probes: A,
			u_states: j
		}), a(0, l.textures[0]), a(1, u.textures[0]), a(3, p), e.enable(e.BLEND), e.blendEquation(e.FUNC_ADD), e.blendFuncSeparate(e.ONE, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA);
		for (let n = 0; n < O.targets.length; n++) {
			let r = O.targets[n], i = JSON.stringify([
				r.text,
				r.style,
				r.label.slice(2)
			]), s = _.get(i);
			s || (s = t.labels(r, k), _.size >= 128 && _.clear(), _.set(i, s)), w(f, s.w, s.h, s.data), a(2, f), a(0, l.textures[0]);
			let c = /* @__PURE__ */ new Int32Array(64), u = [...r.ripple?.chars ?? ""];
			u.forEach((e, t) => {
				if (!y.has(e)) throw RangeError("Missing inspection ripple glyph: " + e);
				c[t] = y.get(e);
			});
			let d = r.ripple, p = [
				r.rect,
				r.label,
				[
					r.anchor[0] - (d?.radius ?? 8),
					r.anchor[1] - (d?.radius ?? 8),
					(d?.radius ?? 8) * 2,
					(d?.radius ?? 8) * 2
				]
			];
			r.lens && p.push(r.lens.rect);
			let m = Math.max(0, Math.floor(Math.min(...p.map((e) => e[0])) - 2)), g = Math.max(0, Math.floor(Math.min(...p.map((e) => e[1])) - 2)), v = Math.min(x, Math.ceil(Math.max(...p.map((e) => e[0] + e[2])) + 2)), b = Math.min(S, Math.ceil(Math.max(...p.map((e) => e[1] + e[3])) + 2));
			e.enable(e.SCISSOR_TEST), e.scissor(m, S - b, v - m, b - g), o(h, C, x, S, {
				u_scene: 0,
				u_visibility: 1,
				u_label: 2,
				u_font: 3,
				u_size: [x, S],
				u_anchor: r.anchor,
				u_rect: r.rect,
				u_labelRect: r.label,
				u_lens: r.lens?.rect ?? [
					0,
					0,
					0,
					0
				],
				u_crop: r.lens?.crop ?? [
					0,
					0,
					0,
					0
				],
				u_ripple: d ? [
					d.speed,
					d.radius,
					d.width,
					d.cell
				] : [
					0,
					1,
					1,
					1
				],
				u_period: d?.period ?? 1,
				u_time: O.time,
				u_color: r.style.rgb,
				u_width: r.style.width,
				u_corner: r.style.corner,
				u_slot: n,
				u_chars: c,
				u_count: u.length
			});
		}
		e.disable(e.SCISSOR_TEST), e.disable(e.BLEND), e.activeTexture(e.TEXTURE0);
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/reflections.mjs
function T(e, t, n, r, i, a, o = Infinity, s) {
	let c = t.water !== !1 && t.reflections !== !1 && e.water?.reflectionPlanes;
	if (!c?.length) return null;
	if (!a) throw TypeError("Water captures require KIT.reflection in the toolkit");
	let l = t.reflectionScale ?? .5, u = t.reflectionMaxSize ?? 512;
	if (!Number.isFinite(l) || l <= 0 || l > 1 || !Number.isSafeInteger(u) || u < 1 || u > 2048) throw RangeError("Reflection scale must be in (0,1] and max size in [1,2048]");
	let d = /* @__PURE__ */ new Map();
	for (let t of e.reflections ?? []) {
		let e = a.plane(t);
		if (d.has(e.id)) throw RangeError("Duplicate reflection plane " + e.id);
		d.set(e.id, e);
	}
	let f = Math.min(l, u / Math.max(r, i), o / (2 * Math.max(r, i))), p = /* @__PURE__ */ new Float32Array(4), m = /* @__PURE__ */ new Float32Array(4), h = c.map((e, t) => {
		let r = d.get(e);
		if (!r) throw RangeError("Unknown water reflection plane " + e);
		if (Math.abs(r.normal[1] - 1) > 1e-6) throw RangeError("Water reflection planes must face up");
		m[t] = r.at[1];
		let i = a.captureView(n.view, r, n.eye);
		if (!i) return null;
		let o = n.eye.slice();
		o[1] = 2 * r.at[1] - o[1];
		let s = i.equation.slice();
		return s[3] -= i.bias, {
			slot: t,
			plane: r,
			equation: s,
			camera: {
				...n,
				eye: o,
				view: i.view
			}
		};
	}).filter(Boolean), g = Math.max(1, Math.round(r * f)), _ = Math.max(1, Math.round(i * f)), v = s?.(h.map((e) => e.plane.id)), y = [];
	for (let e of h) {
		let t = v?.get(e.plane.id) ?? 1;
		t && (p[e.slot] = 1, y.push({
			...e,
			width: Math.max(1, Math.round(g * t)),
			height: Math.max(1, Math.round(_ * t))
		}));
	}
	return {
		captures: y,
		active: p,
		heights: m,
		count: c.length,
		width: g,
		height: _,
		grid: [2, Math.ceil(c.length / 2)]
	};
}
function E(e, t, n, r) {
	if (!t.select) return e;
	let i = e.data.slice(), a = r.KIT.splatFrames.create(e, n, r.KIT.M);
	for (let n = 0; n < e.count; n++) {
		let r = a(n).position();
		t.select(n, ...r, e) || (i[n * 16 + 3] = 0);
	}
	return {
		...e,
		data: i
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/frame-composite.mjs
var D = Symbol("rendered camera");
function O(e, t) {
	return { [D](n) {
		t(n), e[D]?.(n);
	} };
}
var k = "\nvec4 layerTexel(sampler2D image, ivec2 pos, ivec2 size, bool topDown) {\n  if (!topDown) pos.y = size.y - 1 - pos.y;\n  return texelFetch(image, pos, 0);\n}\n\nvec4 layerRegionAt(sampler2D image, vec2 pixel, vec2 outputSize, ivec4 region, bool topDown, bool linear) {\n  ivec2 size = region.zw, origin = region.xy, full = textureSize(image, 0);\n  vec2 uv = pixel * vec2(size) / outputSize;\n  if (!linear) return layerTexel(image, origin + clamp(ivec2(uv), ivec2(0), size - 1), full, topDown);\n  vec2 pos = clamp(uv - 0.5, vec2(0.0), vec2(size) - 1.0);\n  ivec2 p = ivec2(pos), q = min(p + 1, size - 1);\n  vec2 f = fract(pos);\n  return mix(mix(layerTexel(image, origin + p, full, topDown), layerTexel(image, origin + ivec2(q.x, p.y), full, topDown), f.x),\n    mix(layerTexel(image, origin + ivec2(p.x, q.y), full, topDown), layerTexel(image, origin + q, full, topDown), f.x), f.y);\n}\n\nvec4 layerAt(sampler2D image, vec2 pixel, vec2 outputSize, bool topDown, bool linear) {\n  return layerRegionAt(image, pixel, outputSize, ivec4(ivec2(0), textureSize(image, 0)), topDown, linear);\n}\n\nvec4 placedLayerAt(sampler2D image, vec2 pixel, vec4 dest, ivec4 region, bool topDown, bool linear) {\n  vec2 position = pixel - dest.xy;\n  if (any(lessThan(position, vec2(0.0))) || any(greaterThanEqual(position, dest.zw))) return vec4(0.0);\n  return layerRegionAt(image, position, dest.zw, region, topDown, linear);\n}\n", A = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D u_layer;
uniform vec2 u_outputSize;
uniform vec4 u_dest;
uniform ivec4 u_region;
uniform bool u_topDown, u_linear, u_opaque;
uniform float u_opacity;
out vec4 color;

${k}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, u_outputSize.y - gl_FragCoord.y);
  color = placedLayerAt(u_layer, pixel, u_dest, u_region, u_topDown, u_linear);
  if (u_opaque) color.a = 1.0;
  color *= u_opacity;
}`;
function j(e, { program: t, resources: n, target: r, textureUnit: i, fullscreen: a }) {
	let o = t(A), s = r(), c = n.texture(), l = 0, u = 0;
	return function(t, n, r, d, f, p) {
		let { w: m, h } = r;
		s.resize(r.world.w, r.world.h), p(t, n, r.world.w, r.world.h, s.framebuffer);
		let g = typeof d == "function" ? d() : d;
		if (f || (e.canvas.width !== m && (e.canvas.width = m), e.canvas.height !== h && (e.canvas.height = h)), e.disable(e.DEPTH_TEST), e.disable(e.CULL_FACE), e.disable(e.STENCIL_TEST), e.disable(e.SCISSOR_TEST), e.disable(e.BLEND), e.colorMask(!0, !0, !0, !0), i(0, s.textures[0]), a(o, f, m, h, {
			u_layer: 0,
			u_outputSize: [m, h],
			u_topDown: !1,
			u_opaque: !0,
			u_dest: [
				0,
				0,
				m,
				h
			],
			u_region: [
				0,
				0,
				s.width,
				s.height
			],
			u_linear: r.world.filter === "linear",
			u_opacity: 1
		}), g.length) {
			e.enable(e.BLEND), e.blendEquation(e.FUNC_ADD);
			for (let t of g) t.gpu ? i(0, t.gpu.texture) : (i(0, c), l !== t.w || u !== t.h ? (e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, t.w, t.h, 0, e.RGBA, e.UNSIGNED_BYTE, t.data), l = t.w, u = t.h) : e.texSubImage2D(e.TEXTURE_2D, 0, 0, 0, t.w, t.h, e.RGBA, e.UNSIGNED_BYTE, t.data)), e.blendFuncSeparate(e.ONE, t.blend === "add" ? e.ONE : e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA), a(o, f, m, h, {
				u_topDown: !t.gpu,
				u_opaque: !1,
				u_dest: t.dest,
				u_region: t.gpu?.region ?? [
					0,
					0,
					t.w,
					t.h
				],
				u_linear: t.filter === "linear",
				u_opacity: t.opacity
			});
			e.disable(e.BLEND);
		}
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/render-effects.mjs
var M = `
precision highp float;
precision highp int;
uniform sampler2D u_input, u_mask, u_owner, u_selected, u_depth, u_groups, u_work;
uniform vec2 u_size, u_workSize, u_depthRange;
uniform bool u_packedDepth, u_hasMask, u_hasSelect, u_hasDepth, u_hasGroups, u_depthMask, u_depthInvert, u_background, u_protect, u_sourceMask, u_outputMask, u_linear;
uniform vec3 u_depthWindow, u_tint;
uniform int u_kind, u_samples, u_side, u_span;
uniform float u_depthThreshold, u_opacity, u_radius, u_threshold, u_intensity, u_inner, u_width, u_relativeDepth;
uniform vec2 u_offset, u_center, u_blockSize, u_sortThreshold;
uniform float u_radial, u_probability;
uniform uint u_seed, u_tick;
uniform bool u_horizontal, u_descending;
${k}
vec4 readAt(vec2 p){return layerAt(u_input,p,u_size,false,false);}
bool inside(vec2 p){return all(greaterThanEqual(p,vec2(0.0)))&&all(lessThan(p,u_size));}
float zAt(vec2 p){
  if(!u_hasDepth)return 1e20;
  vec4 value=layerAt(u_depth,p,u_size,false,false);
  float n=u_packedDepth?(value.a<.5?1.0:dot(round(value.rgb*255.0),vec3(1.0,256.0,65536.0))/16777215.0):value.r;
  return n>=1.0?1e20:mix(u_depthRange.x,u_depthRange.y,n);
}
int ownerAt(vec2 p){
  ivec3 bytes=ivec3(floor(layerAt(u_owner,p,u_size,false,false).rgb*255.0+.5));
  return bytes.r+bytes.g*256+bytes.b*65536;
}
vec4 groupAt(vec2 p){
  if(!u_hasGroups)return vec4(0.0);
  int id=ownerAt(p),width=textureSize(u_groups,0).x;
  return texelFetch(u_groups,ivec2(id%width,id/width),0);
}
float weightAt(vec2 p){
  float weight=u_hasMask?layerAt(u_mask,p,u_size,false,false).r:1.0;
  if(u_hasSelect){int id=ownerAt(p),width=textureSize(u_selected,0).x;weight*=texelFetch(u_selected,ivec2(id%width,id/width),0).r;}
  if(u_depthMask){
    float z=zAt(p),edge=min(z-u_depthWindow.x,u_depthWindow.y-z);
    float a=u_depthWindow.z>0.0?clamp(edge/u_depthWindow.z,0.0,1.0):step(0.0,edge);
    weight*=z>1e19?(u_background?1.0:0.0):(u_depthInvert?1.0-a:a);
  }
  return weight;
}
bool compatible(vec2 p,vec2 q,bool emission){
  if(!inside(q))return false;
  float a=zAt(p),b=zAt(q);bool skyA=a>1e19,skyB=b>1e19;
  if(emission)return skyA||(!skyB&&b<=a+u_depthThreshold);
  return skyA==skyB&&(skyA||abs(a-b)<=u_depthThreshold)&&(!u_protect||groupAt(p)==groupAt(q));
}
float luminance(vec4 c){return dot(c.rgb,vec3(.2126,.7152,.0722))/max(1e-9,c.a);}
vec3 linearRGB(vec3 c){return mix(pow((c+.055)/1.055,vec3(2.4)),c/12.92,lessThanEqual(c,vec3(.04045)));}
vec3 displayRGB(vec3 c){return mix(1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-.055,c*12.92,lessThanEqual(c,vec3(.0031308)));}
uint hash(uint x){x=(x^(x>>16))*0x7feb352du;x=(x^(x>>15))*0x846ca68bu;return x^(x>>16);}
vec2 sortAt(int n,vec2 p){return u_horizontal?vec2((float(n)+.5)*u_size.x/u_workSize.x,p.y):vec2(p.x,(float(n)+.5)*u_size.y/u_workSize.y);}
bool eligible(vec2 p,vec2 q){
  if(!compatible(q,p,false)||(u_sourceMask&&weightAt(p)<=0.0))return false;
  vec4 c=readAt(p);float l=luminance(c);
  return c.a>0.0&&l>=u_sortThreshold.x&&l<=u_sortThreshold.y;
}
`, N = `#version 300 es
${M}
out vec4 color;
void main(){
  vec2 site=vec2(gl_FragCoord.x,u_workSize.y-gl_FragCoord.y),p=site*u_size/u_workSize;
  vec4 base=readAt(p),result=base;
  if(u_kind==8||u_kind==9){
    vec3 sum=vec3(0.0);
    for(int k=0;k<64;k++){
      if(k>=u_samples)break;
      float t=(float(k)+.5)/float(u_samples),r=u_radius*sqrt(u_kind==9?u_inner*u_inner+t*(1.0-u_inner*u_inner):t),a=float(k)*2.39996323;
      vec2 q=p+r*vec2(cos(a),sin(a));
      if(!compatible(p,q,true))continue;
      vec4 c=readAt(q);float bright=max(c.r,max(c.g,c.b))/max(c.a,1e-9);
      float amount=clamp((bright-u_threshold)/(1.0-u_threshold),0.0,1.0)*(u_sourceMask?weightAt(q):1.0)*(u_kind==8?exp(-2.0*t):1.0);
      sum+=linearRGB(c.rgb/max(c.a,1e-9))*c.a*amount*u_tint/float(u_samples);
    }
    color=vec4(sum*u_intensity*(u_kind==8?2.35:1.0),1.0);return;
  }
  if(u_kind==10){
    float z=zAt(p),coverage=0.0;vec4 g=groupAt(p);
    for(int k=0;k<8;k++){
      if(k>=u_samples)break;float a=float(k)*6.28318530718/float(u_samples);vec2 q=p+u_width*vec2(cos(a),sin(a));if(!inside(q))continue;
      float nz=zAt(q);vec4 ng=groupAt(q);bool near=z<nz,far=nz<z,sky=z>1e19,nsky=nz>1e19;
      bool boundary=sky!=nsky||!sky&&!nsky&&abs(z-nz)>max(u_depthThreshold,min(z,nz)*u_relativeDepth)||u_protect&&g!=ng;
      if(!boundary)continue;
      if(u_side!=1&&!sky&&(near||g!=ng&&!far))coverage=max(coverage,u_sourceMask?weightAt(p):1.0);
      if(u_side!=0&&!nsky&&(far||g!=ng&&!near))coverage=max(coverage,u_sourceMask?weightAt(q):1.0);
    }
    color=vec4(u_tint,coverage);return;
  }
  if(u_kind==11){
    vec2 offset=u_offset+(p/u_size-u_center)*u_radial;
    if(compatible(p,p+offset,false)&&(!u_sourceMask||weightAt(p+offset)>0.0))result.r=readAt(p+offset).r;
    if(compatible(p,p-offset,false)&&(!u_sourceMask||weightAt(p-offset)>0.0))result.b=readAt(p-offset).b;
  }else if(u_kind==12){
    uvec2 block=uvec2(floor(p/u_blockSize));
    uint key=hash(block.x*73856093u^block.y*19349663u^u_tick*83492791u^u_seed);
    if(float(key>>8u)/16777216.0<u_probability){
      vec2 q=p+u_offset*((key&1u)==1u?1.0:-1.0);
      if(compatible(p,q,false)&&(!u_sourceMask||weightAt(q)>0.0))result=readAt(q);
    }
  }else if(u_kind==13){
    int center=int(u_horizontal?site.x:site.y),extent=int(u_horizontal?u_workSize.x:u_workSize.y),start=center/u_span*u_span;
    if(eligible(p,p)){
      int left=center,right=center;
      for(int k=0;k<32;k++){if(left<=start||!eligible(sortAt(left-1,p),sortAt(left,p)))break;left--;}
      for(int k=0;k<32;k++){if(right+1>=min(start+u_span,extent)||!eligible(sortAt(right+1,p),sortAt(right,p)))break;right++;}
      // Bounded insertion sort. Each bucket is <=32 working cells; the resource
      // plan charges its quadratic comparison cost as well as source samples.
      vec4 values[32];int count=right-left+1;
      for(int k=0;k<32;k++){
        if(k>=count)break;
        vec4 value=readAt(sortAt(left+k,p));int dest=k;
        for(int j=0;j<32;j++){
          if(dest<=0)break;
          float d=(luminance(values[dest-1])-luminance(value))*(u_descending?-1.0:1.0);
          if(d<=0.0)break;values[dest]=values[dest-1];dest--;
        }
        values[dest]=value;
      }
      result=values[center-left];
    }
  }
  float gate=u_sourceMask?weightAt(p):1.0;
  color=vec4((vec3(128.0)+(result.rgb-base.rgb)*gate*127.0)/255.0,1.0);
}`, P = `#version 300 es
${M}
out vec4 color;
void main(){
  vec2 p=vec2(gl_FragCoord.x,u_size.y-gl_FragCoord.y);vec4 base=readAt(p);color=base;
  float amount=u_opacity*(u_outputMask?weightAt(p):1.0);if(amount<=0.0)return;
  vec2 uv=p*u_workSize/u_size-.5,origin=floor(uv),fraction=fract(uv);
  vec4 sum=vec4(0.0);float norm=0.0;bool glow=u_kind==8||u_kind==9;
  for(int k=0;k<4;k++){
    if(!u_linear&&k>0)break;
    vec2 index=clamp(u_linear?origin+vec2(k%2,k/2):floor(uv+.5),vec2(0.0),u_workSize-1.0);
    vec2 q=(index+.5)*u_size/u_workSize;
    if(!compatible(p,q,glow||u_kind==10&&u_side!=0))continue;
    float a=u_linear?(k%2==1?fraction.x:1.0-fraction.x)*(k>=2?fraction.y:1.0-fraction.y):1.0;
    sum+=layerAt(u_work,index+.5,u_workSize,false,false)*a;norm+=a;
  }
  if(norm<=0.0)return;sum/=norm;
  if(glow)color.rgb=displayRGB(linearRGB(base.rgb/max(base.a,1e-9))+sum.rgb*amount)*base.a;
  else if(u_kind==10)color.rgb=mix(base.rgb,sum.rgb*base.a,sum.a*amount);
  else color.rgb=base.rgb+(sum.rgb*255.0-128.0)/127.0*amount;
  color.rgb=clamp(color.rgb,vec3(0.0),vec3(base.a));
}`;
function F(e, { program: t, target: n, textureUnit: r, fullscreen: i }) {
	let a, o, s;
	return function(c, l, u, d, f, p, m, h) {
		a ??= t(N), o ??= t(P), e.activeTexture(e.TEXTURE10), s ??= n(), s.resize(l.width, l.height), r(0, h), r(10, s.textures[0]);
		let g = {
			...d,
			u_work: 10,
			u_groups: 9,
			u_workSize: [l.width, l.height],
			u_kind: c.operation,
			u_sourceMask: c.maskMode !== "output",
			u_outputMask: c.maskMode !== "source",
			u_protect: c.protectObjects,
			u_linear: c.budget.filter === "linear",
			u_samples: l.samples,
			u_tint: (c.tint ?? c.color ?? [
				255,
				255,
				255
			]).map((e) => e / 255),
			u_radius: c.radius ?? 1,
			u_threshold: Array.isArray(c.threshold) ? 0 : c.threshold ?? 0,
			u_intensity: c.intensity ?? 1,
			u_inner: c.inner ?? 0,
			u_width: c.width ?? 1,
			u_relativeDepth: c.relativeDepth ?? 0,
			u_side: [
				"inner",
				"outer",
				"both"
			].indexOf(c.side),
			u_offset: c.offset ?? [0, 0],
			u_center: c.center ?? [.5, .5],
			u_radial: c.radial ?? 0,
			u_blockSize: c.blockSize ?? [1, 1],
			u_probability: c.probability ?? 0,
			u_seed: c.seed ?? 1,
			u_tick: Math.floor(m * (c.rate ?? 0)) >>> 0,
			u_span: Math.min(c.span ?? 2, l.samples),
			u_sortThreshold: Array.isArray(c.threshold) ? c.threshold : [0, 1],
			u_horizontal: c.axis !== "y",
			u_descending: c.descending ?? !1
		};
		i(a, s.framebuffer, l.width, l.height, g), i(o, u.framebuffer, f, p, g);
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/render-graph.mjs
var I = Symbol("render graph owner capture"), L = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D u_input, u_source, u_mask, u_owner, u_selected, u_depth, u_history;
uniform highp sampler2D u_rows;
uniform highp sampler3D u_cube;
uniform vec2 u_size, u_passSize, u_offset, u_amplitude;
uniform bool u_packedDepth, u_depthMask, u_depthInvert, u_background, u_displayMask, u_budgetLinear;
uniform vec3 u_depthWindow;
uniform int u_operation;
uniform bool u_hasMask, u_hasSelect, u_hasRect, u_invert, u_layer, u_linear, u_add, u_enabled;
uniform float u_opacity, u_feather, u_line, u_frequency, u_phase, u_cubeSize;
uniform bool u_reflectX;
uniform vec4 u_rect, u_layerDest;
uniform ivec4 u_layerRegion;
uniform bool u_layerTopDown;
uniform vec3 u_volumeAt, u_extent, u_eye;
uniform vec2 u_depthRange, u_projectionScale;
uniform mat4 u_view;
uniform bool u_volume, u_ortho, u_captureHistory, u_hasHistory, u_hold;
uniform float u_volumeFeather, u_decay;
uniform vec2 u_feedbackPivot, u_feedbackTransform, u_threshold;
uniform float u_blockSize, u_gain;
uniform bool u_feedbackLinear, u_hasThreshold;
uniform bool u_scanlines, u_rejectDepth, u_hasDepth, u_isolated, u_over, u_wrap;
uniform float u_depthThreshold;
out vec4 color;

${k}

float depthAt(vec2 pixel) {
  ivec2 size = textureSize(u_depth, 0);
  ivec2 site = min(ivec2(pixel / u_size * vec2(size)), size - 1);
  vec4 value=texelFetch(u_depth, ivec2(site.x, size.y - 1 - site.y), 0);
  return u_packedDepth ? (value.a<.5 ? 1.0 : dot(round(value.rgb*255.0),vec3(1.0,256.0,65536.0))/16777215.0) : value.r;
}

void main() {
  ivec2 pos = ivec2(gl_FragCoord.xy);
  vec2 pixel = vec2(gl_FragCoord.x, u_passSize.y - gl_FragCoord.y) * u_size / u_passSize;
  vec4 inputColor = layerAt(u_input, pixel, u_size, false, false);
  if (u_operation == 0) { color = inputColor; return; }
  if (u_isolated) inputColor = vec4(0.0);
  float weight = u_hasMask ? layerAt(u_mask, pixel, u_size, false, false).r : 1.0;
  float chosen = 1.0;
  if (u_hasSelect) {
    vec3 encoded = layerAt(u_owner, pixel, u_size, false, false).rgb;
    ivec3 bytes = ivec3(floor(encoded * 255.0 + 0.5));
    int id = bytes.r + bytes.g * 256 + bytes.b * 65536;
    int rowWidth = textureSize(u_selected, 0).x;
    chosen = texelFetch(u_selected, ivec2(id % rowWidth, id / rowWidth), 0).r;
    weight *= chosen;
  }
  if (u_depthMask) {
    float n = u_hasDepth ? depthAt(pixel) : 1.0;
    float z = mix(u_depthRange.x, u_depthRange.y, n);
    float edge = min(z - u_depthWindow.x, u_depthWindow.y - z);
    float a = u_depthWindow.z > 0.0 ? clamp(edge / u_depthWindow.z, 0.0, 1.0) : step(0.0, edge);
    weight *= n >= 1.0 ? (u_background ? 1.0 : 0.0) : (u_depthInvert ? 1.0 - a : a);
  }
  if (u_operation == 1) {
    if (u_volume) {
      ivec2 size = textureSize(u_depth, 0);
      ivec2 site = min(ivec2(pixel / u_size * vec2(size)), size - 1);
      float norm = depthAt(pixel);
      if (norm >= 1.0) weight = 0.0;
      else {
        float depth = mix(u_depthRange.x, u_depthRange.y, norm);
        vec2 uv = (vec2(site) + .5) / vec2(size);
        vec2 plane = (uv * vec2(2.0, -2.0) + vec2(-1.0, 1.0)) * u_projectionScale;
        vec3 local = vec3(plane * (u_ortho ? 1.0 : depth), -depth);
        vec3 position = u_eye + vec3(dot(u_view[0].xyz, local), dot(u_view[1].xyz, local), dot(u_view[2].xyz, local));
        float d = length((position - u_volumeAt) / u_extent);
        weight *= u_volumeFeather > 0.0 ? clamp((1.0 - d) / u_volumeFeather, 0.0, 1.0) : step(d, 1.0);
      }
    }
    if (u_hasRect) {
      vec2 edges = min(pixel - u_rect.xy, u_rect.xy + u_rect.zw - pixel);
      float edge = min(edges.x, edges.y);
      weight *= u_feather > 0.0 ? clamp(edge / u_feather, 0.0, 1.0) : step(0.0, edge);
    }
    color = vec4(u_enabled ? (u_invert ? 1.0 - weight : weight) * u_opacity : 0.0);
    return;
  }
  if (u_operation == 6) {
    vec4 previous = u_hasHistory ? layerAt(u_history, pixel, u_size, false, u_budgetLinear) : vec4(0.0);
    if (u_captureHistory) {
      vec4 fresh = inputColor * weight;
      color = u_hold && previous.a > 0.0 ? previous :
        min(vec4(1.0), fresh + floor(previous * u_decay * (1.0 - fresh.a) * 255.0 + .00001) / 255.0);
    } else {
      vec4 sampleColor = previous * (chosen * u_opacity);
      color = sampleColor + inputColor * (1.0 - sampleColor.a);
    }
    return;
  }
  if (u_operation == 7) {
    if (u_captureHistory) {
      vec4 previous = vec4(0.0);
      if (u_hasHistory) {
        vec2 local = pixel - u_feedbackPivot;
        float c = u_feedbackTransform.x, s = u_feedbackTransform.y;
        vec2 field = u_blockSize > 0.0 ? (floor(pixel / u_blockSize) + .5) * u_blockSize : pixel;
        vec2 sampleAt = u_feedbackPivot + vec2(c * local.x + s * local.y, -s * local.x + c * local.y)
          - u_offset - u_amplitude * sin(field.yx * u_frequency + u_phase);
        if (all(greaterThanEqual(sampleAt, vec2(0.0))) && all(lessThan(sampleAt, u_size)))
          previous = layerAt(u_history, sampleAt, u_size, false, u_feedbackLinear);
      }
      vec4 fresh = u_layer ? placedLayerAt(u_source, pixel, u_layerDest, u_layerRegion, u_layerTopDown, u_linear)
        : layerAt(u_source, pixel, u_size, false, false);
      float gain = weight * u_gain;
      if (u_hasThreshold && fresh.a > 0.0) {
        float amount = max(fresh.r, max(fresh.g, fresh.b)) / fresh.a;
        gain *= clamp((amount - u_threshold.x) / (u_threshold.y - u_threshold.x), 0.0, 1.0);
      }
      fresh *= gain;
      color = min(vec4(1.0), fresh + floor(previous * u_decay * (1.0 - fresh.a) * 255.0 + .00001) / 255.0);
    } else {
      vec4 signal = layerAt(u_history, pixel, u_size, false, u_budgetLinear) * u_opacity * (u_displayMask ? weight : 1.0);
      color.a = signal.a + inputColor.a * (1.0 - signal.a);
      color.rgb = min(vec3(color.a), signal.rgb + inputColor.rgb * (u_add ? 1.0 : 1.0 - signal.a));
    }
    return;
  }
  weight *= u_opacity;
  color = inputColor;
  if (weight <= 0.0) return;
  if (u_operation == 2) {
    if (inputColor.a <= 0.0) return;
    vec3 lookup = (clamp(inputColor.rgb / inputColor.a, 0.0, 1.0) * (u_cubeSize - 1.0) + 0.5) / u_cubeSize;
    color.rgb = mix(inputColor.rgb, texture(u_cube, lookup).rgb * inputColor.a, weight);
  } else if (u_operation == 5) {
    vec4 over = u_layer ? placedLayerAt(u_source, pixel, u_layerDest, u_layerRegion, u_layerTopDown, u_linear) : layerAt(u_source, pixel, u_size, false, false);
    over *= weight;
    color.a = over.a + inputColor.a * (1.0 - over.a);
    color.rgb = min(vec3(color.a), over.rgb + inputColor.rgb * (u_add ? 1.0 : 1.0 - over.a));
  } else {
    vec2 sourcePixel = pixel;
    vec3 tint = vec3(0.0);
    if (u_operation == 3) {
      if (u_reflectX) sourcePixel.x = 2.0 * u_line - sourcePixel.x;
      else sourcePixel.y = 2.0 * u_line - sourcePixel.y;
    } else {
      if (u_scanlines) {
        vec4 transform = texelFetch(u_rows, ivec2(0, int(pixel.y)), 0);
        vec2 pivot = u_size * 0.5;
        sourcePixel = (sourcePixel - pivot) * transform.zw + pivot + transform.xy;
        tint = texelFetch(u_rows, ivec2(1, int(pixel.y)), 0).rgb / 255.0;
      }
      sourcePixel += u_offset + u_amplitude * sin(pixel.yx * u_frequency + u_phase);
      if (u_wrap) sourcePixel = mod(sourcePixel, u_size);
    }
    if (!(all(greaterThanEqual(sourcePixel, vec2(0.0))) && all(lessThan(sourcePixel, u_size)))) return;
    if (u_rejectDepth) {
      if (!u_hasDepth) return;
      float a = depthAt(pixel), b = depthAt(floor(sourcePixel) + 0.5);
      bool aSky = a >= 1.0, bSky = b >= 1.0;
      if (aSky != bSky || (!aSky && abs(a - b) * (u_depthRange.y - u_depthRange.x) > u_depthThreshold)) return;
    }
    vec4 sampled = layerAt(u_source, sourcePixel, u_size, false, false);
    sampled.rgb = clamp(sampled.rgb + tint * sampled.a, vec3(0.0), vec3(sampled.a));
    if (u_over) {
      sampled *= weight;
      color = sampled + inputColor * (1.0 - sampled.a);
    } else color = mix(inputColor, sampled, weight);
  }
}`;
function R(e, { api: t, program: n, resources: r, target: i, textureUnit: a, fullscreen: o, maxSize: s }) {
	let c = n(L), l = i(), u = r.texture(), d = r.texture(), f = r.texture(), p = r.allocate("Texture"), m = [], h = [], g = r.texture(), _ = F(e, {
		program: n,
		target: i,
		textureUnit: a,
		fullscreen: o
	}), v = t.history({ release: (e) => h.push(e) }), y;
	e.activeTexture(e.TEXTURE4), e.bindTexture(e.TEXTURE_3D, p), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_MAG_FILTER, e.LINEAR);
	for (let t of [
		e.TEXTURE_WRAP_S,
		e.TEXTURE_WRAP_T,
		e.TEXTURE_WRAP_R
	]) e.texParameteri(e.TEXTURE_3D, t, e.CLAMP_TO_EDGE);
	e.texImage3D(e.TEXTURE_3D, 0, e.RGBA8, 1, 1, 1, 0, e.RGBA, e.UNSIGNED_BYTE, /* @__PURE__ */ new Uint8Array(4)), e.activeTexture(e.TEXTURE0);
	function x(n, r, x, S, C, w, T) {
		let E = t.resources?.(x, S, C);
		l.resize(S, C);
		let D, k, A, j;
		T(n, {
			...r,
			...x.needsCamera && O(r, (e) => {
				k = e;
			}),
			...x.needsDepth && { [b](e, t, n) {
				A = t, j = n.depthRange, r[b]?.(e, t, n);
			} },
			[I]: x.needsOwner ? Object.assign((e, t, n, r) => {
				D = {
					world: e,
					texture: t,
					depth: n,
					view: r
				};
			}, { depth: x.needsDepth }) : void 0
		}, S, C, l.framebuffer), D?.depth && (A = D.depth, j = D.view.depthRange), w || (e.canvas.width !== S && (e.canvas.width = S), e.canvas.height !== C && (e.canvas.height = C));
		for (let t of [
			e.BLEND,
			e.DEPTH_TEST,
			e.CULL_FACE,
			e.SCISSOR_TEST,
			e.STENCIL_TEST
		]) e.disable(t);
		e.colorMask(!0, !0, !0, !0), e.activeTexture(e.TEXTURE4), e.bindTexture(e.TEXTURE_3D, p);
		let M = /* @__PURE__ */ new Map([["scene", l]]), N = m.slice(), P = /* @__PURE__ */ new Map(), F = r.interfaceTime ?? r.time ?? n.lookSnapshot?.time ?? 0, L = v.begin(x, {
			source: r.renderHistoryKey ?? n,
			w: S,
			h: C,
			time: F,
			camera: k,
			reset: r.resetRenderHistory
		}), R = !1;
		if (x.passes.some((e) => e.enabled && e.effect) && D) {
			let n = t.ownerGroups(D.world), r = Math.min(2048, s), i = Math.ceil(n.length / r), o = new Uint8Array(r * i * 4);
			for (let e = 0; e < n.length; e++) o[e * 4] = n[e] & 255, o[e * 4 + 1] = n[e] >>> 8 & 255, o[e * 4 + 2] = n[e] >>> 16 & 255, o[e * 4 + 3] = n[e] >>> 24;
			a(9, g), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, r, i, 0, e.RGBA, e.UNSIGNED_BYTE, o), R = !0;
		}
		let z;
		for (let [p, v] of x.passes.entries()) {
			let b = M.get(v.input) ?? l;
			if ((!v.enabled || v.type === "history" && !D) && v.type !== "mask") M.set(v.id, b);
			else {
				let x = N.pop() ?? i();
				m.includes(x) || m.push(x), x.resize(S, C);
				let w = v.type === "feedback", T = w || v.type === "history" ? L(v) : null, O = M.get(v.mask), I = v.type === "grade" && t.cube(v), B = v.layer && (!w || T.capture) && t.layer(v, S, C, n, F, k, e, r.time), V = t.rowTable(v.rows, S, C, F), H = v.enabled && D && v.select && JSON.stringify(v.select), ee = v.opacity * (v.layer && !w ? B?.opacity ?? 0 : 1);
				if (B?.gpu) a(1, B.gpu.texture);
				else if (B) {
					if (B.w > s || B.h > s) throw RangeError("Render graph layer exceeds the WebGL texture size limit");
					a(1, d), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, B.w, B.h, 0, e.RGBA, e.UNSIGNED_BYTE, B.data);
				} else a(1, (M.get(v.source) ?? l).textures[0]);
				if (I && I !== y && (e.activeTexture(e.TEXTURE4), e.texImage3D(e.TEXTURE_3D, 0, e.RGBA8, I.size, I.size, I.size, 0, e.RGBA, e.UNSIGNED_BYTE, I.data), y = I), H && H !== z) {
					if (!P.has(H)) {
						let e = t.selection(D.world, v.select), n = Math.min(2048, s), r = Math.ceil(e.length / n), i = new Uint8Array(n * r);
						i.set(e), P.set(H, {
							width: n,
							height: r,
							data: i
						});
					}
					let { width: n, height: r, data: i } = P.get(H);
					a(5, u), e.texImage2D(e.TEXTURE_2D, 0, e.R8, n, r, 0, e.RED, e.UNSIGNED_BYTE, i), z = H;
				}
				a(0, b.textures[0]), a(2, (O ?? l).textures[0]), a(3, D?.texture ?? l.textures[0]), a(5, H ? u : l.textures[0]), a(6, A ?? l.textures[0]), a(8, V ? f : l.textures[0]), V && e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, 2, C, 0, e.RGBA, e.FLOAT, V);
				let te = {
					u_input: 0,
					u_source: 1,
					u_mask: 2,
					u_owner: 3,
					u_cube: 4,
					u_selected: 5,
					u_size: [S, C],
					u_passSize: [S, C],
					u_operation: v.operation,
					u_opacity: ee,
					u_enabled: v.enabled,
					u_hasMask: !!O,
					u_hasSelect: !!H,
					u_hasGroups: R,
					u_packedDepth: !!D?.depth,
					u_depthMask: !!v.depth,
					u_depthInvert: v.depth?.invert ?? !1,
					u_background: v.depth?.background ?? !1,
					u_depthWindow: v.depth ? [
						v.depth.near,
						v.depth.far,
						v.depth.feather
					] : [
						0,
						1,
						0
					],
					u_displayMask: v.displayMask ?? !1,
					u_budgetLinear: v.budget?.filter === "linear",
					u_hasRect: !!v.rect,
					...v.rect && {
						u_rect: v.rect,
						u_feather: v.feather
					},
					u_invert: v.invert ?? !1,
					u_cubeSize: I?.size ?? 1,
					u_depth: 6,
					u_history: 7,
					u_volume: !!(v.volume && A && k),
					u_rows: 8,
					u_scanlines: !!V,
					u_isolated: v.isolated ?? !1,
					u_wrap: v.wrap ?? !1,
					u_over: v.type === "distortion" && v.blend === "over",
					u_rejectDepth: v.depthThreshold !== void 0,
					u_hasDepth: !!A,
					u_depthThreshold: v.depthThreshold ?? 0,
					u_depthRange: j ?? [0, 1],
					...v.volume && A && k && {
						u_volumeAt: v.volume.at,
						u_extent: v.volume.extent,
						u_volumeFeather: v.volume.feather,
						u_eye: k.eye,
						u_view: k.view,
						u_projectionScale: [k.tangent * k.aspect, k.tangent],
						u_ortho: k.ortho
					},
					u_layer: !!B,
					...B && {
						u_layerDest: B.dest,
						u_layerTopDown: !B.gpu,
						u_layerRegion: B.gpu?.region ?? [
							0,
							0,
							B.w,
							B.h
						]
					},
					u_linear: B?.filter === "linear",
					u_add: (w ? v.blend : B?.blend ?? v.blend) === "add",
					u_reflectX: v.axis === "x",
					u_line: v.line ?? (v.axis === "x" ? S : C) * .5,
					...v.offset && {
						u_offset: v.offset,
						u_amplitude: v.amplitude,
						u_frequency: 2 * Math.PI / v.period,
						u_phase: 2 * Math.PI * ((v.phase + F * v.rate) % 1)
					}
				};
				if (v.effect) a(9, R ? g : l.textures[0]), _(v, E.passes[p], x, te, S, C, F, b.textures[0]);
				else if (T) {
					let n = T.value;
					if (T.capture) {
						e.activeTexture(e.TEXTURE0), n = h.pop() ?? i();
						let r = E?.passes[p] ?? {
							width: S,
							height: C
						};
						n.resize(r.width, r.height), a(0, b.textures[0]), a(7, T.value?.textures[0] ?? l.textures[0]);
						let s = w && t.feedbackMotion(v, F, T.decay > 0 ? T.elapsed : 0, S, C);
						o(c, n.framebuffer, r.width, r.height, {
							...te,
							u_passSize: [r.width, r.height],
							u_captureHistory: !0,
							u_hasHistory: !!T.value && (!w || T.decay > 0),
							u_hold: v.mode === "hold",
							u_decay: w || v.mode === "persistence" ? T.decay : 0,
							...s && {
								u_feedbackTransform: s.transform,
								u_feedbackPivot: s.pivot,
								u_offset: s.offset,
								u_amplitude: s.wave,
								u_frequency: s.frequency,
								u_phase: s.theta,
								u_blockSize: s.blockSize,
								u_feedbackLinear: v.filter === "linear",
								u_gain: v.gain * (v.layer ? B?.opacity ?? 0 : 1),
								u_hasThreshold: !!v.threshold,
								u_threshold: v.threshold ?? [0, 1]
							}
						}), T.save(n);
					}
					a(7, n.textures[0]), o(c, x.framebuffer, S, C, {
						...te,
						u_captureHistory: !1,
						u_hasHistory: !0
					});
				} else a(7, l.textures[0]), o(c, x.framebuffer, S, C, te);
				M.set(v.id, x);
			}
			for (let e of v.dependencies) if (x.lastUse.get(e) === p) {
				let t = M.get(e);
				M.delete(e), t !== l && ![...M.values()].includes(t) && N.push(t);
			}
		}
		a(0, M.get(x.output).textures[0]), o(c, w, S, C, {
			u_operation: 0,
			u_cube: 4,
			u_size: [S, C],
			u_passSize: [S, C]
		});
	}
	return Object.assign(x, { reset: v.clear });
}
var z = "\nuniform vec3 u_envEye, u_envRight, u_envUp, u_envBack;\nuniform vec4 u_envCamera; // tangent, aspect, orthographic, eye setback\nuniform vec2 u_envSkyView;\nuniform float u_envHorizon;\nvec2 envScreen(vec2 pixel, vec2 size) { return 2.0 * pixel / size - 1.0; }\nvec3 envOffset(vec2 p) { return p.x * u_envRight + p.y * u_envUp; }\nvec3 envSkyRay(vec2 pixel, vec2 size) {\n  return normalize(envOffset(envScreen(pixel,size) * u_envSkyView) - u_envBack);\n}\n", B = "\nuniform highp sampler2D u_envData;\nvec4 envRow(int index) {\n  return texelFetch(u_envData, ivec2(index & 63, index >> 6), 0);\n}\n";
function V(e = !1) {
	return z + B + (e ? "uniform highp sampler3D u_eFogField;uniform vec3 u_eFogMin,u_eFogExtent,u_eFogSize;vec3 eFogLight(vec3 p){vec3 uv=(clamp((p-u_eFogMin)/u_eFogExtent,vec3(0),vec3(1))*(u_eFogSize-1.0)+.5)/u_eFogSize;return texture(u_eFogField,uv).rgb;}" : "") + `
uniform int u_envFogCount, u_envCardSize;
uniform int u_envPaletteFog, u_envPaletteStart, u_envPaletteCard;
vec3 envPalette(vec3 base, int index, vec4 signals) {
  if (index < 0) return base;
  vec4 field = envRow(index);
  if (field.x < 0.5) return base;
  vec4 transfer = envRow(index+1);
  float value = clamp((signals[int(field.y)]-field.z)/field.w,0.0,1.0);
  int first = int(transfer.x), count = int(transfer.y);
  if (field.x < 1.5) {
    for (int i=32; i>=0; i--) {
      if (i >= count) continue;
      vec4 stop = envRow(first+i);
      if (value >= stop.w) return mix(base,stop.rgb,transfer.z);
    }
    return base;
  }
  return mix(base,envRow(first+int(floor(value*float(count-1)+0.5))).rgb,transfer.z);
}
uniform highp sampler2D u_envCard, u_envCloudLight;
uniform float u_envBands, u_envCloudHardness;
float envBand(float value) {
  return u_envBands > 1.0 ? floor(clamp(value,0.0,1.0)*(u_envBands-1.0)+0.5)/(u_envBands-1.0) : value;
}
uniform vec4 u_envCardFrame, u_envCloudStyle, u_envCloudDomain, u_envCloudHeight;
uniform vec3 u_envCardRight, u_envCardUp, u_envCardNormal, u_envCloudRGB, u_envCloudSun, u_envCloudLightRGB;

bool envSlab(inout vec2 hit, float pos, float dir, float lo, float hi) {
  if (abs(dir) < 1e-10) return pos > lo && pos < hi;
  vec2 a = (vec2(lo,hi) - pos) / dir;
  hit = vec2(max(hit.x,min(a.x,a.y)),min(hit.y,max(a.x,a.y)));
  return hit.y > hit.x;
}
bool envRadial(inout vec2 hit, float a, float b, float c) {
  if (a < 1e-10) return c < 0.0;
  float delta = b*b - a*c;
  if (delta <= 0.0) return false;
  float r = sqrt(delta);
  hit = vec2(max(hit.x,(-b-r)/a),min(hit.y,(-b+r)/a));
  return hit.y > hit.x;
}
bool envFogInterval(vec3 origin, vec3 ray, float stop, int index, out vec2 hit) {
  vec4 first = envRow(index), second = envRow(index+1), range = envRow(index+3);
  hit = vec2(range.x,min(range.y,stop));
  if (hit.y <= hit.x) return false;
  if (first.w < 0.5) return envSlab(hit,origin.y,ray.y,first.y,second.y);
  if (first.w < 1.5) return envSlab(hit,origin.x,ray.x,first.x,second.x) &&
    envSlab(hit,origin.y,ray.y,first.y,second.y) && envSlab(hit,origin.z,ray.z,first.z,second.z);
  vec3 offset = origin-first.xyz;
  if (first.w < 2.5) return envRadial(hit,1.0,dot(offset,ray),dot(offset,offset)-range.z*range.z);
  float p = dot(offset,second.xyz), d = dot(ray,second.xyz);
  return envSlab(hit,p,d,0.0,second.w) &&
    envRadial(hit,1.0-d*d,dot(offset,ray)-p*d,dot(offset,offset)-p*p-range.z*range.z);
}
vec4 envFog(vec3 origin, vec3 ray, float stop, float setback) {
  const int budget = 32;
  vec2 events[budget];
  int n = 0;
  for (int i=0; i<16; i++) {
    if (i >= u_envFogCount) break;
    vec2 hit;
    if (envFogInterval(origin,ray,stop,4*i,hit)) {
      events[n++] = vec2(hit.x,float(i+1));
      events[n++] = vec2(hit.y,-float(i+1));
    }
  }
  for (int i=1; i<budget; i++) {
    if (i >= n) break;
    vec2 value = events[i];
    int j = i;
    for (; j>0; j--) {
      if (events[j-1].x <= value.x) break;
      events[j] = events[j-1];
    }
    events[j] = value;
  }
  vec4 result = vec4(0,0,0,1), medium = vec4(0);
  ${e ? "vec3 luminous=vec3(0);" : ""}
  float last = 0.0;
  int fieldMask = 0;
  float rateFloor = n > 0 ? (events[n-1].x-events[0].x)/64.0 : 0.0;
  for (int i=0; i<budget; i++) {
    if (i >= n) break;
    vec2 event = events[i];
    if (medium.a > 1e-10 && event.x > last) {
      if (fieldMask != 0) {
        float stepSize = event.x-last;
        for (int v=0; v<16; v++) {
          if ((fieldMask & (1 << v)) != 0) stepSize = min(stepSize,envRow(u_envPaletteStart+v*2+1).w);
        }
        stepSize = max(stepSize, max(rateFloor,1e-5));
        for (int j=0; j<64; j++) {
          float from = last+float(j)*stepSize;
          if (from >= event.x) break;
          float distance = min(stepSize,event.x-from), depth = from+distance*0.5;
          vec3 point = origin+ray*depth, color = medium.rgb;
          ${e ? "vec3 litColor=luminous;" : ""}
          for (int v=0; v<16; v++) {
            if ((fieldMask & (1 << v)) == 0) continue;
            vec4 source = envRow(v*4+2);
            vec3 tint = envPalette(source.rgb,u_envPaletteStart+v*2,vec4(max(0.0,depth-setback),point.y,0.0,0.0));
            vec3 change = (tint-source.rgb)*source.a;
            color += change;
            ${e ? "if(envRow(v*4+3).w>.5)litColor+=change;" : ""}
          }
          ${e ? "if(dot(litColor,vec3(1))>0.0)color+=litColor*(eFogLight(point)-1.0);" : ""}
          float alpha = 1.0-exp(-medium.a*distance);
          result.rgb += result.a*alpha*color/medium.a;
          result.a *= 1.0-alpha;
        }
      } else {
      ${e ? "if(dot(luminous,vec3(1))>0.0){\n        float ds=(event.x-last)/4.0,alpha=1.0-exp(-medium.a*ds);\n        for(int j=0;j<4;j++){vec3 p=origin+ray*(last+(float(j)+.5)*ds);vec3 light=eFogLight(p);\n          result.rgb+=result.a*alpha*(medium.rgb-luminous+luminous*light)/medium.a;result.a*=1.0-alpha;}\n      }else{" : ""}
      float alpha = 1.0-exp(-medium.a*(event.x-last));
      result.rgb += result.a * alpha * medium.rgb / medium.a;
      result.a *= 1.0-alpha;
      ${e ? "}" : ""}
      }
    }
    int volumeIndex = int(abs(event.y))-1;
    if (u_envPaletteFog != 0 && envRow(u_envPaletteStart+volumeIndex*2).x > 0.5) {
      int bit = 1 << volumeIndex;
      if (event.y > 0.0) fieldMask |= bit;
      else fieldMask &= ~bit;
    }
    vec4 volume = envRow(4*volumeIndex+2);
    medium += sign(event.y)*vec4(volume.rgb*volume.a,volume.a);
    ${e ? "if(envRow(4*(int(abs(event.y))-1)+3).w>.5)luminous+=sign(event.y)*volume.rgb*volume.a;" : ""}
    last = event.x;
  }
  if (u_envBands > 1.0 && result.a < 1.0) {
    float alpha = 1.0-result.a, styled = envBand(alpha);
    result = vec4(result.rgb*(styled/alpha),1.0-styled);
  }
  return result;
}
vec3 envCardTexel(ivec2 p) {
  if (any(lessThan(p,ivec2(0))) || any(greaterThanEqual(p,ivec2(u_envCardSize)))) return vec3(0);
  return texelFetch(u_envCard,p,0).rgb;
}
float envLightTexel(ivec2 p) {
  if (any(lessThan(p,ivec2(0))) || any(greaterThanEqual(p,textureSize(u_envCloudLight,0)))) return 0.0;
  return texelFetch(u_envCloudLight,p,0).r;
}
float envCone(vec2 point) {
  vec2 xy = (point-u_envCloudDomain.xy)/u_envCloudDomain.zw - 0.5;
  ivec2 p = ivec2(floor(xy));
  vec2 f = fract(xy);
  return mix(mix(envLightTexel(p),envLightTexel(p+ivec2(1,0)),f.x),
    mix(envLightTexel(p+ivec2(0,1)),envLightTexel(p+ivec2(1)),f.x),f.y);
}
vec4 envCard(vec3 origin, vec3 ray, float start, float stop) {
  if (u_envCardSize == 0) return vec4(0,0,0,1);
  float d = -dot(ray,u_envCardNormal);
  if (d <= 1e-8) return vec4(0,0,0,1);
  vec3 delta = u_envCardFrame.xyz-origin;
  float plane = -dot(delta,u_envCardNormal)/d;
  vec3 point = plane*ray-delta;
  vec2 uv = (0.5 + 0.5*vec2(dot(point,u_envCardRight),dot(point,u_envCardUp))/u_envCardFrame.w)*float(u_envCardSize)-0.5;
  ivec2 p = ivec2(floor(uv));
  vec2 f = fract(uv);
  vec3 texel = mix(mix(envCardTexel(p),envCardTexel(p+ivec2(1,0)),f.x),
    mix(envCardTexel(p+ivec2(0,1)),envCardTexel(p+ivec2(1)),f.x),f.y);
  if (texel.x <= 0.0) return vec4(0,0,0,1);
  vec2 span = plane + texel.yz/(texel.x*d);
  vec2 clip = vec2(max(start,span.x),min(stop,span.y));
  if (clip.y <= clip.x) return vec4(0,0,0,1);
  float mass = texel.x*(clip.y-clip.x)/((span.y-span.x)*d);
  float coverage = 1.0-exp(-mass), hardness = u_envCloudHardness;
  if (hardness > 0.5) coverage = clamp(0.5+(coverage-0.5)*(1.0+(hardness-0.5)*13.0),0.0,1.0);
  else if (hardness < 0.5) coverage = mix(coverage,acos(1.0-2.0*coverage)/3.14159265359,1.0-2.0*hardness);
  float alpha = u_envCloudHeight.z*coverage;
  vec3 at = origin + ray * (0.5*(clip.x+clip.y));
  float brightness = 0.0, density = coverage;
  if (u_envCloudHeight.w > 0.0) {
    float y = clamp((at.y-u_envCloudHeight.x)/u_envCloudHeight.y,0.0,1.0);
    density = envCone(at.xz);
    float rim = pow(max(0.0,dot(u_envCloudSun,ray)),12.0);
    float up = envCone(at.xz+u_envCloudSun.xz*u_envCloudHeight.w);
    float relief = clamp(0.52 + 1.45*(density-up),0.0,1.0);
    float light = clamp(u_envCloudStyle.x + u_envCloudStyle.w *
      (u_envCloudStyle.y*(0.24+0.76*relief)*(0.48+0.52*y)+u_envCloudStyle.z*rim),0.0,1.0);
    brightness = light*(0.49+0.51*exp(-mass*0.58));
  }
  vec3 color = envPalette(u_envCloudRGB,u_envPaletteCard,vec4(0.0,at.y,density,brightness));
  color = mix(color,u_envCloudLightRGB,brightness);
  return vec4(alpha*color,1.0-alpha);
}
vec3 envMedia(vec3 color, vec2 pixel, vec2 size, float axialDepth) {
  if (u_envFogCount == 0 && u_envCardSize == 0) return color;
  bool ortho = u_envCamera.z > 0.5;
  vec2 screen = envScreen(pixel,size) * u_envCamera.xy;
  vec3 offset = envOffset(screen);
  float axial = ortho ? 1.0 : inversesqrt(1.0+dot(screen,screen));
  vec3 origin = ortho ? u_envEye+offset : u_envEye;
  vec3 ray = ortho ? -u_envBack : (offset-u_envBack)*axial;
  float stop = min(axialDepth,u_envHorizon)/axial;
  if (u_envCardSize > 0) {
    vec4 card = envCard(origin,ray,u_envCamera.w,stop);
    color = card.rgb + card.a*color;
  }
  if (u_envFogCount > 0) {
    vec4 fog = envFog(origin,ray,stop,u_envCamera.w/axial);
    color = fog.rgb + fog.a*color;
  }
  return color;
}
`;
}
var H = V(), ee = "\nuniform int u_envHasSky, u_envSkySplats, u_envSkyStart, u_envBackdropSampled;\nuniform highp sampler2D u_envBackdrop;\nuniform vec3 u_envBackground, u_envZenith, u_envSkyHorizon, u_envGround, u_envSun, u_envSunRGB;\nuniform vec3 u_envSunParams;\nvec3 envBackdrop(vec2 pixel, vec2 size) {\n  if (u_envBackdropSampled == 1) {\n    vec2 pos = pixel * vec2(textureSize(u_envBackdrop,0)) / size;\n    return texelFetch(u_envBackdrop,ivec2(pos),0).rgb;\n  }\n  if (u_envHasSky == 0) return u_envBackground;\n  vec3 ray = envSkyRay(pixel,size);\n  float y = ray.y, angle = dot(ray,u_envSun);\n  float fade = envBand(y > 0.0 ? sqrt(y) : clamp(-y*3.0,0.0,1.0));\n  float disk = y >= 0.0 ? 0.92*clamp((angle-u_envSunParams.x)/max(1e-8,u_envSunParams.y-u_envSunParams.x),0.0,1.0) : 0.0;\n  float glow = angle > 0.0 && y >= 0.0 ? 0.22*exp(-19.0*(1.0-angle)) : 0.0;\n  vec3 color = mix(mix(u_envSkyHorizon,y > 0.0 ? u_envZenith : u_envGround,fade),u_envSunRGB,\n    clamp((disk+glow)*u_envSunParams.z,0.0,1.0));\n  for (int i=0; i<u_envSkySplats; i++) {\n    int at = u_envSkyStart + i*4;\n    vec4 n = envRow(at), r = envRow(at+1), u = envRow(at+2), s = envRow(at+3);\n    float z = dot(ray,n.xyz);\n    if (z <= 0.0) continue;\n    vec2 q = vec2(dot(ray,r.xyz),dot(ray,u.xyz))/(z*vec2(r.w,u.w));\n    float d = dot(q,q);\n    if (d < 9.0) color = mix(color,s.rgb,n.w*exp(-0.5*d));\n  }\n  return color;\n}\n";
H + ee;
var te = (e = !1) => V(e) + ee, U = (e, t = !1) => `#version 300 es
precision highp float; precision highp int;
${V(t) + ee}
uniform vec2 u_envViewport;
layout(location=0) out vec4 scene;
layout(location=1) out vec4 depth;
${e ? "layout(location=2) out vec4 back; layout(location=3) out vec4 through;" : ""}
void main() {
  scene = vec4(envMedia(envBackdrop(gl_FragCoord.xy,u_envViewport),gl_FragCoord.xy,u_envViewport,u_envHorizon),1);
  depth = vec4(1,0,0,1);
  ${e ? "back = scene; through = vec4(1);" : ""}
}`, ne = (e, t, n) => `
${e ? "#define WATER_AIR_POCKETS" : ""}
uniform highp sampler2D u_waterData;
uniform int u_waterCount;
${t ? "#define WATER_LAYERED" : ""}
${n ? "#define WATER_ATLAS" : ""}
#if defined(WATER_LAYERED) || defined(WATER_ATLAS)
precision highp int;
#endif
#ifdef WATER_ATLAS
uniform int u_waterNodeCount, u_waterBodyBase, u_waterStyleBase;
vec4 waterTexel(int i) {
  int width = textureSize(u_waterData, 0).x;
  return texelFetch(u_waterData, ivec2(i % width, i / width), 0);
}
#else
#ifdef WATER_LAYERED
uniform int u_waterSpanMode[8];
#endif
uniform vec4 u_waterMin[8], u_waterMax[8], u_waterGrid[8];
uniform vec4 u_waterTint[8], u_waterLoss[8], u_waterHighlight[8];
#endif

struct WaterStyle {
  vec4 tint, loss, highlight;
  int index;
  #ifdef WATER_ATLAS
  vec4 deep, sediment, depth;
  #else
  float refraction;
  #endif
};
WaterStyle readWaterStyle(int i) {
  #ifdef WATER_ATLAS
  int at = u_waterStyleBase + i * 6;
  return WaterStyle(waterTexel(at), waterTexel(at + 1), waterTexel(at + 2), i,
    waterTexel(at + 3), waterTexel(at + 4), waterTexel(at + 5));
  #else
  return WaterStyle(u_waterTint[i], u_waterLoss[i], u_waterHighlight[i], i, u_waterMax[i].w);
  #endif
}
uniform mat4 u_waterView;
uniform vec3 u_waterEye;
uniform vec3 u_waterCamera;
uniform vec4 u_arrivalPlane;
uniform float u_waterTime, u_waterWindGain;

// Captures reuse the same body/style index in the column and atlas layouts.
uniform sampler2D u_waterReflections;
uniform int u_waterReflectionBase, u_waterReflectionCount;
uniform vec4 u_waterReflectionActive, u_waterReflectionHeights;
uniform vec2 u_waterReflectionGrid, u_waterReflectionViewport;
uniform mat4 u_waterProjection;
vec3 waterReflectedColor(WaterStyle style, vec3 p, vec2 ripple) {
  if (u_waterReflectionCount == 0) return style.highlight.rgb;
  int offset = u_waterReflectionBase + style.index;
  int width = textureSize(u_waterData, 0).x;
  vec3 binding = texelFetch(u_waterData, ivec2(offset % width, offset / width), 0).xyz;
  int slot = int(binding.x) - 1;
  if (slot < 0 || u_waterReflectionActive[slot] == 0.0 || abs(p.y-u_waterReflectionHeights[slot]) > 0.002) return style.highlight.rgb;
  vec4 clip = u_waterProjection * u_waterView * vec4(p, 1.0);
  vec2 uv = clip.xy / clip.w * 0.5 + 0.5;
  vec2 normal = (mat3(u_waterView) * vec3(ripple.x, 0.0, ripple.y)).xy;
  uv += binding.y * normal / u_waterReflectionViewport;
  vec2 tile = vec2(slot % 2, slot / 2), size = vec2(textureSize(u_waterReflections, 0)) / u_waterReflectionGrid;
  vec2 edge = 0.5 / size;
  vec2 at = (tile + clamp(uv, edge, 1.0-edge)) / u_waterReflectionGrid;
  vec3 reflected = texture(u_waterReflections, at).rgb;
  if (binding.z > 0.0) {
    vec2 blur = binding.z / u_waterReflectionViewport;
    reflected *= 0.4;
    reflected += texture(u_waterReflections,(tile+clamp(uv+vec2(blur.x,0),edge,1.0-edge))/u_waterReflectionGrid).rgb * 0.15;
    reflected += texture(u_waterReflections,(tile+clamp(uv-vec2(blur.x,0),edge,1.0-edge))/u_waterReflectionGrid).rgb * 0.15;
    reflected += texture(u_waterReflections,(tile+clamp(uv+vec2(0,blur.y),edge,1.0-edge))/u_waterReflectionGrid).rgb * 0.15;
    reflected += texture(u_waterReflections,(tile+clamp(uv-vec2(0,blur.y),edge,1.0-edge))/u_waterReflectionGrid).rgb * 0.15;
  }
  return reflected * style.highlight.rgb;
}

bool waterSlab(inout vec2 interval, float p, float d, float low, float high) {
  if (abs(d) < 1e-8) return p >= low && p < high;
  vec2 times = (vec2(low, high) - p) / d;
  interval = vec2(max(interval.x, min(times.x, times.y)), min(interval.y, max(times.x, times.y)));
  return interval.x < interval.y;
}

#ifdef WATER_AIR_POCKETS
uniform int u_waterAirCount;
uniform vec4 u_waterAirMin[8], u_waterAirMax[8];

bool airSlab(inout vec2 interval, float p, float d, float low, float high) {
  if (abs(d) < 1e-8) return p > low && p < high;
  return waterSlab(interval, p, d, low, high);
}

bool inAir(float t, vec2 air[8], int count) {
  for (int i = 0; i < 8; i++) {
    if (i >= count || air[i].x > t) break;
    if (t < air[i].y) return true;
  }
  return false;
}

float wetLength(vec2 wet, vec2 air[8], int count) {
  float remaining = wet.y - wet.x;
  float cursor = wet.x;
  for (int i = 0; i < 8; i++) {
    if (i >= count || air[i].x >= wet.y) break;
    float a = max(cursor, air[i].x), b = min(wet.y, air[i].y);
    if (b > a) {
      remaining -= b - a;
      cursor = b;
    }
  }
  return max(0.0, remaining);
}
#endif

void waterSurface(int body, vec3 p, vec3 ray, vec4 column, WaterStyle style, inout vec3 light, inout vec3 through,
                  inout vec3 mark) {
  vec4 highlight = style.highlight;
  vec2 flow = clamp(column.zw, vec2(-4.0), vec2(4.0));
  vec2 position = p.xz - flow * (u_waterTime * 0.25);
  vec2 phase = vec2(dot(position, vec2(3.1, 1.9)), dot(position, vec2(-1.7, 4.4))) +
    u_waterTime * vec2(2.0, -1.6);
  vec2 ripple = sin(phase);
  float grazing = pow(max(0.0, 1.0 - abs(ray.y)), 3.0);
  float foam = (1.0 - smoothstep(0.05, 0.4, column.y - column.x)) *
    smoothstep(0.08, 0.73, (ripple.x + ripple.y) * 0.5) * style.tint.w;
  float reflection = highlight.w * (0.16 + 0.84 * grazing);
  if (highlight.w < 0.0) {
    float f0 = -1.0 - highlight.w;
    reflection = f0 > 0.0 ? f0 + (1.0 - f0) * pow(1.0 - abs(ray.y), 5.0) : 0.0;
  }
  float opacity = clamp(reflection + foam, 0.0, 1.0);
  light += through * mix(waterReflectedColor(style, p, ripple * (1.0 + u_waterWindGain)), vec3(0.9, 0.98, 0.94), foam) * opacity;
  through *= 1.0 - opacity;
  #ifdef WATER_ATLAS
  float refraction = style.deep.w;
  #else
  float refraction = style.refraction;
  #endif
  if (mark.x == 0.0 && refraction > 0.0) {
    vec2 shift = round(ripple * refraction);
    mark = vec3(1.0, float(body) / 255.0, ((shift.x + 4.0) + 9.0 * (shift.y + 4.0)) / 255.0);
  }
}

void waterInterval(int body, vec3 eye, vec3 ray, float limit, float start, float end,
                   vec4 column, bool exposed, bool layered, WaterStyle style, vec2 depthBounds,
                   #ifdef WATER_AIR_POCKETS
                   vec2 air[8], int airCount,
                   #endif
                   inout vec3 light, inout vec3 through, inout vec3 mark,
                   inout float caustic, inout bool surfaceSeen) {
  vec2 wet = vec2(start, end);
  bool horizontal = abs(ray.y) < 1e-8;
  bool inside = (eye.y > column.x || (layered && eye.y == column.x)) && eye.y < column.y;
  if (horizontal ? inside : waterSlab(wet, eye.y, ray.y, column.x, column.y)) {
    float top = horizontal ? -1.0 : (column.y - eye.y) / ray.y;
    bool surface = exposed && (layered || !surfaceSeen) && top >= start && top <= end && top < limit;
    float endpointY = eye.y + ray.y * limit;
    bool endpoint = wet.y == limit && (!layered || (exposed && endpointY >= column.x && endpointY < column.y));
    float distance = wet.y - wet.x;
    #ifdef WATER_AIR_POCKETS
    surface = surface && !inAir(top, air, airCount);
    endpoint = endpoint && !inAir(limit, air, airCount);
    distance = wetLength(wet, air, airCount);
    #endif
    if (surface && ray.y < 0.0)
      waterSurface(body, eye + ray * top, ray, column, style, light, through, mark);
    vec3 transmission = exp(-style.loss.rgb * distance);
    vec3 tint = style.tint.rgb;
    #ifdef WATER_ATLAS
    vec3 center = eye + ray * ((wet.x + wet.y) * 0.5);
    float deep = smoothstep(style.depth.x, style.depth.y, depthBounds.y - center.y);
    tint = mix(tint, style.deep.rgb, deep);
    if (style.sediment.w > 0.0) {
      vec3 drift = vec3(column.z, 0.03, column.w) * u_waterTime;
      vec3 grainPoint = (center - drift) * style.depth.w;
      vec3 bucket = floor(grainPoint), offset = fract(grainPoint) - 0.5;
      float grain = fract(sin(dot(bucket, vec3(2.13, 3.71, 5.73))) * 17368.429);
      float fleck = 1.0 - smoothstep(0.01, 0.19, dot(offset, offset));
      float nearBed = exp(-max(0.0, center.y - depthBounds.x) / style.depth.z);
      float grains = style.sediment.w * (0.22 + 0.78 * fleck * smoothstep(0.65, 0.97, grain)) *
        nearBed * (1.0 - exp(-1.8 * distance));
      light += through * style.sediment.rgb * grains;
      through *= 1.0 - grains * 0.65;
    }
    #endif
    light += through * (1.0 - transmission) * tint;
    through *= transmission;
    if (surface && ray.y > 0.0)
      waterSurface(body, eye + ray * top, ray, column, style, light, through, mark);
    surfaceSeen = surfaceSeen || surface;
    if (endpoint) {
      vec3 p = eye + ray * limit;
      float depth = column.y - p.y;
      vec2 xz = p.xz - clamp(column.zw, vec2(-4.0), vec2(4.0)) * (u_waterTime * 0.17);
      float a = sin(dot(xz, vec2(7.1, 3.8)) + u_waterTime * 2.1);
      float b = sin(dot(xz, vec2(-5.2, 6.4)) - u_waterTime * 1.7);
      caustic = smoothstep(0.78, 0.98, abs(a * b)) * exp(-max(0.0, depth) * 1.2) * style.loss.w;
    }
  }
}

void waterColumns(int body, vec3 eye, vec3 ray, float limit,
                  #ifdef WATER_AIR_POCKETS
                  vec2 air[8], int airCount,
                  #endif
                  inout vec3 light, inout vec3 through,
                  inout vec3 mark, inout float caustic) {
  #ifdef WATER_ATLAS
  int at = u_waterBodyBase + body * 4;
  vec4 low = waterTexel(at), high = waterTexel(at + 1), grid = waterTexel(at + 2);
  int styleId = int(high.w);
  #ifdef WATER_LAYERED
  bool layered = waterTexel(at + 3).x > 0.5;
  #endif
  WaterStyle style = readWaterStyle(styleId);
  #else
  vec4 low = u_waterMin[body], high = u_waterMax[body], grid = u_waterGrid[body];
  #ifdef WATER_LAYERED
  bool layered = u_waterSpanMode[body] == 1;
  #endif
  WaterStyle style = readWaterStyle(body);
  #endif
  vec2 range = vec2(0.0, limit);
  if (!waterSlab(range, eye.x, ray.x, low.x, high.x) ||
      !waterSlab(range, eye.z, ray.z, low.z, high.z)) return;
  vec2 origin = (eye.xz - low.xz) / grid.xy, direction = ray.xz / grid.xy;
  if (abs(ray.x) < 1e-8) direction.x = 0.0;
  if (abs(ray.z) < 1e-8) direction.y = 0.0;
  vec2 crossing = origin + direction * range.x;
  ivec2 count = ivec2(grid.zw), stepCell = ivec2(sign(direction));
  ivec2 cell = ivec2(floor(crossing));
  if (stepCell.x < 0 && crossing.x == floor(crossing.x)) cell.x--;
  if (stepCell.y < 0 && crossing.y == floor(crossing.y)) cell.y--;
  cell = clamp(cell, ivec2(0), count - 1);
  vec2 face = vec2(cell) + max(vec2(stepCell), 0.0);
  vec2 next = vec2(direction.x == 0.0 ? 1e30 : (face.x - origin.x) / direction.x,
                   direction.y == 0.0 ? 1e30 : (face.y - origin.y) / direction.y);
  vec2 stride = vec2(direction.x == 0.0 ? 0.0 : abs(1.0 / direction.x),
                     direction.y == 0.0 ? 0.0 : abs(1.0 / direction.y));
  float start = range.x;
  bool surfaceSeen = false;
  for (int cellStep = 0; cellStep < 128; cellStep++) {
    float end = max(start, min(range.y, min(next.x, next.y)));
    #ifdef WATER_ATLAS
    vec4 column = waterTexel(int(low.w) + cell.y * count.x + cell.x);
    #else
    vec4 column = texelFetch(u_waterData, cell + ivec2(0, int(low.w)), 0);
    #endif
    if (end > start) {
      #ifdef WATER_LAYERED
      if (layered) {
        int first = int(column.x), length = int(column.y);
        for (int i = 0; i < 32; i++) {
          if (i >= length) break;
          int slot = ray.y < 0.0 ? length - 1 - i : i;
          #ifdef WATER_ATLAS
          int offset = first + slot * 2;
          vec4 span = waterTexel(offset), info = waterTexel(offset + 1);
          bool exposed = info.y > 0.5;
          WaterStyle localStyle = style;
          if (int(info.x) != styleId) localStyle = readWaterStyle(int(info.x));
          vec2 depthBounds = info.zw;
          #else
          int width = textureSize(u_waterData, 0).x, offset = first + slot;
          int flags = int(slot < 16 ? column.z : column.w);
          bool exposed = (flags & (1 << (slot % 16))) != 0;
          vec4 span = texelFetch(u_waterData, ivec2(offset % width, offset / width), 0);
          WaterStyle localStyle = style;
          vec2 depthBounds = span.xy;
          #endif
          waterInterval(body, eye, ray, limit, start, end, span, exposed, true, localStyle, depthBounds,
            #ifdef WATER_AIR_POCKETS
            air, airCount,
            #endif
            light, through, mark, caustic, surfaceSeen);
        }
      } else
      #endif
      if (column.y > column.x) waterInterval(body, eye, ray, limit, start, end, column, true, false, style, column.xy,
        #ifdef WATER_AIR_POCKETS
        air, airCount,
        #endif
        light, through, mark, caustic, surfaceSeen);
    }
    if (end >= range.y) break;
    bvec2 crossFace = lessThanEqual(next, vec2(end));
    if (crossFace.x) { cell.x += stepCell.x; next.x += stride.x; }
    if (crossFace.y) { cell.y += stepCell.y; next.y += stride.y; }
    if (any(lessThan(cell, ivec2(0))) || any(greaterThanEqual(cell, count))) break;
    start = end;
  }
}

vec3 waterPaint(vec3 color, vec2 pixel, vec2 size, float axial, out vec3 mark) {
  mark = vec3(0);
  if (u_waterCount == 0 || axial <= 0.0) return color;
  vec2 plane = (pixel * 2.0 / size - 1.0) * u_waterCamera.xy;
  bool ortho = u_waterCamera.z > 0.5;
  mat3 basis = transpose(mat3(u_waterView));
  vec3 eye = u_waterEye + (ortho ? basis * vec3(plane, 0.0) : vec3(0));
  vec3 direction = basis * vec3(ortho ? vec2(0) : plane, -1.0);
  float rayScale = length(direction);
  vec3 ray = direction / rayScale;
  float limit = axial * rayScale;
  float startSide = dot(u_arrivalPlane, vec4(eye, 1.0));
  if (startSide < 0.0) {
    float into = dot(u_arrivalPlane.xyz, ray);
    if (into <= 0.0) return color;
    float entrance = -startSide / into;
    if (entrance >= limit) return color;
    eye += ray * entrance;
    limit -= entrance;
  }
  #ifdef WATER_AIR_POCKETS
  vec2 air[8];
  int airCount = 0;
  for (int i = 0; i < 8; i++) {
    if (i >= u_waterAirCount) break;
    vec3 low = u_waterAirMin[i].xyz, high = u_waterAirMax[i].xyz;
    vec2 hit = vec2(0.0, 1e30);
    if (!airSlab(hit, eye.x, ray.x, low.x, high.x) || !airSlab(hit, eye.y, ray.y, low.y, high.y) ||
        !airSlab(hit, eye.z, ray.z, low.z, high.z) || hit.x >= limit) continue;
    int at = airCount;
    for (int j = 0; j < 8; j++) {
      if (at <= 0 || air[at - 1].x <= hit.x) break;
      air[at] = air[at - 1];
      at--;
    }
    air[at] = hit;
    airCount++;
  }
  #endif
  vec3 light = vec3(0), through = vec3(1);
  float caustic = 0.0;
  #ifdef WATER_ATLAS
  // Each hit uses a stackless BVH walk bounded by the next nearer entry.
  // Body interiors are disjoint, so its exit is the next search cursor.
  float cursor = 0.0;
  for (int j = 0; j < u_waterCount; j++) {
    int body = -1, node = 0;
    float first = limit, exit = limit;
    while (node < u_waterNodeCount) {
      vec4 low = waterTexel(node * 2), high = waterTexel(node * 2 + 1);
      vec2 hit = vec2(cursor, first);
      if (waterSlab(hit, eye.x, ray.x, low.x, high.x) &&
          waterSlab(hit, eye.y, ray.y, low.y, high.y) &&
          waterSlab(hit, eye.z, ray.z, low.z, high.z)) {
        if (high.w < 0.0) {
          node++;
          continue;
        }
        body = int(high.w);
        first = hit.x;
        // The search bound clips hit.y and must not clip the actual exit.
        vec2 extent = vec2(cursor, limit);
        waterSlab(extent, eye.x, ray.x, low.x, high.x);
        waterSlab(extent, eye.y, ray.y, low.y, high.y);
        waterSlab(extent, eye.z, ray.z, low.z, high.z);
        exit = extent.y;
      }
      node = int(low.w);
    }
    if (body < 0) break;
    waterColumns(body, eye, ray, limit,
      #ifdef WATER_AIR_POCKETS
      air, airCount,
      #endif
      light, through, mark, caustic);
    if (exit >= limit) break;
    cursor = exit;
  }
  #else
  float starts[8];
  for (int i = 0; i < 8; i++) {
    starts[i] = 1e30;
    if (i >= u_waterCount) break;
    vec3 low = u_waterMin[i].xyz, high = u_waterMax[i].xyz;
    vec2 hit = vec2(0.0, limit);
    if (waterSlab(hit, eye.x, ray.x, low.x, high.x) && waterSlab(hit, eye.y, ray.y, low.y, high.y) &&
        waterSlab(hit, eye.z, ray.z, low.z, high.z)) starts[i] = hit.x;
  }
  for (int j = 0; j < 8; j++) {
    int body = -1;
    float first = 1e30;
    for (int i = 0; i < 8; i++) {
      if (i >= u_waterCount) break;
      if (starts[i] < first) { body = i; first = starts[i]; }
    }
    if (body < 0) break;
    starts[body] = 1e30;
    waterColumns(body, eye, ray, limit,
      #ifdef WATER_AIR_POCKETS
      air, airCount,
      #endif
      light, through, mark, caustic);
  }
  #endif
  return light + through * mix(color, vec3(0.93, 1.0, 0.86), caustic);
}
`, re = (e, t, n, r, i, a = !1) => `#version 300 es
precision highp float;
${ne(e, t, n)}
uniform vec2 u_waterViewport;
uniform vec3 u_waterBackground;
${r ? te(a) : ""}
layout(location=0) out vec4 scene;
layout(location=1) out vec4 depth;
layout(location=2) out vec4 mask;
${i ? "layout(location=3) out vec4 back; layout(location=4) out vec4 through;" : ""}
void main() {
  vec3 mark;
  vec3 source = ${r ? "envBackdrop(gl_FragCoord.xy,u_waterViewport)" : "u_waterBackground"};
  vec3 color = waterPaint(source,gl_FragCoord.xy,u_waterViewport,400.0,mark);
  ${r ? "color = envMedia(color,gl_FragCoord.xy,u_waterViewport,u_envHorizon);" : ""}
  scene = vec4(color,1);
  depth = vec4(1, 0, 0, 1);
  mask = vec4(mark, 1);
  ${i ? "back = scene; through = vec4(1);" : ""}
}`;
// node_modules/@shapeshift-labs/ink-studio/src/webgl/resources.mjs
function ie(e) {
	let t = [];
	function n(n) {
		let r = e["create" + n]();
		if (!r) throw Error("Could not allocate WebGL " + n);
		return t.push(() => e["delete" + n](r)), r;
	}
	function r() {
		let t = n("Texture");
		return e.bindTexture(e.TEXTURE_2D, t), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), t;
	}
	function i(n, r) {
		let i = e.createProgram();
		if (!i) throw Error("Could not allocate WebGL program");
		let a = [];
		try {
			for (let [t, o] of [[e.VERTEX_SHADER, n], [e.FRAGMENT_SHADER, r]]) {
				let n = e.createShader(t);
				if (!n) throw Error("Could not allocate WebGL shader");
				if (a.push(n), e.shaderSource(n, o), e.compileShader(n), !e.getShaderParameter(n, e.COMPILE_STATUS)) throw Error("Ink Studio shader compilation failed: " + e.getShaderInfoLog(n));
				e.attachShader(i, n);
			}
			if (e.linkProgram(i), !e.getProgramParameter(i, e.LINK_STATUS)) throw Error("Ink Studio program linking failed: " + e.getProgramInfoLog(i));
			let o = Object.create(null), s = Object.create(null), c = {
				[e.FLOAT]: "uniform1f",
				[e.INT]: "uniform1i",
				[e.SAMPLER_2D]: "uniform1i",
				[e.SAMPLER_3D]: "uniform1i",
				[e.SAMPLER_2D_ARRAY]: "uniform1i",
				[e.INT_SAMPLER_2D]: "uniform1i",
				[e.UNSIGNED_INT_SAMPLER_2D]: "uniform1i",
				[e.FLOAT_VEC2]: "uniform2fv",
				[e.FLOAT_VEC3]: "uniform3fv",
				[e.FLOAT_VEC4]: "uniform4fv",
				[e.BOOL]: "uniform1i",
				[e.BOOL_VEC2]: "uniform2iv",
				[e.BOOL_VEC3]: "uniform3iv",
				[e.BOOL_VEC4]: "uniform4iv",
				[e.INT_VEC2]: "uniform2iv",
				[e.INT_VEC3]: "uniform3iv",
				[e.INT_VEC4]: "uniform4iv",
				[e.UNSIGNED_INT]: "uniform1ui",
				[e.UNSIGNED_INT_VEC2]: "uniform2uiv",
				[e.UNSIGNED_INT_VEC3]: "uniform3uiv",
				[e.UNSIGNED_INT_VEC4]: "uniform4uiv",
				[e.FLOAT_MAT2]: "uniformMatrix2fv",
				[e.FLOAT_MAT3]: "uniformMatrix3fv",
				[e.FLOAT_MAT4]: "uniformMatrix4fv",
				[e.FLOAT_MAT2x3]: "uniformMatrix2x3fv",
				[e.FLOAT_MAT2x4]: "uniformMatrix2x4fv",
				[e.FLOAT_MAT3x2]: "uniformMatrix3x2fv",
				[e.FLOAT_MAT3x4]: "uniformMatrix3x4fv",
				[e.FLOAT_MAT4x2]: "uniformMatrix4x2fv",
				[e.FLOAT_MAT4x3]: "uniformMatrix4x3fv"
			};
			for (let t = 0, n = e.getProgramParameter(i, e.ACTIVE_UNIFORMS); t < n; t++) {
				let n = e.getActiveUniform(i, t), r = n.name.replace(/\[0\]$/, ""), a = o[r] = e.getUniformLocation(i, r), l = c[n.type];
				n.size > 1 && [
					"uniform1f",
					"uniform1i",
					"uniform1ui"
				].includes(l) && (l += "v"), l?.startsWith("uniformMatrix") ? s[r] = (t) => e[l](a, !1, t) : l && (s[r] = (t) => e[l](a, t));
			}
			return t.push(() => e.deleteProgram(i)), {
				p: i,
				u: o,
				set(e) {
					for (let t of Object.keys(e)) s[t]?.(e[t]);
				}
			};
		} catch (t) {
			throw e.deleteProgram(i), t;
		} finally {
			for (let t of a) e.deleteShader(t);
		}
	}
	return {
		allocate: n,
		texture: r,
		program: i,
		dispose() {
			for (let e of t.splice(0).reverse()) e();
		}
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/surfaces.mjs
function W(e, { updatesSince: t, geometryUpdatesSince: n, cutaway: r } = {}) {
	let i = ie(e);
	try {
		let a = /* @__PURE__ */ new Map();
		function o(e, t, n, o) {
			let s = [
				e?.airPockets,
				e?.layered,
				e?.atlas,
				!!e,
				!!t,
				!!n,
				!!o?.media,
				!!o?.lit
			].join("/");
			if (a.has(s)) return a.get(s);
			let c = i.program(`#version 300 es
precision highp float;
layout(location=0) in vec3 a_point;
layout(location=1) in vec2 a_texel;
uniform mat4 u_view,u_proj;
out vec2 v_texel;
out vec3 v_world;
${n ? "layout(location=2)in vec2 a_light;out vec2 v_light;" : ""}
out float v_depth;
out vec3 v_camera;
void main(){
  vec4 p=u_view*vec4(a_point,1.0);
  ${n ? "v_light=a_light;" : ""}
  v_texel=a_texel;v_world=a_point;v_depth=-p.z;v_camera=p.xyz;
  gl_Position=u_proj*p;
}`, `#version 300 es
precision highp float;
uniform sampler2D u_atlas;
uniform vec4 u_range,u_splatPlane;
${e ? ne(e.airPockets, e.layered, e.atlas) : "uniform vec4 u_arrivalPlane;"}
uniform vec2 u_surfaceViewport;
uniform vec3 u_fog;
uniform bool u_index, u_graphDepth;
${t ? r : ""}
${o?.media ? V(o.lit) : ""}
${n ? g : ""}
${n ? "uniform highp sampler2DArray u_surfaceLit;uniform int u_surfaceLightCount;in vec2 v_light;" : ""}
in vec2 v_texel;
in vec3 v_world;
in float v_depth;
in vec3 v_camera;
layout(location=0) out vec4 color;
layout(location=1) out vec4 depth;
layout(location=2) out vec4 water;
void main(){
  vec4 ink=texelFetch(u_atlas,ivec2(v_texel),0);
  if(ink.a<.5||dot(u_arrivalPlane,vec4(v_world,1.0))<0.0||dot(u_splatPlane,vec4(v_camera,1.0))<0.0)discard;
  ${t ? "float margin=sectionMargin(v_world,v_depth); if(margin<0.0)discard;" : ""}
  float d=clamp((v_depth-u_range.x)/(u_range.y-u_range.x),0.0,1.0);
  float fog=u_range.z<1.0?smoothstep(u_range.z,1.0,d)*u_range.w:0.0;
  vec3 mark=vec3(0.0), rgb=ink.rgb;
  ${n ? "if(!u_index){vec3 irradiance=vec3(0);for(int i=0;i<32;i++){if(i>=u_surfaceLightCount)break;irradiance+=texelFetch(u_surfaceLit,ivec3(ivec2(v_light),i),0).rgb;}rgb=eSRGB(min(vec3(1),eLinear(rgb)*(vec3(1)+irradiance)));}" : ""}
  ${e ? "if(!u_index)rgb=waterPaint(rgb,gl_FragCoord.xy,u_surfaceViewport,v_depth,mark);" : ""}
  ${o?.media ? "if(!u_index)rgb=envMedia(rgb,gl_FragCoord.xy,u_surfaceViewport,v_depth);" : ""}
  rgb=mix(rgb,u_fog,fog);
  ${t ? "rgb=mix(rgb,u_sectionEdge.rgb,sectionInk(margin));" : ""}
  color=u_index?vec4(0.0):vec4(rgb,1.0);
  depth=vec4(d,0.0,0.0,1.0);water=vec4(mark,1.0);
  if(u_index&&u_graphDepth){float z=round(d*16777215.0);water=vec4(mod(z,256.0),mod(floor(z/256.0),256.0),floor(z/65536.0),255.0)/255.0;}
}`);
			return a.set(s, c), c;
		}
		let s = i.allocate("VertexArray"), c = i.allocate("Buffer"), l = i.texture();
		e.bindVertexArray(s), e.bindBuffer(e.ARRAY_BUFFER, c), e.enableVertexAttribArray(0), e.vertexAttribPointer(0, 3, e.FLOAT, !1, 20, 0), e.enableVertexAttribArray(1), e.vertexAttribPointer(1, 2, e.FLOAT, !1, 20, 12), e.bindVertexArray(null);
		let u, d, f = -1, p = -1, m = 0, h = 0, _ = !1, v = /* @__PURE__ */ new Uint8Array(), y = {
			textureBytes: 0,
			geometryBytes: 0
		};
		function b(r) {
			if (y.textureBytes = 0, y.geometryBytes = 0, _) throw Error("Surface pipeline has been disposed");
			let i = r?.revision ?? 0, a = r?.geometryRevision ?? 0;
			if (u === r && f === i && p === a && d === r.vertices && m === r.width && h === r.height) return;
			if (!r || !(r.vertices instanceof Float32Array) || r.vertices.length % 15 || !Number.isSafeInteger(r.width) || r.width < 1 || !Number.isSafeInteger(r.height) || r.height < 1 || !(r.pixels instanceof Uint8Array) || r.pixels.length !== r.width * r.height * 4 || !Number.isSafeInteger(i) || i < 0 || !Number.isSafeInteger(a) || a < 0) throw RangeError("Invalid sprite surface atlas");
			if (Math.max(r.width, r.height) > e.getParameter(e.MAX_TEXTURE_SIZE)) throw RangeError("Surface atlas exceeds GPU size limit");
			let o = u !== r || m !== r.width || h !== r.height;
			if (o || d !== r.vertices) {
				if (!r.vertices.every(Number.isFinite)) throw RangeError("Invalid sprite surface geometry");
				e.bindBuffer(e.ARRAY_BUFFER, c), e.bufferData(e.ARRAY_BUFFER, r.vertices, a ? e.DYNAMIC_DRAW : e.STATIC_DRAW), y.geometryBytes = r.vertices.byteLength;
			}
			if (!o && d === r.vertices && p !== a) {
				let t = n?.(r, p), i = t?.length ? Math.min(...t.map((e) => e.first)) : 0, a = t?.length ? Math.max(...t.map((e) => e.first + e.count)) : r.vertices.length / 5, o = r.vertices.subarray(i * 5, a * 5);
				if (!o.every(Number.isFinite)) throw RangeError("Invalid sprite surface geometry");
				e.bindBuffer(e.ARRAY_BUFFER, c), e.bufferSubData(e.ARRAY_BUFFER, i * 20, o), y.geometryBytes = o.byteLength;
			}
			if (e.activeTexture(e.TEXTURE0 + 6), e.bindTexture(e.TEXTURE_2D, l), o) e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, r.width, r.height, 0, e.RGBA, e.UNSIGNED_BYTE, r.pixels), y.textureBytes = r.pixels.byteLength;
			else if (f !== i) {
				let n = t?.(r, f), i = 0, a = 0, o = r.width, s = r.height;
				n?.length && (i = Math.min(...n.map((e) => e.x)), a = Math.min(...n.map((e) => e.y)), o = Math.max(...n.map((e) => e.x + e.width)) - i, s = Math.max(...n.map((e) => e.y + e.height)) - a);
				let c = o * s * 4;
				v.length < c && (v = new Uint8Array(c));
				for (let e = 0; e < s; e++) v.set(r.pixels.subarray(((a + e) * r.width + i) * 4, ((a + e) * r.width + i + o) * 4), e * o * 4);
				e.texSubImage2D(e.TEXTURE_2D, 0, i, a, o, s, e.RGBA, e.UNSIGNED_BYTE, v.subarray(0, c)), y.textureBytes = c;
			}
			u = r, d = r.vertices, f = i, p = a, m = r.width, h = r.height;
		}
		let x, S, C, w = [], T, E, D, O, k, A, j, M, N = i.allocate("VertexArray"), P = i.allocate("Buffer"), F = i.allocate("Buffer");
		e.bindVertexArray(s), e.bindBuffer(e.ARRAY_BUFFER, F), e.enableVertexAttribArray(2), e.vertexAttribPointer(2, 2, e.FLOAT, !1, 8, 0), e.bindVertexArray(N), e.bindBuffer(e.ARRAY_BUFFER, P);
		for (let t = 0; t < 3; t++) e.enableVertexAttribArray(t), e.vertexAttribPointer(t, 3, e.FLOAT, !1, 36, t * 12), e.vertexAttribDivisor(t, 1);
		e.bindVertexArray(null);
		function I(t, n, r) {
			let a = n.frame.emitterSurfaceResolution ?? 16;
			if (!Number.isSafeInteger(a) || a < 4 || a > 64) throw RangeError("Surface light resolution must be 4..64");
			let o = Math.min(64, Math.floor(e.getParameter(e.MAX_TEXTURE_SIZE) / a));
			if (O !== t.vertices || k !== (t.geometryRevision ?? 0) || M !== a) {
				M = a, j = t.vertices.length / 15, A = new Float32Array(j * 9);
				let n = new Float32Array(j * 6);
				for (let e = 0; e < j; e++) {
					let r = e % o * a, i = Math.floor(e / o) * a;
					for (let o = 0; o < 3; o++) A.set(t.vertices.subarray(e * 15 + o * 5, e * 15 + o * 5 + 3), e * 9 + o * 3), n.set([r + .5 + (o === 1 ? a - 1 : 0), i + .5 + (o === 2 ? a - 1 : 0)], e * 6 + o * 2);
				}
				e.bindBuffer(e.ARRAY_BUFFER, P), e.bufferData(e.ARRAY_BUFFER, A, e.DYNAMIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, F), e.bufferData(e.ARRAY_BUFFER, n, e.DYNAMIC_DRAW), O = t.vertices, k = t.geometryRevision ?? 0;
			}
			let s = [
				0,
				1,
				2
			].map((e) => -(r[e * 4] * r[12] + r[e * 4 + 1] * r[13] + r[e * 4 + 2] * r[14])), c = 0;
			for (let e = 0; e < A.length; e += 9) {
				let t = A.subarray(e, e + 3), n = [
					0,
					1,
					2
				].map((n) => A[e + 3 + n] - t[n]), r = [
					0,
					1,
					2
				].map((n) => A[e + 6 + n] - t[n]), i = [
					n[1] * r[2] - n[2] * r[1],
					n[2] * r[0] - n[0] * r[2],
					n[0] * r[1] - n[1] * r[0]
				];
				c = Math.imul(c, 31) + +(i.reduce((e, n, r) => e + n * (s[r] - t[r]), 0) < 0) | 0;
			}
			let l = [
				O,
				k,
				n.shadow,
				a
			], u = (e, t) => e?.length === t.length && t.every((t, n) => t === e[n]);
			if (u(T, l) && u(E, n.rows) && c === D) {
				e.activeTexture(e.TEXTURE0 + 24), e.bindTexture(e.TEXTURE_2D_ARRAY, S);
				return;
			}
			let d = !u(T, l) || c !== D, f = E;
			if (T = l, E = n.rows.slice(), D = c, !S) {
				S = i.allocate("Texture"), e.activeTexture(e.TEXTURE0 + 24), e.bindTexture(e.TEXTURE_2D_ARRAY, S);
				for (let t of [e.TEXTURE_MIN_FILTER, e.TEXTURE_MAG_FILTER]) e.texParameteri(e.TEXTURE_2D_ARRAY, t, e.NEAREST);
				for (let t of [e.TEXTURE_WRAP_S, e.TEXTURE_WRAP_T]) e.texParameteri(e.TEXTURE_2D_ARRAY, t, e.CLAMP_TO_EDGE);
			}
			C ??= i.allocate("Framebuffer"), e.activeTexture(e.TEXTURE0 + 24), e.bindTexture(e.TEXTURE_2D_ARRAY, S);
			let p = [o * a, Math.max(1, Math.ceil(j / o)) * a];
			if (p[1] > e.getParameter(e.MAX_TEXTURE_SIZE)) throw RangeError("Surface lighting charts exceed the GPU atlas budget");
			if (w[0] !== p[0] || w[1] !== p[1] || w[2] !== n.count) {
				if (p[0] * p[1] * n.count > 16777216) throw RangeError("Surface lighting cache exceeds its texel budget");
				e.texImage3D(e.TEXTURE_2D_ARRAY, 0, e.RGBA16F, ...p, Math.max(1, n.count), 0, e.RGBA, e.FLOAT, null), w = [...p, n.count], d = !0;
			}
			if (e.bindFramebuffer(e.FRAMEBUFFER, C), e.framebufferTextureLayer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, S, 0, 0), e.drawBuffers([e.COLOR_ATTACHMENT0]), e.checkFramebufferStatus(e.FRAMEBUFFER) !== e.FRAMEBUFFER_COMPLETE) throw Error("Surface lightmap target is incomplete");
			x ??= i.program("#version 300 es\nprecision highp float;layout(location=0)in vec3 a_a;layout(location=1)in vec3 a_b;layout(location=2)in vec3 a_c;uniform vec2 u_lightSize;uniform float u_lightResolution;uniform int u_lightColumns;uniform vec3 u_surfaceEye;out vec3 v_world;flat out vec3 v_normal;void main(){vec2 q=vec2(gl_VertexID&1,gl_VertexID>>1);vec2 uv=(q*u_lightResolution-.5)/(u_lightResolution-1.0);v_world=a_a+(a_b-a_a)*uv.x+(a_c-a_a)*uv.y;v_normal=normalize(cross(a_b-a_a,a_c-a_a));if(dot(v_normal,u_surfaceEye-a_a)<0.0)v_normal=-v_normal;vec2 tile=vec2(gl_InstanceID%u_lightColumns,gl_InstanceID/u_lightColumns)*u_lightResolution;gl_Position=vec4((tile+q*u_lightResolution)/u_lightSize*2.0-1.0,0,1);}", `#version 300 es
precision highp float;${g}
in vec3 v_world;flat in vec3 v_normal;out vec4 color;void main(){color=vec4(eLighting(v_world,v_normal,false,vec3(0)),1);}`), e.disable(e.BLEND), e.disable(e.DEPTH_TEST), e.viewport(0, 0, w[0], w[1]), e.useProgram(x.p), x.set({
				...n.uniforms,
				u_lightSize: w.slice(0, 2),
				u_lightColumns: o,
				u_lightResolution: a,
				u_surfaceEye: s
			}), e.bindVertexArray(N);
			for (let t = 0; t < n.count; t++) (d || !u(f?.subarray(t * 44, t * 44 + 44), n.rows.subarray(t * 44, t * 44 + 44))) && (e.framebufferTextureLayer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, S, 0, t), e.clearBufferfv(e.COLOR, 0, [
				0,
				0,
				0,
				0
			]), x.set({ u_ePick: t + 1 }), e.drawArraysInstanced(e.TRIANGLE_STRIP, 0, 4, j));
		}
		function L(t, { lighting: n, environment: r, view: i, projection: a, range: c, fog: d, index: f = !1, graphDepth: p = !1, arrivalPlane: m = [
			0,
			0,
			0,
			0
		], clip: h = [
			0,
			0,
			0,
			0
		], water: g, wet: _, width: v = 1, height: y = 1, section: x }) {
			if (b(t), n?.active && !f) {
				let r = e.getParameter(e.DRAW_FRAMEBUFFER_BINDING), a = e.getParameter(e.VIEWPORT), o = e.isEnabled(e.BLEND), s = e.isEnabled(e.DEPTH_TEST);
				I(t, n, i), e.bindFramebuffer(e.FRAMEBUFFER, r), e.viewport(...a), o ? e.enable(e.BLEND) : e.disable(e.BLEND), s ? e.enable(e.DEPTH_TEST) : e.disable(e.DEPTH_TEST);
			}
			e.activeTexture(e.TEXTURE0 + 6), e.bindTexture(e.TEXTURE_2D, l);
			let S = o(_, x, !f && n?.active, r);
			e.useProgram(S.p), S.set({
				u_view: i,
				u_proj: a,
				u_range: c,
				u_fog: d,
				u_atlas: 6,
				u_surfaceLightCount: n?.count ?? 0,
				u_surfaceLit: 24,
				u_index: +f,
				u_graphDepth: p,
				u_arrivalPlane: m,
				u_splatPlane: h,
				u_surfaceViewport: [v, y],
				...g,
				...x,
				...r?.uniforms,
				...n?.uniforms
			}), e.bindVertexArray(s), !f && n?.active ? e.enableVertexAttribArray(2) : e.disableVertexAttribArray(2), e.drawArrays(e.TRIANGLES, 0, u.vertices.length / 5), e.activeTexture(e.TEXTURE0);
		}
		return {
			draw: L,
			get stats() {
				return { ...y };
			},
			dispose() {
				_ || (_ = !0, i.dispose());
			}
		};
	} catch (e) {
		throw i.dispose(), e;
	}
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/targets.mjs
function ae(e, t) {
	let n = (t, n) => {
		e.activeTexture(e.TEXTURE0 + t), e.bindTexture(e.TEXTURE_2D, n);
	};
	function r(r = 1, { integer: i = !1, depth: a = !1 } = {}) {
		let o = t.allocate("Framebuffer"), s = Array.from({ length: r }, () => t.texture()), c = a ? t.allocate("Renderbuffer") : null;
		e.bindFramebuffer(e.FRAMEBUFFER, o);
		let l = s.map((t, n) => {
			let r = e.COLOR_ATTACHMENT0 + n;
			return e.framebufferTexture2D(e.FRAMEBUFFER, r, e.TEXTURE_2D, t, 0), r;
		});
		e.drawBuffers(l), c && (e.bindRenderbuffer(e.RENDERBUFFER, c), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.RENDERBUFFER, c)), e.bindFramebuffer(e.FRAMEBUFFER, null);
		let u = 0, d = 0;
		return {
			framebuffer: o,
			textures: s,
			get width() {
				return u;
			},
			get height() {
				return d;
			},
			ensureDepth() {
				c || (c = t.allocate("Renderbuffer"), e.bindRenderbuffer(e.RENDERBUFFER, c), u && d && e.renderbufferStorage(e.RENDERBUFFER, e.DEPTH_COMPONENT16, u, d), e.bindFramebuffer(e.FRAMEBUFFER, o), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.RENDERBUFFER, c));
			},
			resize(t, r) {
				if (u !== t || d !== r) {
					for (let a of s) n(0, a), i ? e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32I, t, r, 0, e.RGBA_INTEGER, e.INT, null) : e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, t, r, 0, e.RGBA, e.UNSIGNED_BYTE, null);
					if (c && (e.bindRenderbuffer(e.RENDERBUFFER, c), e.renderbufferStorage(e.RENDERBUFFER, e.DEPTH_COMPONENT16, t, r)), e.bindFramebuffer(e.FRAMEBUFFER, o), e.checkFramebufferStatus(e.FRAMEBUFFER) !== e.FRAMEBUFFER_COMPLETE) throw Error("Ink Studio could not build a complete WebGL render target");
					u = t, d = r;
				}
			}
		};
	}
	function i(r, i, a) {
		let o = t.texture(), s = r * 4, c = new Float32Array(s), l = 0;
		function u(t, u = t.length, d) {
			let f = Math.max(1, Math.ceil(u / s));
			if (f > a) throw RangeError("Ink Studio data exceeds the WebGL texture size limit");
			n(i, o), f !== l && (e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, r, f, 0, e.RGBA, e.FLOAT, null), l = f, d = void 0);
			let p = Math.floor(u / s);
			if (d !== void 0) for (let n of d) {
				let i = n * s;
				n < p ? e.texSubImage2D(e.TEXTURE_2D, 0, 0, n, r, 1, e.RGBA, e.FLOAT, t, i) : (c.fill(0), c.set(t.subarray(i, u)), e.texSubImage2D(e.TEXTURE_2D, 0, 0, n, r, 1, e.RGBA, e.FLOAT, c));
			}
			else p && e.texSubImage2D(e.TEXTURE_2D, 0, 0, 0, r, p, e.RGBA, e.FLOAT, t), p < f && (c.fill(0), c.set(t.subarray(p * s, u)), e.texSubImage2D(e.TEXTURE_2D, 0, 0, p, r, 1, e.RGBA, e.FLOAT, c));
		}
		return {
			bind: (e = i) => n(e, o),
			upload: u
		};
	}
	return {
		target: r,
		table: i,
		textureUnit: n
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/contribution-shaders.mjs
var oe = "\nfloat contributionAlpha(float power, float density, bool solid) {\n  if (power > 0.0 || power < -4.5) return 0.0;\n  float g = density * exp(power);\n  return solid ? 0.99 * smoothstep(0.38, 0.62, g) : min(0.99, g);\n}", se = (e) => e?.glsl ?? oe, G = "\nuniform highp sampler2D u_constraintSlots, u_constraintRows;\nuniform int u_constraintDefault, u_constraintMap, u_constraintLab, u_constraintPairs;\nint contributionSlot(int index) {\n  int span = textureSize(u_constraintSlots, 0).x * 4;\n  int slot = int(texelFetch(u_constraintSlots, ivec2((index % span) / 4, index / span), 0)[index & 3]);\n  return slot > 0 ? slot : u_constraintDefault;\n}\n", ce = "\nuniform int u_constraintMask;\nvec4 maskSettings(int slot) { return texelFetch(u_constraintRows, ivec2(u_constraintMask, slot - 1), 0); }\n", K = (e) => `
flat LOOK_IO vec4 v_maskCenter;
flat LOOK_IO vec3 v_maskNormal;
flat LOOK_IO vec3 v_maskAxis;
${e ? "flat LOOK_IO vec4 v_maskSecond;" : ""}
`, le = (e) => `
uniform vec2 u_lookViewport;
uniform mat4 u_lookProjection;
uniform float u_lookOrtho, u_lookRadius;
${e ? "uniform highp sampler2D u_maskTextures; uniform float u_maskTime;" : ""}
float maskAt(int slot) {
  vec4 settings = maskSettings(slot);
  if (settings.x == 0.0) return 1.0;
  vec2 screen = (gl_FragCoord.xy * 2.0 / u_lookViewport - 1.0) /
    vec2(u_lookProjection[0][0], u_lookProjection[1][1]);
  vec3 center = v_maskCenter.xyz;
  vec3 ray = vec3(u_lookOrtho > 0.5 ? vec2(0.0) : screen, -1.0);
  vec3 at = vec3(screen * (u_lookOrtho > 0.5 ? 1.0 : -center.z), center.z);
  float facing = dot(v_maskNormal, ray);
  vec3 offset = vec3(0.0);
  if (abs(facing) > 1e-7) {
    float advance = dot(v_maskNormal, center - at) / facing;
    if (abs(advance) <= u_lookRadius && -center.z + advance > 0.0)
      offset = at + advance * ray - center;
  }
  vec4 limits = texelFetch(u_constraintRows, ivec2(u_constraintMask + 2, slot - 1), 0);
  float scalar = v_maskCenter.w + dot(v_maskAxis, offset);
  ${e ? "if (settings.x == 2.0) {\n    vec2 uv = vec2(scalar,v_maskSecond.w + dot(v_maskSecond.xyz,offset));\n    if (limits.w == 0.0 && (any(lessThan(uv,vec2(0))) || any(greaterThanEqual(uv,vec2(1))))) scalar=0.0;\n    else {\n      vec4 dim=texelFetch(u_constraintRows,ivec2(u_constraintMask+4,slot-1),0);\n      bool repeat=texelFetch(u_constraintRows,ivec2(u_constraintMask+5,slot-1),0).x > 0.0;\n      int frame=int(max(0.0,floor(u_maskTime*dim.w)));\n      frame=repeat ? frame%int(dim.z) : min(frame,int(dim.z)-1);\n      ivec2 pixel=ivec2(floor(fract(uv)*dim.xy));\n      int at=int(limits.z)+(frame*int(dim.y)+pixel.y)*int(dim.x)+pixel.x;\n      int width=textureSize(u_maskTextures,0).x;\n      scalar=texelFetch(u_maskTextures,ivec2(at%width,at/width),0).r;\n    }\n  }" : ""}
  float f = clamp((scalar - limits.x) * limits.y, 0.0, 1.0);
  if (settings.z == 1.0) f = f * f * (3.0 - 2.0 * f);
  if (settings.z == 2.0) f = step(1.0, f);
  return settings.w > 0.0 ? 1.0 - f : f;
}
`, ue = (e) => `
uniform highp sampler2D u_lookSites;
void placeMask(int index, int slot, vec3 posed, vec3 viewCenter, mat3 worldToRest, mat3 view) {
  v_maskCenter = vec4(viewCenter, 0.0);
  v_maskNormal = vec3(0.0);
  v_maskAxis = vec3(0.0);
  ${e ? "v_maskSecond = vec4(0.0);" : ""}
  if (slot == 0) return;
  vec4 settings = maskSettings(slot);
  if (settings.x == 0.0) return;
  ivec2 uv = ivec2((index & 511) * 2, index >> 9);
  vec3 normal = texelFetch(u_lookSites, uv, 0).xyz;
  vec3 rest = texelFetch(u_lookSites, uv + ivec2(1,0), 0).xyz;
  vec4 axis = texelFetch(u_constraintRows, ivec2(u_constraintMask + 1, slot - 1), 0);
  v_maskNormal = view * transpose(worldToRest) * normal;
  v_maskAxis = view * (settings.y > 0.0 ? transpose(worldToRest) * axis.xyz : axis.xyz);
  vec3 point=settings.y > 0.0 ? rest : posed;
  v_maskCenter.w = dot(point, axis.xyz) + axis.w;
  ${e ? "if (settings.x == 2.0) {\n    vec4 second=texelFetch(u_constraintRows,ivec2(u_constraintMask+3,slot-1),0);\n    v_maskSecond=vec4(view*(settings.y > 0.0 ? transpose(worldToRest)*second.xyz : second.xyz),dot(point,second.xyz)+second.w);\n  }" : ""}
}
`, de = "\n    float m = floor(maskAt(v_policySlot) * 65535.0 + 0.5);\n    od = vec4(mod(m,256.0), floor(m/256.0), 0.0, 255.0) / 255.0;\n", fe = "\nvec3 axialPosition(vec2 pixel, float axial, vec2 size) {\n  vec2 screen = (pixel * 2.0 / size - 1.0) / vec2(u_proj[0][0], u_proj[1][1]);\n  return vec3(screen * (u_ortho > 0.5 ? 1.0 : axial), -axial);\n}", pe = "\nfloat pixelStyleThreshold(int mode, ivec2 p) {\n  const float ordered[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);\n  if (mode == 1) return (ordered[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0;\n  if (mode == 2) return ((p.x + p.y) & 1) != 0 ? 0.75 : 0.25;\n  return (float((p.x + p.y) & 3) + 0.5) / 4.0;\n}\n", me = "\nuniform highp sampler2D u_relight;\nvec4 relightAt(int row) { return texelFetch(u_relight, ivec2(row & 511, row >> 9), 0); }\n";
function he(e, t, { water: n = !1, airPockets: r = !1, layered: i = !1, atlas: a = !1, portal: o = !1, instances: s = !1, contributions: c = !1, masked: l = !1, textured: u = !1, layeredGlass: d = !1, coverageRules: f, materialStyles: p = !1, environment: m = !1, emitterFog: h = !1, relighting: g = !1, optical: _ = !1, stableDetail: v, cutaway: y, airflow: b } = {}) {
	let x = f?.coverageStride ?? 4, S = f?.continuousCoverage ?? 1, C = f?.softCoverage ?? 2, w = f?.nonSurface ?? 2559, T = f?.continuousVariance ?? .25, E = f?.continuousLow ?? .16, D = f?.continuousHigh ?? .3;
	return {
		vertex: `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D u_data;
uniform mat4 u_view, u_proj;
uniform bool u_geometryDepth;
uniform vec2 u_viewport;
uniform float u_focal, u_time, u_scale, u_snap, u_dilate, u_near, u_ortho, u_idx;
uniform bool u_motionCadence, u_motionWind;
uniform vec4 u_effectTimes, u_effectWind;
uniform vec2 u_waterAndRainTime, u_rainWind; uniform float u_emissiveWind;
${b?.glsl ?? ""}
uniform float u_paintMarker; uniform int u_afterimageStart; flat out int v_paint;
uniform int u_splatCoverage; uniform float u_materialGridScale; flat out int v_coverage;
${v ? `uniform vec2 u_detailTexture, u_detailGeometry;
flat out float v_detailGeometry, v_detailTexture;
${v.glsl}` : ""}
${g ? me + "flat out vec4 v_relight;" : ""}
${d ? "uniform float u_glassTolerance; flat out float v_glassNearDepth;" : ""}
${_ ? "uniform highp sampler2D u_optical;\nflat out vec4 v_optical;\nflat out vec3 v_scatterTint, v_reflectTint;\nflat out float v_opticalFog;" : ""}
uniform vec4 u_actor; uniform float u_reveal, u_fade; uniform vec3 u_camdir; uniform ivec2 u_dyn;
uniform vec4 u_rev, u_rbox;   // the lit part of the world: centre x, z, sin and cos of the view's turn; then near, far, near half-width, far half-width
uniform vec4 u_sh[16]; uniform int u_shn;
uniform vec4 u_wc[4]; uniform vec4 u_wd[4];   // where a blow is about to land: painted on the ground itself (a disc that fills, or a lane), so grass cannot hide it
uniform vec4 u_hitf[4]; uniform vec3 u_fl[8];   // places just struck (a ball each), and bodies just hurt (a run of splats each): both go white for an instant
uniform highp sampler2D u_eco; uniform highp sampler2D u_bones; uniform float u_ecoOn;   // what the ground remembers, a texel to each unit of it: burnt, burning, frozen, and how high the ground is there   // round shadows: x, z, ground height, radius
uniform vec2 u_season;   // how far autumn, and how far winter, has come
${t ? "uniform float u_sampleWithdrawal;\n" + t.glsl : ""}
uniform vec4 u_born;   // growth you can watch: when the diorama was shown, how fast its clock runs, how long a dab takes to grow, and the loop (0: once)
uniform vec2 u_cut;       // how wide a view is cleared between you and the eye, and how low it reaches
uniform float u_wl, u_slice; uniform vec2 u_lid; uniform vec4 u_pit; uniform vec4 u_portal; uniform vec2 u_pdoor; uniform vec3 u_eye;   // a doorway standing square to z (centre x, sill y, z, and which side of it this place is on), its half-width and height, and where the eye is
uniform vec3 u_fog;
uniform vec4 u_arrivalPlane;
uniform vec4 u_fogp;   // haze start, haze max, depth range near, depth range far
layout(location=0) in vec2 a_corner;
layout(location=1) in int a_index;
${s ? "layout(location=2) in int a_instance; uniform highp sampler2D u_instances;" : ""}
out vec2 v_d; out vec3 v_conic; out vec4 v_color; out float v_depth;
${o ? "flat out vec3 v_portalDepth;" : "flat out float v_ownerDepth;"}
${y ? "flat out vec4 v_sectionSample;" : ""}
out float v_gl; out float v_as; out float v_ast; uniform vec4 u_az[4]; uniform int u_azn; uniform float u_asoft, u_azst;
${n && !o ? "flat out float v_waterAxial;" : ""}
${m ? "flat out float v_envAxial;" : ""}
${e ? e.vsDecl : ""}// Inked detail (an option, off unless asked for): a dab may carry a 4 by 4 picture of the surface under it. Its two half-axes are
// carried to the screen here and turned inside out, so each pixel can find where on the surface it is looking.
uniform highp sampler2D u_fine; uniform float u_fineOn;
// Carried lights (the game's lantern, things on fire): where each is and how far it reaches, how strong, the palette, and for each palette
// colour the next lighter one of its own family. What is near a light steps up its own colours; nothing is tinted.
uniform vec4 u_lamp[8]; uniform float u_lamps[8]; uniform int u_lampN; uniform float u_lampGain; uniform vec3 u_lpal[48]; uniform int u_lup[48];
flat out vec4 v_fm; flat out vec4 v_ft; flat out float v_fk; flat out float v_lit; flat out float v_ix;
${c || l ? `${G}flat out int v_policySlot;` : ""}
${l ? ce + K(u).replaceAll("LOOK_IO", "out") + ue(u) : ""}
${p ? "uniform highp sampler2D u_materialStyles; uniform bool u_materialPatterned, u_materialStylesOn; flat out vec4 v_pixelStyle; flat out float v_pixelFog;" : ""}
void main(){
  int record = a_index;
  ${s ? "ivec2 inst = ivec2((a_instance & 15) * 16, a_instance >> 4);\n  vec4 meta;\n  if (a_instance != 0) {\n    meta = texelFetch(u_instances, inst + ivec2(3, 0), 0);\n    record += int(meta.x);\n  }" : ""}
  int row = record >> 9, col = (record & 511) << 2; v_ix = float(a_index);
  vec4 t0 = texelFetch(u_data, ivec2(col, row), 0);
  vec4 t1 = texelFetch(u_data, ivec2(col + 1, row), 0);
  vec4 t2 = texelFetch(u_data, ivec2(col + 2, row), 0);
  vec4 t3 = ${s ? "a_instance != 0 ? vec4(0.0) : " : ""}texelFetch(u_data, ivec2(col + 3, row), 0);
  v_paint = (u_paintMarker != 0.0 && t3.z == u_paintMarker ||
    u_afterimageStart > 0 && a_index >= u_afterimageStart) ? 1 : 0;
  ${p ? "v_pixelStyle = texelFetch(u_materialStyles, ivec2(record & 511, row), 0);" : ""}
  vec3 pos = t0.xyz; float alpha = t0.w;
  if (alpha <= 0.0 || pos.y < -30.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }   // (what is put away is put far below: it is not drawn from there)
  mat3 cov = mat3(t1.x, t1.y, t1.z,  t1.y, t2.x, t2.y,  t1.z, t2.y, t2.z);
  ${s ? `if (a_instance != 0) {
    int options = int(meta.w);
    if ((options & 2) != 0) {
      vec4 cut = texelFetch(u_instances, inst + ivec2(4, 0), 0);
      vec3 delta = pos - cut.xyz;
      if (dot(delta, delta) <= cut.w) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    }
    if ((options & 1) != 0) {
      vec4 axis = texelFetch(u_instances, inst + ivec2(13, 0), 0);
      pos = pos * axis.w + axis.xyz;
      cov *= axis.w * axis.w;
    } else {
      vec4 a = texelFetch(u_instances, inst, 0);
      vec4 b = texelFetch(u_instances, inst + ivec2(1, 0), 0);
      vec4 c = texelFetch(u_instances, inst + ivec2(2, 0), 0);
      mat3 transform = transpose(mat3(a.xyz, b.xyz, c.xyz));
      pos = transform * pos + vec3(a.w, b.w, c.w);
      cov = transform * cov * transpose(transform);
    }
    if (pos.y < -30.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    alpha *= meta.z;
    ${p ? "float originalShade = t1.w; vec2 originalRamp = v_pixelStyle.zw;" : ""}
    if (meta.y > 0.0) for (int i = 0; i < 16; i++) {
      if (i >= int(meta.y)) break;
      vec4 pair = texelFetch(u_instances, inst + ivec2(5 + i / 2, 0), 0);
      vec2 swap = i % 2 == 0 ? pair.xy : pair.zw;
      ${p ? "\n      if (originalShade == swap.x) t1.w = swap.y;\n      if (originalRamp.x == swap.x) v_pixelStyle.z = swap.y;\n      if (originalRamp.y == swap.x) v_pixelStyle.w = swap.y;" : "if (t1.w == swap.x) { t1.w = swap.y; break; }"}
    }
  }` : ""}
  vec3 color = vec3(mod(t1.w, 256.0), mod(floor(t1.w / 256.0), 256.0), floor(t1.w / 65536.0)) / 255.0;
  vec3 color0 = color; mat3 FM = mat3(1.0); v_fk = -1.0; v_lit = 0.0; v_fm = vec4(0.0); v_ft = vec4(0.0);
  int kraw = int(t2.w), flags = kraw / 16, kind = kraw - flags * 16;
  ${t ? "if (!sampleCoverageVisible(kraw, u_sampleWithdrawal)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }" : ""}
  float ph = t3.x, sp = t3.y, rg = t3.z, ex = t3.w, sc = u_scale;
  bool snap = false, stat = a_index < u_dyn.x || a_index >= u_dyn.y, pv = (flags & 8) != 0, green = (flags & 2) == 0 && color.g - max(color.r, color.b) > 0.06, veg = green || (flags & 6) == 0 && color.b - color.g > 0.15 && color.r - color.g > 0.08, fire = false;   // what grows: green things, and the purple grass
  if (u_ecoOn > 0.5 && stat && !pv && abs(t0.x) < 80.0 && t0.z > -208.0 && t0.z < 80.0) {
    vec4 eco = texelFetch(u_eco, ivec2(clamp(floor(t0.xz) + vec2(80.0, 208.0), vec2(0.0), vec2(159.0, 287.0))), 0);
    float hb = fract(sin(dot(floor(t0.xyz / 0.4), vec3(27.1, 61.7, 13.3))) * 4375.85), up = t0.y - (eco.a * 25.5 - 8.0);
    if ((flags & 4) != 0) { if (eco.b > hb * 0.8 + 0.1) { float h2 = fract(hb * 17.3), lm = dot(color, vec3(0.3, 0.59, 0.11)); kind = 0;   // water under frost: ice, still, with pale cracks in it
        color = h2 < 0.1 ? vec3(0.54, 0.52, 0.58) : lm < 0.34 || h2 < 0.7 ? vec3(0.56, 0.77, 0.96) : vec3(0.96, 0.95, 0.92); } }
    else if (eco.g > 0.9 && veg) { float fl = fract(hb * 7.0 + u_time * (2.0 + hb * 3.0)); fire = true; flags = flags | 2;   // alight
      color = fl < 0.33 ? vec3(1.0, 0.82, 0.29) : fl < 0.7 ? vec3(0.94, 0.54, 0.14) : vec3(0.72, 0.31, 0.10); }
    else if (eco.r > hb * 0.9 + 0.05 && (flags & 2) == 0) {   // burnt: leaves are gone, grass is black stubble, and everything else there is sooted
      if (veg) { if (up > 1.1) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } veg = false; green = false; sc *= 0.72;
        color = eco.g > 0.1 && fract(hb * 13.0 + u_time * 0.7) < 0.12 ? vec3(0.94, 0.54, 0.14) : hb < 0.5 ? vec3(0.07, 0.06, 0.07) : vec3(0.17, 0.13, 0.12); }
      else color *= 0.5; }
    else if (veg && eco.b > hb * 0.8 + 0.1 && up < 1.2) { float lm = dot(color, vec3(0.3, 0.59, 0.11)); veg = false; green = false; color = lm < 0.45 ? vec3(0.54, 0.52, 0.58) : lm < 0.62 ? vec3(0.56, 0.77, 0.96) : vec3(0.96, 0.95, 0.92); }   // rime on the grass
  }
  bool fabric = (kraw & 6144) == 4096;
  float foliageTime = u_motionCadence ? u_effectTimes.x : u_time;
  float bendTime = fabric && u_motionCadence ? u_effectTimes.y : foliageTime;
  float fallTime = u_motionCadence ? ((kraw & 8192) != 0 ? u_waterAndRainTime.y : u_effectTimes.z) : u_time;
  float flickerTime = u_motionCadence ? u_effectTimes.w : u_time;
  float waterTime = u_motionCadence ? u_waterAndRainTime.x : u_time;
  if (kind == 1) { alpha *= 0.62 + 0.38 * sin(flickerTime * sp + ph); snap = u_snap > 0.5; }                      // twinkle
  else if (kind == 2) { float pr = fract(fallTime * sp / rg + ph); pos.y -= pr * rg; alpha *= 1.0 - pr * pr; sc *= 1.0 + pr * ex;
    pos.xz += u_rainWind * (pr * rg / max(sp, 0.00001)); }   // fall
  else if (kind == 3) { float pr = fract(u_time * sp / rg + ph); pos.y += pr * rg; pos.x += sin(pr * 7.0 + ph * 50.0) * 0.25 * pr;
                        alpha *= (1.0 - pr) * smoothstep(0.0, 0.1, pr); sc *= 0.6 + pr * ex; }                 // rise
  else if (kind == 4) { color += vec3(0.3) * smoothstep(0.75, 1.0, sin(waterTime * sp + ph)); }                   // shimmer
  else if (kind == 5) { float a = u_time * sp, c = cos(a), s = sin(a);
                        mat3 R = mat3(c, 0.0, -s,  0.0, 1.0, 0.0,  s, 0.0, c); pos = R * pos; cov = R * cov * transpose(R); FM = R; } // orbit
  else if (kind == 6) { pos.y += sin(u_time * sp + ph) * rg; }                                                 // bob
  else if (kind == 7) { alpha *= 0.82 + 0.18 * sin(flickerTime * sp + ph); }                                        // glow
  else if (kind == 8) { float f = 0.2 + 0.8 * abs(sin(u_time * sp + ph)); pos.x = rg + (pos.x - rg) * f; pos.z = ex + (pos.z - ex) * f; pos.y += 0.14 * sin(u_time * sp * 0.31 + ph); }   // flap about a pivot
  else if (kind == 9) { pos.xz *= 1.0 + rg * sin(u_time * sp + ph - pos.y * ex); }                                                         // swell about the centre line
  else if (kind == 10) { float q = length(pos.xz), w = min(1.0, q * 0.22); pos.y += rg * w * sin(u_time * sp + ph - q * ex);
                         pos.xz += rg * 0.6 * w * vec2(-pos.z, pos.x) / max(q, 0.01) * sin(u_time * sp * 0.7 + ph - q * ex * 0.6); }                 // writhe outward from the centre
  else if (kind == 11) {
    ${b ? "if (u_motionWind && (kraw & 8192) != 0) pos.xz += (fabric ? u_effectWind.zw : u_effectWind.xy) * airflowBend(bendTime, ph, sp, rg); else" : ""}
    { pos.x += rg * sin(bendTime * sp + pos.y * 1.3 + pos.z * 0.9 + ph); pos.y += rg * 0.6 * sin(bendTime * sp * 1.3 + pos.x * 1.1 + ph); }
    vec2 dv = pos.xz - u_actor.xy; float q = length(dv); if (u_actor.z > 0.0 && q < u_actor.z && pos.y - u_actor.w < 2.3 && pos.y - u_actor.w > -0.4) { float pf = 1.0 - q / u_actor.z; pos.xz += dv / max(q, 0.05) * pf * pf * 0.5; pos.y -= pf * pf * 0.07; } }
  else if (kind == 12 || kind == 13) { int bi = int(ph + 0.5) * 3; ivec2 bq = ivec2(bi % 768, bi / 768); vec4 b0 = texelFetch(u_bones, bq, 0), b1 = texelFetch(u_bones, bq + ivec2(1, 0), 0), b2 = texelFetch(u_bones, bq + ivec2(2, 0), 0);   // carried by a bone: the splat is kept as it was made, and turned and moved here
                         mat3 A = mat3(b0.x, b1.x, b2.x, b0.y, b1.y, b2.y, b0.z, b1.z, b2.z); vec3 p1 = A * pos + vec3(b0.w, b1.w, b2.w); cov = A * cov * transpose(A); FM = A;
                         if (rg > 0.0) { int ci = int(sp + 0.5) * 3; ivec2 cq = ivec2(ci % 768, ci / 768); vec4 c0 = texelFetch(u_bones, cq, 0), c1 = texelFetch(u_bones, cq + ivec2(1, 0), 0), c2 = texelFetch(u_bones, cq + ivec2(2, 0), 0);   // shared with a second bone: its place is blended
                           p1 = mix(p1, vec3(dot(c0.xyz, pos) + c0.w, dot(c1.xyz, pos) + c1.w, dot(c2.xyz, pos) + c2.w), rg); }
                         pos = p1;
                         if (kind == 13) { pos.x += 0.022 * sin(foliageTime * 1.9 + pos.y * 1.3 + pos.z * 0.9 + 1.0); pos.y += 0.0132 * sin(foliageTime * 2.47 + pos.x * 1.1 + 1.0); } }   /* carried, and then stirred by the wind as hair and grass are */
  else if (kind == 15) { float pr = fract(foliageTime * sp / rg + ph); pos.y -= pr * rg; pos.x += sin(pr * 11.0 + ph * 40.0) * ex; pos.z += cos(pr * 7.0 + ph * 23.0) * ex * 0.6;   // flutter down: a leaf or a flake, swinging as it falls
                         alpha *= smoothstep(0.0, 0.05, pr) * (1.0 - smoothstep(0.92, 1.0, pr)); }
  else if (kind == 14) { float hg = max(0.0, pos.y - ex); pos.x += rg * hg * sin(foliageTime * sp + ph); pos.z += rg * 0.6 * hg * sin(foliageTime * sp * 0.73 + ph * 1.7); }   // sways as a whole from its foot (a placed copy: ex is where its foot is)
  if ((flags & 2) != 0 && (kind == 1 || (kind == 7 && ex != -7.0))) alpha *= 1.0 - u_emissiveWind;
  if ((flags & 32) != 0) { float gt = (u_time - u_born.x) * u_born.y; if (u_born.w > 0.0) gt = mod(gt, u_born.w); float gs = clamp((gt - ex) / u_born.z, 0.0, 1.0);   // born: not there till its time, then it grows to its size
                           if (gs <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } sc *= gs * (2.0 - gs); }
  else if ((flags & 64) != 0) { float wt = clamp(((u_time - u_born.x) * u_born.y - ex) / 2.0, 0.0, 1.0); color = mix(color, color * vec3(0.58, 0.62, 0.7), wt); }   // wet: from its time on it darkens, as rain soaks it
  // The portal is not a picture. A piece of the other place really stands beyond the ring; of it, only what the eye sees through the
  // ring is drawn, and of this place, whatever lies beyond the ring on that same line of sight is left out.
  if (u_portal.w != 0.0) { bool thr = false; float sg = u_portal.w;
    if ((pos.z - u_portal.z) * sg < -0.12 && (u_eye.z - u_portal.z) * sg > 0.05) { vec3 hp = u_eye + (pos - u_eye) * ((u_eye.z - u_portal.z) / (u_eye.z - pos.z)); thr = abs(hp.x - u_portal.x) < u_pdoor.x && hp.y > u_portal.y && hp.y < u_portal.y + u_pdoor.y; }
    if (pv ? !thr : (thr && stat)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  else if (pv) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  ${o ? "" : "if (dot(u_arrivalPlane, vec4(pos, 1.0)) < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }"}
  // under a roof, the storey over your head is not drawn at all: the cut comes down from above to just over head height, block by block
  if (u_lid.y > 0.0 && !pv) { float hl = fract(sin(dot(floor(pos.xyz / 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453); if (pos.y > u_lid.x + (stat ? 0.0 : 0.9) + (1.0 - u_lid.y) * (7.0 + 3.0 * hl)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  // what moves (an enemy, a barrel, a saw, a rail's lights) is held to the same lit circle as the ground it stands on: nothing shows out in the black where there is no floor
  if (u_reveal > 0.0 && !stat && !pv && u_rbox.x > 0.5) { float hv2 = fract(sin(dot(floor(pos.xyz / 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453); if (clamp((u_rbox.x - distance(pos.xz, u_rev.xy)) / 2.2, 0.0, 1.0) <= hv2 * 0.86 + 0.04) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  if (u_reveal > 0.0 && stat) {
    // The world exists only around you. Scenery stays exactly where it stands and comes up out of black, patch by patch:
    // when its cell arrives, and again at the edge of the lit ground, which trails a little behind as you run.
    // It forms in solid half-unit blocks, not as loose specks: every splat in a block appears at the same moment, low blocks before
    // high ones, so a tree arrives trunk first and its crown in clumps.
    float hv = fract(sin(dot(floor(t0.xyz / 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453), hs = fract(float(a_index) * 0.6180339), yr = clamp(t0.y - u_actor.w, 0.0, 9.0);
    float de = pv ? 9.0 : u_rbox.x - distance(pos.xz, u_rev.xy) - (1.0 - u_fade) * 50.0;   // how far inside the circle of world round you this is
    bool own = kind == 2 || kind == 3 || kind == 8 || kind == 9 || kind == 10 || kind == 14 || kind == 15;   // these use the last number for their own motion, so they carry no arrival time
    float te = min(clamp((de - yr * 0.1) / 2.2, 0.0, 1.0), own ? 1.0 : clamp((u_time - ex) / 0.7 - yr * 0.06, 0.0, 1.0));
    if (te <= hv * 0.86 + 0.04) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }   // not formed yet: nothing is drawn, so what shows is plain black
    // seasons: everything green turns, a patch at a time: to amber and rust in autumn, to snow in winter
    if (green && !fire && u_season.x + u_season.y > 0.0) {
      float lm = dot(color, vec3(0.3, 0.59, 0.11)), hp = fract(sin(dot(floor(pos.xz / 0.7), vec2(41.3, 17.7))) * 9731.1) * 0.999;
      if (hp < u_season.y) color = lm < 0.3 ? vec3(0.34, 0.31, 0.42) : lm < 0.45 ? vec3(0.54, 0.52, 0.58) : lm < 0.62 ? vec3(0.56, 0.77, 0.96) : vec3(0.96, 0.95, 0.92);
      else if (hp < u_season.x) color = lm < 0.3 ? vec3(0.42, 0.27, 0.15) : lm < 0.45 ? vec3(0.72, 0.31, 0.10) : lm < 0.62 ? vec3(0.94, 0.54, 0.14) : vec3(1.0, 0.82, 0.29);
    }
    // round shadows under whoever is standing on this
    if ((flags & 6) == 0) for (int i = 0; i < 16; i++) { if (i >= u_shn) break; vec4 s4 = u_sh[i]; if (distance(pos.xz, s4.xy) < s4.w && pos.y > s4.z - 0.35 && pos.y < s4.z + 0.55) {   // the shadow is a darker colour of the same family, never a tint that lands on some other hue
      float lm = dot(color, vec3(0.3, 0.59, 0.11)); color = color.g - max(color.r, color.b) > 0.06 ? (lm > 0.62 ? vec3(0.227, 0.478, 0.235) : vec3(0.118, 0.29, 0.204)) : color * 0.45; break; } }
    for (int i = 0; i < 4; i++) { vec4 wc = u_wc[i], wd = u_wd[i]; if (wc.w > 0.0 && abs(pos.y - wc.y - 0.35) < 1.2) { vec2 ab = wd.zw - wc.xz; float tt = wd.y < 0.5 ? 0.0 : clamp(dot(pos.xz - wc.xz, ab) / max(dot(ab, ab), 0.001), 0.0, 1.0), dd = distance(pos.xz, wc.xz + ab * tt);
      if (dd < wc.w) { bool rim = dd > wc.w - 0.2 || (wd.y > 0.5 && (tt < 0.02 || tt > 0.98)), fill = wd.y < 0.5 ? dd < wc.w * wd.x : tt < wd.x; color = rim ? vec3(1.0, 0.64, 0.3) : mix(color, vec3(0.84, 0.17, 0.15), fill ? 0.62 : 0.26); } } }
    // whatever stands between you and the eye is simply not drawn
    vec3 rel = pos - vec3(u_actor.x, u_actor.w + 0.9, u_actor.y); float al = dot(rel, u_camdir), pr2 = length(rel - al * u_camdir);
    vec2 hc = normalize(u_camdir.xz + vec2(0.0, 1e-5));   // (only what is on the eye's side of you: a wall you have your back to is behind you however tall it is, and stays whole)
    if (al > 0.4 && dot(rel.xz, hc) > 0.2 + 0.25 * hs && pos.y > u_actor.w + u_cut.y && pr2 < u_cut.x - 0.4 * hs) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    // and, underground, whatever stands well to the eye's side of you is cut down to knee height right across: the back of the next
    // room's wall, its railings and its statues would otherwise fill the bottom of the picture
    if (u_slice > 0.0 && dot(rel.xz, hc) > u_slice + 0.8 * hv && pos.y > u_actor.w + u_cut.y) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    // What lies under the water (a reflection, the bed) is seen only through water: the line from the eye to it has to cross the
    // surface where there is water, inside the lit circle. Otherwise it would hang in the dark under the edge of the world.
    // And a reflection goes when the thing it is the reflection of has been cut away.
    if (!pv && pos.y < u_wl - 0.02 && u_eye.y > u_wl + 0.1 && !(pos.x > u_pit.x && pos.x < u_pit.y && pos.z > u_pit.z && pos.z < u_pit.w)) { vec3 dd = pos - u_eye; vec2 q = u_eye.xz + dd.xz * ((u_wl - u_eye.y) / dd.y);
      if (distance(q, u_rev.xy) > u_rbox.x - 0.3 || (u_ecoOn > 0.5 && texelFetch(u_eco, ivec2(clamp(floor(q) + vec2(80.0, 208.0), vec2(0.0), vec2(159.0, 287.0))), 0).a * 25.5 - 8.0 > u_wl - 0.03)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      vec3 rs = vec3(pos.x, 2.0 * u_wl - pos.y, pos.z) - vec3(u_actor.x, u_actor.w + 0.9, u_actor.y); float as2 = dot(rs, u_camdir);
      if ((flags & 1) != 0 && rs.y + 0.9 > u_cut.y && (as2 > 0.4 && length(rs - as2 * u_camdir) < u_cut.x || u_slice > 0.0 && dot(rs.xz, hc) > u_slice)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } }
  }
  cov *= sc * sc;

  vec4 cam = u_view * vec4(pos, 1.0);
  if (cam.z > -u_near) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
${n && !o ? "  v_waterAxial = -cam.z;" : ""}
${m ? "  v_envAxial = -cam.z;" : ""}
  vec4 clip = u_proj * cam;
  ${d ? "\n  vec4 nearGlass = u_proj * vec4(cam.xy, min(cam.z + u_glassTolerance, -u_near), cam.w);\n  v_glassNearDepth = nearGlass.z / nearGlass.w * 0.5 + 0.5;" : ""}
  ${c || l ? "v_policySlot = contributionSlot(a_index);" : ""}
  ${l ? "if (u_idx < 2.5) placeMask(a_index, v_policySlot, pos, cam.xyz, abs(determinant(FM)) > 1e-8 ? inverse(FM) : mat3(1.0), mat3(u_view));" : ""}
  ${o ? "" : `v_ownerDepth = ${d ? "" : "u_idx > 1.5 ? "}clip.z / clip.w * 0.5 + 0.5${d ? "" : " : 0.0"};`}
  float dn = clamp((-cam.z - u_fogp.z) / (u_fogp.w - u_fogp.z), 0.0, 1.0);
  if (u_lampN > 0 && (flags & 22) == 0 && alpha >= 1.0) {
    float tr = cov[0][0] + cov[1][1] + cov[2][2], pp = tr / 2.4253, add = 0.0;   // (a dab is a disc, thin the way it faces: from its shape, how squarely it faces a light)
    for (int i = 0; i < 8; i++) { if (i >= u_lampN) break; vec4 Lq = u_lamp[i]; vec3 dl = Lq.xyz - pos; float d2 = dot(dl, dl);
      if (d2 < Lq.w * Lq.w) { float fa = 1.0 - sqrt(d2) / Lq.w, nd = sqrt(clamp(dot(dl, (cov - mat3(pp)) * dl) / (-0.5747 * pp * max(d2, 1e-4)), 0.0, 1.0)); add += fa * fa * u_lamps[i] * (0.3 + 0.7 * nd); } }
    if (add > 0.0) { float hb = fract(sin(dot(floor(pos.xyz / 0.22), vec3(12.9898, 78.233, 37.719))) * 43758.5453); int steps = int(floor(add * u_lampGain + (hb - 0.5) * 0.5)); v_lit = clamp(add * 1.8, 0.0, 1.0);   // (how lit it is also goes to the last pass, which shows lit things in the colours they have by day)
      if (steps > 0) { int ci = -1; for (int k = 0; k < 48; k++) { vec3 dc = abs(color - u_lpal[k]); if (max(dc.r, max(dc.g, dc.b)) < 0.004) { ci = k; break; } }
        if (ci >= 0) { if (!stat) steps = min(steps, 1);   /* (whoever carries the light is not washed out by it) */
          for (int k = 0; k < 3; k++) { if (k >= steps) break; ci = u_lup[ci]; } color = u_lpal[ci]; color0 = color; } } } }
  bool plain = color == color0 && (kraw & 32768) == 0; float fogk = (flags & 2) == 0 && u_fogp.y > 0.0 && u_fogp.x < 1.0 ? smoothstep(u_fogp.x, 1.0, dn) * u_fogp.y : 0.0;   // (smoothstep from 1 to 1 is undefined: some cards give NaN, a black pixel)
  ${_ ? "\n  ivec2 opticalUV = ivec2((a_index & 511) * 3, a_index >> 9);\n  v_optical = texelFetch(u_optical, opticalUV, 0);\n  v_scatterTint = texelFetch(u_optical, opticalUV + ivec2(1,0), 0).xyz;\n  v_reflectTint = texelFetch(u_optical, opticalUV + ivec2(2,0), 0).xyz;\n  v_opticalFog = v_optical.w > 0.5 ? fogk : 0.0;\n  fogk -= v_opticalFog;" : ""}
  ${g ? "v_relight = relightAt(a_index); if (v_relight.w > 0.0) { v_relight.w += fogk; fogk = 0.0; }" : ""}
  if (fogk > 0.0) color = mix(color, u_fog, fogk);   // distance haze
  vec3 colorF = color;
  int coverage = u_splatCoverage;
  ${p ? `
  int encodedCoverage = int(v_pixelStyle.x / ${x}.0);
  if (encodedCoverage > 0) coverage = encodedCoverage - 1;
  v_pixelStyle.x = mod(v_pixelStyle.x, ${x}.0);
  if (!u_materialStylesOn) v_pixelStyle.xy = vec2(0.0);` : ""}
  bool continuous = coverage == ${S} && alpha >= 1.0 && (kraw & ${w}) == 0 && v_paint == 0
    ${_ ? "&& v_optical.w < 0.5" : ""};
  v_coverage = continuous ? ${S} : (coverage == ${C} ? ${C} : 0);
  v_depth = coverage == ${C} || (flags & 1) != 0 ${_ ? "|| v_optical.w > 0.5" : ""} ? -1.0 : dn;
  float iz = -1.0 / cam.z;
  vec2 lim = 1.3 * 0.5 * u_viewport / u_focal;
  float tx = clamp(cam.x * iz, -lim.x, lim.x) / iz, ty = clamp(cam.y * iz, -lim.y, lim.y) / iz;
  // Jacobian of the perspective projection, then covariance into screen space
  mat3 J = u_ortho > 0.5 ? mat3(u_focal, 0.0, 0.0,   0.0, u_focal, 0.0,   0.0, 0.0, 0.0)   // (orthographic: u_focal is pixels to a unit)
    : mat3(u_focal * iz, 0.0, 0.0,   0.0, u_focal * iz, 0.0,   u_focal * tx * iz * iz, u_focal * ty * iz * iz, 0.0);
  mat3 T = J * mat3(u_view);
  mat3 c2 = T * cov * transpose(T);
  float variance = continuous ? ${T} * u_materialGridScale * u_materialGridScale : u_dilate;
  float A = c2[0][0] + variance, B = c2[0][1], C = c2[1][1] + variance;
  ${v ? `
  v_detailTexture = 1.0;
  v_detailGeometry = 1.0;
  if (u_detailGeometry.y > u_detailGeometry.x && detailStroke(kraw) && v_paint == 0
      ${_ ? "&& v_optical.w < 0.5" : ""}) {
    v_detailGeometry = detailWeight(u_detailGeometry,detailGeometryPixels(c2[0][0],B,c2[1][1],u_materialGridScale));
    if (v_detailGeometry <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  }` : ""}
  float det = A * C - B * B;
  if (det <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  v_conic = vec3(C, -B, A) / det;
  ${o || y ? "\n  // Condition axial depth on pixel offset using projected Gaussian covariance.\n  vec3 back = vec3(u_view[0].z, u_view[1].z, u_view[2].z);\n  vec3 crossDepth = cov * back;\n  vec2 depthCov = -(T * crossDepth).xy;\n  " : ""}
  ${o ? "v_portalDepth = vec3(-cam.z, mat2(v_conic.x, v_conic.y, v_conic.y, v_conic.z) * depthCov);" : ""}
  ${y ? "\n  float pureDet = c2[0][0] * c2[1][1] - B * B;\n  vec3 sectionConic = pureDet > 1e-8 * max(1.0, c2[0][0] * c2[1][1])\n    ? vec3(c2[1][1], -B, c2[0][0]) / pureDet : v_conic;\n  vec2 sectionSlope = mat2(sectionConic.x, sectionConic.y, sectionConic.y, sectionConic.z) * depthCov;\n  v_sectionSample = vec4(-cam.z, sectionSlope, 3.0 * sqrt(max(0.0, dot(back, crossDepth))));\n  " : ""}
  vec2 ext = min(3.0 * sqrt(vec2(A, C)), vec2(2048.0));
  vec2 ndc = clip.xy / clip.w;
  if (snap) { vec2 px = floor((ndc * 0.5 + 0.5) * u_viewport) + 0.5; ndc = px / u_viewport * 2.0 - 1.0; }
  vec2 extN = ext * 2.0 / u_viewport;
  if (any(greaterThan(abs(ndc) - extN, vec2(1.0)))) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  v_d = a_corner * ext;
  if (stat) { for (int i = 0; i < 4; i++) { vec4 h4 = u_hitf[i]; if (h4.w > 0.0 && distance(pos, h4.xyz) < h4.w) color = vec3(1.0, 0.97, 0.88); } }
  else { float ai = float(a_index); for (int i = 0; i < 8; i++) { vec3 f3 = u_fl[i]; if (f3.z > 0.0 && ai >= f3.x && ai < f3.y) color = vec3(1.0, 0.97, 0.88); } }
  if (${s ? "a_instance == 0 && " : ""}u_fineOn > 0.5 && plain && color == colorF) {   // (a dab that has been recoloured since it was baked, by anything, is drawn plain)
    ivec2 fq = ivec2((a_index & 511) * 3, row); vec4 f1 = texelFetch(u_fine, fq + ivec2(1, 0), 0), f2 = texelFetch(u_fine, fq + ivec2(2, 0), 0);
    if (f2.w > 0.5 && f1.w == t1.w) { vec3 pu = T * (FM * f1.xyz) * sc, pw = T * (FM * f2.xyz) * sc; float dt = pu.x * pw.y - pw.x * pu.y;
      if (abs(dt) > 1e-4 * (abs(pu.x * pw.y) + abs(pw.x * pu.y) + 1e-9)) {
        ${v ? "if (u_detailTexture.y > u_detailTexture.x) v_detailTexture =\n          detailWeight(u_detailTexture,detailTexturePixels(pu.xy,pw.xy,u_materialGridScale));" : ""}
        v_fm = vec4(pw.y, -pw.x, -pu.y, pu.x) / dt; v_ft = texelFetch(u_fine, fq, 0); v_fk = fogk; } } }
  ${p ? "\n  int styleCode = int(v_pixelStyle.y);\n  if (!plain || color != colorF || v_lit > 0.0 ||\n      (u_materialPatterned && (styleCode & 1024) != 0) ||\n      t1.w != (fract(v_pixelStyle.y) >= 0.25 ? v_pixelStyle.w : v_pixelStyle.z)) v_pixelStyle.y = 0.0;\n  v_pixelFog = fogk;" : ""}
  v_color = vec4(min(color, 1.0), alpha);
  v_gl = (flags & 16) != 0 ? 1.0 : 0.0;   // glass
  v_as = (flags & 128) != 0 ? 1.0 : 0.0; v_ast = v_as > 0.5 ? float(((kraw >> 12) & 1) | (((kraw >> 14) & 1) << 1)) : 0.0;   // text (K.ascii): the dab asks for it (and maybe for a set of its own), or it lies inside a zone (0.5 on the zone's surface)
  for (int i = 0; i < 4; i++) { if (i >= u_azn) break; vec4 z4 = u_az[i]; float zm = clamp(0.5 + (z4.w - distance(pos, z4.xyz)) / (2.0 * u_asoft), 0.0, 1.0); if (zm > v_as) { v_as = zm; v_ast = u_azst; } }

${e ? e.vsMain : ""}  gl_Position = vec4(ndc + a_corner * extN, u_geometryDepth ? clip.z/clip.w : 0.0, 1.0);
}`,
		fragment: `#version 300 es
precision highp float; precision highp int;
in vec2 v_d; in vec3 v_conic; in vec4 v_color; in float v_depth; flat in int v_coverage;
${v ? "flat in float v_detailGeometry, v_detailTexture;" : ""}
${o ? "flat in vec3 v_portalDepth; uniform vec4 u_splatPlane;" : "flat in float v_ownerDepth;"}
${o || y ? "uniform mat4 u_proj; uniform float u_ortho;" : ""}
${y ? y + "\nflat in vec4 v_sectionSample;\nuniform mat4 u_view;\nuniform vec4 u_fogp;\nuniform float u_near;\nuniform bool u_geometryDepth;" : ""}
in float v_gl; in float v_as; in float v_ast;
${e ? e.fsDecl : "uniform float u_gly;\n"}uniform float u_crisp, u_hard;
flat in vec4 v_fm; flat in vec4 v_ft; flat in float v_fk; flat in float v_lit; flat in float v_ix; uniform vec3 u_fpal[64]; uniform vec3 u_fog;
${p ? `flat in vec4 v_pixelStyle; flat in float v_pixelFog; uniform float u_materialGridScale;
${pe}` : ""}
uniform float u_idx;
uniform bool u_paintPass; flat in int v_paint;
${g ? "flat in vec4 v_relight;" : ""}
${_ ? "flat in vec4 v_optical; flat in vec3 v_scatterTint, v_reflectTint; flat in float v_opticalFog;" : ""}
layout(location=0) out vec4 o;
layout(location=1) out vec4 od;
${d && !n ? "vec4 oa;" : "layout(location=2) out vec4 oa;"}
${d ? `layout(location=${n ? 3 : 2}) out vec4 o_back;
layout(location=${n ? 4 : 3}) out vec4 o_through;
uniform highp sampler2D u_glassBoundary;
flat in float v_glassNearDepth;
float glassDepth(vec4 sampleDepth) {
  return dot(floor(sampleDepth.rgb*255.0+0.5),vec3(1.0,256.0,65536.0)) / 16777215.0;
}` : ""}
${n || o || m || y ? "uniform vec2 u_viewport;" : ""}
${m ? V(h) + "flat in float v_envAxial;" : ""}
${o || y ? fe : ""}
${se(f)}
${c || l ? `${G}flat in int v_policySlot;` : ""}
${c ? `uniform vec3 u_pal[64], u_out[64]; uniform int u_n;
uniform float u_toneOn, u_grade;
uniform vec2 u_lookGrid, u_lookViewportScale;
${ge}` : ""}
${l ? ce + K(u).replaceAll("LOOK_IO", "in") + le(u) : ""}
${n ? ne(r, i, a) + (o ? "" : "flat in float v_waterAxial;") : ""}
void main(){
${e ? e.fsMain : ""}  float power = -0.5 * (v_conic.x * v_d.x * v_d.x + v_conic.z * v_d.y * v_d.y) - v_conic.y * v_d.x * v_d.y;
  if (power > 0.0 || power < -4.5) discard;
  float g = v_color.a * exp(power);
  bool continuous = v_coverage == ${S};
  float surfaceAlpha = continuous ? smoothstep(${E}, ${D.toFixed(2)}, g) : 0.0;
  ${_ ? "bool hasOptical = v_optical.w > 0.5; if (hasOptical && v_optical.x == 0.0) discard;" : ""}
  ${y ? "\n  float sectionAxial = v_sectionSample.x + clamp(dot(v_sectionSample.yz, v_d), -v_sectionSample.w, v_sectionSample.w);\n  if (sectionAxial < u_near) discard;\n  vec3 inView = axialPosition(gl_FragCoord.xy, sectionAxial, u_viewport);\n  vec3 inWorld = transpose(mat3(u_view)) * (inView - u_view[3].xyz);\n  float margin = sectionMargin(inWorld, sectionAxial);\n  if (margin < 0.0) discard;\n  float cutInk = sectionInk(margin);\n  vec4 sectionProjected = u_proj * vec4(inView,1.0);\n  float sectionZ = sectionProjected.z / sectionProjected.w * 0.5 + 0.5;\n  gl_FragDepth = u_geometryDepth ? clamp(sectionZ,0.0,1.0) : gl_FragCoord.z;\n  float sectionDepth = clamp((sectionAxial - u_fogp.z) / (u_fogp.w - u_fogp.z), 0.0, 1.0);\n  " : ""}
  ${d ? `
  ${y ? "" : "gl_FragDepth = gl_FragCoord.z;"}
  if (u_idx > 2.5) {
    if (v_gl < 0.5 || g ${_ ? "* (hasOptical ? v_optical.x : 1.0)" : ""} < 0.004) discard;
    float depth = ${y ? "sectionZ" : "v_ownerDepth"};
    float z = round(clamp(depth,0.0,1.0)*16777215.0);
    gl_FragDepth = clamp(depth,0.000001,1.0);
    o = vec4(mod(z,256.0),mod(floor(z/256.0),256.0),floor(z/65536.0),255.0)/255.0;
    return;
  }` : ""}
  ${o ? `
  float axial = v_portalDepth.x + dot(v_portalDepth.yz, v_d);
  bool clipped = any(notEqual(u_splatPlane.xyz, vec3(0.0)));
  if (clipped) {
    if (axial <= 0.0 || dot(u_splatPlane, vec4(axialPosition(gl_FragCoord.xy, axial, u_viewport), 1.0)) < 0.0) discard;
  }
  if (u_idx > 1.5) {
    if (v_coverage == ${C} || v_color.a < 0.5 || (continuous ? surfaceAlpha <= 0.5 : g < 0.38)${_ ? " || hasOptical" : ""}) discard;
    o = vec4(1.0); od = vec4(0.0); oa = vec4(0.0);
    return;
  }
  ` : `
  if (u_idx > 1.5) {
    if (v_coverage == ${C} || v_color.a < 0.5 || (continuous ? surfaceAlpha <= 0.5 : g < 0.38)${_ ? " || hasOptical" : ""}) discard;
    float k = v_ix + 1.0, z = round(clamp(${y ? "sectionZ" : "v_ownerDepth"}, 0.0, 1.0) * 16777215.0);
    o = vec4(mod(k, 256.0), mod(floor(k / 256.0), 256.0), floor(k / 65536.0), 255.0) / 255.0;
    od = vec4(mod(z, 256.0), mod(floor(z / 256.0), 256.0), floor(z / 65536.0), 255.0) / 255.0;
    oa = vec4(0);
    return;
  }
  `}
  if (u_idx > 0.5) {   // the index pass (colour per pixel): which solid dab is in front here, its number in three bytes
    if (v_color.a < 1.0 || (continuous ? surfaceAlpha <= 0.5 : g < 0.5) || v_depth < 0.0) discard;
    ${y ? "if (cutInk > 0.0) { o = vec4(0.0); od = vec4(0.0); oa = vec4(0.0); return; }" : ""}
    float k = v_ix + 1.0;
    o = vec4(mod(k, 256.0), mod(floor(k / 256.0), 256.0), floor(k / 65536.0), 255.0) / 255.0;
    od = vec4(0.0); ${l ? `if (v_policySlot > 0) {${de}}` : ""}
    float graphDepth = round(clamp(${y ? "sectionDepth" : "v_depth"}, 0.0, 1.0) * 16777215.0);
    oa = vec4(mod(graphDepth,256.0), mod(floor(graphDepth/256.0),256.0), floor(graphDepth/65536.0),255.0)/255.0; return; }
  bool solid = u_crisp > 0.5 && v_color.a >= 1.0 && v_coverage != ${C};
  float a = continuous ? surfaceAlpha :
    (solid && u_hard > 0.5 ? (g > 0.5 ? 1.0 : 0.0) : contributionAlpha(power,v_color.a,solid));
  ${p ? "\n  if (!continuous && solid && u_hard < 0.5 && v_pixelStyle.x > 0.0) {\n    float width = 0.36 * (2.0 - v_pixelStyle.x);\n    a = 0.99 * (width > 0.0 ? smoothstep(0.5 - width, 0.5 + width, g) : step(0.5, g));\n  }" : ""}
  ${v ? "a *= v_detailGeometry;" : ""}
  if (a < 0.004) discard;
  vec3 rgb = v_color.rgb;
${p ? `
  if ((v_fk < 0.0${v ? " || v_detailTexture < 1.0" : ""}) && (int(v_pixelStyle.y) & 2048) != 0) {
    float rank = pixelStyleThreshold(int(v_pixelStyle.y) & 7, ivec2(gl_FragCoord.xy / u_materialGridScale));
    float pk = fract(v_pixelStyle.y) * 2.0 > rank ? v_pixelStyle.w : v_pixelStyle.z;
    vec3 shade = vec3(mod(pk, 256.0), mod(floor(pk / 256.0), 256.0), floor(pk / 65536.0)) / 255.0;
    rgb = mix(shade, u_fog, v_pixelFog);
  }` : ""}
    if (v_fk >= 0.0) {   // inked detail: this pixel's own place on the dab's tile
    ivec2 ij = clamp(ivec2(floor(vec2(dot(v_fm.xy, v_d), dot(v_fm.zw, v_d)) * 2.0 + 2.0)), ivec2(0), ivec2(3));
    float f = ij.y == 0 ? v_ft.x : ij.y == 1 ? v_ft.y : ij.y == 2 ? v_ft.z : v_ft.w;
    int ci = int(mod(floor(f / (ij.x == 0 ? 1.0 : ij.x == 1 ? 64.0 : ij.x == 2 ? 4096.0 : 262144.0)), 64.0));
    vec3 tile = mix(u_fpal[min(ci, 63)], u_fog, v_fk);
    rgb = ${v ? "mix(rgb, tile, v_detailTexture)" : "tile"}; }
${g ? "if (v_relight.w > 0.0) rgb = mix(min(vec3(1.0), rgb * v_relight.xyz), u_fog, v_relight.w - 1.0);" : ""}
${_ ? "\n  if (hasOptical) {\n    rgb = (v_scatterTint.x >= 0.0 ? v_scatterTint : rgb) * v_optical.y + v_reflectTint * v_optical.z;\n    rgb = mix(rgb, u_fog, v_opticalFog);\n    a *= v_optical.x;\n    if (a < 0.004) discard;\n  }" : ""}
${c ? `  if (v_policySlot > 0) {
    ivec2 p = ivec2(floor(gl_FragCoord.xy * u_lookViewportScale));
    p.y = int(u_lookGrid.y) - 1 - p.y;
    vec3 next = paletteRow(v_policySlot, rgb, p);
    float mask = ${l ? "maskAt(v_policySlot)" : "1.0"};
    if (mask < 1.0) {
      vec3 base = rgb;
      ${l ? "if (u_constraintDefault > 0 && maskSettings(u_constraintDefault).x == 0.0)\n        base = paletteRow(u_constraintDefault, rgb, p);" : ""}
      next = mix(base, next, mask);
    }
    rgb = next;
  }` : ""}
${y ? "rgb = mix(rgb, u_sectionEdge.rgb, cutInk);" : ""}
${n ? `  vec3 mark; rgb = waterPaint(rgb, gl_FragCoord.xy, u_viewport,
    ${y ? "sectionAxial" : o ? "clipped ? axial : v_portalDepth.x" : "v_waterAxial"}, mark);` : ""}
  ${m ? "rgb = envMedia(rgb, gl_FragCoord.xy, u_viewport, " + (y ? "sectionAxial" : "v_envAxial") + ");" : ""}
  if (u_paintPass) {
    // Every fragment attenuates the overlay behind it.
    bool overlay = v_paint != 0 ${_ ? "|| hasOptical" : ""};
    o = vec4(overlay ? rgb * a : vec3(0.0), a);
    od = vec4(overlay ? a : 0.0, 0.0, 0.0, a);
    return;
  }
  o = vec4(rgb * a, a);
  ${d ? `vec4 pane = texelFetch(u_glassBoundary,ivec2(gl_FragCoord.xy),0);
  // Keep near-coplanar transparent contributions together through crossings.
  float splitDepth = v_depth < 0.0 || v_color.a < 1.0 ? v_glassNearDepth : ${y ? "sectionZ" : "v_ownerDepth"};
  bool behind = pane.a > 0.0 && splitDepth > glassDepth(pane)+0.0000001;
  o_back = behind ? o : vec4(0.0);
  o_through = pane.a > 0.0 && !behind ? vec4(0.0,0.0,0.0,a) : vec4(0.0);` : ""}
  float a2 = v_color.a >= 1.0 && v_depth >= 0.0 ? a : 0.0;   // only solid splats write depth
  od = vec4(${y ? "sectionDepth" : "v_depth"} * a2, v_gl * a * 0.5, v_lit * a2, a2);   // (green: how much glass lies over this pixel, in front of the last solid thing; a solid splat wipes it)
  oa = ${n ? "vec4(mark * a, a)" : "vec4(v_as * a, v_ast * 0.25 * a, 0.0, a)"};
}`
	};
}
var ge = "\n// OKLab and matching coordinates mirror PixelLook.preparePalette.\nvec4 paletteLab(vec3 rgb) {\n  vec3 m = abs(rgb);\n  vec3 c = sign(rgb) * mix(pow((m+.055)/1.055,vec3(2.4)),m/12.92,lessThanEqual(m,vec3(.04045)));\n  vec3 lms = vec3(dot(vec3(.4122214708,.5363325363,.0514459929),c),\n                  dot(vec3(.2119034982,.6806995451,.1073969566),c),\n                  dot(vec3(.0883024619,.2817188376,.6299787005),c));\n  lms = sign(lms)*pow(abs(lms),vec3(1.0/3.0));\n  vec3 lab = vec3(dot(vec3(.2104542553,.7936177850,-.0040720468),lms),\n                  dot(vec3(1.9779984951,-2.4285922050,.4505937099),lms),\n                  dot(vec3(.0259040371,.7827717662,-.8086757660),lms));\n  return vec4(lab,length(lab.yz));\n}\nfloat paletteLabDistance(vec4 a, vec4 b, int mode, float hue) {\n  vec4 q = a-b;\n  float distance = (mode == 2 ? 25.0 : 1.0)*q.x*q.x+dot(q.yz,q.yz);\n  if (mode == 3) distance += 25.0*q.w*q.w;\n  if (hue > 0.0) {\n    vec2 d = a.yz/max(.04,a.w)-b.yz/max(.04,b.w);\n    distance += hue*dot(d,d);\n  }\n  return distance;\n}\nbool paletteAccess(int slot, int row, int base) {\n  int bits = int(texelFetch(u_constraintRows, ivec2(base + slot / 24, row), 0).a);\n  return (bits & (1 << (slot % 24))) != 0;\n}\nvec3 paletteRow(int slot, vec3 inputColor, ivec2 p) {\n  int row = slot - 1;\n  vec4 settings = texelFetch(u_constraintRows, ivec2(0, row), 0);\n  int count = int(settings.x), total = int(settings.y);\n  vec3 bytes = floor(clamp(inputColor, 0.0, 1.0) * 255.0 + 0.5);\n  const vec3 weight = vec3(0.30, 0.55, 0.15);\n  vec3 gradedBytes = bytes, gradedReserve = vec3(0.0);\n  bool hasGradedReserve = false;\n  float mapping = texelFetch(u_constraintRows, ivec2(3, row), 0).a;\n  if (mapping > 0.5 || (u_toneOn < 0.5 && u_grade > 0.5 && texelFetch(u_constraintRows, ivec2(2, row), 0).a > 0.5)) {\n    int index = 0; float nearestDistance = 1e9;\n    for (int i = 0; i < 64; i++) {\n      if (i >= u_n) break;\n      vec3 d = inputColor - u_pal[i];\n      float distance = dot(weight, d * d);\n      if (distance < nearestDistance) { index = i; nearestDistance = distance; }\n    }\n    inputColor = mapping > 0.5 ? texelFetch(u_constraintRows, ivec2(u_constraintMap + index, row), 0).rgb : u_out[index];\n    if (mapping > 1.5) { return inputColor; }\n    gradedBytes = floor(clamp(inputColor, 0.0, 1.0) * 255.0 + 0.5);\n  }\n  int mode = int(texelFetch(u_constraintRows, ivec2(4, row), 0).a);\n  vec4 inputLab = mode == 0 ? vec4(0.0) : paletteLab(inputColor);\n  float hue = mode == 4 ? .49*smoothstep(.02,.06,inputLab.w) : 0.0;\n  float firstDistance = 1e9;\n  int bestSlot = 0;\n  vec3 best = vec3(0.0), second = vec3(0.0);\n  vec4 firstLab = vec4(0.0), secondLab = vec4(0.0);\n  for (int i = 0; i < 48; i++) {\n    if (i >= total) break;\n    vec3 swatch = texelFetch(u_constraintRows, ivec2(i + 1, row), 0).rgb;\n    if (i >= count) {\n      vec3 code = floor(swatch * 255.0 + 0.5);\n      if (all(equal(bytes, code))) { return swatch; }\n      if (all(equal(gradedBytes, code))) { gradedReserve = swatch; hasGradedReserve = true; }\n      if (!paletteAccess(i, row, 8)) continue;\n    }\n    vec3 d = inputColor - swatch;\n    vec4 swatchLab = mode == 0 ? vec4(0.0) : texelFetch(u_constraintRows,ivec2(u_constraintLab+i,row),0);\n    float distance = mode == 0 ? dot(weight,d*d) : paletteLabDistance(inputLab,swatchLab,mode,hue);\n    if (distance < firstDistance) {\n      best = swatch; firstDistance = distance; firstLab = swatchLab; bestSlot = i;\n    }\n  }\n  if (hasGradedReserve) { return gradedReserve; }\n  vec3 color = best;\n  float amount = texelFetch(u_constraintRows, ivec2(1, row), 0).a;\n  float gain = texelFetch(u_constraintRows, ivec2(7, row), 0).a;\n  if (total < 2 || amount == 0.0 || gain <= 0.0 ||\n      (bestSlot >= count && !paletteAccess(bestSlot, row, 10))) return color;\n  ivec2 size = ivec2(settings.zw);\n  float scale = texelFetch(u_constraintRows, ivec2(6, row), 0).a;\n  ivec2 grid = ivec2(floor(vec2(p) / scale));\n  int cell = (grid.y % size.y) * size.x + grid.x % size.x;\n  float rank = texelFetch(u_constraintRows, ivec2(49 + cell / 4, row), 0)[cell & 3] / gain;\n  if (rank >= .5) return color;\n  int pairCount = int(texelFetch(u_constraintRows,ivec2(5,row),0).a)-1;\n  int partner = -1;\n  float secondDistance = 1e9;\n  float lightness = mode == 0 ? -1.0 : clamp(inputLab.x,0.0,1.0);\n  int entries = pairCount >= 0 ? pairCount : total;\n  for (int i = 0; i < 256; i++) {\n    if (i >= entries) break;\n    int candidate = i;\n    if (pairCount >= 0) {\n      vec4 pair = texelFetch(u_constraintRows, ivec2(u_constraintPairs + i, row), 0);\n      ivec2 slots = ivec2(pair.xy);\n      candidate = slots.x == bestSlot ? slots.y : slots.y == bestSlot ? slots.x : -1;\n      if (candidate < 0) continue;\n      if (pair.z >= 0.0) {\n        if (lightness < 0.0) lightness = clamp(paletteLab(inputColor).x, 0.0, 1.0);\n        if (lightness < pair.z || lightness > pair.w) continue;\n      }\n    } else if (candidate == bestSlot || (candidate >= count && !paletteAccess(candidate, row, 10))) continue;\n    vec3 rgb = texelFetch(u_constraintRows, ivec2(candidate + 1, row), 0).rgb;\n    vec4 lab = mode == 0 ? vec4(0.0) : texelFetch(u_constraintRows, ivec2(u_constraintLab + candidate, row), 0);\n    vec3 d = inputColor - rgb;\n    float distance = mode == 0 ? dot(weight, d*d) : paletteLabDistance(inputLab, lab, mode, hue);\n    if (distance < secondDistance || distance == secondDistance && candidate < partner) {\n      partner = candidate;\n      second = rgb;\n      secondLab = lab;\n      secondDistance = distance;\n    }\n  }\n  if (partner < 0) return color;\n  float threshold = .5+(rank-.5)*amount;\n  if (mode != 0) {\n    float reach = paletteLabDistance(firstLab,secondLab,mode,hue);\n    return reach > 0.0 && .5*(firstDistance+reach-secondDistance) >= threshold*reach ? second : color;\n  }\n  vec3 delta = second-best;\n  if (dot(weight*delta,inputColor-best) >= threshold*dot(weight,delta*delta)) color = second;\n  return color;\n}\n";
function _e(e) {
	return `${G}${ge}
bool g_constrained = false;
${e ? `${ce}
uniform highp sampler2D u_maskOwner;
vec3 defaultMaskColor(vec3 rgb, ivec2 p) {
  float th = (BAYER[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0 - 0.5;
  rgb = clamp(rgb + th * u_dither, 0.0, 1.0);
  int best = 0; float bd = 1e9;
  for (int i = 0; i < 64; i++) {
    if (i >= u_n) break;
    vec3 d = rgb - u_pal[i];
    float dd = dot(d*d, vec3(0.30, 0.55, 0.15));
    if (dd < bd) { bd = dd; best = i; }
  }
  return u_grade > 0.5 ? u_out[best] : u_pal[best];
}` : ""}
bool constrainPalette(ivec2 p, vec3 inputColor, out vec3 color) {
  int index = dabAt(p);
  if (index < 0) return false;
  int slot = contributionSlot(index);
  if (slot == 0) return false;
  ivec2 pos = ivec2(p.x, textureSize(u_idxTex, 0).y - 1 - p.y);
  color = paletteRow(slot,inputColor,pos);
  ${e ? "if (maskSettings(slot).x != 0.0) {\n    vec2 encoded = floor(texelFetch(u_maskOwner,p,0).rg * 255.0 + 0.5);\n    float amount = dot(encoded, vec2(1.0,256.0)) / 65535.0;\n    if (amount < 1.0) {\n      vec3 base = u_constraintDefault > 0 && maskSettings(u_constraintDefault).x == 0.0 ?\n        paletteRow(u_constraintDefault,inputColor,pos) : defaultMaskColor(inputColor,p);\n      color = mix(base,color,amount);\n    }\n  }" : ""}
  return true;
}`;
}
function ve(e, { water: t = !1, airPockets: n = !1, layered: r = !1, atlas: i = !1, paletteConstraints: a = !1, masked: o = !1, contributions: s = !1, layeredGlass: c = !1, materialStyles: l = !1, environment: u = !1, emitterFog: d = !1, relighting: f = !1, packedTone: p = !1, cutaway: m } = {}) {
	let h = "\nuniform highp sampler2D u_waterMask;\nivec2 waterPixel(ivec2 p) {\n  vec3 mark = texelFetch(u_waterMask, p, 0).rgb;\n  if (mark.x < 0.98) return p;\n  int body = int(round(mark.y * 255.0)), code = int(round(mark.z * 255.0));\n  ivec2 shift = ivec2(code % 9 - 4, code / 9 - 4);\n  ivec2 dest = clamp(p + shift, ivec2(0), textureSize(u_waterMask, 0) - 1);\n  vec3 other = texelFetch(u_waterMask, dest, 0).rgb;\n  return other.x >= 0.98 && int(round(other.y * 255.0)) == body ? dest : p;\n}\n", g = `#version 300 es
precision highp float;
${a || l || f ? "precision highp int;" : ""}
uniform sampler2D u_scene, u_depth, u_crispScene, u_crispDepth;
${u ? V(d) : ""}
uniform bool u_paintOn;
${f ? me + "uniform vec3 u_relightFog; uniform vec2 u_relightFogRange;" : ""}
uniform vec3 u_line;
uniform float u_edge;
// the tone look (a diorama's look.tone, or the Tone option: PixelLook's stipple): brightness below the cutoff is black, the rest
// mapped onto the stops (u_toneStops: colour, and its place in .a), each pixel between two stops taking one or the other by its rank
// in a fixed pattern (Bayer or blue noise) on the screen's art grid
uniform float u_toneOn, u_toneCut, u_toneAmt; uniform int u_toneN; uniform highp sampler2D u_toneStops;
${p ? "uniform ivec2 u_toneThSize;" : "uniform highp sampler2D u_toneTh;"}
uniform vec3 u_pal[64], u_out[64], u_outl[64];   // (u_outl: what each colour is shown as where a carried light falls on it)
uniform int u_n;
uniform float u_grade; uniform float u_bars; uniform int u_remapLine;
uniform float u_dither, u_luma, u_bypass, u_colored, u_refract, u_ao, u_aor;
uniform float u_lines, u_lineGap, u_lineK, u_lineLit;
out vec4 o;
${t ? ne(n, r, i) + h : ""}
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
const ivec2 AOT[8] = ivec2[8](ivec2(2, 0), ivec2(-2, 0), ivec2(0, 2), ivec2(0, -2), ivec2(1, 1), ivec2(-1, 1), ivec2(1, -1), ivec2(-1, -1));
// light in the air behind a round stained window (a diorama's .glass): the window's centre and radius, the way its light travels, six glass
// colours, and the eye. Each pixel's line of sight is walked where it crosses the beam; every step adds the colour of the pane it lies behind,
// thinned or thickened by a haze that drifts, and the sum is added to the finished picture: this is light, so it is not held to the palette.
uniform mat4 u_gview; uniform vec3 u_geye, u_gd; uniform vec4 u_gw, u_gcam; uniform float u_gk, u_gtime, u_gortho; uniform vec3 u_gc[6];
// colour per pixel (a diorama's look.pixel): the solid dab in front at each pixel (u_idxTex), what it is coloured from (u_pixTex: its
// ramp, how lit, its pattern, the way its surface truly faces), its middle (u_data); the camera, to meet each pixel's line of sight
// with the dab's plane; the patterns and ramps. The pixel is coloured at that exact place, its light the mean of the pixels round
// it on the same ramp and surface, and a stone, tile or board's edge is drawn where the cell changes from this pixel to the next
uniform highp sampler2D u_idxTex, u_pixTex, u_dat; uniform float u_pixOn, u_tanF, u_asp, u_fpG, u_ol, u_olEps, u_olGap, u_ptime, u_portho, u_shape; uniform int u_olK; uniform mat4 u_pview; uniform vec3 u_peye;
uniform vec4 u_patK4[8], u_patP[128], u_rmp4[128], u_rmpN4[16]; uniform float u_detail;
int jm2(int v) { return v - 2 * int(trunc(float(v) * 0.5)); }   // (v % 2 as script does it, negative for a negative odd v)
int dabAt(ivec2 q) { ivec2 s = textureSize(u_idxTex, 0); if (q.x < 0 || q.y < 0 || q.x >= s.x || q.y >= s.y) return -1;
  vec4 e = texelFetch(u_idxTex, q, 0) * 255.0; return int(e.r + 0.5) + int(e.g + 0.5) * 256 + int(e.b + 0.5) * 65536 - 1; }
vec4 pixA(int i) { return texelFetch(u_pixTex, ivec2((i & 1023) * 2, i >> 10), 0); }
vec4 pixB(int i) { return texelFetch(u_pixTex, ivec2((i & 1023) * 2 + 1, i >> 10), 0); }
uint hsh(int i, int j, int k, int s) { uint h = uint(i) * 374761393u + uint(j) * 668265263u + uint(k) * 1440662683u + uint(s) * 1274126177u;
  h = (h ^ (h >> 13u)) * 1274126177u; h ^= h >> 16u; h *= 2246822519u; h ^= h >> 13u; return h; }
float hsf(int i, int j, int k, int s) { return float(hsh(i, j, k, s)) / 4294967296.0; }
int rlen(int r) { return int(u_rmpN4[r >> 2][r & 3] + 0.5) & 15; }
bool lineOff(int r) { return (int(u_rmpN4[r >> 2][r & 3] + 0.5) & 16) != 0; }
// two ramps of one material (its shade ramp and its lit one share colours where they meet): not an edge between things
bool sameStuff(int a, int b) { return a == b || (int(u_rmpN4[a >> 2][a & 3] + 0.5) >> 5) == (int(u_rmpN4[b >> 2][b & 3] + 0.5) >> 5); }
int rampAt(int r, int b) { int x = r * 8 + clamp(b, 0, rlen(r) - 1); return int(u_rmp4[x >> 2][x & 3] + 0.5); }
int bandOf(int r, float t) { return clamp(int(floor(t * float(rlen(r)))), 0, rlen(r) - 1); }
float lvl(float px0, float fp) { return fp > 0.0 ? px0 * exp2(floor(log2(fp / px0) + 0.5)) : px0; }
// where this pixel's line of sight meets the plane of dab i, and how big a screen pixel is there
vec4 hitOf(ivec2 q, int i, vec3 n) { ivec2 sz = textureSize(u_idxTex, 0);
  vec3 v = vec3(((float(q.x) + 0.5) / float(sz.x) * 2.0 - 1.0) * u_tanF * u_asp, ((float(q.y) + 0.5) / float(sz.y) * 2.0 - 1.0) * u_tanF, -1.0);
  // (orthographic: each line of sight starts at its own point on the picture's plane and all run straight ahead)
  vec3 o0 = u_portho > 0.5 ? u_peye + transpose(mat3(u_pview)) * vec3(v.xy, 0.0) : u_peye;
  vec3 d = transpose(mat3(u_pview)) * (u_portho > 0.5 ? vec3(0.0, 0.0, -1.0) : v); vec3 c = texelFetch(u_dat, ivec2((i & 511) << 2, i >> 9), 0).xyz;
  float den = dot(n, d), s = abs(den) > 1e-6 ? dot(n, c - o0) / den : 0.0;
  // (a pixel's size on the surface, for the pattern's level: the same over a whole face, from the camera's distance and the face's slant)
  float ce = abs(dot(n, vec3(u_pview[0][2], u_pview[1][2], u_pview[2][2])));
  return s > 0.0 ? vec4(o0 + d * s, u_fpG / max(0.3, ce)) : vec4(c, 0.0); }
// a pattern's cell where the pixel lands (the same over one stone, tile or board), and the colours of its body and edges
struct Cell { ivec3 key, sel; int body, below, above, left; };
ivec2 g_q;   // (the pixel being coloured, for patterns drawn as upright pixel pictures)
float g_fp;   // (and the size of a screen pixel on its surface)
/* points pinned to the world, nested over detail levels. Level L's cells (a size times 2^L) each show one point: the one its chosen
   child shows, and so down to the finest level (LMIN). So a point shown at one level is shown at every finer one, in the same place:
   zooming out takes points away one by one (between L and L + 1 the cells not chosen by their parent go, each at its own moment)
   and zooming in brings them back; none ever moves */
const int LMIN = -2;
bool shown2(ivec2 c, int L, float f, int sd) { ivec2 pa = ivec2(floor(vec2(c) * 0.5)); int ch = int(hsf(pa.x, pa.y, 21 + L, sd) * 4.0);
  return c - pa * 2 == ivec2(ch & 1, ch >> 1) || hsf(c.x, c.y, 41 + L, sd) >= f; }
ivec2 atom2(ivec2 c, int L, int sd) { for (int l = 0; l < 8; l++) { if (L - l <= LMIN) break; int ch = int(hsf(c.x, c.y, 20 + L - l, sd) * 4.0); c = c * 2 + ivec2(ch & 1, ch >> 1); } return c; }
bool shown3(ivec3 c, int L, float f, int sd) { ivec3 pa = ivec3(floor(vec3(c) * 0.5)); int ch = int(hsf(pa.x + 7 * pa.z, pa.y, 21 + L, sd) * 8.0);
  return c - pa * 2 == ivec3(ch & 1, (ch >> 1) & 1, ch >> 2) || hsf(c.x + 7 * c.z, c.y, 41 + L, sd) >= f; }
ivec3 atom3(ivec3 c, int L, int sd) { for (int l = 0; l < 8; l++) { if (L - l <= LMIN) break; int ch = int(hsf(c.x + 7 * c.z, c.y, 20 + L - l, sd) * 8.0); c = c * 2 + ivec3(ch & 1, (ch >> 1) & 1, ch >> 2); } return c; }
// (the level for a surface's pixel size: L and how far toward L + 1)
int nestL(float p, out float f) { float lam = clamp(log2(max(g_fp, 1e-6) / p), float(LMIN), 4.0); int L = int(floor(lam)); f = lam - float(L); return L; }
const int TUFTS[6] = int[6](17732, 4782, 324, 11118, 2700, 8524); const int LEAFM[4] = int[4](2274, 4812, 10692, 5312); const int CLUMPS[4] = int[4](42975166, 17211164, 38797084, 9150366); const int NEEDLES[4] = int[4](21956, 3268, 24964, 10368); const int CRACKS[4] = int[4](1100, 4289, 368, 192); const int RIPPLES[4] = int[4](14, 108, 7, 22);
vec3 unfoldN(vec2 q, vec3 dflt) { if (q.x > 8.0) return dflt; float y = 1.0 - abs(q.x) - abs(q.y); vec2 xz = q;
  if (y < 0.0) xz = (1.0 - abs(q.yx)) * vec2(q.x >= 0.0 ? 1.0 : -1.0, q.y >= 0.0 ? 1.0 : -1.0); return normalize(vec3(xz.x, y, xz.y)); }
Cell cellAtL(int k, int r, vec3 P, vec3 n, vec3 fn, float t, float p) {
  Cell C; C.key = ivec3(-99999); C.sel = ivec3(0); int b = bandOf(r, t); C.body = rampAt(r, b); C.below = C.body; C.above = C.body; C.left = C.body;
  int kind = int(u_patK4[k >> 2][k & 3] + 0.5); vec4 a = u_patP[k * 4], e = u_patP[k * 4 + 1]; int sd = int(e.x + 0.5);
  if (kind == 1) {   // stones in courses
    float sl = a.x * p, sh = a.y * p; vec3 uvf = abs(n.y) > 0.7 ? vec3(P.x, P.z, 0.0) : abs(n.x) > abs(n.z) ? vec3(P.z * sign(n.x == 0.0 ? 1.0 : n.x), P.y, 1.0) : vec3(-P.x * sign(n.z == 0.0 ? 1.0 : n.z), P.y, 2.0);
    int face = int(uvf.z), row = int(floor(uvf.y / sh)); float off = float(jm2(row)) * 0.5 * sl + hsf(row, face, 0, sd) * sl * 0.3;
    int slot = int(floor((uvf.x + off) / sl)); float su = uvf.x + off - float(slot) * sl;
    bool halfS = hsf(slot, row, face, sd + 9) > 0.86, keepS = hsf(slot, row, face, sd + 7) > 0.28; int col;
    if (halfS && su > sl * 0.5) col = slot * 2 + 1; else if (keepS) col = slot * 2;
    else { int s2 = slot - 1; col = s2 * 2; for (int g = 0; g < 4; g++) { if (hsf(s2, row, face, sd + 9) > 0.86) { col = s2 * 2 + 1; break; } if (hsf(s2, row, face, sd + 7) > 0.28 || g == 3) { col = s2 * 2; break; } s2--; } }
    float hv = hsf(col, row, face, sd + 3); int dd = hv < a.w * 0.6 ? -1 : hv > 1.0 - a.w * 0.4 ? 1 : 0; int n0 = rlen(r);
    C.body = rampAt(r, b + dd); C.below = rampAt(r, b - int(a.z + 0.5)); C.left = C.below; C.above = rampAt(r, b + dd + (b < n0 - 1 ? 1 : 0));
    C.key = ivec3(face, row, col);
  } else if (kind == 2) {   // boards
    float w = a.x * p; int ax = int(a.y + 0.5); float al = ax == 0 ? P.x : ax == 1 ? P.z : P.y;
    float cc = ax == 2 ? (abs(n.x) > abs(n.z) ? P.z : P.x) : abs(n.y) > 0.7 ? (ax == 0 ? P.z : P.x) : P.y;
    int k0 = int(floor(cc / w)); bool wide = hsf(k0, 9, 0, sd) < 0.3; int kk = wide && jm2(k0) != 0 ? k0 - 1 : k0;
    float len = (6.0 + 10.0 * hsf(kk, 0, 0, sd)) * p * 4.0, ee = al + hsf(kk, 1, 0, sd) * len; int seg = int(floor(ee / len));
    C.body = rampAt(r, b + (hsf(kk, seg, 4, sd) < 0.2 ? -1 : 0)); C.below = rampAt(r, b - 2); C.left = C.below; C.above = C.body;
    C.key = ivec3(kk, seg, 0);
  } else if (kind == 3) {   // tiles: the lower edge a lit lip, the upper edge in the row above's shadow, the sides seams
    float tw = a.x * p, th = a.y * p, u = abs(n.x) > abs(n.z) ? P.z : P.x; int row = int(floor(P.y / th));
    float off = float(jm2(row)) * 0.5 * tw; int col = int(floor((u + off) / tw));
    C.body = rampAt(r, b + (hsf(col, row, 0, sd) < 0.08 ? -1 : 0)); C.below = rampAt(r, b + 1); C.above = rampAt(r, b - 2);
    C.left = P.y - float(row) * th < th * 0.5 ? rampAt(r, b - 1) : C.body;   // (seams only on a tile's lower half: shingles, not a grid)
    C.key = ivec3(row, col, 1);
  } else if (kind == 6) {   // thatch: courses along the eaves, bundles shading them, ragged feet; a course is one cell
    float ch = a.x * p, bw = a.y * p, u = abs(n.x) > abs(n.z) ? P.z : P.x; int row = int(floor(P.y / ch)); float f = P.y - float(row) * ch;
    int cU = int(floor((u + hsf(row + 1, 0, 2, sd) * bw) / bw)); float sagU = floor(hsf(cU, row + 1, 1, sd) * (a.z + 0.999)) * p; int col;
    if (f >= ch - sagU) { row++; col = cU; } else col = int(floor((u + hsf(row, 0, 2, sd) * bw) / bw));
    float hv = hsf(col, row, 3, sd); int dd = hv < 0.28 ? -1 : hv > 0.82 ? 1 : 0;
    C.body = rampAt(r, b + dd); C.below = rampAt(r, b + 1); C.above = rampAt(r, b - 2); C.left = rampAt(r, b - 1);
    C.key = ivec3(row, 0, 6);
  } else if (kind == 5) {   // leaves: clusters round Worley points, each lit as a dome and as the crown's shape: scalloped band edges
    float cl = a.x * p; vec3 g = P / cl; ivec3 ig = ivec3(floor(g)); float best = 1e9; vec3 fq = vec3(0.0);
    for (int kz = -1; kz <= 1; kz++) for (int ky = -1; ky <= 1; ky++) for (int kx = -1; kx <= 1; kx++) { ivec3 c3 = ig + ivec3(kx, ky, kz);
      vec3 q = vec3(c3) + 0.15 + 0.7 * vec3(hsf(c3.x, c3.y, c3.z, sd), hsf(c3.x, c3.y, c3.z, sd + 1), hsf(c3.x, c3.y, c3.z, sd + 2)); vec3 dq = q - g; float d2 = dot(dq, dq);
      if (d2 < best) { best = d2; fq = q; } }
    vec3 L = e.yzw, dd = normalize(P - fq * cl), nc = normalize(fn * (1.0 - a.y) + dd * a.y);
    float t2 = t + a.z * (max(0.0, dot(nc, L)) - max(0.0, dot(fn, L))); int b2 = bandOf(r, t2), body = rampAt(r, b2);
    // leaf marks: little upright pixel pictures of leaves at points over the crown, darker in the light and lighter in the shade
    if (a.w > 0.0) { float fr; int L = nestL(p, fr); float mc = u_patP[k * 4 + 2].x * p * exp2(float(L)), mA = u_patP[k * 4 + 2].x * p * exp2(float(LMIN)); ivec3 mg = ivec3(floor(P / mc)); int best = -9, col = -1; ivec2 sz = textureSize(u_idxTex, 0); mat3 V = mat3(u_pview);
      for (int kz = -1; kz <= 1; kz++) for (int ky = -1; ky <= 1; ky++) for (int kx = -1; kx <= 1; kx++) { ivec3 cL = mg + ivec3(kx, ky, kz); if (!shown3(cL, L, fr, sd)) continue; ivec3 c3 = atom3(cL, L, sd);
        if (hsf(c3.x, c3.y, c3.z, sd + 5) > a.w) continue;
        vec3 Q = (vec3(c3) + 0.15 + 0.7 * vec3(hsf(c3.x, c3.y, c3.z, sd), hsf(c3.x, c3.y, c3.z, sd + 1), hsf(c3.x, c3.y, c3.z, sd + 2))) * mA;
        if (dot(Q - P, Q - P) > mc * mc * 1.5) continue;
        vec3 vs = V * (Q - u_peye); float iw = u_portho > 0.5 ? 1.0 : 1.0 / max(-vs.z, 1e-6);
        vec2 sc = vec2((vs.x * iw / (u_tanF * u_asp) + 1.0) * 0.5 * float(sz.x) - 0.5, (vs.y * iw / u_tanF + 1.0) * 0.5 * float(sz.y) - 0.5);
        int ox = int(floor(float(g_q.x) - sc.x + 0.5)), oy = int(floor(float(g_q.y) - sc.y + 0.5));
        if (abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
        int m = LEAFM[int(hsf(c3.x, c3.y, c3.z, sd + 6) * 4.0) % 4]; if (((m >> (oy * 5 + ox + 2)) & 1) == 0) continue;
        best = oy; col = rampAt(r, b2 + (float(b2) >= float(rlen(r)) * 0.5 ? -1 : 1)); }
      if (col >= 0) body = col; }
    C.body = body; C.below = body; C.above = body; C.left = body; C.key = ivec3(floor(fq));
  } else if (kind == 7) {   // turf: an even ground (darker in big patches) scattered with upright tufts, each a little pixel picture anchored to the ground
    float ps = a.z, pn = sin(P.x / ps + 1.3 * sin(P.z / (ps * 1.7))) * sin(P.z / ps + 0.9 * sin(P.x / (ps * 1.3)));
    float fr; int L = nestL(p, fr); float cl = a.x * p * exp2(float(L)), cA = a.x * p * exp2(float(LMIN));
    int bb = max(0, b - (pn > 0.55 ? 1 : 0) + int(floor(e.z + 0.5))), body = rampAt(r, bb); int ix = int(floor(P.x / cl)), iz = int(floor(P.z / cl));
    if (n.y >= 0.5) {
      int d = bb <= rlen(r) - 2 ? 1 : -1, best = -9, col = -1, nf = int(a.w + 0.5); bool shade = false; vec4 F0 = u_patP[k * 4 + 2], F1 = u_patP[k * 4 + 3];
      ivec2 sz = textureSize(u_idxTex, 0); mat3 V = mat3(u_pview);
      for (int kz = -1; kz <= 1; kz++) for (int kx = -1; kx <= 1; kx++) { ivec2 c2 = ivec2(ix + kx, iz + kz); if (!shown2(c2, L, fr, sd)) continue;
        ivec2 at2 = atom2(c2, L, sd); int ax = at2.x, cz = at2.y;
        if (hsf(ax, cz, 4, sd) > a.y) continue;
        vec2 qw = vec2((float(ax) + 0.15 + 0.7 * hsf(ax, cz, 0, sd)) * cA, (float(cz) + 0.15 + 0.7 * hsf(ax, cz, 1, sd)) * cA);
        vec3 vs = V * (vec3(qw.x, P.y, qw.y) - u_peye); float iw = u_portho > 0.5 ? 1.0 : 1.0 / max(-vs.z, 1e-6);
        vec2 sc = vec2((vs.x * iw / (u_tanF * u_asp) + 1.0) * 0.5 * float(sz.x) - 0.5, (vs.y * iw / u_tanF + 1.0) * 0.5 * float(sz.y) - 0.5);
        int oy = int(floor(float(g_q.y) - sc.y + 0.5));
        int lean = e.w > 0.5 && oy >= 2 && sin(u_ptime * 1.5 - (qw.x * 0.8 + qw.y * 0.6) * 3.0) > 0.5 ? 1 : 0;   // (gusts over the lawn: tops lean a pixel)
        int ox = int(floor(float(g_q.x) - sc.x + 0.5)) - lean;
        if (hsf(ax, cz, 8, sd) < e.y) {   // (a clump: bigger, a step lighter, its top two, a dark line under it)
          if (oy == -1 && abs(ox) <= 2) shade = true;
          if (abs(ox) > 3 || oy < 0 || oy > 3 || oy <= best) continue;
          int m = CLUMPS[int(hsf(ax, cz, 6, sd) * 4.0) % 4], bit = oy * 7 + ox + 3; if (((m >> bit) & 1) == 0) continue;
          best = oy; col = rampAt(r, bb + (d > 0 ? (oy == 3 || ((m >> (bit + 7)) & 1) == 0 ? 2 : 1) : d)); continue; }
        if (oy == -1 && abs(ox) <= 1) shade = true;
        if (abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
        float hf = hsf(ax, cz, 5, sd); int fl = -1; if (nf > 0 && hf < F0.y) fl = 0; else if (nf > 1 && hf < F0.y + F1.x) fl = 1;
        int m = fl >= 0 ? 4548 : TUFTS[int(hsf(ax, cz, 6, sd) * 6.0) % 6];
        if (((m >> (oy * 5 + ox + 2)) & 1) == 0) continue;
        best = oy;
        if (fl == 0) col = int((ox == 0 && oy == 1 ? F0.z : F0.x) + 0.5); else if (fl == 1) col = int((ox == 0 && oy == 1 ? F1.y : F0.w) + 0.5);
        else col = rampAt(r, bb + (oy == 2 && d > 0 ? 2 : d)); }
      if (col >= 0) body = col; else if (shade) body = rampAt(r, bb - 1);
    }
    C.body = body; C.below = body; C.above = body; C.left = body; C.sel = ivec3(0, 0, 7);
  } else if (kind == 9) {   // needles: a conifer's tier lit as its cone, needle marks a step lighter, dark under the tier above
    int body = C.body; float fr; int L = nestL(p, fr); float mc = a.z * p * exp2(float(L)), mA = a.z * p * exp2(float(LMIN)); ivec3 mg = ivec3(floor(P / mc)); int best = -9; ivec2 sz = textureSize(u_idxTex, 0); mat3 V = mat3(u_pview);
    for (int kz = -1; kz <= 1; kz++) for (int ky = -1; ky <= 1; ky++) for (int kx = -1; kx <= 1; kx++) { ivec3 cL = mg + ivec3(kx, ky, kz); if (!shown3(cL, L, fr, sd)) continue; ivec3 c3 = atom3(cL, L, sd);
      if (hsf(c3.x, c3.y, c3.z, sd + 5) > a.y) continue;
      vec3 Q = (vec3(c3) + 0.15 + 0.7 * vec3(hsf(c3.x, c3.y, c3.z, sd), hsf(c3.x, c3.y, c3.z, sd + 1), hsf(c3.x, c3.y, c3.z, sd + 2))) * mA;
      if (dot(Q - P, Q - P) > mc * mc * 1.5) continue;
      vec3 vs = V * (Q - u_peye); float iw = u_portho > 0.5 ? 1.0 : 1.0 / max(-vs.z, 1e-6);
      vec2 sc = vec2((vs.x * iw / (u_tanF * u_asp) + 1.0) * 0.5 * float(sz.x) - 0.5, (vs.y * iw / u_tanF + 1.0) * 0.5 * float(sz.y) - 0.5);
      int ox = int(floor(float(g_q.x) - sc.x + 0.5)), oy = int(floor(float(g_q.y) - sc.y + 0.5));
      if (abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
      int m = NEEDLES[int(hsf(c3.x, c3.y, c3.z, sd + 6) * 4.0) % 4]; if (((m >> (oy * 5 + ox + 2)) & 1) == 0) continue;
      best = oy; body = rampAt(r, b + (b >= rlen(r) - 1 ? -1 : 1)); }
    C.body = body; C.below = body; C.left = body; C.above = rampAt(r, b - 2); C.key = ivec3(int(a.x + 0.5), 0, 9);
  } else if (kind == 10) {   // rock: plain stone with upright marks of cracks (two steps darker) and now and then a pebble of light
    int body = C.body; float fr; int L = nestL(p, fr); float mc = a.x * p * exp2(float(L)), mA = a.x * p * exp2(float(LMIN)); ivec3 mg = ivec3(floor(P / mc)); int best = -9; ivec2 sz = textureSize(u_idxTex, 0); mat3 V = mat3(u_pview);
    for (int kz = -1; kz <= 1; kz++) for (int ky = -1; ky <= 1; ky++) for (int kx = -1; kx <= 1; kx++) { ivec3 cL = mg + ivec3(kx, ky, kz); if (!shown3(cL, L, fr, sd)) continue; ivec3 c3 = atom3(cL, L, sd);
      if (hsf(c3.x, c3.y, c3.z, sd + 5) > a.y) continue;
      vec3 Q = (vec3(c3) + 0.15 + 0.7 * vec3(hsf(c3.x, c3.y, c3.z, sd), hsf(c3.x, c3.y, c3.z, sd + 1), hsf(c3.x, c3.y, c3.z, sd + 2))) * mA;
      if (dot(Q - P, Q - P) > mc * mc * 1.5) continue;
      vec3 vs = V * (Q - u_peye); float iw = u_portho > 0.5 ? 1.0 : 1.0 / max(-vs.z, 1e-6);
      vec2 sc = vec2((vs.x * iw / (u_tanF * u_asp) + 1.0) * 0.5 * float(sz.x) - 0.5, (vs.y * iw / u_tanF + 1.0) * 0.5 * float(sz.y) - 0.5);
      int ox = int(floor(float(g_q.x) - sc.x + 0.5)), oy = int(floor(float(g_q.y) - sc.y + 0.5));
      if (abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
      int mi = int(hsf(c3.x, c3.y, c3.z, sd + 6) * 4.0) % 4; if (((CRACKS[mi] >> (oy * 5 + ox + 2)) & 1) == 0) continue;
      best = oy; body = rampAt(r, b + (mi == 3 ? 1 : -2)); }
    C.body = body; C.below = body; C.above = body; C.left = body;
  } else if (kind == 8) {   // water: its own colour as it was made (shallows, foam), with ripples twinkling on it
    float fr; int L = nestL(p, fr); float cl = a.x * p * exp2(float(L)), cA = a.x * p * exp2(float(LMIN));
    C.body = -2; int ix = int(floor(P.x / cl)), iz = int(floor(P.z / cl)); C.sel = ivec3(0, 0, 8);
    ivec2 sz = textureSize(u_idxTex, 0); mat3 V = mat3(u_pview);
    for (int kz = -1; kz <= 1; kz++) for (int kx = -1; kx <= 1; kx++) { ivec2 c2 = ivec2(ix + kx, iz + kz); if (!shown2(c2, L, fr, sd)) continue;
      ivec2 at2 = atom2(c2, L, sd); int ax = at2.x, cz = at2.y;
      if (hsf(ax, cz, 4, sd) > a.y) continue; float ph = u_ptime * a.z + hsf(ax, cz, 7, sd); if (fract(ph) > 0.6) continue;
      vec3 vs = V * (vec3((float(ax) + 0.15 + 0.7 * hsf(ax, cz, 0, sd)) * cA, P.y, (float(cz) + 0.15 + 0.7 * hsf(ax, cz, 1, sd)) * cA) - u_peye); float iw = u_portho > 0.5 ? 1.0 : 1.0 / max(-vs.z, 1e-6);
      vec2 sc = vec2((vs.x * iw / (u_tanF * u_asp) + 1.0) * 0.5 * float(sz.x) - 0.5, (vs.y * iw / u_tanF + 1.0) * 0.5 * float(sz.y) - 0.5);
      int ox = int(floor(float(g_q.x) - sc.x + 0.5)), oy = int(floor(float(g_q.y) - sc.y + 0.5)), m = RIPPLES[int(hsf(ax, cz, 6, sd) * 4.0) % 4];
      if (abs(ox) <= 2 && oy >= 0 && oy <= 1 && ((m >> (oy * 5 + ox + 2)) & 1) != 0) { C.body = rampAt(r, b + 2); break; } }
    C.below = C.body; C.above = C.body; C.left = C.body;
  } else if (kind == 4) {   // grass: darker patches, tufts, flowers
    float ps = a.z, pn = sin(P.x / ps + 1.3 * sin(P.z / (ps * 1.7))) * sin(P.z / ps + 0.9 * sin(P.x / (ps * 1.3)));
    int bb = pn > 0.55 ? max(0, b - 1) : b; float cl = a.y * p; int ii = int(floor(P.x / cl)), kz = int(floor(P.z / cl));
    float h = hsf(ii, kz, 0, sd), cx = (float(ii) + 0.25 + 0.5 * hsf(ii, kz, 1, sd)) * cl, cz = (float(kz) + 0.25 + 0.5 * hsf(ii, kz, 2, sd)) * cl;
    float dx = (P.x - cx) / p, dz = (P.z - cz) / p, f = 0.0; int body = rampAt(r, bb); int nf = int(a.w + 0.5);
    vec4 F0 = u_patP[k * 4 + 1], F1 = u_patP[k * 4 + 2], F2 = u_patP[k * 4 + 3];
    float fc[3] = float[3](F0.y, F1.x, F1.w), fs[3] = float[3](F0.z, F1.y, F2.x), fm[3] = float[3](F0.w, F1.z, F2.y);
    bool done = false;
    for (int q = 0; q < 3; q++) { if (q >= nf || done) break; f += fs[q];
      if (h < f) { done = true; if (abs(dx) + abs(dz) < 1.1) body = int((abs(dx) < 0.5 && abs(dz) < 0.5 ? fm[q] : fc[q]) + 0.5); } }
    if (!done && h < f + a.x && abs(dz) < 0.6 && abs(dx) < 1.6) body = rampAt(r, bb + (bb >= rlen(r) - 2 ? -1 : 1));
    C.body = body; C.below = body; C.above = body; C.left = body; C.sel = ivec3(ii, kz, 4);
  }
  if (kind != 4 && kind != 7 && kind != 8) C.sel = C.key;
  return C; }
/* a pattern's detail, pinned to the world: stones, boards, tiles and thatch keep their real size at every zoom. Seen from far, where
   a screen pixel is bigger than the pattern's own, their seams go one by one: each cell joins its neighbour (along the course first,
   then course to course), each pair at its own moment as the camera draws back, so the stones merge and nothing moves; coming back in,
   the seams come back where they were. Points drawn as little pictures (tufts, marks, cracks, ripples) are pinned the same way,
   in nested sets (shown2/shown3). g_fp carries the size of a screen pixel on the surface to them */
ivec3 mergeKey(int kind, ivec3 k, int m) { if (m <= 0) return k;
  if (kind == 1) return ivec3(k.x, k.y >> max(0, m - 1), k.z >> (m + 1));   // stones: along the course first, then courses
  if (kind == 2) return ivec3(k.x >> max(0, m - 1), k.y >> m, k.z);          // boards: their ends first, then board to board
  if (kind == 3) return ivec3(k.x >> max(0, m - 1), k.y >> m, k.z);          // tiles: along the row, then rows
  if (kind == 6) return ivec3(k.x >> m, k.y, k.z);                           // thatch: course to course
  return k; }
Cell cellOf(int k, int r, vec3 P, vec3 n, vec3 fn, float t, float fp0) {
  /* (the level of detail is one for the whole picture, from the camera's distance alone: taken from each surface's slant it would
     differ from pixel to pixel, and change as the view turns, and the details would flicker) */
  float px0 = 1.0 / u_detail, fp = u_fpG; g_fp = fp;
  Cell C = cellAtL(k, r, P, n, fn, t, px0);
  if (C.key.x != -99999 && fp > px0) { int kind = int(u_patK4[k >> 2][k & 3] + 0.5); float lam = min(log2(fp / px0), 3.99); int m = int(floor(lam));
    ivec3 kn = mergeKey(kind, C.key, m + 1); C.key = hsf(kn.x, kn.y, kn.z, 4099) < lam - float(m) ? kn : mergeKey(kind, C.key, m); }
  return C; }
/* (smoothness: the cell of every pixel is worked out once, in a pass of its own (KEY_FS), and read here for the pixels round
   each one, instead of being worked out again for each of them) */
uniform highp isampler2D u_keyTex; uniform float u_keyOn;
ivec3 keyCalc(ivec2 q);
ivec3 keyAt(ivec2 q) { if (u_keyOn > 0.5) { ivec2 s = textureSize(u_keyTex, 0); if (q.x < 0 || q.y < 0 || q.x >= s.x || q.y >= s.y) return ivec3(-99999);
    ivec4 k = texelFetch(u_keyTex, q, 0); return k.w == 1 ? k.xyz : ivec3(-99999); } return keyCalc(q); }
ivec3 keyCalc(ivec2 q) { g_q = q; int i = dabAt(q); if (i < 0) return ivec3(-99999); if ((int(texelFetch(u_dat,ivec2(((i & 511)<<2)+2,i>>9),0).w) & 32768) != 0) return ivec3(-99999); vec4 A = pixA(i); if (A.x < 0.5 || A.z < 0.5) return ivec3(-99999);
  vec4 Bq = pixB(i); vec3 n = vec3(A.w, Bq.x, Bq.y); vec4 h = hitOf(q, i, n); return cellOf(int(A.z + 0.5) - 1, int(A.x + 0.5) - 1, h.xyz, n, unfoldN(Bq.zw, n), 0.5, h.w).key; }
bool differs(ivec3 k, ivec3 q) { return q.x != -99999 && q != k; }
const ivec2 N4o[4] = ivec2[4](ivec2(-1, 0), ivec2(1, 0), ivec2(0, -1), ivec2(0, 1)); bool g_pixed = false;
/* edge sprites (K.pixel.edge, an option): drawn first in a pass of their own (SPR_VS / SPR_FS: each stands on a point pinned to its
   surface), into u_sprLayer: which cell (8 + steps from the edge's own colour, or 100 + a palette colour), ramp and band */
uniform highp sampler2D u_sprLayer; uniform float u_sprOn, u_markA; bool g_spr = false;
${l ? `uniform highp sampler2D u_materialStyles;
${pe}
float materialLight(float t, int id, int rampSize, ivec2 p) {
  int code = int(texelFetch(u_materialStyles, ivec2(id & 511, id >> 9), 0).y);
  int mode = code & 7, steps = (code >> 3) & 127;
  if (mode == 0 && steps == 0) return t;
  int bands = min(steps == 0 ? rampSize : steps, rampSize) - 1;
  if (bands < 1) return t;
  float level = clamp(t, 0.0, 1.0) * float(bands);
  return (mode == 0 ? floor(level + 0.5) :
    floor(level) + float(fract(level) > pixelStyleThreshold(mode, p))) / float(bands);
}
` : ""}
vec3 pixColour(ivec2 p, vec3 c) {
  int i = dabAt(p); if (i < 0) return c;
  if ((int(texelFetch(u_dat,ivec2(((i & 511)<<2)+2,i>>9),0).w) & 32768) != 0) return c; vec4 A = pixA(i); if (A.x < 0.5) return c;
  // (only where the dab is what shows: nothing soft in front of it, no light carried onto it)
  vec4 t1 = texelFetch(u_dat, ivec2(((i & 511) << 2) + 1, i >> 9), 0); float pk = t1.w;
  vec3 baked = vec3(mod(pk, 256.0), mod(floor(pk / 256.0), 256.0), floor(pk / 65536.0)) / 255.0;
${f ? "\n  vec4 gain = relightAt(i);\n  float fogAmount = 0.0;\n  if (gain.w > 0.0) {\n    if (u_relightFogRange.x < 1.0 && u_relightFogRange.y > 0.0)\n      fogAmount = smoothstep(u_relightFogRange.x, 1.0, texelFetch(u_depth, p, 0).r) * u_relightFogRange.y;\n    baked = mix(min(vec3(1.0), baked * gain.rgb), u_relightFog, fogAmount);\n  }" : ""}
${t || u ? `
  vec3 center = texelFetch(u_dat, ivec2((i & 511) << 2, i >> 9), 0).xyz;
  float axial = ${t ? "-(u_waterView * vec4(center, 1.0)).z" : "dot(u_envEye-center,u_envBack)"};
  vec2 size = vec2(textureSize(u_scene, 0));` : ""}
${t ? "  vec3 mark;\n  baked = waterPaint(baked, vec2(p) + 0.5, size, axial, mark);" : ""}
${u ? "  baked = envMedia(baked, vec2(p) + 0.5, size, axial);" : ""}
  if (max(abs(baked.r - c.r), max(abs(baked.g - c.g), abs(baked.b - c.b))) > 0.03) return c;
  int r = int(A.x + 0.5) - 1; float dc = texelFetch(u_depth, p, 0).r, sum = 0.0, cnt = 0.0;
  vec4 Bq = pixB(i); vec3 n = vec3(A.w, Bq.x, Bq.y);
  /* the light, smoothed over the same surface round the pixel (the same ramp, near in depth): over three by three; with the light
     shaper (an option), over seven by seven and only where the surface faces much the same way, so the light and the shade fall in a
     few big shapes with smooth edges, not wherever the light of each dab happens to cross a step */
  // (near the edge of a surface the big window is cut in half, and its mean would pull a lit rim toward the middle, shading that
  // follows the outline: there the three by three is kept, and the two are blended by how much of the big window is surface)
  bool shp = u_shape > 0.5; float s7 = 0.0, c7 = 0.0;
  for (int dy = -3; dy <= 3; dy++) for (int dx = -3; dx <= 3; dx++) { bool small = abs(dx) <= 1 && abs(dy) <= 1, wide = shp && ((dx + dy) & 1) == 0; if (!small && !wide) continue;
    ivec2 q = p + ivec2(dx, dy); int j = dabAt(q); if (j < 0) continue; vec4 Aj = pixA(j);
    if (abs(Aj.x - A.x) > 0.5 || abs(texelFetch(u_depth, q, 0).r - dc) > 0.03) continue;
    if (small) { sum += Aj.y; cnt += 1.0; }
    if (wide) { vec4 Bj = pixB(j); if (dot(n, vec3(Aj.w, Bj.x, Bj.y)) >= 0.8) { s7 += Aj.y; c7 += 1.0; } } }
  float t = cnt > 0.0 ? sum / cnt : A.y;
  if (shp && c7 > 0.0) t = mix(t, s7 / c7, smoothstep(0.5, 0.85, c7 / 25.0));
  ${l ? "t = materialLight(t, i, rlen(r), p);" : ""}
  int ci;
  if (A.z < 0.5) ci = rampAt(r, bandOf(r, t));
  else { vec4 h = hitOf(p, i, n); g_q = p; Cell C = cellOf(int(A.z + 0.5) - 1, r, h.xyz, n, unfoldN(Bq.zw, n), t, h.w); ci = C.body;
    if (C.key.x != -99999) { if (differs(C.key, keyAt(p - ivec2(0, 1)))) ci = C.below; else if (differs(C.key, keyAt(p - ivec2(1, 0)))) ci = C.left; else if (differs(C.key, keyAt(p + ivec2(0, 1)))) ci = C.above; } }
  if (ci == -2) return c;   // (a pattern that keeps the colour the dab was made with, here and there drawn over)
  /* outlines (look.outline): at the edge of a thing, where it meets another material, the background or something well behind it,
     the nearer pixel takes a darker step of its own ramp, so each thing is ringed in its own darker colour (a lit one more softly) */
  if (u_ol > 0.5 && !lineOff(r) && dc > -0.5) { bool edge = false, sky = false;
    ivec2 omx = textureSize(u_depth, 0) - 1;
    for (int k = 0; k < 4; k++) { ivec2 q = p + N4o[k]; if (texelFetch(u_depth, q, 0).r < -0.5) continue; float dd = texelFetch(u_depth, q, 0).r - dc; if (dd <= u_olEps) continue;
      // (a break must carry on past the next pixel or two: a hole in a surface, where what lies under it shows through, is not an edge)
      if (texelFetch(u_depth, clamp(p + 2 * N4o[k], ivec2(0), omx), 0).r - dc <= u_olEps || texelFetch(u_depth, clamp(p + 3 * N4o[k], ivec2(0), omx), 0).r - dc <= u_olEps) continue;
      int j = dabAt(q); if (j < 0 || dd > u_olGap) { edge = true; sky = sky || texelFetch(u_depth, q, 0).r >= 0.995; break; } vec4 Aj = pixA(j); if (!sameStuff(int(Aj.x + 0.5) - 1, r)) { edge = true; break; } }
    // (and a crease: where its own surface turns sharply, the lit side a step lighter, the other a step darker; not in leaves or grass)
    int ck = 0; bool soft = false; if (A.z > 0.5) { int kk = int(A.z + 0.5) - 1; int kd = int(u_patK4[kk >> 2][kk & 3] + 0.5); soft = kd == 5 || kd == 7; }
    if (!edge && !soft) for (int k = 0; k < 4; k++) { ivec2 q = p + N4o[k]; int j = dabAt(q); if (j < 0) continue; vec4 Aj = pixA(j);
      if (abs(Aj.x - A.x) > 0.5 || abs(texelFetch(u_depth, q, 0).r - dc) > u_olGap) continue; vec4 Bj = pixB(j);
      if (dot(n, vec3(Aj.w, Bj.x, Bj.y)) > 0.7) continue; ck = A.y >= Aj.y ? 1 : -1; break; }
    if (edge || ck != 0) { int bb = -1; for (int k = 0; k < 8; k++) { if (k >= rlen(r)) break; if (rampAt(r, k) == ci) { bb = k; break; } }
      // (a rim in the light takes a softer line than one in shade, or none against another thing: so the outline does not darken a
      // shape all round, whichever way it faces, which is pillow shading)
      int kk2 = bb * 2 >= rlen(r) ? (sky ? 1 : 0) : u_olK;
      if (bb >= 0) ci = rampAt(r, edge ? max(0, bb - kk2) : bb + ck); } }
  g_pixed = true;
  vec3 surfaceColor = u_pal[clamp(ci,0,63)];
  ${f ? "if (gain.w > 0.0) surfaceColor = mix(min(vec3(1.0), surfaceColor * gain.rgb), u_relightFog, fogAmount);" : ""}
  ${t ? "surfaceColor = waterPaint(surfaceColor,vec2(p)+0.5,size,axial,mark);" : ""}
  ${u ? "surfaceColor = envMedia(surfaceColor,vec2(p)+0.5,size,axial);" : ""}
  return surfaceColor; }
const int GPET[12] = int[12](0, 3, 1, 4, 0, 3, 2, 4, 0, 3, 1, 4); const int GOUT[6] = int[6](3, 1, 4, 2, 0, 1);
vec3 glassPane(vec2 q) {
  float r = length(q) / u_gw.w * 2.6, a = fract(atan(q.y, q.x) / 6.2831853 + 1.0);
  if (r > 2.52) return vec3(0.0); if (r < 0.5) return u_gc[5]; if (r < 0.64) return vec3(0.0);
  if (r < 1.72) { float s = a * 12.0, k = floor(s), f = s - k, w = 0.07 / r; if (f < w || f > 1.0 - w) return vec3(0.0); if (r > 1.2 && abs(f - 0.5) > 0.5 - (r - 1.2) * 0.75) return vec3(0.0); return r < 0.98 ? u_gc[5] : u_gc[GPET[int(k) % 12]]; }
  if (r < 1.86) return vec3(0.0); float s = a * 24.0 + 0.5, k = floor(s), f = s - k; if (f < 0.07 || f > 0.93) return vec3(0.0);
  return length(vec2((f - 0.5) * 0.6, (r - 2.19) * 1.25)) < 0.36 ? u_gc[GOUT[int(k) % 6]] : vec3(0.0);
}
float glassHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float glassHaze(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(glassHash(i), glassHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(glassHash(i + vec3(0.0, 1.0, 0.0)), glassHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(glassHash(i + vec3(0.0, 0.0, 1.0)), glassHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(glassHash(i + vec3(0.0, 1.0, 1.0)), glassHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
// sunlight through gaps in a canopy (a diorama's .glass with mode 'gaps', from K.dapple): each gap lets down a shaft along the light. A line
// of sight lights up by how much of a shaft it passes through, but only until it is well inside: a shaft is a flat, even band of light.
// Four looks along the part it passes through say how strong the band is there: it eases in just under its gap, thins as it goes down,
// is thicker where the haze drifts, and fades out toward the ground and toward the edge of the stand (the diorama's .glass at and r), so
// a shaft never ends on a hard line whatever it is seen from. With steps, the light is banded into that many levels, dithered only where
// one level gives way to the next, so a shaft is drawn as flat pixel tones are, with a stippled edge
uniform float u_gm, u_gq, u_gfl; uniform vec4 u_gh[24]; uniform int u_ghn;
vec3 glassGaps(vec3 c, ivec2 p, float dn, vec2 res) {
  vec2 ndc = (vec2(p) + 0.5) / res * 2.0 - 1.0; vec3 rv = u_gortho > 0.5 ? vec3(0.0, 0.0, -1.0) : normalize(vec3(ndc.x * u_gcam.x, ndc.y * u_gcam.y, -1.0)), dir = transpose(mat3(u_gview)) * rv;
  vec3 ge = u_gortho > 0.5 ? u_geye + transpose(mat3(u_gview)) * vec3(ndc.x * u_gcam.x, ndc.y * u_gcam.y, 0.0) : u_geye;   // (orthographic: parallel lines of sight)
  // (where nothing is drawn the line of sight goes on through the air: it is not stopped at the far side of the stand)
  float tmax = dn >= 0.999 ? 1e4 : (u_gcam.z + min(dn, 1.0) * (u_gcam.w - u_gcam.z)) / max(-rv.z, 0.05), sw = 0.0; vec3 sc = vec3(0.0);
  for (int i = 0; i < 24; i++) { if (i >= u_ghn) break;
    vec4 h = u_gh[i]; vec3 hc = h.xyz + vec3(sin(u_gtime * 0.7 + float(i) * 1.7), 0.0, cos(u_gtime * 0.6 + float(i) * 2.3)) * 0.05 * h.w;
    vec3 oc = ge - hc; float dd = dot(dir, u_gd), od = dot(oc, u_gd), A = 1.0 - dd * dd, Bq = dot(oc, dir) - od * dd, C = dot(oc, oc) - od * od - h.w * h.w, disc = Bq * Bq - A * C;
    if (A < 1e-5 || disc <= 0.0) continue;
    float sq = sqrt(disc), t0 = max((-Bq - sq) / A, 0.0), t1 = min((-Bq + sq) / A, tmax), lo = u_gfl - 0.6;
    if (abs(dir.y) > 1e-5) { float ty = (hc.y - ge.y) / dir.y, tf = (lo - ge.y) / dir.y; if (dir.y < 0.0) { t0 = max(t0, ty); t1 = min(t1, tf); } else { t0 = max(t0, tf); t1 = min(t1, ty); } }
    else if (ge.y > hc.y || ge.y < lo) continue;
    if (t1 <= t0) continue;
    float f = 0.0;
    for (int k = 0; k < 4; k++) { vec3 Q = ge + dir * mix(t0, t1, (float(k) + 0.5) / 4.0); float s = (hc.y - Q.y) / max(-u_gd.y, 0.05);
      f += smoothstep(0.0, 0.9, s) * smoothstep(lo, u_gfl + 0.6, Q.y) * (1.0 - smoothstep(u_gw.w * 0.72, u_gw.w, length(Q.xz - u_gw.xz))) * exp(-s * 0.09)
         * (0.8 + 0.45 * glassHaze(Q * 0.6 + vec3(u_gtime * 0.11, -u_gtime * 0.05, u_gtime * 0.07))); }
    float w = min(1.0, (t1 - t0) / (0.6 * h.w)) * f * 0.25 * (0.88 + 0.12 * sin(u_gtime * 1.3 + float(i) * 2.1));
    sc += u_gc[i - (i / 6) * 6] * w; sw += w; }
  if (sw <= 0.0) return c;
  vec3 col = sc / sw; float a = min(sw, 1.6);
  if (u_gq > 0.0) { float th = (BAYER[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0 - 0.5; a = floor(a * u_gq + 0.5 + th * 0.5) / u_gq; }   // (stippled only near a level's edge)
  return c + col * a * u_gk;
}
vec3 glassAir(vec3 c, ivec2 p, float dn, vec2 res) {
  if (u_gk <= 0.0) return c;
  if (u_gm > 0.5) return glassGaps(c, p, dn, res);
  vec2 ndc = (vec2(p) + 0.5) / res * 2.0 - 1.0; vec3 rv = u_gortho > 0.5 ? vec3(0.0, 0.0, -1.0) : normalize(vec3(ndc.x * u_gcam.x, ndc.y * u_gcam.y, -1.0)), dir = transpose(mat3(u_gview)) * rv;
  vec3 ge = u_gortho > 0.5 ? u_geye + transpose(mat3(u_gview)) * vec3(ndc.x * u_gcam.x, ndc.y * u_gcam.y, 0.0) : u_geye;   // (orthographic: parallel lines of sight)
  float tmax = (u_gcam.z + min(dn, 1.0) * (u_gcam.w - u_gcam.z)) / max(-rv.z, 0.05);
  vec3 oc = ge - u_gw.xyz; float dd = dot(dir, u_gd), od = dot(oc, u_gd), A = 1.0 - dd * dd, Bq = dot(oc, dir) - od * dd, C = dot(oc, oc) - od * od - u_gw.w * u_gw.w, disc = Bq * Bq - A * C;
  if (A < 1e-5 || disc <= 0.0) return c;
  float sq = sqrt(disc), t0 = max((-Bq - sq) / A, 0.0), t1 = min((-Bq + sq) / A, tmax), tm = -Bq / A, tw = 0.3 * sq / A; if (t1 <= t0) return c;
  // (the middle of the beam counts for most: what is seen is mainly the row of panes straight through its axis, drawn out along the light, so the
  // shafts keep their own colours side by side; the rest of the depth adds a little of everything, which is the haze)
  float jit = fract(52.9829189 * fract(dot(vec2(p), vec2(0.06711056, 0.00583715)))), dt = (t1 - t0) / 32.0, T = 1.0; vec3 sc = vec3(0.0);
  for (int i = 0; i < 32; i++) { vec3 P = ge + dir * (t0 + (float(i) + jit) * dt); float s = (P.z - u_gw.z) / u_gd.z; if (s < 0.05 || P.y < -0.05) continue;
    float dens = (0.45 + 1.0 * glassHaze(P * 0.5 + vec3(u_gtime * 0.07, -u_gtime * 0.04, u_gtime * 0.05))) * exp(-s * 0.02);
    float tt = (t0 + (float(i) + jit) * dt - tm) / tw; sc += T * glassPane(P.xy - u_gd.xy * s - u_gw.xy) * dens * dt * (0.22 + 1.9 * exp(-tt * tt)); T *= exp(-dens * dt * 0.03); }
  float lum = dot(sc, vec3(0.3, 0.55, 0.15)); sc = max(vec3(0.0), mix(vec3(lum), sc, 1.45));
  return c * mix(1.0, T, 0.7) + sc * u_gk;
}
// with coloured contours on, the inside of things comes from the picture drawn at its own size: glass bends that picture and contact shade
// darkens it here, exactly as they do in the plain look below
#define PIXEL_NATIVE
vec3 pixelNative(ivec2 p) {
  ivec2 mx = textureSize(u_crispDepth, 0) - 1; vec3 c = texelFetch(u_crispScene, p, 0).rgb; vec4 dm = texelFetch(u_crispDepth, p, 0);
  vec2 gg = vec2(texelFetch(u_crispDepth, clamp(p + ivec2(1, 0), ivec2(0), mx), 0).g - texelFetch(u_crispDepth, clamp(p - ivec2(1, 0), ivec2(0), mx), 0).g, texelFetch(u_crispDepth, clamp(p + ivec2(0, 1), ivec2(0), mx), 0).g - texelFetch(u_crispDepth, clamp(p - ivec2(0, 1), ivec2(0), mx), 0).g);
  if (dm.g + abs(gg.x) + abs(gg.y) > 0.0) c = texelFetch(u_crispScene, clamp(p + ivec2(round(gg * u_refract)), ivec2(0), mx), 0).rgb;
  if (u_ao > 0.0) { float occ = 0.0; for (int i = 0; i < 8; i++) { float dd = (dm.r - texelFetch(u_crispDepth, clamp(p + AOT[i], ivec2(0), mx), 0).r) / u_aor; if (dd > 0.08 && dd < 3.0) occ += min(1.0, dd); } c *= 1.0 - u_ao * min(1.0, occ / 4.0); }
  return c;
}
${c ? "\nuniform highp sampler2D u_glassBoundary, u_glassBack, u_glassThrough;\nuniform vec2 u_glassRange;\nuniform mat4 u_glassProjection;\nfloat glassDepth(vec4 info) {\n  return dot(floor(info.rgb*255.0+0.5),vec3(1.0,256.0,65536.0)) / 16777215.0;\n}\nvec3 refractContributions(ivec2 p, vec3 color) {\n  vec4 front=texelFetch(u_glassBoundary,p,0);\n  if (front.a==0.0) return color;\n  float through=texelFetch(u_glassThrough,p,0).r;\n  if (through<=0.0 || texelFetch(u_depth,p,0).g==0.0) return color;\n  ivec2 mx=textureSize(u_depth,0)-1;\n  vec2 delta=vec2(texelFetch(u_depth,clamp(p+ivec2(1,0),ivec2(0),mx),0).g-texelFetch(u_depth,clamp(p-ivec2(1,0),ivec2(0),mx),0).g,\n    texelFetch(u_depth,clamp(p+ivec2(0,1),ivec2(0),mx),0).g-texelFetch(u_depth,clamp(p-ivec2(0,1),ivec2(0),mx),0).g);\n  ivec2 source=clamp(p+ivec2(round(delta*u_refract)),ivec2(0),mx);\n  if (all(equal(source,p))) return color;\n  bool rear=texelFetch(u_glassBoundary,source,0).a>0.0;\n  if (!rear) {\n    float axial=mix(u_glassRange.x,u_glassRange.y,texelFetch(u_depth,source,0).r);\n    vec4 clip=u_glassProjection*vec4(0.0,0.0,-axial,1.0);\n    if (clip.z/clip.w*0.5+0.5 < glassDepth(front)) return color;\n  }\n  vec3 shifted=rear?texelFetch(u_glassBack,source,0).rgb:texelFetch(u_scene,source,0).rgb;\n  return clamp(color + (shifted-texelFetch(u_glassBack,p,0).rgb)*through,0.0,1.0);\n}" : ""}
${e.glsl}
${a ? _e(o) : ""}
// a hole a pixel across in a surface (its dabs, seen nearly edge on, leave gaps, and what lies under it or far behind shows through, as
// dark broken lines across the ground): it is drawn as the nearer of the pixels either side of it, which lie on the surface
ivec2 holeFill(ivec2 p) { ivec2 ms = textureSize(u_depth, 0) - 1; float d0 = texelFetch(u_depth, p, 0).r;
  // (colour per pixel knows which dab is in front at each pixel: a pixel with none, between two that have one, is a hole whatever the
  // depths say: dabs left out of outlines write none)
  if (u_pixOn > 0.5 && dabAt(p) < 0) for (int ax = 0; ax < 2; ax++) { ivec2 o = ax == 0 ? ivec2(0, 1) : ivec2(1, 0); if (dabAt(p + o) >= 0 && dabAt(p - o) >= 0) return p + o; }
  for (int ax = 0; ax < 2; ax++) { ivec2 o = ax == 0 ? ivec2(0, 1) : ivec2(1, 0), qa = clamp(p + o, ivec2(0), ms), qb = clamp(p - o, ivec2(0), ms);
    float da = texelFetch(u_depth, qa, 0).r, db = texelFetch(u_depth, qb, 0).r, gap = d0 - max(da, db);
    if (min(d0, min(da, db)) > -0.5 && gap > 0.004 && abs(da - db) < 0.6 * gap) return da < db ? qa : qb; }
  return p; }
// the finished colour of one pixel of the picture, in whichever look is on
vec3 plainAt(ivec2 p) {
  p = holeFill(p);
  vec3 c = texelFetch(u_scene, p, 0).rgb;
  ${c ? "c = refractContributions(p,c);" : ""}
  g_pixed = false;
  if (u_pixOn > 0.5) { if (u_sprOn > 0.5) {
${t || u || f ? "      vec4 sl = texelFetch(u_sprLayer, p, 0); if (sl.a > 0.5) { g_spr = true; g_pixed = true; return sl.rgb; }" : "      vec4 sl = texelFetch(u_sprLayer, p, 0) * 255.0; if (sl.a > 127.0) { int v = int(sl.r + 0.5), ci = v >= 100 ? v - 100 : rampAt(int(sl.g + 0.5), int(sl.b + 0.5) + v - 8); g_spr = true; g_pixed = true; return u_pal[clamp(ci, 0, 63)]; }"} }
    if (u_paintOn) {
      vec3 paint = texelFetch(u_crispScene, p, 0).rgb;
      float through = 1.0 - texelFetch(u_crispDepth, p, 0).r;
      if (through > 0.01) {
        vec3 base = pixColour(p, clamp((c - paint) / through, 0.0, 1.0));
        if (g_pixed) c = paint + base * through;
      }
    } else c = pixColour(p, c);
  }
  // outline: this pixel sits clearly behind a neighbour, so it is the edge of something nearer
  ivec2 mx = textureSize(u_depth, 0) - 1;
  float dc = texelFetch(u_depth, p, 0).r;
  float dl = texelFetch(u_depth, clamp(p - ivec2(1, 0), ivec2(0), mx), 0).r, dr = texelFetch(u_depth, clamp(p + ivec2(1, 0), ivec2(0), mx), 0).r;
  float du = texelFetch(u_depth, clamp(p + ivec2(0, 1), ivec2(0), mx), 0).r, db = texelFetch(u_depth, clamp(p - ivec2(0, 1), ivec2(0), mx), 0).r;
  // glass bends what is behind it: the picture is looked up a little to one side, by how the thickness of glass changes across this pixel
  ${s ? "" : "{ vec2 gg = vec2(texelFetch(u_depth, clamp(p + ivec2(1, 0), ivec2(0), mx), 0).g - texelFetch(u_depth, clamp(p - ivec2(1, 0), ivec2(0), mx), 0).g, texelFetch(u_depth, clamp(p + ivec2(0, 1), ivec2(0), mx), 0).g - texelFetch(u_depth, clamp(p - ivec2(0, 1), ivec2(0), mx), 0).g);\n    if (texelFetch(u_depth, p, 0).g + abs(gg.x) + abs(gg.y) > 0.0) c = texelFetch(u_scene, clamp(p + ivec2(round(gg * u_refract)), ivec2(0), mx), 0).rgb; }"}
  // where a diorama asks for it, a pixel with nearer things close round it is shaded: what moves still sits in its own shadow
  if (u_ao > 0.0) { float occ = 0.0;
    for (int i = 0; i < 8; i++) { float dd = (dc - texelFetch(u_depth, clamp(p + AOT[i], ivec2(0), mx), 0).r) / u_aor; if (dd > 0.08 && dd < 3.0) occ += min(1.0, dd); } c *= 1.0 - u_ao * min(1.0, occ / 4.0); }
  // part lines (a diorama's look.lines): the near side of a break in depth takes a darker shade of its own colour, or a lighter one
  // where the break is toward the light (up or to the left), as pixel art outlines a thing. (Second differences, so a floor that
  // only recedes is not a break)
  float dl2 = texelFetch(u_depth, clamp(p - ivec2(2, 0), ivec2(0), mx), 0).r, dr2 = texelFetch(u_depth, clamp(p + ivec2(2, 0), ivec2(0), mx), 0).r;
  float du2 = texelFetch(u_depth, clamp(p + ivec2(0, 2), ivec2(0), mx), 0).r, db2 = texelFetch(u_depth, clamp(p - ivec2(0, 2), ivec2(0), mx), 0).r;
  // (a dab left out of outlines writes no depth, -1: a neighbour like that is taken as level with this pixel, and such a pixel takes
  // no line, so where one ground that is left out meets one that is not, no line runs along the seam)
  if (dl < -0.5) dl = dc; if (dr < -0.5) dr = dc; if (du < -0.5) du = dc; if (db < -0.5) db = dc; if (dl2 < -0.5) dl2 = dc; if (dr2 < -0.5) dr2 = dc; if (du2 < -0.5) du2 = dc; if (db2 < -0.5) db2 = dc;
  // (a break in depth must show two pixels out as well as one: a hole in a surface, a pixel wide, where what lies under it shows
  // through, is not the edge of anything)
  if (u_lines > 0.0 && dc > -0.5 && !(g_pixed && u_ol > 0.5)) { float sx = min(dl + dr, dl2 + dr2) - 2.0 * dc, sy = min(du + db, du2 + db2) - 2.0 * dc;
    if (max(sx, sy) > u_lineGap) { bool litSide = sx >= sy ? dl > dr : du > db; c *= litSide ? u_lineLit : u_lineK; } }
  float dm = dc - max(2.0 * dc - min(dl + dr, dl2 + dr2), 2.0 * dc - min(du + db, du2 + db2));   // second difference, so a receding floor is not an edge
  if (u_edge > 0.0 && dc > -0.5 && dc - dm > u_edge) {
    if (u_remapLine > 0) return glassAir(u_out[u_remapLine - 1], p, dc, vec2(textureSize(u_depth, 0)));
    c = u_line;
  }
  ${s ? "return glassAir(c, p, dc, vec2(textureSize(u_depth, 0)));" : ""}
  ${s ? "" : "else {"}
${a ? "    vec3 constrained; if (constrainPalette(p, c, constrained)) { g_constrained = true; return constrained; }" : ""}
    float th = (BAYER[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0 - 0.5;
    c = clamp(c + th * u_dither, 0.0, 1.0);
  ${s ? "" : "}"}
  if (u_toneOn > 0.5) { float lu = dot(c, vec3(0.30, 0.55, 0.15)); if (lu <= u_toneCut) return vec3(0.0);
    float v = (lu - u_toneCut) / (1.0 - u_toneCut); int lo = 0; for (int i = 0; i < 46; i++) { if (lo >= u_toneN - 2 || v <= texelFetch(u_toneStops, ivec2(lo + 1, 0), 0).a) break; lo++; }
    vec4 s0 = texelFetch(u_toneStops, ivec2(lo, 0), 0), s1 = texelFetch(u_toneStops, ivec2(lo + 1, 0), 0); ivec2 th = ${p ? "u_toneThSize" : "textureSize(u_toneTh, 0)"}, sz = textureSize(u_depth, 0);
    ivec2 rankAt = ivec2(p.x % th.x, (sz.y - 1 - p.y) % th.y);
    float share = (v - s0.a) / max(1e-5, s1.a - s0.a),
      rank = ${p ? "texelFetch(u_toneStops, rankAt + ivec2(0, 1), 0).r" : "texelFetch(u_toneTh, rankAt, 0).r"};
    return share >= 0.5 + (rank - 0.5) * u_toneAmt ? s1.rgb : s0.rgb; }
  vec3 best = u_pal[0]; float bd = 1e9; int bi = 0;
  for (int i = 0; i < 64; i++) {
    if (i >= u_n) break;
    vec3 df = c - u_pal[i];
    float d = u_luma > 0.5 ? abs(dot(df, vec3(0.299, 0.587, 0.114))) : dot(df * df, vec3(0.30, 0.55, 0.15));
    if (d < bd) { bd = d; best = u_pal[i]; bi = i; }
  }
  bool lit = texelFetch(u_depth, p, 0).b > 0.3 + ((BAYER[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0 - 0.5) * 0.3;
  return glassAir(u_grade > 0.5 ? (lit ? u_outl[bi] : u_out[bi]) : best, p, dc, vec2(textureSize(u_depth, 0)));
}
bool like(vec3 a, vec3 b) { vec3 d = abs(a - b); return max(d.r, max(d.g, d.b)) < 0.004; }
vec3 lookAt(ivec2 p) {
  if (u_colored > 0.5) {
${a ? "    vec3 constrained; if (constrainPalette(p, pixelNative(p), constrained)) { g_constrained = true; return constrained; }" : ""}
    vec3 c = pixelResolve(p); vec4 dq = texelFetch(u_crispDepth, p, 0);
    if (u_grade > 0.5 && dq.b > 0.3 + ((BAYER[(p.x & 3) + ((p.y & 3) << 2)] + 0.5) / 16.0 - 0.5) * 0.3) { for (int j = 0; j < 64; j++) { if (j >= u_n) break; if (like(c, u_out[j])) { c = u_outl[j]; break; } } }   // under a carried light
    return glassAir(c, p, dq.r, vec2(textureSize(u_crispScene, 0))); }
  return plainAt(p);
}
float depthAt(ivec2 p) { return u_colored > 0.5 ? texelFetch(u_crispDepth, p, 0).r : texelFetch(u_depth, p, 0).r; }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  if (u_bars > 0.0 && abs(gl_FragCoord.y / float(textureSize(u_crispScene, 0).y) - 0.5) > 0.5 - u_bars) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }   /* letterbox bars, when a diorama asks for them */
${t ? "  p = waterPixel(p);" : ""}
  if (u_bypass > 0.5) { o = vec4(texelFetch(u_scene, p, 0).rgb, 1.0); return; }
  vec3 c0 = lookAt(p);
  o = vec4(c0, (g_spr${a ? " || g_constrained" : ""}) && u_markA > 0.5 ? 0.5 : 1.0);
}`, _ = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_look, u_dep;
uniform highp sampler2D u_detailOwners, u_detailFlags;
uniform float u_keep, u_lineClean;
uniform bool u_scopedOnly, u_hasDetailFlags, u_detailWater;
out vec4 o;
${h}
bool like(vec3 a, vec3 b) { vec3 d = abs(a - b); return max(d.r, max(d.g, d.b)) < 0.004; }
vec3 at(ivec2 p) { return texelFetch(u_look, clamp(p, ivec2(0), textureSize(u_look, 0) - 1), 0).rgb; }
float dp(ivec2 p) { ivec2 q = clamp(p, ivec2(0), textureSize(u_dep, 0) - 1); return texelFetch(u_look, q, 0).a < 0.75 ? 0.5 : texelFetch(u_dep, u_detailWater ? waterPixel(q) : q, 0).r; }
const ivec2 N8[8] = ivec2[8](ivec2(-1, 0), ivec2(1, 0), ivec2(0, -1), ivec2(0, 1), ivec2(-1, -1), ivec2(1, -1), ivec2(-1, 1), ivec2(1, 1));
int detailFlags(ivec2 p) {
  if (!u_hasDetailFlags) return 0;
  ivec3 owner = ivec3(round(texelFetch(u_detailOwners, u_detailWater ? waterPixel(p) : p, 0).rgb * 255.0));
  int i = owner.r + owner.g * 256 + owner.b * 65536 - 1;
  if (i < 0) return 0;
  return 8 | int(texelFetch(u_detailFlags, ivec2((i >> 2) & 511, i >> 11), 0)[i & 3]);
}
bool protects(int flags) { return (flags & 6) != 0; }
int likes(ivec2 p, vec3 c, out ivec2 one) { int n = 0; one = p; for (int i = 0; i < 8; i++) if (like(c, at(p + N8[i]))) { n++; one = p + N8[i]; } return n; }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy); vec3 c0 = at(p); ivec2 q, q2;
  float alpha = texelFetch(u_look, p, 0).a;
  int flags = detailFlags(p);
  if (alpha < 0.75 || (flags & 2) != 0 || (u_scopedOnly && (flags & 1) == 0)) {
    o = vec4(c0, 1.0); return;
  }
  // outlines: a notch (an empty pixel with things on three or four sides) is filled from them, a bump (a pixel of a thing with
  // nothing on three or four sides) is taken off, so the edge of a thing against the background runs clean
  { bool e0 = dp(p) >= 0.995; int en = 0;
    for (int i = 0; i < 4; i++) {
      ivec2 q = clamp(p + N8[i], ivec2(0), textureSize(u_look, 0) - 1);
      if (dp(q) >= 0.995) en++;
      if (u_hasDetailFlags && (e0 || (flags & 8) == 0) &&
          protects(detailFlags(q))) { o = vec4(c0, 1.0); return; }
    }
    if (!e0 && en > 0 && protects(flags)) { o = vec4(c0, 1.0); return; }
    if (e0 && en <= 1) { int kb = 0, ib = -1; for (int i = 0; i < 4; i++) { if (dp(p + N8[i]) >= 0.995) continue; int k = 0; for (int j = 0; j < 4; j++) if (like(at(p + N8[i]), at(p + N8[j]))) k++; if (k > kb) { kb = k; ib = i; } }
      if (ib >= 0) { o = vec4(at(p + N8[ib]), 1.0); return; } }
    if (!e0 && en >= 3) { for (int i = 0; i < 4; i++) if (dp(p + N8[i]) >= 0.995) { o = vec4(at(p + N8[i]), 1.0); return; } } }
  /* the line cleaner (an option): a one-pixel kink in a straight edge between two colours is taken off (a pixel with one colour across
     from it and on both sides, its own colour carrying on straight behind it, takes the other colour: a bump, or a dent, filled);
     and on a dark line one pixel thick, the extra pixel at the inside corner of a step (a double) takes the colour beside it, so the
     line meets corner to corner as a pixel artist draws it */
  if (u_lineClean > 0.5) {
    for (int k = 0; k < 4; k++) { ivec2 d = N8[k], e = ivec2(d.y, d.x); vec3 X = at(p + d);
      if (like(X, c0) || !like(at(p + e), X) || !like(at(p - e), X)) continue;
      if (like(at(p - d), c0) && like(at(p - d + e), c0) && like(at(p - d - e), c0)) { o = vec4(X, 1.0); return; } }
    float l0 = dot(c0, vec3(0.3, 0.55, 0.15));
    for (int k = 4; k < 8; k++) { ivec2 dg = N8[k], h = ivec2(dg.x, 0), v = ivec2(0, dg.y);
      if (!like(at(p + h), c0) || !like(at(p + v), c0) || like(at(p + dg), c0) || like(at(p - h), c0) || like(at(p - v), c0)) continue;
      // (the line goes on past both arms, and is darker than what lies on the other side of the corner)
      bool goH = like(at(p + 2 * h), c0) || like(at(p + 2 * h - v), c0), goV = like(at(p + 2 * v), c0) || like(at(p + 2 * v - h), c0);
      vec3 a = at(p - h), b = at(p - v);
      if (goH && goV && dot(a, vec3(0.3, 0.55, 0.15)) > l0 + 0.06 && dot(b, vec3(0.3, 0.55, 0.15)) > l0 + 0.06) { o = vec4(like(a, b) ? a : at(p - h - v), 1.0); return; } } }
  int n = likes(p, c0, q);
  bool speck = n == 0 || (n == 1 && likes(q, c0, q2) == 1);
  if (speck) {
    vec3 nb[8]; for (int i = 0; i < 8; i++) nb[i] = at(p + N8[i]);
    int kb = 0; int ib = 0;
    for (int i = 0; i < 8; i++) { if (like(nb[i], c0)) continue; int k = 0; for (int j = 0; j < 8; j++) if (like(nb[i], nb[j])) k++; if (k > kb) { kb = k; ib = i; } }
    float lum0 = dot(c0, vec3(0.3, 0.55, 0.15)), lum1 = dot(nb[ib], vec3(0.3, 0.55, 0.15));
    if (kb >= 3 && abs(dp(p) - dp(p + N8[ib])) < 0.03 && abs(lum0 - lum1) < u_keep) c0 = nb[ib];
  }
  o = vec4(c0, 1.0);
}`, v = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D u_anc, u_dat, u_sprTex; uniform mat4 u_view, u_proj; uniform vec2 u_vp, u_rng; uniform float u_time, u_keep, u_ortho; uniform vec4 u_rmpN4[16];
flat out ivec2 v_a; flat out ivec4 v_i; flat out float v_dA, v_axial; flat out vec3 v_P, v_N;
${f ? "flat out int v_relightOwner;" : ""}
vec4 sprT(int x, int y) { return texelFetch(u_sprTex, ivec2(x, y), 0); }
int rlen(int r) { return int(u_rmpN4[r >> 2][r & 3] + 0.5) & 15; }
void main() {
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  int i = gl_InstanceID; ivec2 b = ivec2((i & 255) * 3, i >> 8);
  vec4 t0 = texelFetch(u_anc, b, 0), t1 = texelFetch(u_anc, b + ivec2(1, 0), 0), t2 = texelFetch(u_anc, b + ivec2(2, 0), 0);
  int k = int(t2.x + 0.5); vec4 E0 = sprT(0, k), E1 = sprT(1, k);
  if (t1.w >= u_keep * E1.w) return;
  int j = int(t0.w + 0.5); vec4 m2 = texelFetch(u_dat, ivec2(((j & 511) << 2) + 2, j >> 9), 0), m3 = texelFetch(u_dat, ivec2(((j & 511) << 2) + 3, j >> 9), 0);
  if ((int(m2.w) & 32768) != 0) return;
  ${f ? "v_relightOwner = j;" : ""}
  vec3 pos = t0.xyz;
  if (int(m2.w + 0.5) % 16 == 11) { pos.x += m3.z * sin(u_time * m3.y + pos.y * 1.3 + pos.z * 0.9 + m3.x); pos.y += m3.z * 0.6 * sin(u_time * m3.y * 1.3 + pos.x * 1.1 + m3.x); }
  vec4 cam = u_view * vec4(pos, 1.0); if (cam.z > -0.05) return;
  vec4 clip = u_proj * cam; ivec2 a = ivec2(floor((clip.xy / clip.w * 0.5 + 0.5) * u_vp));
  vec3 N = t1.xyz, vn = mat3(u_view) * N, c = cam.xyz;
  float facing = u_ortho > 0.5 ? -vn.z : dot(vn, c) / length(c); if (abs(facing) > 0.95) return;
  vec2 dir = u_ortho > 0.5 ? vn.xy : vec2(-vn.x * c.z + c.x * vn.z, -vn.y * c.z + c.y * vn.z); float dl = length(dir); if (dl < 1e-12) return; dir /= dl;
  int cat = dir.y > 0.38 ? 0 : dir.y < -0.38 ? 3 : dir.x > 0.0 ? 1 : 2;
  float first = cat == 0 ? E0.x : cat == 3 ? E1.x : E0.z, cnt = cat == 0 ? E0.y : cat == 3 ? E1.y : E0.w; if (cnt < 0.5) return;
  int s = int(first + 0.5) + min(int(cnt + 0.5) - 1, int(floor(t2.w * cnt))), r = int(t2.y + 0.5), band = clamp(int(floor(t2.z * float(rlen(r)))), 0, rlen(r) - 1);
  float dA = clamp((-cam.z - u_rng.x) / (u_rng.y - u_rng.x), 0.0, 1.0);
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)) * 2.0 - 1.0;
  gl_Position = vec4((vec2(a) + 0.5 + corner * 8.0) / u_vp * 2.0 - 1.0, dA * 2.0 - 1.0, 1.0);
  v_a = a; v_i = ivec4(s, cat, r, band); v_dA = dA; v_axial = -cam.z; v_P = pos; v_N = N; }`, y = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D u_sprTex, u_depth, u_idxTex, u_pixTex, u_dat; uniform mat4 u_pview; uniform vec3 u_peye; uniform float u_tanF, u_asp, u_portho, u_eGap, u_tol;
uniform mat4 u_proj; uniform vec2 u_vp; uniform float u_ortho; uniform vec4 u_splatPlane, u_spriteCover;
flat in ivec2 v_a; flat in ivec4 v_i; flat in float v_dA, v_axial; flat in vec3 v_P, v_N;
${f ? me + "flat in int v_relightOwner;" : ""}
layout(location=0) out vec4 o;
layout(location=1) out vec4 cover;
${fe}
${m ?? ""}
${t ? ne(n, r, i) : ""}
${u ? V(d) : ""}
${t || u || f ? "\nuniform vec3 u_waterSpritePalette[64];\nuniform vec4 u_rmp4[128], u_rmpN4[16];\nint spriteColor(int v) {\n  if (v >= 100) return clamp(v - 100, 0, 63);\n  int index = v_i.z;\n  int count = int(u_rmpN4[index >> 2][index & 3] + 0.5) & 15;\n  int offset = index * 8 + clamp(v_i.w + v - 8, 0, max(0, count - 1));\n  return clamp(int(u_rmp4[offset >> 2][offset & 3] + 0.5), 0, 63);\n}\n" : ""}
const ivec2 EOD[4] = ivec2[4](ivec2(0, 1), ivec2(1, 0), ivec2(-1, 0), ivec2(0, -1)), ETD[4] = ivec2[4](ivec2(1, 0), ivec2(0, -1), ivec2(0, 1), ivec2(1, 0));
vec4 sprT(int x, int y) { return texelFetch(u_sprTex, ivec2(x, y), 0); }
int dabAt(ivec2 q) { ivec2 s = textureSize(u_idxTex, 0); if (q.x < 0 || q.y < 0 || q.x >= s.x || q.y >= s.y) return -1;
  vec4 e = texelFetch(u_idxTex, q, 0) * 255.0; return int(e.r + 0.5) + int(e.g + 0.5) * 256 + int(e.b + 0.5) * 65536 - 1; }
vec4 pixA(int i) { return texelFetch(u_pixTex, ivec2((i & 1023) * 2, i >> 10), 0); }
vec4 pixB(int i) { return texelFetch(u_pixTex, ivec2((i & 1023) * 2 + 1, i >> 10), 0); }
vec3 hitAt(ivec2 q, int i, vec3 n) { ivec2 sz = textureSize(u_idxTex, 0);
  vec3 v = vec3(((float(q.x) + 0.5) / float(sz.x) * 2.0 - 1.0) * u_tanF * u_asp, ((float(q.y) + 0.5) / float(sz.y) * 2.0 - 1.0) * u_tanF, -1.0);
  vec3 o0 = u_portho > 0.5 ? u_peye + transpose(mat3(u_pview)) * vec3(v.xy, 0.0) : u_peye;
  vec3 d = transpose(mat3(u_pview)) * (u_portho > 0.5 ? vec3(0.0, 0.0, -1.0) : v); vec3 c = texelFetch(u_dat, ivec2((i & 511) << 2, i >> 9), 0).xyz;
  float den = dot(n, d), s = abs(den) > 1e-6 ? dot(n, c - o0) / den : 0.0; return s > 0.0 ? o0 + d * s : c; }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy), d = p - v_a, od = EOD[v_i.y], td = ETD[v_i.y]; int s = v_i.x;
  vec4 I = sprT(0, 32 + s); int w = int(I.x + 0.5), h = int(I.y + 0.5), sk = int(I.w + 0.5), rr = d.x * od.x + d.y * od.y - 1 + sk, cc = d.x * td.x + d.y * td.y + int(I.z + 0.5);
  if (rr < 0 || rr >= h || cc < 0 || cc >= w) discard;
  int k = rr * w + cc; vec4 t = sprT(1 + (k >> 2), 32 + s); int v = int(t[k & 3] + 0.5); if (v == 0) discard;
  ${m ? "\n  vec3 inView = axialPosition(gl_FragCoord.xy, v_axial, u_vp);\n  if (sectionMargin(transpose(mat3(u_pview)) * (inView - u_pview[3].xyz), v_axial) < 0.0) discard;\n  " : ""}
  cover = vec4(0.0);
  if (any(notEqual(u_splatPlane.xyz, vec3(0.0))) || any(notEqual(u_spriteCover.xyz, vec3(0.0)))) {
    vec4 at = vec4(axialPosition(gl_FragCoord.xy, v_axial, u_vp), 1.0);
    if (dot(u_splatPlane, at) < 0.0) discard;
    if (any(notEqual(u_spriteCover.xyz, vec3(0.0))) && dot(u_spriteCover, at) >= 0.0) cover = vec4(1.0);
  }
  float dp = texelFetch(u_depth, p, 0).r;
  if (dp < 0.995) {
    if (dp < v_dA - 0.008) discard;   // (something nearer stands here)
    if (rr >= sk) { int j = dabAt(p); bool other;   // (the root rows lie over the thing itself; the rest only past its own surface)
      if (j < 0 || pixA(j).x < 0.5) other = dp - v_dA > u_eGap;
      else { vec4 A = pixA(j), B = pixB(j); other = abs(dot(hitAt(p, j, vec3(A.w, B.x, B.y)) - v_P, v_N)) > u_tol; }
      if (!other) discard; } }
  ${t || u || f ? `
  vec3 color = u_waterSpritePalette[spriteColor(v)];
  ${f ? "vec4 gain = relightAt(v_relightOwner); if (gain.w > 0.0) color = min(vec3(1.0), color * gain.rgb);" : ""}
  ${t ? "vec3 mark; color = waterPaint(color,gl_FragCoord.xy,u_vp,v_axial,mark);" : ""}
  ${u ? "color = envMedia(color,gl_FragCoord.xy,u_vp,v_axial);" : ""}
  o = vec4(color,1.0);` : "o = vec4(float(v), float(v_i.z), float(v_i.w), 255.0) / 255.0;"} }`;
	return {
		POST_VS: "#version 300 es\nvoid main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }",
		POST_FS: g,
		KEY_FS: g.replace("out vec4 o;", "out ivec4 o;").replace(/void main\(\)\{[\s\S]*$/, "void main(){ ivec2 p = ivec2(gl_FragCoord.xy); ivec3 k = keyCalc(p); o = ivec4(k, k.x == -99999 ? 0 : 1); }"),
		CLEAN_FS: _,
		DAMP_FS: "#version 300 es\nprecision highp float;\nuniform sampler2D u_cur, u_hist, u_dep; uniform vec3 u_pal[64]; uniform int u_n; uniform float u_have;\nuniform mat4 u_iview, u_pvp; uniform vec4 u_cam; uniform vec2 u_rng;\nout vec4 o;\nint idxOf(vec3 c) { for (int i = 0; i < 64; i++) { if (i >= u_n) break; vec3 d = abs(c - u_pal[i]); if (max(d.r, max(d.g, d.b)) < 0.006) return i; } return -1; }\nvoid main() {\n  ivec2 p = ivec2(gl_FragCoord.xy), sz = textureSize(u_cur, 0); vec3 c = texelFetch(u_cur, p, 0).rgb; int ci = idxOf(c);\n  o = vec4(c, float(ci + 1) / 255.0);\n  if (u_have < 0.5 || ci < 0) return;\n  float dn = texelFetch(u_dep, p, 0).r; ivec2 q = p;\n  if (dn < 0.995) { float z = -(u_rng.x + dn * (u_rng.y - u_rng.x)); vec2 ndc = (vec2(p) + 0.5) / vec2(sz) * 2.0 - 1.0;\n    vec3 v = u_cam.z > 0.5 ? vec3(ndc.x * u_cam.x * u_cam.y, ndc.y * u_cam.x, z) : vec3(ndc.x * u_cam.x * u_cam.y * -z, ndc.y * u_cam.x * -z, z);\n    vec4 pc = u_pvp * (u_iview * vec4(v, 1.0)); q = ivec2(floor((pc.xy / pc.w * 0.5 + 0.5) * vec2(sz))); }\n  if (q.x < 0 || q.y < 0 || q.x >= sz.x || q.y >= sz.y) return;\n  vec4 h = texelFetch(u_hist, q, 0); int prev = int(h.a * 255.0 + 0.5) - 1;\n  if (prev >= 0 && ci != prev) o.rgb = h.rgb; }",
		COPY_FS: "#version 300 es\nprecision highp float;\nuniform sampler2D u_src; out vec4 o;\nvoid main() { o = vec4(texelFetch(u_src, ivec2(gl_FragCoord.xy), 0).rgb, 1.0); }",
		SPR_VS: v,
		SPR_FS: y
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/pipeline.mjs
function ye(e) {
	return e.replace("if (u_lampN > 0 &&", "if (false &&").replace("if (u_fineOn > 0.5 && plain", "if (false && plain").replace("if (i >= u_azn) break;", "break;");
}
function be(e, { ascii: t, specialize: n = !0, sampleCoverage: r, coverageRules: i, stableDetail: a, cutaway: o, airflow: s } = {}) {
	let c = ie(e);
	try {
		let { vertex: l, fragment: u } = he(t, r, {
			coverageRules: i,
			stableDetail: a,
			airflow: s
		}), d = c.program(l, u), f = /* @__PURE__ */ new Map(), p, m = !1, h, g = !1, _ = 0, v = 0, y = !1, b = c.allocate("VertexArray");
		e.bindVertexArray(b);
		let x = c.allocate("Buffer");
		e.bindBuffer(e.ARRAY_BUFFER, x);
		let S = new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			1,
			1
		]);
		e.bufferData(e.ARRAY_BUFFER, S, e.STATIC_DRAW), e.enableVertexAttribArray(0), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0);
		let C = c.allocate("Buffer");
		e.bindBuffer(e.ARRAY_BUFFER, C), e.enableVertexAttribArray(1), e.vertexAttribIPointer(1, 1, e.INT, 0, 0), e.vertexAttribDivisor(1, 1), e.bindVertexArray(null), e.bindBuffer(e.ARRAY_BUFFER, null);
		function w() {
			if (g) throw Error("The Ink Studio splat pipeline has been disposed");
		}
		return {
			programFor(h) {
				if (w(), h?.water || h?.portal || h?.instances || h?.contributions || h?.masked || h?.layeredGlass || h?.materialStyles || h?.environment || h?.relighting || h?.optical || h?.cutaway) {
					let e = !!h.water, n = !!h.portal, l = !!h.airPockets, u = !!h.layered, d = !!h.atlas, p = !!h.instances, m = !!h.contributions, g = !!h.masked, _ = !!h.textured, v = !!h.layeredGlass, y = !!h.materialStyles, b = !!h.environment, x = !!h.emitterFog, S = !!h.relighting, C = !!h.optical, w = +l + 2 * u + 4 * d + 8 * e + 16 * n + 32 * p + 64 * m + 128 * g + 256 * _ + 512 * v + 1024 * y + 2048 * b + 4096 * S + 8192 * C + 16384 * !!h.cutaway + 32768 * x;
					if (!f.has(w)) {
						let T = he(t, r, {
							water: e,
							airPockets: l,
							layered: u,
							atlas: d,
							portal: n,
							instances: p,
							contributions: m,
							masked: g,
							textured: _,
							layeredGlass: v,
							coverageRules: i,
							materialStyles: y,
							environment: b,
							emitterFog: x,
							relighting: S,
							optical: C,
							stableDetail: a,
							airflow: s,
							cutaway: h.cutaway ? o : void 0
						});
						f.set(w, c.program(T.vertex, T.fragment));
					}
					return f.get(w);
				}
				if (!n || m || h?.lamps !== !1 || h.fine !== !1 || h.textZones !== !1) return d;
				if (!p) try {
					p = c.program(ye(l), u);
				} catch (t) {
					if (e.isContextLost()) throw t;
					return m = !0, d;
				}
				return p;
			},
			setOrder(t, n = !1) {
				if (w(), !(t instanceof Int32Array) || n && t.length % 2) throw TypeError("Draw order must be an Int32Array with the selected stride");
				e.bindBuffer(e.ARRAY_BUFFER, C), t.byteLength > _ ? (e.bufferData(e.ARRAY_BUFFER, t, e.DYNAMIC_DRAW), _ = t.byteLength) : t.length && e.bufferSubData(e.ARRAY_BUFFER, 0, t), n !== y && (e.bindVertexArray(b), e.vertexAttribIPointer(1, 1, e.INT, n ? 8 : 0, 0), n ? (e.enableVertexAttribArray(2), e.vertexAttribIPointer(2, 1, e.INT, 8, 4), e.vertexAttribDivisor(2, 1)) : e.disableVertexAttribArray(2), e.bindVertexArray(null), y = n), v = t.length / (n ? 2 : 1);
			},
			draw(t = v, n = b) {
				if (w(), !Number.isInteger(t) || t < 0 || n === b && t > v) throw RangeError("Invalid splat draw count");
				t && (e.bindVertexArray(n), e.drawArraysInstanced(e.TRIANGLE_STRIP, 0, 4, t));
			},
			drawSubset(t) {
				if (w(), !(t instanceof Int32Array)) throw TypeError("Subset order must be an Int32Array");
				t.length && (h || (h = {
					vao: c.allocate("VertexArray"),
					buffer: c.allocate("Buffer")
				}, e.bindVertexArray(h.vao), e.bindBuffer(e.ARRAY_BUFFER, x), e.enableVertexAttribArray(0), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, h.buffer), e.enableVertexAttribArray(1), e.vertexAttribIPointer(1, 1, e.INT, 0, 0), e.vertexAttribDivisor(1, 1)), h.indices !== t && (e.bindBuffer(e.ARRAY_BUFFER, h.buffer), e.bufferData(e.ARRAY_BUFFER, t, e.DYNAMIC_DRAW), h.indices = t), e.bindVertexArray(h.vao), e.drawArraysInstanced(e.TRIANGLE_STRIP, 0, 4, t.length));
			},
			dispose() {
				g || (g = !0, c.dispose());
			}
		};
	} catch (e) {
		throw c.dispose(), e;
	}
}
var xe = (/* @__PURE__ */ f((/* @__PURE__ */ u(((e, t) => {
	var n = (() => {
		let e = 38 * Math.PI / 180, t = Number.isFinite, n = (e, t) => {
			if (!e) throw RangeError("Camera lens: " + t);
		}, r = (e) => t(e) && e > 0 && e < Math.PI;
		function i(e, i = 24) {
			n(t(e) && e > 0 && t(i) && i > 0, "focal length and sensor height must be positive millimeters");
			let a = 2 * Math.atan(i / 2 / e);
			return n(r(a), "lens must have a representable vertical field of view"), a;
		}
		function a(e, i = 24) {
			n(r(e) && t(i) && i > 0, "invalid field of view or sensor height");
			let a = i / 2 / Math.tan(e / 2);
			return n(t(a) && a > 0, "lens must have a representable focal length"), a;
		}
		function o(o = {}, s = {}) {
			let c = s.sensorHeight ?? o.sensorHeight ?? 24;
			n(t(c) && c > 0, "sensor height must be positive millimeters"), s.fov !== void 0 && s.focalLength !== void 0 && n(Math.abs(s.fov - i(s.focalLength, c)) < 1e-10, "choose field of view or focal length");
			let l = o.fov ?? (o.focalLength === void 0 ? e : i(o.focalLength, o.sensorHeight)), u = s.fov ?? l;
			s.focalLength === void 0 ? s.sensorHeight !== void 0 && s.fov === void 0 && (u = i(a(l, o.sensorHeight), c)) : u = i(s.focalLength, c), n(r(u), "vertical field of view must be in (0, pi)");
			let d = s.focusDistance ?? o.focusDistance;
			return n(d === void 0 || t(d) && d > 0, "focus distance must be positive"), {
				fov: u,
				sensorHeight: c,
				focalLength: a(u, c),
				...d !== void 0 && { focusDistance: d }
			};
		}
		function s(e = {}, ...r) {
			let i = {
				target: [
					0,
					0,
					0
				],
				dist: 12,
				yaw: 0,
				pitch: 0,
				...e,
				...o(e)
			};
			for (let e of r) if (e) {
				let t = o(i, e);
				i = {
					...i,
					...e,
					...t
				}, e.projection !== void 0 && e.ortho === void 0 && (i.ortho = e.projection === "orthographic");
			}
			return i.ortho === void 0 && (i.ortho = i.projection === "orthographic"), n(Array.isArray(i.target) && i.target.length === 3 && i.target.every(t) && [
				i.yaw,
				i.pitch,
				i.dist
			].every(t) && i.dist > 0, "finite target, orbit and positive distance required"), i.target = i.target.slice(), i.composition !== void 0 && (i.composition = c(i.composition).slice()), i;
		}
		function c(e) {
			return n(Array.isArray(e) && e.length === 2 && e.every((e) => t(e) && e >= 0 && e <= 1), "composition is a normalized screen point [u,v]"), e;
		}
		function l(e, r) {
			if (n(t(r) && r > 0, "aspect must be positive"), !e.composition) return e.target;
			let [i, a] = c(e.composition), o = e.dist * Math.tan(e.fov / 2), s = Math.sin(e.yaw), l = Math.cos(e.yaw), u = Math.sin(e.pitch), d = Math.cos(e.pitch), f = [
				l,
				0,
				-s
			], p = [
				-u * s,
				d,
				-u * l
			], m = (.5 - i) * 2 * o * r, h = (a - .5) * 2 * o;
			return e.target.map((e, t) => e + f[t] * m + p[t] * h);
		}
		let u = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], d = (e, t) => [
			e[1] * t[2] - e[2] * t[1],
			e[2] * t[0] - e[0] * t[2],
			e[0] * t[1] - e[1] * t[0]
		];
		function f(e) {
			n(e && [
				e.eye,
				e.right,
				e.up,
				e.back
			].every((e) => Array.isArray(e) && e.length === 3 && e.every(t)), "pose requires a finite eye and camera axes");
			let r = [
				e.right,
				e.up,
				e.back
			];
			return n(r.every((e) => Math.abs(u(e, e) - 1) < 1e-4) && Math.abs(u(r[0], r[1])) < 1e-4 && Math.abs(u(r[0], r[2])) < 1e-4 && Math.abs(u(r[1], r[2])) < 1e-4 && u(d(r[0], r[1]), r[2]) > .9999, "pose axes must be right-handed and orthonormal"), Object.fromEntries([
				"eye",
				"right",
				"up",
				"back"
			].map((t) => [t, e[t].slice()]));
		}
		function p(e) {
			return n(e && e.length === 16 && Array.from(e).every(t), "view matrix must be finite"), f({
				eye: [
					-(e[0] * e[12] + e[1] * e[13] + e[2] * e[14]),
					-(e[4] * e[12] + e[5] * e[13] + e[6] * e[14]),
					-(e[8] * e[12] + e[9] * e[13] + e[10] * e[14])
				],
				right: [
					e[0],
					e[4],
					e[8]
				],
				up: [
					e[1],
					e[5],
					e[9]
				],
				back: [
					e[2],
					e[6],
					e[10]
				]
			});
		}
		function m(e) {
			let { eye: t, right: n, up: r, back: i } = f(e);
			return [
				n[0],
				r[0],
				i[0],
				0,
				n[1],
				r[1],
				i[1],
				0,
				n[2],
				r[2],
				i[2],
				0,
				-u(n, t),
				-u(r, t),
				-u(i, t),
				1
			];
		}
		function h(e, r = 0) {
			n(t(r), "camera setback must be finite");
			let i = f(e);
			return i.eye = i.eye.map((e, t) => e - i.back[t] * r), i;
		}
		function g(e, r, { setback: i = 0 } = {}) {
			let a = h(e, i), o = r.translation ?? [
				0,
				0,
				0
			], s = r.rotation ?? [
				0,
				0,
				0
			];
			n([o, s].every((e) => Array.isArray(e) && e.length === 3 && e.every(t)), "camera motion requires finite world translation and rotation vectors");
			let c = Math.hypot(...s);
			n(t(c), "rotation magnitude must be finite");
			let l = c ? s.map((e) => e / c) : [
				0,
				0,
				1
			], f = Math.cos(c), p = Math.sin(c);
			function m(e) {
				let t = d(l, e), n = u(l, e) * (1 - f);
				return e.map((e, r) => e * f + t[r] * p + l[r] * n);
			}
			let g = m(a.back);
			return {
				eye: a.eye.map((e, t) => e + o[t] + g[t] * i),
				right: m(a.right),
				up: m(a.up),
				back: g
			};
		}
		let _ = (e, t, n) => Math.max(t, Math.min(n, e));
		function v(e, t) {
			if (!t) return e;
			let { yaw: n, pitch: r, dist: i } = e;
			if (t.yaw && t.yaw[1] - t.yaw[0] < 2 * Math.PI) {
				let e = (t.yaw[0] + t.yaw[1]) / 2, r = n - e, i = e + Math.atan2(Math.sin(r), Math.cos(r));
				n += _(i, ...t.yaw) - i;
			}
			return t.pitch && (r = _(r, ...t.pitch)), t.distance && (i = _(i, ...t.distance)), {
				...e,
				yaw: n,
				pitch: r,
				dist: i
			};
		}
		function y(e, t, n, r) {
			let i = Math.sin(e), a = Math.cos(e), o = Math.cos(t), s = o < 0 ? -1 : 1, c = [
				o * i,
				Math.sin(t),
				o * a
			], l = [
				s * a,
				0,
				-s * i
			];
			return {
				eye: r.map((e, t) => e + n * c[t]),
				right: l,
				up: d(c, l),
				back: c
			};
		}
		function b(e, t, n) {
			let r = e.slice();
			for (let i = 0; i < 2; i++) {
				let a = n[0] * e[i] + n[1] * e[4 + i] + n[2] * e[8 + i] + e[12 + i];
				r[i + 12] += Math.round(a * t) / t - a;
			}
			return r;
		}
		function x(e, r, i, a, o = 1) {
			let s = (e) => e === !0 ? { snap: !0 } : e || {}, { snap: c, anchor: l = [
				0,
				0,
				0
			] } = {
				...s(i),
				...s(a)
			};
			return !e.ortho || !c || a === !1 ? e.view : (n(Array.isArray(l) && l.length === 3 && Array.from(l).every(t), "snap anchor must be finite XYZ"), b(e.view, r / (2 * e.tangent * e.dist * o), l));
		}
		function S(e, r, i, a, { orbit: c, impulse: u, probe: d = !1 } = {}) {
			n([i, a].every((e) => t(e) && e > 0), "viewport must be positive");
			let f = r.cameraTime ?? (r.timeDomains ?? e.timeDomains)?.read("camera").sampleTime ?? r.time ?? r.t ?? e.lookSnapshot?.time, p = f ?? 0, _ = e.cameraRig?.sample(p, { shot: r.cameraShot }).camera, b = s(e.cam, _, d ? void 0 : r.camera), x = o(b, Object.fromEntries((d ? ["fov"] : [
				"fov",
				"focalLength",
				"sensorHeight",
				"focusDistance"
			]).filter((e) => r[e] !== void 0).map((e) => [e, r[e]]))), S = r.lensScale ?? 1, C = r.zoom ?? 1;
			n(t(S) && S > 0 && t(C) && C > 0, "lens scale and zoom must be positive");
			let w = Math.tan(x.fov / 2) / S, T = i / a, E = r.ortho ?? (r.projection === void 0 ? b.ortho : r.projection === "orthographic"), D = r.lockCamera ? void 0 : e.anim, O = r.dist ?? b.dist / C, { yaw: k, pitch: A, dist: j } = v({
				yaw: r.yaw ?? b.yaw,
				pitch: r.pitch ?? b.pitch,
				dist: O / (D?.zoom || 1)
			}, c);
			n([
				k,
				A,
				j
			].every(t) && j > 0, "finite orbit and positive distance required");
			let M = !(r.target && Object.hasOwn(r.target, "framebuffer")) && r.target != null ? r.target : b.target;
			n((Array.isArray(M) || ArrayBuffer.isView(M)) && M.length === 3 && Array.from(M).every(t), "target must be finite XYZ");
			let N = l({
				target: Array.from(M),
				yaw: k,
				pitch: A,
				dist: j,
				fov: 2 * Math.atan(w),
				composition: r.composition ?? b.composition
			}, T).map((e, t) => e + (D?.kick?.[t] ?? 0)), P = e.radius ?? 14, F = E && !_ && !b.pose ? 2 * P + 4 : 0, I = j + F, L = b.pose ?? y(k, A, I, N), R = !d && u?.(e, {
				...r,
				cameraTime: f
			}, h(L, F));
			return R && (R.translation.some(Boolean) || R.rotation.some(Boolean)) && (L = g(L, R, { setback: F })), {
				base: b,
				lens: x,
				time: p,
				motion: R || null,
				pose: L,
				view: m(L),
				framed: N,
				yaw: k,
				pitch: A,
				dist: j,
				dist0: O,
				distance: I,
				radius: P,
				setback: F,
				aspect: T,
				tangent: w,
				ortho: E,
				clipNear: Math.max(.4, .15 * j),
				clipFar: 400
			};
		}
		function C(e, t, n, r, i, a) {
			let o = t.slice(), s = [
				0,
				0,
				0
			], c = {
				origin: o,
				direction: s,
				axial: 1
			};
			return (l, u) => {
				let d = (l - n / 2) / i, f = (u - r / 2) / i;
				c.axial = a ? 1 : 1 / Math.hypot(d, f, 1);
				for (let n = 0; n < 3; n++) {
					let r = n * 4, i = d * e[r] + f * e[r + 1];
					o[n] = t[n] + (a ? i : 0), s[n] = a ? -e[r + 2] : (i - e[r + 2]) * c.axial;
				}
				return c;
			};
		}
		return Object.freeze({
			rays: C,
			defaultFov: e,
			defaultSensorHeight: 24,
			fieldOfView: i,
			focalLength: a,
			resolve: o,
			view: s,
			composition: c,
			target: l,
			pose: f,
			fromView: p,
			matrix: m,
			listenerPose: h,
			applyMotion: g,
			constrain: v,
			orbitPose: y,
			frame: S,
			snapView: b,
			artView: x
		});
	})();
	t === void 0 ? globalThis[Symbol.for("ink-studio.camera-lens")] = n : t.exports = n;
})))(), 1)).default ?? globalThis[Symbol.for("ink-studio.camera-lens")], Se = (/* @__PURE__ */ f((/* @__PURE__ */ u(((e, t) => {
	var n = (() => {
		let e = Number.isFinite, t = 2 * Math.PI, n = () => [
			0,
			0,
			0
		], r = {
			eye: [
				0,
				0,
				0
			],
			right: [
				1,
				0,
				0
			],
			up: [
				0,
				1,
				0
			],
			back: [
				0,
				0,
				1
			]
		}, i = (e, t) => {
			if (!e) throw TypeError("Camera impulses: " + t);
		}, a = (e) => e && typeof e == "object" && !Array.isArray(e) && [Object.prototype, null].includes(Object.getPrototypeOf(e)), o = (e, t) => a(e) && Object.keys(e).every((e) => t.includes(e)), s = (e) => typeof e == "string" && /^[A-Za-z0-9_][A-Za-z0-9_.:-]{0,95}$/.test(e) && ![
			"__proto__",
			"prototype",
			"constructor"
		].includes(e), c = (t) => Array.isArray(t) && t.length === 3 && t.every((t) => e(t) && Math.abs(t) <= 1e6), l = (t, n, r) => e(t) && t >= n && t <= r, u = (e) => Math.hypot(...e), d = (e, t) => e.map((e) => e * t), f = (e, t) => e.reduce((e, n, r) => e + n * t[r], 0), p = (e, t) => [
			e[1] * t[2] - e[2] * t[1],
			e[2] * t[0] - e[0] * t[2],
			e[0] * t[1] - e[1] * t[0]
		], m = (e, t) => e.map((e, n) => e - t[n]), h = (e, t = [
			0,
			0,
			1
		]) => u(e) > 1e-10 ? d(e, 1 / u(e)) : t.slice(), g = (e) => (e = Math.max(0, Math.min(1, e)), e * e * (3 - 2 * e)), _ = (e) => (e && typeof e == "object" && (Object.values(e).forEach(_), Object.freeze(e)), e);
		function v(t, n = 0) {
			return i(n <= 32, "data nesting budget exceeded"), Array.isArray(t) ? t.map((e) => v(e, n + 1)) : a(t) ? Object.fromEntries(Object.entries(t).filter(([, e]) => e !== void 0).map(([e, t]) => [e, v(t, n + 1)])) : (i(t === null || typeof t == "string" || typeof t == "boolean" || e(t), "expected finite JSON data"), t);
		}
		function y(e, t) {
			let n = e >>> 0;
			for (let e of String(t)) n = Math.imul(n ^ e.charCodeAt(0), 16777619) >>> 0;
			return n;
		}
		function b(e, t) {
			let n = (Math.imul(e | 0, 374761393) ^ t) >>> 0;
			return n = Math.imul(n ^ n >>> 13, 1274126177), ((n ^ n >>> 16) >>> 0) / 4294967295 * 2 - 1;
		}
		function x(e, t) {
			let n = Math.floor(e), r = g(e - n);
			return b(n, t) * (1 - r) + b(n + 1, t) * r;
		}
		function S(e = r) {
			i(a(e) && [
				e.eye,
				e.right,
				e.up,
				e.back
			].every(c), "expected an unshaken eye and orthonormal camera basis");
			let t = [
				e.right,
				e.up,
				e.back
			];
			return i(t.every((e) => Math.abs(u(e) - 1) < 1e-4) && Math.abs(f(t[0], t[1])) < 1e-4 && Math.abs(f(t[0], t[2])) < 1e-4 && Math.abs(f(t[1], t[2])) < 1e-4 && f(p(t[0], t[1]), t[2]) > .9999, "camera basis must be right-handed and orthonormal"), e;
		}
		function C(e, t) {
			return [
				0,
				1,
				2
			].map((n) => e[0] * t.right[n] + e[1] * t.up[n] + e[2] * t.back[n]);
		}
		function w(e) {
			if (e === void 0 || e === !1) return null;
			i(o(e, [
				"inner",
				"outer",
				"power"
			]), "invalid distance falloff");
			let { inner: t = 0, outer: n = 20, power: r = 2 } = e;
			return i(l(t, 0, 1e6) && l(n, 0, 1e6) && n > t && l(r, .05, 16), "falloff needs increasing radii and a positive power"), {
				inner: t,
				outer: n,
				power: r
			};
		}
		function T(e, t, n, r) {
			i(o(e, [
				"id",
				"time",
				"duration",
				"translation",
				"rotation",
				"space",
				"direction",
				"source",
				"falloff",
				"propagationSpeed",
				"frequency",
				"damping",
				"attack",
				"release",
				"profile",
				"weight",
				"seed",
				"lever",
				"angularGain",
				"enabled"
			]), "unknown impulse field");
			let { id: a = t, time: d = n, duration: f = .7, translation: p = [
				0,
				0,
				0
			], rotation: m = [
				0,
				0,
				0
			], space: g = "camera", direction: _, source: v, propagationSpeed: y = 0, frequency: b = 12, damping: x = 7, attack: S = .015, release: C = f * .2, profile: T = "spring", weight: E = 1, seed: D = r, lever: O, angularGain: k = 0, enabled: A = !0 } = e;
			i(s(a) && l(d, 0, 0xe8d4a51000) && l(f, 1e-4, 3600) && c(p) && c(m) && [
				"camera",
				"world",
				"impact"
			].includes(g) && [
				"spring",
				"shake",
				"pulse"
			].includes(T) && l(b, .01, 240) && l(x, 0, 1e3) && l(S, 0, f) && l(C, 1e-6, f) && l(E, 0, 16) && Number.isSafeInteger(D) && l(D, 0, 4294967295) && typeof A == "boolean", "invalid impulse settings"), i((_ === void 0 || c(_) && u(_) > 1e-8) && (v === void 0 || c(v)) && (g !== "impact" || v !== void 0 || _ !== void 0) && (_ === void 0 || g === "impact"), "impact space needs a source or nonzero world direction"), i(l(y, 0, 1e6) && (!y || v !== void 0) && (O === void 0 || c(O)) && l(k, 0, 100), "invalid propagation or angular leverage");
			let j = w(e.falloff);
			return i(!j || v !== void 0, "distance falloff needs a source"), {
				id: a,
				time: d,
				duration: f,
				translation: p.slice(),
				rotation: m.slice(),
				space: g,
				direction: _ ? h(_) : null,
				source: v?.slice() ?? null,
				falloff: j,
				propagationSpeed: y,
				frequency: b,
				damping: x,
				attack: S,
				release: C,
				profile: T,
				weight: E,
				seed: D,
				lever: O?.slice() ?? null,
				angularGain: k,
				enabled: A
			};
		}
		function E(e, t) {
			i(o(e, [
				"id",
				"translation",
				"rotation",
				"space",
				"frequency",
				"octaves",
				"persistence",
				"weight",
				"seed",
				"time",
				"fadeIn",
				"enabled"
			]), "unknown handheld field");
			let { id: n, translation: r = [
				.006,
				.009,
				.002
			], rotation: a = [
				.001,
				.0012,
				8e-4
			], space: u = "camera", frequency: d = .65, octaves: f = 3, persistence: p = .45, weight: m = 1, seed: h = t, time: g = 0, fadeIn: _ = .5, enabled: v = !0 } = e;
			return i(s(n) && c(r) && c(a) && ["camera", "world"].includes(u) && l(d, .01, 120) && Number.isSafeInteger(f) && l(f, 1, 5) && l(p, 0, 1) && l(m, 0, 16) && Number.isSafeInteger(h) && l(h, 0, 4294967295) && l(g, 0, 0xe8d4a51000) && l(_, 0, 60) && typeof v == "boolean", "invalid handheld layer"), {
				id: n,
				translation: r.slice(),
				rotation: a.slice(),
				space: u,
				frequency: d,
				octaves: f,
				persistence: p,
				weight: m,
				seed: h,
				time: g,
				fadeIn: _,
				enabled: v
			};
		}
		function D(e) {
			let t = v(e);
			for (let e of [
				"direction",
				"source",
				"falloff",
				"lever"
			]) t[e] === null && delete t[e];
			return t;
		}
		function O(c = {}) {
			i(o(c, [
				"impulses",
				"handheld",
				"seed",
				"translationLimit",
				"rotationLimit",
				"maxImpulses"
			]), "unknown configuration field");
			let { impulses: f = [], handheld: b = [], seed: w = 1, translationLimit: k = 1, rotationLimit: A = .35, maxImpulses: j = 256 } = c;
			i(Number.isSafeInteger(w) && l(w, 0, 4294967295) && l(k, 0, 100) && l(A, 0, Math.PI) && Number.isSafeInteger(j) && l(j, 1, 2048) && Array.isArray(f) && f.length <= j && Array.isArray(b) && b.length <= 32, "invalid limits, seed or history budget");
			let M = f.map((e, t) => T(e, "impulse." + (t + 1), 0, y(w, e.id ?? "impulse." + (t + 1)))), N = b.map((e) => E(e, y(w, e.id))), P = 0, F = 0, I = f.length;
			i(new Set(M.map((e) => e.id)).size === M.length && new Set(N.map((e) => e.id)).size === N.length, "duplicate impulse or handheld ID");
			let L = null, R = null, z = (e) => e.slice().sort((e, t) => e.time - t.time || (e.id < t.id ? -1 : +(e.id > t.id)));
			function B(e = P, { pose: a = r } = {}) {
				i(l(e, 0, 0xe8d4a51000), "sample time must be nonnegative and finite"), S(a);
				let o = n(), s = n(), c = [], f = [];
				function v(e, t, n, r, i) {
					for (let e = 0; e < 3; e++) o[e] += n[e], s[e] += r[e];
					c.push({
						id: e,
						type: t,
						...i,
						translation: n,
						rotation: r
					});
				}
				for (let n of L ??= z(M)) {
					if (!n.enabled) continue;
					let i = n.source ? u(m(a.eye, n.source)) : 0, o = n.propagationSpeed ? i / n.propagationSpeed : 0, s = e - n.time - o, c = n.weight * (n.falloff ? Math.max(0, Math.min(1, (n.falloff.outer - i) / (n.falloff.outer - n.falloff.inner))) ** +n.falloff.power : 1);
					if (!c || s >= n.duration) continue;
					if (s < 0) {
						f.push({
							id: n.id,
							arrival: n.time + o,
							delay: o,
							distance: i,
							gain: c
						});
						continue;
					}
					let l = 1 - g((s - (n.duration - n.release)) / n.release), _ = n.attack ? g(s / n.attack) : 1, y = l * Math.exp(-s * n.damping), b = n.profile === "spring" ? Math.sin(t * n.frequency * s) * y * _ : n.profile === "pulse" ? _ * (1 - s / n.duration) ** 2 * l : _ * y, S = a;
					if (n.space === "world" && (S = r), n.space === "impact") {
						let e = n.direction ?? h(m(a.eye, n.source), a.back), t = Math.abs(e[1]) > .97 ? [
							1,
							0,
							0
						] : [
							0,
							1,
							0
						], r = h(p(t, e));
						S = {
							right: r,
							up: p(e, r),
							back: e
						};
					}
					let w = (e, t, r) => e * b * c * (n.profile === "shake" ? x(s * n.frequency * (1 + t * .13), n.seed + r + t * 231) : 1), T = C(n.translation.map((e, t) => w(e, t, 11)), S), E = C(n.rotation.map((e, t) => w(e, t, 397)), S);
					if (n.lever && n.angularGain) {
						let e = d(p(C(n.lever, a), T), n.angularGain);
						for (let t = 0; t < 3; t++) E[t] += e[t];
					}
					v(n.id, "impulse", T, E, {
						age: s,
						arrival: n.time + o,
						delay: o,
						distance: i,
						gain: c,
						envelope: b,
						profile: n.profile,
						space: n.space
					});
				}
				for (let t of R ??= z(N)) {
					if (!t.enabled || e < t.time) continue;
					let n = e - t.time, i = t.weight * (t.fadeIn ? g(n / t.fadeIn) : 1), o = t.space === "camera" ? a : r;
					if (!i) continue;
					function s(e, r) {
						let a = 0, o = 0, s = 1;
						for (let i = 0; i < t.octaves; i++) a += x(n * t.frequency * (1 + e * .17) * 2 ** i, t.seed + r + e * 307 + i * 647) * s, o += s, s *= t.persistence;
						return a / o * i;
					}
					v(t.id, "handheld", C(t.translation.map((e, t) => e * s(t, 0)), o), C(t.rotation.map((e, t) => e * s(t, 991)), o), {
						age: n,
						gain: i,
						frequency: t.frequency,
						space: t.space
					});
				}
				let y = u(o), b = u(s), w = y ? Math.min(1, k / y) : 1, T = b ? Math.min(1, A / b) : 1;
				return _({
					time: e,
					translation: d(o, w),
					rotation: d(s, T),
					contributions: c,
					pending: f,
					limits: {
						translationScale: w,
						rotationScale: T
					},
					activeCount: c.length
				});
			}
			function V(e) {
				i(M.length < j, "impulse history budget reached; cancel, prune or clear history");
				let t = I + 1;
				for (i(Number.isSafeInteger(t), "serial budget exceeded"); M.some((e) => e.id === "impulse." + t);) t++, i(Number.isSafeInteger(t), "serial budget exceeded");
				let n = T(e, "impulse." + t, P, y(w, e?.id ?? "impulse." + t));
				return i(!M.some((e) => e.id === n.id), "duplicate impulse ID"), M.push(n), L = null, I = t, n.id;
			}
			function H() {
				return {
					format: "ink-studio/camera-impulses",
					version: 1,
					time: P,
					compensation: F,
					serial: I,
					settings: {
						seed: w,
						translationLimit: k,
						rotationLimit: A,
						maxImpulses: j
					},
					impulses: M.map(D),
					handheld: v(N)
				};
			}
			let ee = H();
			function te(t) {
				i(a(t) && t.format === "ink-studio/camera-impulses" && t.version === 1 && l(t.time, 0, 0xe8d4a51000) && e(t.compensation ?? 0) && Math.abs(t.compensation ?? 0) <= 2 ** -52 * Math.max(1, t.time) * 4 && Array.isArray(t.impulses) && Array.isArray(t.handheld) && Number.isSafeInteger(t.serial) && t.serial >= 0 && o(t.settings, [
					"seed",
					"translationLimit",
					"rotationLimit",
					"maxImpulses"
				]) && Object.entries({
					seed: w,
					translationLimit: k,
					rotationLimit: A,
					maxImpulses: j
				}).every(([e, n]) => t.settings[e] === n), "incompatible checkpoint");
				let n = O({
					...t.settings,
					impulses: t.impulses,
					handheld: t.handheld
				}).snapshot();
				return M = n.impulses.map((e, t) => T(e, e.id, 0, w + t * 101 >>> 0)), N = n.handheld.map((e, t) => E(e, w + t * 139 >>> 0)), L = R = null, P = t.time, F = t.compensation ?? 0, I = t.serial, U;
			}
			let U = Object.freeze({
				sample: B,
				emit: V,
				impulse: V,
				get time() {
					return P;
				},
				advance(e, t) {
					i(l(e, 0, 1e6) && l(P + e, 0, 0xe8d4a51000), "advance needs bounded nonnegative seconds");
					let n = e - F, r = P + n;
					return F = r - P - n, P = r, B(P, t);
				},
				seek(e, t) {
					return i(l(e, 0, 0xe8d4a51000), "seek needs nonnegative seconds"), P = e, F = 0, B(P, t);
				},
				setLayer(e) {
					i(a(e) && s(e.id), "handheld edits need an ID");
					let t = N.findIndex((t) => t.id === e.id), n = E({
						...N[t],
						...e
					}, N[t]?.seed ?? y(w, e.id));
					return i(t >= 0 || N.length < 32, "handheld layer budget reached"), R = null, t >= 0 ? N[t] = n : N.push(n), U;
				},
				removeLayer: (e) => (N = N.filter((t) => t.id !== e), R = null, U),
				cancel: (e) => (M = M.filter((t) => t.id !== e), L = null, U),
				clear() {
					return M = [], L = null, U;
				},
				prune(e) {
					return i(l(e, 0, 0xe8d4a51000), "prune needs nonnegative seconds"), L = null, M = M.filter((t) => t.time + t.duration + (t.falloff && t.propagationSpeed ? t.falloff.outer / t.propagationSpeed : t.propagationSpeed ? Infinity : 0) > e), U;
				},
				snapshot: H,
				restore: te,
				reset: () => te(ee),
				bind(e) {
					i(a(e), "bind needs a mutable world");
					let t = e.cameraImpulses;
					return e.cameraImpulses = U, i(e.cameraImpulses === U, "world must allow a live camera binding"), () => {
						e.cameraImpulses === U && (t === void 0 ? delete e.cameraImpulses : e.cameraImpulses = t);
					};
				}
			});
			return U;
		}
		let k = /* @__PURE__ */ new WeakMap();
		function A(e) {
			return e === void 0 || e === !1 ? null : typeof e?.sample == "function" ? e : (i(a(e), "expected a motion definition or live impulse sampler"), k.has(e) || k.set(e, O(e)), k.get(e));
		}
		function j(e = {}, t = {}, n) {
			if (t.lockCamera) return null;
			let r = A(t.cameraImpulses ?? e.cameraImpulses ?? e.look?.cameraImpulses);
			if (!r) return null;
			let i = t.cameraImpulseTime ?? t.cameraTime ?? e.timeDomains?.read("camera").sampleTime ?? t.time ?? t.t ?? e.lookSnapshot?.time ?? r.time ?? 0;
			return r.sample(i, { pose: n });
		}
		let M = {
			recoil: {
				profile: "spring",
				space: "camera",
				duration: .42,
				frequency: 17,
				damping: 17,
				translation: [
					0,
					0,
					.12
				],
				rotation: [
					.045,
					0,
					.002
				]
			},
			crash: {
				profile: "spring",
				space: "impact",
				duration: 1.7,
				frequency: 5,
				damping: 3.5,
				translation: [
					0,
					0,
					.42
				],
				rotation: [
					.012,
					.018,
					.018
				],
				lever: [
					0,
					.5,
					0
				],
				angularGain: .5,
				falloff: {
					inner: 2,
					outer: 24,
					power: 1.5
				}
			},
			thunder: {
				profile: "shake",
				space: "impact",
				duration: 3.4,
				frequency: 1.8,
				damping: .7,
				attack: .12,
				translation: [
					0,
					.065,
					.035
				],
				rotation: [
					.004,
					.005,
					.003
				],
				falloff: {
					inner: 0,
					outer: 220,
					power: 1.2
				},
				propagationSpeed: 80
			}
		};
		function N(e, t = {}) {
			i(Object.hasOwn(M, e) && a(t), "unknown preset");
			let n = {
				...v(M[e]),
				...v(t)
			};
			return n.space === "impact" && n.source === void 0 && n.direction === void 0 && (n.direction = [
				0,
				0,
				1
			]), n.source === void 0 && (delete n.falloff, delete n.propagationSpeed), T(n, "preset", 0, 1), _(n);
		}
		return Object.freeze({
			create: O,
			prepare: A,
			frame: j,
			preset: N,
			restore: (e) => O(e.settings).restore(e)
		});
	})();
	t === void 0 ? globalThis[Symbol.for("ink-studio.camera-impulses")] = n : t.exports = n;
})))(), 1)).default ?? globalThis[Symbol.for("ink-studio.camera-impulses")], Ce = /* @__PURE__ */ new WeakMap();
function we(e, t, n, r) {
	if (!Number.isSafeInteger(n) || n < 1 || !Number.isSafeInteger(r) || r < 1) throw RangeError("Camera capture requires positive integer dimensions");
	let i = Ee(e, t, n, r), a = Object.freeze(Object.fromEntries(Object.entries(De(i)).map(([e, t]) => [e, Object.freeze(t)]))), o = Object.freeze({
		pose: a,
		ortho: i.ortho,
		yaw: Math.atan2(a.back[0], a.back[2]),
		pitch: Math.asin(Math.max(-1, Math.min(1, a.back[1])))
	});
	return Ce.set(o, {
		camera: i,
		height: r
	}), o;
}
function Te(e, t, n, r) {
	let i = we(e, t, n, r), { camera: a } = Ce.get(i), { eye: o, back: s } = i.pose;
	return {
		snapshot: i,
		camera: {
			...i.pose,
			ortho: a.ortho,
			tangent: a.tangent,
			aspect: a.aspect,
			near: a.clipNear,
			far: a.clipFar,
			observer: o.map((e, t) => e - s[t] * a.setback)
		}
	};
}
function Ee(e, t, n, r) {
	if (t.cameraSnapshot !== void 0) {
		let e = Ce.get(t.cameraSnapshot);
		if (!e) throw TypeError("Use a camera snapshot from captureCamera");
		let { camera: i } = e, a = n / r, o = e.height / r;
		if (a === i.aspect && o === 1) return i;
		let s = i.projection.slice();
		return s[0] *= i.aspect / a, {
			...i,
			aspect: a,
			projection: s,
			footprint: i.footprint * o,
			shadowFootprint: i.shadowFootprint * o
		};
	}
	let i = t.cameraStaging ?? e.look?.cameraStaging, a = xe.frame(e, t, n, r, {
		orbit: i?.orbit,
		impulse: Se.frame
	}), { dist: o, distance: s, aspect: c, radius: l, ortho: u, tangent: d, clipNear: f, clipFar: p, setback: m } = a, h = xe.artView(a, r, e.look?.stable, t.stable), g = h === a.view ? a.pose.eye : xe.fromView(h).eye, _ = o * d, v = .4, y = 1 / d, b = u ? new Float32Array([
		1 / (_ * c),
		0,
		0,
		0,
		0,
		1 / _,
		0,
		0,
		0,
		0,
		-2 / (p - v),
		0,
		0,
		0,
		-(p + v) / (p - v),
		1
	]) : new Float32Array([
		y / c,
		0,
		0,
		0,
		0,
		y,
		0,
		0,
		0,
		0,
		(p + v) / (v - p),
		-1,
		0,
		0,
		2 * p * v / (v - p),
		0
	]), x = u ? s : o;
	return {
		view: Float32Array.from(h),
		projection: b,
		eye: g,
		aspect: c,
		ortho: u,
		radius: l,
		distance: s,
		lens: a.lens,
		composition: t.composition ?? a.base.composition ?? [.5, .5],
		setback: m,
		tangent: u ? _ : d,
		footprint: o * 2 * d / r,
		shadowFootprint: 2 * _ / r,
		clipNear: f,
		clipFar: p,
		depthRange: [x - l, x + l],
		...a.motion && { cameraImpulse: a.motion }
	};
}
function De({ eye: e, view: t }) {
	return {
		eye: e.slice(),
		right: [
			t[0],
			t[4],
			t[8]
		],
		up: [
			t[1],
			t[5],
			t[9]
		],
		back: [
			t[2],
			t[6],
			t[10]
		]
	};
}
function Oe(e, t) {
	let n = xe.pose(t);
	return {
		...e,
		eye: n.eye,
		view: new Float32Array(xe.matrix(n))
	};
}
function ke(e, t, n) {
	let r = e.asset.data, i = e.matrix, a = e.at, o = r[t], s = r[t + 1], c = r[t + 2], l = Math.fround;
	return l(n(l(i[0] * o + i[1] * s + i[2] * c + a[0]), l(i[3] * o + i[4] * s + i[5] * c + a[1]), l(i[6] * o + i[7] * s + i[8] * c + a[2])));
}
function Ae(e, t) {
	let n = e.matrix, r = e.at, { sortLo: i, sortHi: a } = e.asset, o = t[2] * n[0] + t[6] * n[3] + t[10] * n[6], s = t[2] * n[1] + t[6] * n[4] + t[10] * n[7], c = t[2] * n[2] + t[6] * n[5] + t[10] * n[8], l = t[2] * r[0] + t[6] * r[1] + t[10] * r[2] + t[14], u = a.reduce((e, t, n) => e + Math.max(Math.abs(t), Math.abs(i[n])), 0), d = 1e-6 * (1 + Math.abs(l) + Math.abs(r[0]) + Math.abs(r[1]) + Math.abs(r[2]) + u * e.authored.scale);
	return [l + Math.min(o * i[0], o * a[0]) + Math.min(s * i[1], s * a[1]) + Math.min(c * i[2], c * a[2]) - d, l + Math.max(o * i[0], o * a[0]) + Math.max(s * i[1], s * a[1]) + Math.max(c * i[2], c * a[2]) + d];
}
function je() {
	let e = /* @__PURE__ */ new Uint32Array(65536), t, n, r;
	return function(i, a, o, s, c, l, u = [o, o], d = [0, 0]) {
		let { count: f, data: p } = i, m = s ? 2 : 1, h = f + (s?.reduce((e, t) => e + t.asset.count, 0) ?? 0);
		if (!t || t.length < h) {
			let e = Math.max(h, Math.ceil((t?.length ?? 0) * 1.25));
			t = new Float32Array(e), n = new Uint16Array(e);
		}
		(!r || r.length < h * m) && (r = new Int32Array(t.length * m));
		let g = a[2], _ = a[6], v = a[10], y = a[14], b = (e, t, n) => g * e + _ * t + v * n + y;
		for (let e = 0, n = 0; e < f; e++, n += 16) t[e] = b(p[n], p[n + 1], p[n + 2]);
		for (let e of i.moving ?? []) {
			if (e >= f) continue;
			let n = e * 16, r = p[n + 11] % 16, i = p[n + 12], a = p[n + 13], s = p[n + 14], c = p[n], l = p[n + 1], m = p[n + 2];
			if (r === 2 || r === 3) {
				let e = (r === 2 ? u[Math.round(p[n + 11]) & 8192 ? 1 : 0] : o) * a / s + i, t = (e - Math.floor(e)) * s;
				l += r === 2 ? -t : t, r === 2 && (c += d[0] * t / Math.max(a, 1e-5), m += d[1] * t / Math.max(a, 1e-5));
			} else if (r === 5) {
				let e = o * a, t = Math.cos(e), n = Math.sin(e), r = t * c + n * m;
				m = -n * c + t * m, c = r;
			} else l += Math.sin(o * a + i) * s;
			t[e] = b(c, l, m);
		}
		let x = i.anim?.bones;
		if (x) for (let e of i.anim.boned ?? []) {
			if (e >= f) continue;
			let n = e * 16, r = p[n], i = p[n + 1], a = p[n + 2], o = p[n + 14], s = p[n + 12] * 12, c = p[n + 13] * 12, l = (e, t) => x[e + t * 3] * r + x[e + t * 3 + 1] * i + x[e + t * 3 + 2] * a + x[e + 9 + t], u = (e) => {
				let t = l(s, e);
				return o > 0 ? t + (l(c, e) - t) * o : t;
			};
			t[e] = b(u(0), u(1), u(2));
		}
		let S = f;
		for (let e of s ?? []) for (let n = 0; n < e.asset.data.length; n += 16) t[S++] = ke(e, n, b);
		let C = Infinity, w = -Infinity;
		for (let e = 0; e < h; e++) {
			let n = t[e];
			n < C && (C = n), n > w && (w = n);
		}
		if (c && s.length < c.length) {
			let e = 0;
			for (let t of c) {
				if (t === s[e]) {
					e++;
					continue;
				}
				let [n, r] = Ae(t, a);
				if (!(n >= C && r <= w)) for (let e = 0; e < t.asset.data.length; e += 16) {
					let n = ke(t, e, b);
					n < C && (C = n), n > w && (w = n);
				}
			}
		}
		for (let e of i.back ?? []) e < f && (t[e] = C);
		if (l) {
			let e = r.subarray(0, f);
			for (let t = 0; t < f; t++) e[t] = t;
			return e.sort((e, n) => t[e] - t[n]), l(e, t);
		}
		let T = 65535 / (w - C || 1);
		e.fill(0);
		for (let r = 0; r < h; r++) e[n[r] = (t[r] - C) * T | 0]++;
		let E = 0;
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			e[t] = E, E += n;
		}
		if (s) {
			for (let t = 0; t < f; t++) {
				let i = e[n[t]]++ * 2;
				r[i] = t, r[i + 1] = 0;
			}
			let t = f;
			for (let i of s) {
				let a = f + i.start, o = i.index + 1;
				for (let s = 0; s < i.asset.count; s++, t++) {
					let i = e[n[t]]++ * 2;
					r[i] = a + s, r[i + 1] = o;
				}
			}
		} else for (let t = 0; t < f; t++) r[e[n[t]]++] = t;
		return r.length === h * m ? r : r.subarray(0, h * m);
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/environment.mjs
var Me = 17, Ne = 18, Pe = 19, Fe = 20, Ie = /* @__PURE__ */ new Map([
	["fog", 0],
	["box", 1],
	["sphere", 2],
	["shaft", 3]
]), Le = [
	0,
	0,
	0
], Re = (e) => Math.round(255 * Math.max(0, Math.min(1, e))), ze = (e) => [
	e >> 16 & 255,
	e >> 8 & 255,
	e & 255
].map((e) => e / 255);
function Be(e, t, n) {
	let r = Ie.get(e.type), i = e.min ?? e.at ?? e.from ?? [
		0,
		e.bottom ?? -0x56bc75e2d63100000,
		0
	], a = e.max ?? e.axis ?? [
		0,
		e.top ?? 0x56bc75e2d63100000,
		0
	];
	t.set([
		...i,
		r,
		...a,
		e.height ?? 0,
		...e.rgb,
		e.density,
		e.near,
		e.far ?? 0x56bc75e2d63100000,
		e.radius ?? 0,
		+!!e.lit
	], n);
}
function Ve(e, t, n) {
	let r = [...e.map((e) => e.paletteField), t?.paletteField];
	if (!r.some((e) => e?.strength)) return {
		rows: [],
		fog: !1,
		card: -1
	};
	let i = new Float32Array(r.length * 8), a = [];
	return r.forEach((t, o) => {
		if (!t?.strength) return;
		let s = n + r.length * 2 + a.length / 4;
		if (t.stops) for (let { at: e, rgb: n } of t.stops) a.push(...n, e);
		else for (let e = 0; e <= 128; e++) a.push(...t.sampleUnit(e / 128), 0);
		let c = [
			"depth",
			"altitude",
			"density",
			"light"
		].indexOf(t.source);
		i.set([
			t.stops ? 1 : 2,
			c,
			t.low,
			t.span,
			s,
			t.stops?.length ?? 129,
			t.strength,
			e[o]?.step ?? 0
		], o * 8);
	}), {
		rows: [...i, ...a],
		fog: e.some((e) => e.paletteField),
		card: t?.paletteField?.strength ? n + 2 * e.length : -1
	};
}
function He(e, t, { table: n, textureUnit: r }, i, a) {
	let o = a.KIT, s = a.EnvironmentFrame ?? o?.environmentFrame, c = a.SkyEnvironment ?? o?.skyEnvironment, l = a.CelestialTracks ?? o?.celestialTracks, u = a.ArtDirection ?? o?.artDirection, d = a.HorizonBands ?? o?.horizonBands, f, p, m, h, g, _, v = /* @__PURE__ */ new WeakMap();
	function y(n) {
		return e.activeTexture(e.TEXTURE0 + n), t.texture();
	}
	function b(t, a, b, x, S, C, w = !1) {
		if (a.environment === !1 || !s || !c) return null;
		let T = a.skyEnvironment ?? t.skyEnvironment, E = a.cloudField ?? t.cloudField, D = a.atmosphere === !1 ? [] : t.atmosphere ?? [], O = a.horizonBands ?? t.look?.horizonBands, k = a.celestialTracks ?? t.celestialTracks;
		if (!T && !E && !D.length && !O && !k) return null;
		let A = u?.prepare(t.look?.artDirection, a.artDirection), j = s.timeline(t, a, x, A, o?.weather?.tracks), M = ze(t.pal[0]), N = l?.settings(t.celestialTracks, a.celestialTracks)?.frame(j.skyTime), P = c.withCelestials(j.environment?.sky, N, M), F = w ? c.forReflection(P) : P, I = De(b), L = I.eye.map((e, t) => e - b.setback * I.back[t]), R, z, B = s.opticalWeather(t, a, j);
		if (E && o?.clouds) {
			let e;
			typeof E == "string" ? e = o.clouds.compile(E) : (e = v.get(E), e || (e = o.clouds.compile(E), v.set(E, e)));
			let { windConfig: n, flow: r } = s.wind(t, a, {
				...j,
				weather: B
			}), i = n && n.clouds !== !1 ? r.cloudTravel(0, j.skyTime).map((e) => e * n.clouds) : void 0;
			R = e.frame(j.skyTime, null, N?.sun?.direction ?? F?.sun, i, a.cloudRepresentation ?? t.cloudRepresentation, void 0, void 0, A?.cloudEdge), z = R.view?.(L, b.ortho ? I.back : null);
		}
		let V = z?.card, H = o?.atmosphere?.prepare(D.filter((e) => Ie.has(e?.type)), t.pal, void 0, B?.fogGain, j.skyTime) ?? [];
		if (H.length > 16) throw RangeError("WebGL supports up to 16 analytic atmosphere volumes per frame");
		let ee = Math.atan2(I.back[0], I.back[2]), te = Math.atan2(I.back[1], Math.hypot(I.back[0], I.back[2])), U = d?.prepare(t.look?.horizonBands, a.horizonBands)?.frame({
			eye: L,
			yaw: ee,
			pitch: te,
			distance: b.distance - b.setback,
			parameters: j.environment?.parameters
		}), ne = R?.visible && !z;
		if (!F && !V && !H.length && !U && !ne) return null;
		let re = b.ortho ? Math.tan((F?.orthoFov ?? Math.PI / 3) * .5) : b.tangent, ie = [re * b.aspect, re], W = Math.max(b.distance + 2 * b.radius, V ? z.horizon(I.eye) : 0), ae = !!(F?.celestial || F?.paletteRamp || F?.paletteField || U || ne), oe = ae ? [] : F?.splats ?? [], se = 4 * (H.length + oe.length), G = Ve(H, V, se), ce = new Float32Array(se * 4 + G.rows.length);
		ce.set(G.rows, se * 4);
		for (let e = 0; e < H.length; e++) Be(H[e], ce, e * 16);
		for (let e = 0; e < oe.length; e++) {
			let t = oe[e];
			ce.set([
				...t.direction,
				t.opacity,
				...t.right,
				t.size[0],
				...t.up,
				t.size[1],
				...t.color,
				0
			], 16 * (e + H.length));
		}
		if (f ||= (e.activeTexture(e.TEXTURE0 + Me), n(64, Me, i)), f.upload(ce), ae) {
			_ ??= y(Fe);
			let t = new Uint8Array(S * C * 4), n = [
				0,
				0,
				0
			], i = [
				0,
				0,
				0
			], a = F && A?.bands ? {
				...F,
				bands: A.bands
			} : F;
			for (let e = 0; e < C; e++) for (let r = 0; r < S; r++) {
				let o = (2 * (r + .5) / S - 1) * ie[0], s = (2 * (e + .5) / C - 1) * ie[1], l = 1 / Math.hypot(o, s, 1);
				for (let e = 0; e < 3; e++) i[e] = M[e], n[e] = (I.right[e] * o + I.up[e] * s - I.back[e]) * l;
				a && c.shade(a, n, i), U?.(n, i), ne && R.paint(L, n, i);
				let u = 4 * (e * S + r);
				for (let e = 0; e < 3; e++) t[u + e] = Re(i[e]);
				t[u + 3] = 255;
			}
			r(Fe, _), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, S, C, 0, e.RGBA, e.UNSIGNED_BYTE, t);
		} else f.bind(Fe);
		V ? (p ??= y(Ne), r(Ne, p), m !== V.pixels && (e.texImage2D(e.TEXTURE_2D, 0, e.RGB32F, V.resolution, V.resolution, 0, e.RGB, e.FLOAT, V.pixels), m = V.pixels)) : f.bind(Ne);
		let K = V?.lighting;
		return K ? (h ??= y(Pe), r(Pe, h), g !== K.cells && (e.texImage2D(e.TEXTURE_2D, 0, e.R32F, K.width, K.rows, 0, e.RED, e.FLOAT, K.cells), g = K.cells)) : f.bind(Pe), {
			media: !!(V || H.length),
			lit: H.some((e) => e.lit),
			uniforms: {
				u_envData: Me,
				u_envCard: Ne,
				u_envCloudLight: Pe,
				u_envBackdrop: Fe,
				u_envEye: I.eye,
				u_envRight: I.right,
				u_envUp: I.up,
				u_envBack: I.back,
				u_envCamera: [
					b.tangent * b.aspect,
					b.tangent,
					+b.ortho,
					b.setback
				],
				u_envSkyView: ie,
				u_envHorizon: W,
				u_envBackground: M,
				u_envHasSky: +!!F,
				u_envSkySplats: oe.length,
				u_envSkyStart: H.length * 4,
				u_envBackdropSampled: +ae,
				u_envZenith: F?.zenith ?? Le,
				u_envSkyHorizon: F?.horizon ?? Le,
				u_envGround: F?.ground ?? Le,
				u_envSun: F?.sun ?? Le,
				u_envSunRGB: F?.sunColor ?? Le,
				u_envSunParams: [
					F?.sunEdge ?? 0,
					F?.sunCore ?? 1,
					F?.sunStrength ?? 0
				],
				u_envFogCount: H.length,
				u_envBands: A?.atmosphereBands ?? 0,
				u_envPaletteFog: +G.fog,
				u_envPaletteStart: se,
				u_envPaletteCard: G.card,
				u_envCardSize: V?.resolution ?? 0,
				u_envCloudHardness: A?.cloudHardness ?? .5,
				...V && {
					u_envCardFrame: [...V.center, V.radius],
					u_envCardRight: V.right,
					u_envCardUp: V.up,
					u_envCardNormal: V.normal,
					u_envCloudRGB: V.rgb,
					u_envCloudHeight: [
						K?.low ?? 0,
						K?.thickness ?? 1,
						V.opacity,
						K?.probe ?? 0
					]
				},
				...K && {
					u_envCloudStyle: [
						K.ambient,
						K.strength,
						K.rim,
						K.daylight
					],
					u_envCloudDomain: [...K.origin, ...K.cell],
					u_envCloudSun: K.direction,
					u_envCloudLightRGB: K.rgb
				}
			}
		};
	}
	return { prepare: b };
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/portal-composite.mjs
var Ue = "#version 300 es\nprecision highp float;\nuniform sampler2D u_source, u_destination, u_cover, u_spriteCover;\nuniform vec3 u_origin, u_right, u_up, u_normal, u_eye;\nuniform mat4 u_portalView;\nuniform vec3 u_settings;\nuniform vec2 u_half, u_size;\nuniform int u_opening, u_hasSpriteCover;\nuniform float u_fade, u_far;\nout vec4 o;\nbool throughOpening() {\n  vec2 p = (gl_FragCoord.xy / u_size * 2.0 - 1.0) * u_settings.xy;\n  bool ortho = u_settings.z > 0.5;\n  mat3 world = transpose(mat3(u_portalView));\n  vec3 eye = u_eye + (ortho ? world * vec3(p, 0.0) : vec3(0));\n  vec3 ray = world * vec3(ortho ? vec2(0) : p, -1.0);\n  float towards = dot(ray, u_normal);\n  if (towards >= -1e-7) return false;\n  float t = dot(u_origin - eye, u_normal) / towards;\n  if (t <= 0.0 || t >= u_far) return false;\n  vec3 at = eye + ray * t;\n  vec3 relative = at - u_origin;\n  vec2 local = vec2(dot(relative, u_right), dot(relative, u_up)) / u_half;\n  if (u_opening == 2 ? dot(local, local) > 1.0 : any(greaterThan(abs(local), vec2(1.0)))) return false;\n  ivec2 pixel = ivec2(gl_FragCoord.xy);\n  return texelFetch(u_cover, pixel, 0).r < 0.5 &&\n    (u_hasSpriteCover == 0 || texelFetch(u_spriteCover, pixel, 0).r < 0.5);\n}\nvoid main() {\n  ivec2 p = ivec2(gl_FragCoord.xy);\n  vec3 color = u_opening != 0 && throughOpening() ? texelFetch(u_destination, p, 0).rgb :\n    texelFetch(u_source, p, 0).rgb;\n  o = vec4(color * (1.0 - u_fade), 1.0);\n}", We = /* @__PURE__ */ new WeakMap(), Ge = 16777215;
function Ke(e) {
	let t = We.get(e);
	if (!t) throw TypeError("Expected instances from createSplatInstances");
	return t;
}
function qe(e, t, n) {
	let { asset: r, matrix: i, at: a, authored: o, swatches: s, mask: c, diagonal: l } = t, { opacity: u, visible: d } = o, f = new Map(s);
	for (let t = 0, o = n * 16; t < r.count * 16; t += 16, o += 16) {
		let n = r.data, s = n[t], p = n[t + 1], m = n[t + 2], h = s - c?.[0], g = p - c?.[1], _ = m - c?.[2];
		e[o] = i[0] * s + i[1] * p + i[2] * m + a[0], e[o + 1] = i[3] * s + i[4] * p + i[5] * m + a[1], e[o + 2] = i[6] * s + i[7] * p + i[8] * m + a[2], e[o + 3] = !d || p < -30 || c && h * h + g * g + _ * _ <= c[3] ? 0 : n[t + 3] * u;
		let v = n[t + 4], y = n[t + 5], b = n[t + 6], x = n[t + 8], S = n[t + 9], C = n[t + 10];
		if (l) {
			let t = i[0] * i[0];
			e[o + 4] = v * t, e[o + 5] = y * t, e[o + 6] = b * t, e[o + 8] = x * t, e[o + 9] = S * t, e[o + 10] = C * t;
		} else for (let t = 0; t < 3; t++) {
			let n = t * 3, r = i[n] * v + i[n + 1] * y + i[n + 2] * b, a = i[n] * y + i[n + 1] * x + i[n + 2] * S, s = i[n] * b + i[n + 1] * S + i[n + 2] * C;
			for (let n = t; n < 3; n++) {
				let c = t === 0 ? 4 + n : t === 1 ? 7 + n : 10, l = n * 3;
				e[o + c] = r * i[l] + a * i[l + 1] + s * i[l + 2];
			}
		}
		e[o + 7] = f.get(n[t + 7]) ?? n[t + 7], e[o + 11] = n[t + 11];
	}
}
function Je(e, t, n) {
	let r = t.asset.materialPixelStyles;
	if (!e || !r || (n *= 4, e.set(r, n), !t.swatches.length)) return;
	let i = new Map(t.swatches);
	for (let t = n + 2; t < n + r.length; t += 4) e[t] = i.get(e[t]) ?? e[t], e[t + 1] = i.get(e[t + 1]) ?? e[t + 1];
}
function Ye(e, { asset: t, authored: { rotation: n } }, r) {
	if (e && t.normals) for (let i = 0, a = r * 3; i + 2 < t.normals.length; i += 3, a += 3) {
		let r = t.normals[i], o = t.normals[i + 1], s = t.normals[i + 2];
		for (let t = 0; t < 3; t++) {
			let i = t * 3;
			e[a + t] = n[i] * r + n[i + 1] * o + n[i + 2] * s;
		}
	}
}
function Xe(e, t) {
	if (e + t.count > Ge || e + t.sharedCount > Ge) throw RangeError("Instances exceed the 24-bit splat address space");
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/instance-draw.mjs
var Ze = 512, Qe = 256, $e = 64, et = Qe * 4 / $e;
function tt(e, t, n, r, i, a, o) {
	let { authored: s, asset: c, center: l, extent: u, spread: d } = e;
	if (!s.visible || !s.opacity || c.empty) return !1;
	let [f, p, m] = l, h = t.view, g = .001 + 1e-6 * (Math.abs(f) + Math.abs(p) + Math.abs(m)), _ = -(h[2] * f + h[6] * p + h[10] * m + h[14]), v = u + g;
	if (_ + v < t.clipNear) return !1;
	let y = Math.abs(h[0] * f + h[4] * p + h[8] * m + h[12]), b = Math.abs(h[1] * f + h[5] * p + h[9] * m + h[13]), x = d * Math.abs(o);
	return t.ortho ? y <= n + i + v + x && b <= r + a + v + x : y <= (n + i) * (_ + v) + v + x * Math.hypot(1, 1.3 * n) && b <= (r + a) * (_ + v) + v + x * Math.hypot(1, 1.3 * r);
}
function nt(e, { index: t, start: n, asset: r, matrix: i, at: a, authored: o, swatches: s, diagonal: c, mask: l }) {
	let u = (t + 1) * $e;
	for (let t = 0; t < 3; t++) {
		let n = t * 3;
		e.set([
			i[n],
			i[n + 1],
			i[n + 2],
			a[t]
		], u + t * 4);
	}
	e.set([
		r.offset - n,
		s.length,
		o.opacity,
		+c + 2 * !!l
	], u + 12), c && e.set([
		a[0],
		a[1],
		a[2],
		i[0]
	], u + 52), l && e.set(l, u + 16);
	for (let t = 0; t < s.length; t++) e.set(s[t], u + 20 + t * 2);
}
function rt(e, t, n, r, i) {
	let a = t.tangent * t.aspect, o = t.tangent, s = 6 * a / n, c = 6 * o / r;
	return e.rows.filter((e) => tt(e, t, a, o, s, c, i));
}
function it(e, t) {
	return t ?? Array.from({ length: Math.ceil(e.count / Ze) }, (e, t) => t);
}
function at() {
	let e, t, n, r, i, a, o, s, c, l, u, d;
	return function(f, p, m) {
		let h = Ke(p);
		if (f !== e || p !== t || f.data !== i || f.count !== a || f.fine !== o || f.pix !== s || f.renderMetadata !== c || f.materialPixelStyles !== l || f.opticalSplats !== u) {
			n = p.flatten(f);
			let { data: m, count: g, fine: _, pix: v, renderMetadata: y, materialPixelStyles: b, opticalSplats: x } = n;
			return d = {
				data: m,
				count: g,
				fine: _,
				pix: v,
				renderMetadata: y,
				materialPixelStyles: b,
				opticalSplats: x
			}, e = f, t = p, i = f.data, a = f.count, o = f.fine, s = f.pix, c = f.renderMetadata, l = f.materialPixelStyles, u = f.opticalSplats, r = h.revision, { world: n };
		}
		Object.assign(n, f, d);
		let g = it(f, m), _ = new Set(g);
		for (let e of g) {
			let t = e * Ze * 16, r = Math.min(t + Ze * 16, f.count * 16);
			n.data.set(f.data.subarray(t, r), t), u && n.opticalSplats.set(u.subarray(t / 16 * 12, r / 16 * 12), t / 16 * 12);
			let i = f.renderMetadata?.normals;
			i && n.renderMetadata.normals.set(i.subarray(t / 16 * 3, r / 16 * 3), t / 16 * 3);
		}
		if (r !== h.revision) {
			for (let e of h.rows) {
				if (!(e.version > r)) continue;
				let t = f.count + e.start;
				qe(n.data, e, t), Je(n.materialPixelStyles, e, t), Ye(n.renderMetadata.normals, e, t);
				let i = Math.ceil((t + e.asset.count) / Ze);
				for (let e = Math.floor(t / Ze); e < i; e++) _.add(e);
			}
			r = h.revision;
		}
		return {
			world: n,
			changedRows: [..._]
		};
	};
}
function ot(e, t, n) {
	let r = e(Qe, 15, n), i, a, o, s, c, l, u;
	return { bind(e, d, f, p, m = d.data) {
		let h = Ke(e), g = i !== e || c !== d || l !== d.data || u !== d.count;
		if (g) {
			let e = (d.count + h.sharedCount) * 16;
			if (Math.ceil(e / (Ze * 16)) > n) throw RangeError("Shared splat geometry exceeds the WebGL texture size limit");
			a = new Float32Array(e), a.set(m.subarray(0, d.count * 16));
			for (let e of h.assets) a.set(e.data, (d.count + e.offset) * 16);
		}
		let _ = it(d, f);
		if (!g) for (let e of _) {
			let t = e * Ze * 16;
			a.set(m.subarray(t, Math.min(t + Ze * 16, d.count * 16)), t);
		}
		if (t.upload(a, a.length, g || p ? void 0 : _), i !== e) {
			o = new Float32Array((h.rows.length + 1) * $e);
			for (let e of h.rows) nt(o, e);
			r.upload(o);
		} else if (s !== h.revision) {
			let e = /* @__PURE__ */ new Set();
			for (let t of h.rows) t.version > s && (nt(o, t), e.add(Math.floor((t.index + 1) / et)));
			r.upload(o, o.length, [...e]);
		} else r.bind();
		return i = e, c = d, l = d.data, u = d.count, s = h.revision, h;
	} };
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/contribution-plan.mjs
var st = [
	"red",
	"green",
	"blue",
	"luminance",
	"alpha"
], ct = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
function lt(e, t, n) {
	let r = [], i = [], a = 0;
	for (let { maskSource: n } of e) {
		if (!n) {
			r.push(null);
			continue;
		}
		let [e, o] = n.range ?? [0, 1], s = [
			n.type === "axis" ? 1 : 2,
			+(n.space !== "world"),
			[
				"linear",
				"smooth",
				"step"
			].indexOf(n.interpolation ?? "smooth"),
			+!!n.invert
		];
		if (n.type === "axis") {
			let { direction: i, offset: a } = t.axis(n);
			r.push([
				...s,
				...i,
				a,
				e,
				1 / (o - e)
			]);
			continue;
		}
		let { x: c, z: l, origin: u } = t.plane(n.projection), [d, f] = n.scale ?? [1, 1], [p, m] = n.offset ?? [0, 0], { width: h, height: g, frames: _, fps: v = 1, channels: y = 4, repeat: b = !1, wrap: x = !1 } = n.raster;
		r.push([
			...s,
			...c.map((e) => e / d),
			(-ct(c, u) - p) / d,
			e,
			1 / (o - e),
			a,
			+x,
			...l.map((e) => e / f),
			(-ct(l, u) - m) / f,
			h,
			g,
			_.length,
			v,
			+b
		]), a += h * g * _.length, i.push({
			frames: _,
			channels: y,
			channel: st.indexOf(n.channel ?? "alpha")
		});
	}
	if (!a) return { rows: r };
	let o = Math.min(n, 1024), s = Math.ceil(a / o);
	if (s > n || a > 2 ** 22) throw RangeError("WebGL look mask textures exceed their atlas budget");
	let c = new Float32Array(o * s), l = 0;
	for (let { frames: e, channels: t, channel: n } of i) for (let r of e) for (let e = 0; e < r.length; e += t) {
		let i = t === 4 ? r[e + 3] / 255 : 1, a = n === 4 ? 1 : n === 3 ? (.3 * r[e] + .55 * r[e + 1] + .15 * r[e + 2]) / 255 : r[e + n] / 255;
		c[l++] = a * i;
	}
	return {
		rows: r,
		texture: {
			width: o,
			height: s,
			values: c
		}
	};
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/viewer-input.mjs
var ut = [
	"South",
	"East",
	"West",
	"North",
	"LeftBumper",
	"RightBumper",
	"LeftTrigger",
	"RightTrigger",
	"Back",
	"Start",
	"LeftStick",
	"RightStick",
	"DPadUp",
	"DPadDown",
	"DPadLeft",
	"DPadRight",
	"Home"
], dt = [
	"LeftX",
	"LeftY",
	"RightX",
	"RightY"
], ft = [
	"Left",
	"Middle",
	"Right",
	"Back",
	"Forward"
], pt = {
	0: "Tip",
	2: "Barrel",
	5: "Eraser"
}, mt = [
	1,
	4,
	2,
	8,
	16,
	32
], ht = [
	"Alt",
	"Control",
	"Meta",
	"Shift"
], gt = /* @__PURE__ */ new WeakSet(), _t = (e) => Math.min(1, Math.max(-1, e)), vt = Object.freeze([]), yt = "input,textarea,select,button,a[href],[contenteditable]:not([contenteditable=\"false\"]),[role=\"textbox\"]";
function bt(e) {
	return ht.filter((t) => e[t === "Control" ? "ctrlKey" : t.toLowerCase() + "Key"]);
}
function xt(e, t) {
	return ht.filter((n) => e.includes(n) && t !== "key:" + n + "Left" && t !== "key:" + n + "Right");
}
function St(e, t) {
	for (let [n, r] of e) Math.abs(r) > Math.abs(t[n]) && (t[n] = r);
}
function Ct(e) {
	let t = e.mapping === "standard", n = /* @__PURE__ */ new Map();
	return Array.from(e.buttons ?? []).slice(0, 64).forEach((e, r) => {
		let i = Number.isFinite(e?.value) ? e.value : +!!e?.pressed;
		n.set("pad:" + (t && ut[r] || "Button" + r), Math.max(0, Math.min(1, i)));
	}), Array.from(e.axes ?? []).slice(0, 32).forEach((e, r) => {
		n.set("pad:" + (t && dt[r] || "Axis" + r), Number.isFinite(e) ? _t(e) : 0);
	}), n;
}
function wt(e, { toolkit: t, contexts: n, context: r, onAction: i, onPointer: a, onFocus: o, focusOnPointer: s = !0, tabStop: c = !0, motionScale: l = 96, readGamepads: u } = {}) {
	let d = (t?.KIT ?? t)?.procedural?.inputActions?.compile, f = e?.ownerDocument, p = f?.defaultView;
	if (typeof d != "function" || !p || typeof e.focus != "function" || gt.has(e) || [
		i,
		a,
		o,
		u
	].some((e) => e !== void 0 && typeof e != "function") || typeof s != "boolean" || typeof c != "boolean" || !Number.isFinite(l) || l <= 0) throw TypeError("Viewer input needs an available DOM surface, action toolkit, and valid options");
	let m = d(n), h = r ?? Object.keys(m.profile)[0], g = { ...m.sample(h, vt) }, _ = !1, v = !0, y = !1, b = !1, x = /* @__PURE__ */ new Set(), S = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), w = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Set(), E = /* @__PURE__ */ new Set(), D = [], O = [], k = e.getAttribute("tabindex"), A = c && k === null && e.tabIndex < 0;
	A && e.setAttribute("tabindex", "0"), gt.add(e);
	function j(e, t, n, r) {
		e.addEventListener(t, n, r), D.push(() => e.removeEventListener(t, n, r));
	}
	function M(e, t, n, r) {
		i?.(Object.freeze({
			action: e,
			phase: t,
			value: n,
			...r
		}));
	}
	function N(e, t) {
		let n = g;
		g = e;
		for (let [r, i] of Object.entries(e)) {
			if (g !== e) break;
			let a = n[r] ?? 0;
			if (i === a) continue;
			let o = i === 0 ? "release" : a === 0 ? "press" : "change";
			o === "press" && T.add(r), o === "release" && E.add(r), M(r, o, i, t);
		}
	}
	function P(e) {
		let t = { ...m.sample(h, vt) };
		for (let e of x) {
			let n = m.resolve(h, e, 1, xt(O, e));
			n && St([[n.action, n.value]], t);
		}
		for (let { binding: e } of S.values()) e && St([[e.action, e.value]], t);
		for (let { levels: e } of C.values()) St(e, t);
		N(t, e);
	}
	function F(t) {
		e.hasPointerCapture?.(t.id) && e.releasePointerCapture(t.id);
	}
	function I(e, t, n, r = [0, 0]) {
		a?.(Object.freeze({
			phase: t,
			id: e.id,
			device: e.device,
			action: e.binding?.action ?? null,
			input: e.input,
			point: Object.freeze(e.point.slice()),
			delta: Object.freeze(r),
			event: n
		}));
	}
	function L() {
		x.clear(), O = [], C.clear(), w.clear(), T.clear();
		let e = [...S.values()];
		S.clear(), N({ ...m.sample(h, vt) }, { device: "focus" });
		for (let t of e) F(t), I(t, "cancel");
	}
	function R() {
		let e;
		try {
			e = u ? u() : p.navigator.getGamepads?.();
		} catch {
			e = vt;
		}
		let t = /* @__PURE__ */ new Set();
		for (let [n, r] of Array.from(e ?? vt).slice(0, 16).entries()) {
			if (!r || r.connected === !1) continue;
			t.add(n);
			let e = r.id + "\0" + r.mapping, i = C.get(n), a = Ct(r), o = i?.identity === e ? i.blocked : new Set([...a].filter(([, e]) => Math.abs(e) > .12).map(([e]) => e)), s = [];
			for (let [e, t] of a) {
				if (o.has(e)) {
					Math.abs(t) <= .12 && o.delete(e);
					continue;
				}
				let n = m.resolve(h, e, t);
				n && s.push([n.action, n.value]);
			}
			C.set(n, {
				identity: e,
				blocked: o,
				levels: s
			});
		}
		for (let e of C.keys()) t.has(e) || C.delete(e);
		P({ device: "gamepad" });
	}
	function z() {
		let t = !y && v && !b && f.visibilityState !== "hidden" && (f.hasFocus?.() ?? !0) && e.getRootNode().activeElement === e && !e.matches?.(yt) && !e.isContentEditable;
		return t !== _ && (_ = t, t ? R() : L(), o?.(_)), _;
	}
	function B(t) {
		let n = t.composedPath?.()[0] ?? t.target;
		return n === e && !n.closest?.(yt) && !n.isContentEditable;
	}
	function V() {
		return y || !v ? !1 : (e.focus({ preventScroll: !0 }), z());
	}
	function H(e, t) {
		if (!z() || !B(e) || e.defaultPrevented || e.isComposing || !e.code || e.code === "Tab" || !/^\w[\w-]{0,47}$/.test(e.code)) return;
		let n = "key:" + e.code;
		if (t && e.repeat && !x.has(n)) return;
		O = bt(e);
		let r = m.resolve(h, n, 1, xt(O, n)), i = x.has(n);
		t ? x.add(n) : x.delete(n);
		let a = {
			device: "keyboard",
			input: n,
			event: e
		};
		P(a), t && e.repeat && r?.value && M(r.action, "repeat", r.value, a), r?.value && (t || i) && e.preventDefault();
	}
	function ee(t) {
		let n = e.getBoundingClientRect();
		return [t.clientX - n.left, t.clientY - n.top];
	}
	function te(t) {
		if (!v || t.defaultPrevented || !B(t) || S.has(t.pointerId) || S.size >= 16 || (s && !z() && V(), !z())) return;
		let n = t.pointerType === "touch" ? "touch" : t.pointerType === "pen" ? "pen" : "mouse", r = n === "touch" ? "Contact" : n === "pen" ? pt[t.button] : ft[t.button], i = bt(t), a = r && n + ":" + r, o = a ? m.resolve(h, a, 1, i) : null, c = ["X", "Y"].some((e) => m.resolve(h, n + ":Drag" + e, 1, i)?.value);
		if (!o?.value && !c) return;
		let l = {
			id: t.pointerId,
			device: n,
			input: a,
			binding: o,
			chord: i,
			button: t.button,
			point: ee(t)
		};
		S.set(l.id, l);
		try {
			e.setPointerCapture?.(l.id);
		} catch {}
		t.preventDefault(), P({
			device: n,
			input: a,
			event: t
		}), S.has(l.id) && I(l, "start", t);
	}
	function U(e, t, n, r) {
		if (!Number.isFinite(t) || !t || !m.resolve(h, e, 1, n)?.value) return !1;
		let i = e + " " + n.join("+"), a = (w.get(i)?.value ?? 0) + t;
		w.set(i, {
			input: e,
			value: a,
			chord: n
		});
		let o = m.resolve(h, e, _t(t / l), n);
		return o.value && M(o.action, "pulse", o.value, {
			...r,
			input: e
		}), !0;
	}
	function ne(e) {
		if (!z()) return;
		let t = S.get(e.pointerId);
		if (!t) return;
		if (t.device !== "touch" && e.isTrusted && !(e.buttons & mt[t.button])) {
			re(e, "end");
			return;
		}
		let n = ee(e), r = [n[0] - t.point[0], n[1] - t.point[1]];
		t.point = n;
		let i = {
			device: t.device,
			event: e
		};
		U(t.device + ":DragX", r[0], t.chord, i), U(t.device + ":DragY", r[1], t.chord, i), S.has(t.id) && I(t, "move", e, r), e.preventDefault();
	}
	function re(e, t) {
		let n = S.get(e.pointerId);
		n && (S.delete(n.id), t === "end" && (n.point = ee(e)), F(n), P({
			device: n.device,
			input: n.input,
			event: e
		}), I(n, t, e));
	}
	function ie(t) {
		if (t.defaultPrevented || !B(t) || !z()) return;
		let n = t.deltaMode === 1 ? 16 : t.deltaMode === 2 ? e.clientHeight : 1, r = bt(t), i = {
			device: "wheel",
			event: t
		}, a = U("wheel:X", t.deltaX * n, r, i), o = U("wheel:Y", t.deltaY * n, r, i);
		(a || o) && t.preventDefault();
	}
	function W(e, t = h) {
		if (y) throw Error("Viewer input is disposed");
		let n = d(e);
		return n.sample(t, vt), L(), m = n, h = t, g = { ...m.sample(h, vt) }, z() && R(), m.profile;
	}
	for (let [t, n] of Object.entries({
		focus: z,
		blur: z,
		keydown: (e) => H(e, !0),
		keyup: (e) => H(e, !1),
		pointerdown: te,
		pointermove: ne,
		pointerup: (e) => re(e, "end"),
		pointercancel: (e) => re(e, "cancel"),
		lostpointercapture: (e) => re(e, "cancel")
	})) j(e, t, n);
	return j(e, "wheel", ie, { passive: !1 }), j(f, "visibilitychange", z), j(p, "blur", () => {
		b = !0, z();
	}), j(p, "focus", () => {
		b = !1, z();
	}), j(p, "gamepaddisconnected", () => {
		z() && R();
	}), Object.freeze({
		get focused() {
			return z();
		},
		get context() {
			return h;
		},
		profile: () => m.profile,
		focus: V,
		setProfile: W,
		setContext(e) {
			e !== h && W(m.profile, e);
		},
		setBindings(e, t, n) {
			let r = m.profile;
			if (!Object.hasOwn(r, e) || !Object.hasOwn(r[e], t)) throw TypeError("Unknown viewer input context or action");
			return W({
				...r,
				[e]: {
					...r[e],
					[t]: n
				}
			});
		},
		setEnabled(e) {
			if (typeof e != "boolean") throw TypeError("Viewer input enabled state must be Boolean");
			v = e, z();
		},
		poll() {
			z() && R();
			let e = { ...g };
			for (let { input: t, value: n, chord: r } of w.values()) {
				let i = m.resolve(h, t, _t(n / l), r);
				i && St([[i.action, i.value]], e);
			}
			let t = Object.freeze({
				context: h,
				focused: _,
				values: Object.freeze(e),
				pressed: Object.freeze([...T]),
				released: Object.freeze([...E])
			});
			return T.clear(), E.clear(), w.clear(), t;
		},
		dispose() {
			if (!y) {
				y = !0;
				for (let e of D) e();
				gt.delete(e), A && e.getAttribute("tabindex") === "0" && e.removeAttribute("tabindex"), _ && (_ = !1, L(), o?.(!1));
			}
		}
	});
}
// node_modules/@shapeshift-labs/ink-studio/src/webgl/renderer.mjs
var q = /* @__PURE__ */ new Float32Array(4), Tt = /* @__PURE__ */ new Float32Array(), Et = Symbol("reconstruction source");
function Dt(e, t, n, r) {
	let i = e.KIT?.reconstruction;
	if (!i) throw Error("World reconstruction needs the Ink Studio KIT");
	return i.frame(t, n.time ?? t.lookSnapshot?.time ?? 0, r);
}
var Ot = (e) => [
	(e >> 16 & 255) / 255,
	(e >> 8 & 255) / 255,
	(e & 255) / 255
];
function kt(e, t = 64) {
	let n = new Float32Array(t * 3);
	for (let r = 0; r < Math.min(t, e.length); r++) n.set(Ot(e[r]), r * 3);
	return n;
}
function At(e, t) {
	let n = /* @__PURE__ */ new Float32Array(16);
	for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
		let a = 0;
		for (let n = 0; n < 4; n++) a += e[n * 4 + i] * t[r * 4 + n];
		n[r * 4 + i] = a;
	}
	return n;
}
function jt(e, t) {
	return new Float32Array([
		e[0],
		e[4],
		e[8],
		0,
		e[1],
		e[5],
		e[9],
		0,
		e[2],
		e[6],
		e[10],
		0,
		...t,
		1
	]);
}
function Mt({ origin: e, normal: [t, n, r] }) {
	return [
		t,
		n,
		r,
		-(t * e[0] + n * e[1] + r * e[2])
	];
}
function Nt([e, t, n, r], { view: i, eye: a }) {
	return [
		i[0] * e + i[4] * t + i[8] * n,
		i[1] * e + i[5] * t + i[9] * n,
		i[2] * e + i[6] * t + i[10] * n,
		e * a[0] + t * a[1] + n * a[2] + r
	];
}
function Pt(e, t) {
	let n = e.gpu(t), r = Float32Array.from(n.lens), i = Array.from(r, (e, t) => Array.from(n.ramps.slice(t * 8, t * 8 + (Math.round(e) & 15)), Math.round)), a = i.map((e, t) => t), o = (e) => {
		for (; a[e] !== e;) e = a[e];
		return e;
	};
	for (let e = 0; e < r.length; e++) for (let t = e + 1; t < r.length; t++) {
		let n = 0;
		for (let r of i[e]) i[t].includes(r) && n++;
		n >= 2 && (a[o(t)] = o(e));
	}
	return r.forEach((e, t) => {
		r[t] = (Math.round(e) & 31) + o(t) * 32;
	}), {
		...n,
		lens: r
	};
}
function J(e) {
	return e.replaceAll("u_pixOn > 0.5", "false").replaceAll("u_ao > 0.0", "false").replaceAll("u_toneOn > 0.5", "false").replaceAll("u_remapLine > 0", "false").replaceAll("u_grade > 0.5", "false").replace("if (u_gk <= 0.0) return c;", "return c;");
}
function Ft(e, t) {
	return e?.length === t.length && t.every((t, n) => t === e[n]);
}
function It(e, t, n, r) {
	let i = ie(e), a = t.KIT?.procedural?.sampleCoverage, o = t.ContributionRules ?? t.KIT?.procedural?.contributionRules, s = t.StableDetail ?? t.KIT?.stableDetail, c = t.KIT?.cutaway, l;
	try {
		let u = (e) => ve(t.PixelLook, {
			packedTone: !0,
			...e
		}), d = u(), f = (e) => i.program(d.POST_VS, e), p = f(d.POST_FS), m = f(d.CLEAN_FS), g = t.ArtDirection ?? t.KIT?.artDirection, _ = t.KIT?.procedural?.airflow, v = t.KIT?.environmentFrame;
		l = be(e, {
			specialize: !1,
			sampleCoverage: a,
			coverageRules: o,
			stableDetail: s,
			cutaway: c?.glsl,
			airflow: _
		});
		let x = i.allocate("VertexArray"), S = e.getParameter(e.MAX_TEXTURE_SIZE), C = e.getParameter(e.MAX_DRAW_BUFFERS), k = ae(e, i), { target: A, table: M, textureUnit: N } = k, P = He(e, i, k, S, t), F = y(e, i, k, S, t), L = h(e, i, k, S, t), z = /* @__PURE__ */ new Map(), B = A(2), V = A(2), H = A(), ee = A(1, { integer: !0 }), te = /* @__PURE__ */ new Map(), ne, ie, oe, se, G, ce, K, le, ue, de, fe, pe, me, he, ge, _e, ye, xe = 0, Se = 0, Ce, we, Te, ke, Ae, Me, Ne, Pe, Fe = A(), Ie = A(), Le = [A(), A()], Re = t.DetailBudgets ?? t.KIT?.detailBudgets, ze = t.KIT?.passQuality, Be = t.KIT?.renderContract, Ve = t.KIT?.splatRelighting, We = /* @__PURE__ */ new Map(), Ge, qe, Je, Ye, Xe, Ze, Qe = /* @__PURE__ */ new WeakMap(), $e = /* @__PURE__ */ new WeakMap(), et, tt, nt, it, st, ct, ut, dt = M(2048, 0, S), ft = M(768, 4, S), pt = M(1536, 7, S), mt = M(2048, 10, S), ht = i.texture(), gt, _t, vt, yt, bt, xt, St, Ct, wt, It, Lt, Rt = /* @__PURE__ */ new Map(), zt = /* @__PURE__ */ new Map(), Y, X, Bt, Z, Vt, Ht, Ut = /* @__PURE__ */ new WeakMap(), Wt = 0, Q = je(), Gt = t.KIT?.procedural?.splatOrder, Kt = t.KIT?.afterimages, qt = Kt?.history(), Jt = Kt?.history(), Yt = /* @__PURE__ */ new WeakMap(), Xt = /* @__PURE__ */ new WeakMap(), Zt = [], Qt, $t, en, tn, nn, rn, an, on, sn = !1, cn, ln, un, dn, fn, pn, mn, hn, gn, _n, vn, yn, bn, xn, Sn, Cn, wn, Tn = 0, En = Tt, Dn = 0, On = !1, kn, An, jn, Mn, Nn, Pn, Fn, In, Ln, Rn, zn;
		function Bn(e, t, n, i, a, o, s, c, u, d, f, p, m, h, g) {
			let _ = t.time ?? e.lookSnapshot?.time ?? 0, v = d && In?.source === p && In.histories === f && _ < In.sceneTime, y = f.get(p);
			if (!d || t.order ? f.delete(p) : (y || f.set(p, y = Gt.history()), (t.resetTransparency || v) && y.reset()), t.order) {
				l.setOrder(g ? t.order.filter((e) => g.keep[e]) : t.order), In = null;
				return;
			}
			let b = e.moving ?? [], x = e.back ?? [], S = r && !e.anim?.bones?.length, C = b.length ? [
				i,
				...m,
				...h
			] : [], w = o ? [
				s,
				c,
				u,
				n.tangent,
				n.clipNear,
				+n.ortho
			] : [];
			if (S && !a && (t.changedRows?.length === 0 || o && !e.count && !t.changedRows) && !t.resetTransparency && !v && In?.tolerance === d && Ft(In.clock, C) && (!d || In.histories === f) && In.quality === g && In.revision === o?.orderRevision && Ft(In.viewport, w) && Ft(In.view, n.view) && Ft(In.moving, b) && Ft(In.back, x)) {
				In.sceneTime = _;
				return;
			}
			let T = o && rt(o, n, s, c, u), E = d && x.length ? new Set(x) : null, { data: D, opticalSplats: O } = e, k = d ? (e, r) => y.sort(e, {
				data: p.data,
				layout: t.instances,
				view: n.view,
				time: _,
				tolerance: d,
				depthAt: (e) => r[e],
				transparentAt: (e) => Gt.isTransparent(D, e, D[e * 16 + 3], O?.[e * 12 + 3], E)
			}) : void 0, A = Q(e, n.view, i, T, o?.rows, k, m, h);
			l.setOrder(g ? A.filter((e) => g.keep[e]) : A, !!o), In = S ? {
				view: n.view,
				moving: Int32Array.from(b),
				back: Int32Array.from(x),
				clock: C,
				tolerance: d,
				sceneTime: _,
				source: p,
				histories: f,
				revision: o?.orderRevision,
				viewport: w,
				quality: g
			} : null;
		}
		function Vn(e, t) {
			if (!t?.affectsCleanup && !t?.fineOff) return null;
			let n = e.look.detailBudgets, r = Qe.get(e);
			if (r?.definition === n && r.count === e.count && r.metadata === e.renderMetadata && r.tiles === e.fine) return r;
			let i = t.bind(e), a = t.affectsCleanup && Float32Array.from({ length: e.count }, (e, t) => Re.flags(i(t))), o = e.fine;
			if (o && t.fineOff) for (let t = 0; t < e.count; t++) {
				let n = t * 12 + 11;
				o[n] && i(t)?.fine === !1 && (o === e.fine && (o = o.slice()), o[n] = 0);
			}
			let s = {
				definition: n,
				count: e.count,
				metadata: e.renderMetadata,
				tiles: e.fine,
				fine: o,
				flags: a && a.some(Boolean) ? a : null
			};
			return Qe.set(e, s), s;
		}
		function Hn(e, t, n, r, i) {
			if (!n?.rows) return null;
			let a = $e.get(e);
			if (t.changedRows?.length === 0 && a?.key === r && a.data === e.data && a.metadata === e.renderMetadata && a.count === e.count && a.particleStart === i) return a.selection;
			let o = ze.planRows(e, n, {
				particleStart: i,
				silhouette: t.silhouetteProtection
			});
			return $e.set(e, {
				key: r,
				data: e.data,
				metadata: e.renderMetadata,
				count: e.count,
				particleStart: i,
				selection: o
			}), o;
		}
		function Un(e, t, n, r) {
			let i = e.materialPixelStyles, a = it;
			if (!a || a.group !== t || a.source !== i || a.count !== e.count) {
				let r = i;
				if (n) {
					r = new Float32Array((e.count + n.sharedCount) * 4), i && r.set(i.subarray(0, e.count * 4));
					for (let t of n.assets) t.materialPixelStyles && r.set(t.materialPixelStyles, (e.count + t.offset) * 4);
				}
				it = {
					group: t,
					source: i,
					rows: r,
					count: e.count
				}, nt.upload(r, (e.count + (n?.sharedCount ?? 0)) * 4);
			} else if (r?.length && i) {
				if (n) for (let t of r) {
					let n = t * 512 * 4, r = Math.min(n + 2048, e.count * 4);
					a.rows.set(i.subarray(n, r), n);
				}
				nt.upload(a.rows, (e.count + (n?.sharedCount ?? 0)) * 4, r);
			} else nt.bind();
		}
		function Wn(t, r, i, a, o) {
			if (!n || sn || t || r || i || a || o) return p;
			if (!on) try {
				on = f(J(d.POST_FS));
			} catch (t) {
				if (e.isContextLost()) throw t;
				return sn = !0, p;
			}
			return on;
		}
		function Gn(t, n, r, i, a) {
			e.bindFramebuffer(e.FRAMEBUFFER, n), e.viewport(0, 0, r, i), e.bindVertexArray(x), e.useProgram(t.p), t.set(a), e.drawArrays(e.TRIANGLES, 0, 3);
		}
		function Kn(n) {
			let r = JSON.stringify(n);
			if (Pn !== r) {
				let i = n ? t.PixelLook.prepareTone(n, t.KIT?.procedural?.materials?.blueNoise ? ({ seed: e }) => t.KIT.procedural.materials.blueNoise({ seed: e }) : void 0) : null;
				if (i) {
					let t = Math.max(48, i.width), n = i.height + 1, r = new Float32Array(t * n * 4);
					i.stops.forEach(([e, t], n) => r.set([...Ot(parseInt(t.slice(1), 16)), e], n * 4));
					for (let e = 0; e < i.height; e++) for (let n = 0; n < i.width; n++) r[((e + 1) * t + n) * 4] = i.thresholds[e * i.width + n];
					N(12, ht), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, t, n, 0, e.RGBA, e.FLOAT, r);
				}
				Pn = r, Fn = i;
			}
			return Fn ? (N(12, ht), {
				u_toneOn: 1,
				u_toneCut: Fn.cutoff,
				u_toneAmt: Fn.amount,
				u_toneN: Fn.stops.length,
				u_toneStops: 12,
				u_toneThSize: [Fn.width, Fn.height]
			}) : { u_toneOn: 0 };
		}
		function qn(n, r, a) {
			if (r === void 0 || r === !1) return null;
			let s = JSON.stringify([
				r,
				n.pal,
				n.paletteRoles,
				a
			], (e, t) => e !== "frames" || !Array.isArray(t) ? t : (Ut.has(t) || Ut.set(t, ++Wt), { rasterFrames: Ut.get(t) }));
			if (s === yt && n === bt && n.renderMetadata === xt && n.count === St) return vt;
			let c = t.PixelLook.preparePaletteConstraints(r, {
				palette: n.pal,
				roles: n.paletteRoles,
				blueNoise: t.KIT?.procedural?.materials?.blueNoise,
				skipMasks: a,
				skipDitherRegions: !0,
				maskSupported: (e) => !!o?.supportsMask(e)
			});
			if (c) {
				gt ??= i.texture(), _t ??= M(1024, 4, S), Ct = 49 + Math.ceil(Math.max(...c.palettes.map((e) => e.ranks.length)) / 4), wt = Ct + Math.max(...c.palettes.map((e) => (e.grade?.length ?? 0) / 3)), c.masked = c.palettes.some((e) => e.maskSource);
				let t = c.masked && lt(c.palettes, o, S);
				c.textured = !!t?.texture, It = wt + (c.masked ? 6 : 0), Lt = It + (c.palettes.some((e) => e.matchId) ? 48 : 0);
				let r = Lt + Math.max(...c.palettes.map((e) => e.pairs?.length ?? 0)), a = new Float32Array(r * 4 * c.palettes.length);
				if (c.palettes.forEach((e, n) => {
					let i = n * r * 4;
					if (a.set([
						e.count,
						e.packed.length,
						e.width,
						e.height
					], i), e.mapOnly || e.swatches.forEach((e, t) => a.set(e, i + (t + 1) * 4)), a[i + 7] = e.amount, a[i + 11] = Number(e.source === "graded"), a[i + 15] = e.mapOnly ? 2 : Number(!!e.grade), a[i + 19] = e.matchId ?? 0, a[i + 23] = e.pairs ? e.pairs.length + 1 : 0, a[i + 27] = e.tuning?.scale ?? 1, a[i + 31] = e.tuning?.screenGain ?? 1, e.reserveAccess?.forEach((t, n) => {
						let r = e.count + n, o = Math.floor(r / 24), s = 1 << r % 24;
						t & 1 && (a[i + (8 + o) * 4 + 3] += s), t & 2 && (a[i + (10 + o) * 4 + 3] += s);
					}), e.pairs?.forEach(({ slots: e, lightness: t }, n) => a.set([...e, ...t ?? [-1, 1]], i + (Lt + n) * 4)), e.lab?.forEach((e, t) => a.set(e, i + (It + t) * 4)), a.set(e.ranks, i + 196), e.grade) for (let t = 0; t < e.grade.length / 3; t++) a.set(e.grade.subarray(t * 3, t * 3 + 3), i + (Ct + t) * 4);
					t?.rows?.[n] && a.set(t.rows[n], i + wt * 4);
				}), N(8, gt), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, r, c.palettes.length, 0, e.RGBA, e.FLOAT, a), _t.upload(Float32Array.from(c.slots(n))), t?.texture) {
					let { width: n, height: r, values: a } = t.texture;
					Bt ??= i.texture(), N(14, Bt), e.texImage2D(e.TEXTURE_2D, 0, e.R32F, n, r, 0, e.RED, e.FLOAT, a);
				}
			}
			return yt = s, bt = n, xt = n.renderMetadata, St = n.count, vt = c, c;
		}
		function Jn(e, t) {
			Y ??= M(1024, 10, S);
			let { data: n, pix: r, renderMetadata: i, surfaceData: a, anim: o, count: s } = e, c = e.rest ?? o?.base ?? n, l = [
				e,
				r,
				i,
				a,
				c,
				s
			], u = Ft(X?.sources, l), d = u ? X.values : new Float32Array(s * 8), f = u ? c === n ? t : [] : void 0, p = (e, t) => {
				let n = i?.normals;
				for (let i = e; i < t; i++) {
					let e = i * 3, t = i * 8, o = i * 16, s, l;
					r?.[t] ? (s = r, l = t + 3) : n?.[e] || n?.[e + 1] || n?.[e + 2] ? (s = n, l = e) : a?.[t] && (s = a, l = t + 1);
					for (let e = 0; e < 3; e++) d[t + e] = s?.[l + e] ?? 0, d[t + 4 + e] = c[o + e];
				}
			};
			if (f === void 0) p(0, s);
			else for (let e of f) p(e * 512, Math.min(s, (e + 1) * 512));
			Y.upload(d, d.length, f), X = {
				sources: l,
				values: d
			};
		}
		function Yn(e) {
			if (!e) ft.bind();
			else {
				En.length !== e.length && (En = new Float32Array(e.length));
				for (let t = 0; t < e.length; t += 12) for (let n = 0; n < 3; n++) {
					let r = t + n * 3, i = t + n * 4;
					En[i] = e[r], En[i + 1] = e[r + 1], En[i + 2] = e[r + 2], En[i + 3] = e[t + 9 + n];
				}
				ft.upload(En);
			}
		}
		function Xn(t, n) {
			Tn = 0;
			let r = n.edgeTable?.(t);
			if (!r?.any || !n.anchors) return;
			let { count: a, data: o, detail: s, pix: c, pats: l } = t, u = t.reconstructionPose ? t._anchors : n.anchors({
				count: a,
				data: o,
				detail: s,
				pix: c,
				pats: l
			});
			if (!u?.n) return;
			dn ??= i.program(d.SPR_VS, d.SPR_FS), pn ??= A(1, { depth: !0 }), mn ??= i.texture(), hn ??= M(768, 14, S);
			let f = /* @__PURE__ */ new Float32Array(4608);
			for (let e = 0; e < 32; e++) f.set(r.per.subarray(e * 8, e * 8 + 8), e * 48);
			r.sprites.forEach((e, t) => {
				let n = (32 + t) * 48;
				f.set([
					e.w,
					e.h,
					e.ax,
					e.sink
				], n), f.set(e.cells.slice(0, 44), n + 4);
			}), N(12, mn), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, 12, 96, 0, e.RGBA, e.FLOAT, f), hn.upload(u.data), Tn = u.n;
		}
		function Zn(t, n, r, a, o, s, c) {
			if (!t) return null;
			if (se ??= i.texture(), N(3, se), t !== ye || !G) {
				let { width: n, height: r, data: i, uniforms: a } = t.pack();
				n === xe && r === Se ? e.texSubImage2D(e.TEXTURE_2D, 0, 0, 0, n, r, e.RGBA, e.FLOAT, i) : (e.texImage2D(e.TEXTURE_2D, 0, e.RGBA32F, n, r, 0, e.RGBA, e.FLOAT, i), xe = n, Se = r), G = a, ye = t;
			}
			return {
				...G,
				u_waterData: 3,
				u_waterView: n.view,
				u_waterEye: n.eye,
				u_arrivalPlane: a,
				u_waterCamera: [
					n.tangent * n.aspect,
					n.tangent,
					+n.ortho
				],
				u_waterTime: r,
				u_waterReflections: o ? 23 : 0,
				u_waterReflectionCount: o?.count ?? 0,
				u_waterReflectionActive: o?.active ?? q,
				u_waterReflectionHeights: o?.heights ?? q,
				u_waterReflectionGrid: o?.grid ?? [2, 1],
				u_waterReflectionViewport: [s, c],
				u_waterProjection: n.projection
			};
		}
		function Qn(e, t) {
			let n = !!e.u_waterAirCount, r = !!e.u_waterLayered, i = !!e.u_waterAtlas, a = +n + 2 * r + 4 * i + 8 * Number(t);
			return te.has(a) || te.set(a, {
				airPockets: n,
				layered: r,
				atlas: i,
				sources: u({
					water: !0,
					airPockets: n,
					layered: r,
					atlas: i,
					environment: t
				})
			}), te.get(a);
		}
		function $n(n, r, i, a, o, s, u, d) {
			if (e.bindFramebuffer(e.FRAMEBUFFER, r.framebuffer), e.viewport(0, 0, i, a), o.u_paintPass) e.clearBufferfv(e.COLOR, 0, q), e.clearBufferfv(e.COLOR, 1, q), e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA);
			else if (o.u_idx) e.disable(e.BLEND), o.u_idx === 3 && (e.clearBufferfv(e.DEPTH, 0, q), e.enable(e.DEPTH_TEST), e.depthFunc(e.GREATER)), e.clearBufferfv(e.COLOR, 0, q), o.u_idx === 1 && r.textures.length > 1 && e.clearBufferfv(e.COLOR, 1, q), o.u_idx === 1 && r.textures.length > 2 && e.clearBufferfv(e.COLOR, 2, q);
			else {
				if (d) {
					let t = u ? u.skyPrograms ??= /* @__PURE__ */ new Map() : z, n = !!o.layeredGlass, c = +n + 2 * !!d.lit;
					t.has(c) || t.set(c, f(u ? re(u.airPockets, u.layered, u.atlas, !0, n, d.lit) : U(n, d.lit))), e.disable(e.BLEND), Gn(t.get(c), r.framebuffer, i, a, {
						...s,
						...d.uniforms,
						u_envViewport: [i, a],
						u_waterViewport: [i, a]
					});
				} else if (s ? (u.background ??= f(re(u.airPockets, u.layered, u.atlas)), e.disable(e.BLEND), Gn(u.background, r.framebuffer, i, a, {
					...s,
					u_waterViewport: [i, a],
					u_waterBackground: o.background.slice(0, 3)
				})) : (e.clearBufferfv(e.COLOR, 0, o.background), e.clearBufferfv(e.COLOR, 1, [
					1,
					0,
					0,
					1
				])), o.layeredGlass) {
					let t = r.textures.length - 2;
					e.clearBufferfv(e.COLOR, t, o.background), e.clearBufferfv(e.COLOR, t + 1, [
						1,
						1,
						1,
						1
					]);
				}
				e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA);
			}
			let p = o.surfaces, m = o.scaleSurfaces, h = !!(p || m?.some(Boolean));
			if (h || o.surfaceFrame?.lighting?.display) {
				let n = {
					geometryUpdatesSince: t.SpriteSurface?.geometryUpdatesSince,
					updatesSince: t.SpriteSurface?.updatesSince ?? t.KIT?.ecology?.atlasUpdates,
					cutaway: c?.glsl
				};
				if (r.ensureDepth(), e.enable(e.DEPTH_TEST), e.depthFunc(e.LEQUAL), e.depthMask(!0), e.clearBufferfv(e.DEPTH, 0, [1]), e.disable(e.BLEND), p && (Qt ??= W(e, n), Qt.draw(p, {
					...o.surfaceFrame,
					water: s,
					wet: u,
					width: i,
					height: a
				})), m) {
					e.depthFunc(e.LESS);
					for (let [t, r] of m.entries()) r && (Zt[t] ??= W(e, n), Zt[t].draw(r, {
						...o.surfaceFrame,
						water: s,
						wet: u,
						width: i,
						height: a
					}));
					e.depthFunc(e.LEQUAL);
				}
				o.surfaceFrame?.lighting?.display && ($t ??= W(e, { cutaway: c?.glsl }), $t.draw(o.surfaceFrame.lighting.display, {
					...o.surfaceFrame,
					lighting: null,
					water: s,
					wet: u,
					width: i,
					height: a
				})), dt.bind(), e.depthMask(!1), o.u_idx || (e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA));
			} else o.u_idx !== 3 && e.disable(e.DEPTH_TEST);
			e.useProgram(n.p), n.set({
				...o,
				u_geometryDepth: +h,
				u_paintPass: !!o.u_paintPass,
				u_materialGridScale: o.u_materialGridScale ?? 1,
				u_viewport: [i, a],
				u_lookViewport: [i, a],
				...o.lookGrid && { u_lookViewportScale: [o.lookGrid[0] / i, o.lookGrid[1] / a] },
				u_focal: a / 2 / o.tangent
			}), o.u_idx === 3 ? (l.drawSubset(o.indices), e.disable(e.DEPTH_TEST)) : l.draw(), e.disable(e.DEPTH_TEST), e.depthMask(!0);
		}
		function er(n, r, a, o, s, l, f, p, m, h, g, _, v, y) {
			let b = g ? me : pn;
			b.resize(a, o), dt.bind(), N(13, null), N(12, mn), hn.bind(), e.bindFramebuffer(e.FRAMEBUFFER, b.framebuffer), e.viewport(0, 0, a, o), e.clearBufferfv(e.COLOR, 0, q), g && e.clearBufferfv(e.COLOR, 1, q), e.clearBufferfv(e.DEPTH, 0, [1]), e.disable(e.BLEND), e.enable(e.DEPTH_TEST), e.depthFunc(e.LESS);
			let S;
			if (v || y) {
				let e = [
					!!m,
					m?.airPockets,
					m?.layered,
					m?.atlas,
					!!_?.media,
					!!v,
					!!_?.lit,
					!!y
				].join("/");
				if (!We.has(e)) {
					let t = u({
						water: !!m,
						airPockets: m?.airPockets,
						layered: m?.layered,
						atlas: m?.atlas,
						environment: !!_?.media,
						emitterFog: !!_?.lit,
						relighting: v,
						cutaway: y ? c.glsl : void 0
					});
					We.set(e, i.program(t.SPR_VS, t.SPR_FS));
				}
				S = We.get(e);
			} else S = m ? m.sprites ??= i.program(m.sources.SPR_VS, m.sources.SPR_FS) : _?.media ? fn ??= i.program(d.SPR_VS, u({ environment: !0 }).SPR_FS) : dn;
			return e.useProgram(S.p), S.set({
				u_anc: 14,
				u_sprTex: 12,
				u_dat: 0,
				u_depth: 2,
				u_idxTex: 9,
				u_pixTex: 10,
				u_view: n.view,
				u_proj: n.projection,
				u_vp: [a, o],
				u_splatPlane: h,
				u_spriteCover: g ?? q,
				u_rng: n.depthRange,
				u_time: s,
				u_keep: t.KIT.pixel.anchorKeep(r, n.footprint),
				u_ortho: +n.ortho,
				u_rmpN4: wn.gpu.lens,
				u_pview: n.view,
				u_peye: n.eye,
				u_tanF: n.tangent,
				u_asp: n.aspect,
				u_portho: +n.ortho,
				u_eGap: (l?.gap ?? .3) / (2 * n.radius),
				u_tol: 3 * n.footprint + .02,
				...f,
				..._?.uniforms,
				...y,
				...v && { u_relight: 21 },
				...f || _?.media || v ? {
					u_waterSpritePalette: p,
					u_rmp4: wn.gpu.ramps
				} : {}
			}), e.bindVertexArray(x), e.drawArraysInstanced(e.TRIANGLE_STRIP, 0, 4, Tn), e.disable(e.DEPTH_TEST), N(13, b.textures[0]), b.textures[1];
		}
		function tr(n, r, a, o, s, c, l) {
			let u = T(n, r, a, o, s, t.KIT?.reflection, S, l?.captures && ((e) => ze.reflectionPlan(l, e)));
			if (!u?.captures.length) return null;
			nn ??= i.texture();
			let d = [u.width * u.grid[0], u.height * u.grid[1]];
			N(23, nn), Ft(rn, d) || (e.texImage2D(e.TEXTURE_2D, 0, e.RGBA8, ...d, 0, e.RGBA, e.UNSIGNED_BYTE, null), rn = d);
			for (let a of u.captures) {
				let { width: o, height: s } = a, l = o !== u.width || s !== u.height, d = l ? tn ??= A() : en ??= A();
				d.resize(o, s);
				let f = n, p = r.instances;
				p && a.plane.select && (Rn ??= at(), f = Rn(n, p, r.changedRows).world, p = void 0);
				let m = r.time ?? n.lookSnapshot?.time ?? 0, h = Be?.clock(n, r).scene ?? m;
				f = E(f, a.plane, h, t), ar(f, {
					...r,
					instances: p,
					order: void 0,
					changedRows: void 0,
					water: !1,
					reflections: !1,
					raw: r.raw ?? !1,
					outline: !1,
					dither: 0,
					damp: !1,
					edges: !1,
					clean: !1,
					tone: !1
				}, o, s, d.framebuffer, a.camera, a.equation, void 0, !0, c), e.bindFramebuffer(e.READ_FRAMEBUFFER, d.framebuffer), N(23, nn);
				let g = a.slot % 2 * u.width, _ = Math.floor(a.slot / 2) * u.height;
				l ? (an ??= i.allocate("Framebuffer"), e.bindFramebuffer(e.DRAW_FRAMEBUFFER, an), e.framebufferTexture2D(e.DRAW_FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, nn, 0), e.blitFramebuffer(0, 0, o, s, g, _, g + u.width, _ + u.height, e.COLOR_BUFFER_BIT, e.LINEAR)) : e.copyTexSubImage2D(e.TEXTURE_2D, 0, g, _, 0, 0, o, s);
			}
			return e.activeTexture(e.TEXTURE0), u;
		}
		let nr = at(), rr = at();
		function ir(e, n, r) {
			let i = n.reconstruction ?? e.look?.reconstruction;
			if (i === void 0 || i === !1) return {
				world: e,
				frame: n
			};
			let a = e, o = n.instances, s = o ? r(e, o, n.changedRows) : null, c = Dt(t, s?.world ?? e, n, i);
			return c === (s?.world ?? e) ? {
				world: e,
				frame: n
			} : {
				world: c,
				frame: {
					...n,
					[Et]: {
						source: a,
						layout: o
					},
					instances: void 0,
					changedRows: void 0
				}
			};
		}
		function ar(n, r, i, p, h, y, x = q, w, T = !1, E = 0) {
			let O = r[Et], k = O?.source ?? n, j = x === q ? Yt : Xt, R = y ?? Ee(n, r, i, p);
			n.shadowLod && r.shadowArt !== !1 && (n = t.KIT?.shadowArt?.frame(n, R.shadowFootprint) ?? n);
			let { raw: z = !1, outline: te = !0, dither: U = .35, scale: re = 1 } = r, W = n.look ?? {}, ae = Be?.clock(n, r), se = ae?.time ?? r.time ?? n.lookSnapshot?.time ?? 0, G = ae?.scene ?? (r.stepAnimation !== !1 && W.pixel ? Math.floor(se * 10) / 10 : se);
			if (r.strictContract) {
				if (!Be) throw Error("Strict frame validation needs the Ink Studio KIT");
				Be.requirePortable(n, r);
			}
			let de = Be?.hasStages(n, r) && !Be.compatibility(n, r).length, fe = r.passQuality ?? W.passQuality;
			if (fe && !ze) throw Error("Pass quality needs the Ink Studio KIT");
			let pe = ze?.prepare(fe), he = pe ? JSON.stringify([fe, r.silhouetteProtection ?? W.silhouetteProtection]) : "", ve = r.cutaway ?? W.cutaway;
			if (ve && !c) throw Error("Cutaways need the Ink Studio KIT");
			let ye = c?.prepare(ve), be = ye && c.uniforms(ye, R.setback);
			if (!T && x === q) {
				let e = ye ? JSON.stringify(ye) : null;
				e !== Mn && (On = !1), Mn = e;
			}
			let xe = r.stableDetail ?? W.stableDetail;
			if (xe && !s) throw Error("Stable detail needs the Ink Studio KIT");
			let Se = s?.prepare(xe), De = Se?.texture ?? [0, 0], Oe = Se?.geometry ?? [0, 0], je = [...De, ...Oe];
			Ft(jn, je) || (On = !1), jn = je;
			let He = Gt?.transparency(r.stableTransparency ?? W.stableTransparency)?.depthTolerance ?? 0, Ue = z ? null : Re?.prepare(W.detailBudgets), We = !z && (r.clean ?? !!W.clean), Qe = Ue?.affectsCleanup && (We || Ue?.enablesCleanup), $e = r.paletteConstraints ?? W.paletteConstraints, rt = r.areaLights !== !1 && n.areaLights?.length || Array.isArray(r.areaLights) && r.areaLights.length || (r.volumeLighting ?? n.volumeLighting)?.spots?.length, it = Ve && (r.relighting ?? n.relighting), lt = r.instances, ft = r.afterimages ?? W.afterimages, ht = !T && !r.order && ft !== void 0 && ft !== !1;
			if (ht && !Kt) throw Error("Afterimages need the Ink Studio KIT");
			let vt = ht ? Kt.prepare(ft) : [], yt = vt.length ? null : tr(n, r, R, i, p, 0, pe);
			if (lt && (L.has(n) || de || pe?.rows || vt.length || r[I] || r.order || He || it || rt || n.opticalSplats || Ke(lt).hasOpticalSplats || !z && ($e || W.pixel && n.pix || Qe || Ue?.fineOn || Ue?.fineOff))) {
				Rn ??= at();
				let e = Rn(n, lt, r.changedRows);
				n = e.world, r = {
					...r,
					changedRows: e.changedRows
				}, lt = void 0;
			}
			let bt = r.afterimageHistory ?? (x === q ? qt : Jt), xt = E;
			if (T || !r.resetAfterimages && vt.length || bt?.clear(), vt.length) {
				let e = bt.frame(n, se, vt, {
					source: k,
					layout: O?.layout ?? r.instances,
					poseTime: G,
					bornAt: r.bornAt,
					withdrawal: r.sampleWithdrawal ?? n.sampleWithdrawal ?? 0
				});
				e.length && (xt = n.count, n = Kt.append(n, e));
			}
			let St = vt.length ? tr(n, {
				...r,
				instances: lt
			}, R, i, p, xt, pe) : yt, Dt = de && Be.stagePlan(n, r, G, {
				skipMasks: r.lookMasks === !1,
				blueNoise: (e) => t.KIT.procedural.materials.blueNoise(e),
				query: () => t.KIT.world.query.fromScene(n, G)
			}), Mt = Hn(n, r, pe, he, xt || n.count), J = !z && qn(n, $e, r.lookMasks === !1), Y = !z && (r.coverageAware ?? W.coverageAware) === !0, X = !!J?.masked;
			X && !Y && (ce ??= A(2));
			let Ut = r[I]?.depth ? ne ??= A(3) : X && !Y ? ce : H, Wt = r.water !== !1 && n.water?.count ? n.water : null, Q = Array.isArray(W.optics) && W.optics.some((e) => e.driver) ? r.time ?? n.lookSnapshot?.time ?? 0 : void 0;
			!z && Wt && (W.optics !== Ae || n !== Me || Q !== Pe) && (Ae = W.optics, Me = n, Pe = Q, Ne = t.RenderStages?.optics(W.optics, {
				palette: n.pal,
				roles: n.paletteRoles,
				time: Q,
				query: () => n.lookSnapshot?.query ?? n.surfaceEffects?.query ?? t.KIT?.world?.query.fromScene(n, Q),
				blueNoise: t.KIT?.procedural?.materials?.blueNoise
			}));
			let Zt = z ? null : Ne;
			Wt && (Wt !== Ce || J !== we || Zt !== Te) && (Ce = Wt, we = J, Te = Zt, ke = (J || Zt) && Wt?.mapColors ? Wt.mapColors((e, n) => Zt?.transform({
				kind: "medium",
				medium: e,
				mediumKind: n
			}) ?? t.PixelLook.mediumTransform(J, {
				medium: e,
				mediumKind: n
			})) : Wt);
			let Qt = Wt ? ke : null;
			Qt && (ie ??= A(3), oe ??= A(3));
			let $t = !1;
			if (Y && (n.refract ?? 6) > 0 && x === q && !w && C >= (Qt ? 5 : 4)) {
				if (n !== Z || n.data !== Vt || r.changedRows?.length !== 0) {
					let e = [];
					for (let t = 0; t < n.count; t++) Math.round(n.data[t * 16 + 11]) & 256 && e.push(t);
					Ft(Ht, e) || (Ht = Int32Array.from(e)), Z = n, Vt = n.data;
				}
				$t = !!Ht?.length;
			}
			$t && (K ??= A(1, { depth: !0 }), K.resize(i, p), Qt ? ue ??= A(5) : le ??= A(4));
			let en = Qt ? $t ? ue : ie : $t ? le : B, tn = Qt ? oe : V, nn = n !== gn || n.data !== _n || n.count !== vn || lt !== zn, rn = t.KIT?.pixel, an = !z && !!(W.pixel && n.pix && rn?.gpu), on = !!(n.materialPixelStyles || lt && Ke(lt).hasMaterialPixelStyles), sn = r.splatCoverage ?? W.splatCoverage ?? "legacy", dn = o?.coverageMode?.(sn) ?? [
				"legacy",
				"continuous",
				"soft"
			].indexOf(sn);
			if (dn < 0) throw RangeError("Splat coverage must be legacy, continuous or soft");
			let fn = !z && !Dt && !an && !Y && (r.colored ?? !0), pn = Vn(n, Ue), mn = !!Qe && !!pn?.flags, hn = We || mn, En = !z && !Dt && !Y && !fn && !J && !!W.pixel && r.damp !== !1, Pn = fn ? 2 : 1, Fn = i * Pn, In = p * Pn;
			if (Fn > S || In > S || Fn > sr[0] || In > sr[1]) throw RangeError("Ink Studio frame exceeds the WebGL viewport or texture size limit");
			h || (e.canvas.width !== i && (e.canvas.width = i), e.canvas.height !== p && (e.canvas.height = p));
			let nr = i !== Ie.width || p !== Ie.height;
			(nn || he !== Nn || nr || h !== yn || pn !== bn || !En || Qt !== ge || Qt && r.time !== _e) && (On = !1), en.resize(Fn, In), tn.resize(fn ? i : 1, fn ? p : 1);
			let rr = !!r[I] || an || !!J && !Y || mn;
			Ut.resize(rr ? i : 1, rr ? p : 1), mn && (et ??= M(512, 7, S)), on && (nt ??= M(512, 16, S)), ee.resize(an ? i : 1, an ? p : 1), w && an && r.edges !== !1 && (me ??= A(2, { depth: !0 })), hn && Fe.resize(i, p), En && (Ie.resize(i, p), Le.forEach((e) => e.resize(i, p)));
			let ir = n.paintCorrections, ar = n.data, or = !1;
			if (ir && r.paintCorrections !== !1) {
				ct?.length !== n.count * 16 && (ct = new Float32Array(n.count * 16)), ct.set(n.data.subarray(0, n.count * 16));
				let { view: e, ortho: t, eye: r } = R;
				or = ir.paint(ct, n.pal, {
					direction: [
						e[2],
						e[6],
						e[10]
					],
					...t ? {} : { eye: r }
				}), ar = ct;
			}
			let cr = or ? R.view : void 0;
			Dt && (ar = Be.materialData(Dt, n, ar)), !cr && !ut || cr && ut && Ft(cr, ut) || (On = !1), ut = cr;
			let lr = an && (or || !!xt || !!n.opticalSplats);
			lr && (st ??= A(2), st.resize(i, p));
			let ur = x === q ? q : Nt(x, R), dr = ae?.direction ?? g?.prepare(W.artDirection, r.artDirection), fr = ae ?? g?.motion(dr, se, r.skyTime ?? se, G), pr = fr ? [fr.falling, fr.rain] : [G, G], mr = pr.some((e) => e !== G) || [
				"foliage",
				"cloth",
				"rain",
				"water",
				"emissive"
			].some((e) => dr?.cadence[e] !== void 0), hr = dr?.windResponse, gr = v && _ && (mr || hr?.water || hr?.emissive) && (r.windField ?? n.windField ?? n.weatherBinding), _r = () => [0, 0], vr = [0, 0];
			if (gr) {
				let e = v.timeline(n, r, se, dr, t.KIT?.weather?.tracks), i = v.opticalWeather(n, r, e, r.weatherFronts !== !1), a = v.wind(n, r, {
					...e,
					weather: i
				}), o = (t) => a.windAt?.(dr?.cadence[t] === void 0 ? e.skyTime : r.skyTime ?? fr[t]) ?? a.wind.velocity;
				_r = (e) => _.frame(o(e)).flex, dr?.cadence.rain !== void 0 && (vr = o("rain"));
			}
			let yr = Zn(Qt, R, fr?.water ?? G, x, St, i, p);
			yr && (yr.u_waterWindGain = (hr?.water ?? 0) * Math.hypot(..._r("water")));
			let $ = P.prepare(n, r, R, se, i, p, T);
			($ || xn) && (On = !1), xn = !!$;
			let br = yr && Qn(yr, !!$?.media), xr = !!n.opticalSplats;
			if (xr) {
				let e = t.KIT;
				Xe = e.optical.frame(n, R, e.splatFrames.create(n, G, e.M), null, Xe), Ye ??= M(1536, 22, S), Ye.upload(Xe);
			}
			(xr || Ze) && (On = !1), Ze = xr;
			let Sr = !1;
			if (it) {
				let e = t.KIT, i = e.environmentFrame.timeline(n, r, se, e.artDirection.prepare(W.artDirection, r.artDirection), e.weather?.tracks), a = Ve.frame(n, r, i);
				if (a) {
					let t = Ve.rows(n, a, e.splatFrames.create(n, G, e.M), null, qe);
					t && (qe = t, Ge ??= M(512, 21, S), Ge.upload(t), Sr = !0);
				}
			}
			let Cr = F.prepare(n, r, se, T, R);
			Sr = F.compose(Cr, n, G, qe, Sr), F.fog(Cr, n, r), Cr && (On = !1, $ && ($.emitters = Cr, $.uniforms = {
				...$.uniforms,
				...Cr.uniforms
			})), $ && ($.lit = !!($.lit && Cr)), (Sr || Je) && (On = !1), Je = Sr;
			let wr = pn?.fine ?? n.fine, Tr = !z && !!wr, Er = kt(n.pal), Dr = Math.min(n.pal.length, 64), Or = n.fog ?? {}, kr = r.previousWorld && r.previousWorld === gn && gn.data === _n && n.count === vn && !lt && !zn && !ir && !gn.paintCorrections && !n.anim && !gn.anim, Ar = !nn || kr ? r.changedRows : void 0, jr = Dt || Sn ? void 0 : Ar && ir ? [.../* @__PURE__ */ new Set([...Ar, ...ir.dirtyRows.filter((e) => e * 512 < n.count)])] : Ar, Mr;
			if (lt ? (Ln ??= ot(M, dt, S), Mr = Ln.bind(lt, n, jr, zn !== lt, ar)) : dt.upload(ar, n.count * 16, jr), on && Un(n, lt, Mr, Ar), Tr && (nn || Cn !== wr)) {
				let e = kr && !pn && Cn === gn.fine ? r.changedFineRows : void 0;
				pt.upload(wr, n.count * 12, e), Cn = wr;
			} else pt.bind();
			if (Yn(n.anim?.bones), Sr = L.compose(n, r, R, G, Sr), L.has(n) && (On = !1), Bn(n, r, R, G, nn, Mr, i, p, re, He, j, k, pr, vr, Mt), an) {
				if (nn || wn?.world !== n || wn.values !== n.pix || wn.ramps !== n.ramps || wn.rampOff !== n.rampOff || wn.patterns !== n.pats) {
					let e = kr && wn?.world === gn && wn.values === gn.pix ? r.changedPatternRows : void 0;
					mt.upload(n.pix, n.count * 8, e);
					let t = Pt(rn, n);
					Xn(n, rn), wn = {
						world: n,
						values: n.pix,
						ramps: n.ramps,
						rampOff: n.rampOff,
						patterns: n.pats,
						gpu: t
					};
				} else if (n.anim?.dynamicPatternNormals) {
					let e = Ar && [...new Set(Ar.map((e) => Math.floor(e / 2)))];
					mt.upload(n.pix, n.count * 8, e);
				} else mt.bind();
			}
			let Nr = t.PixelLook.framePalette?.(n, r, {
				grading: !z && !Dt,
				tone: !z && !Y
			}) ?? {
				toneDefinition: z || Y ? null : r.tone ?? W.tone,
				grade: r.ignoreLookGrade ? void 0 : n.anim?.grade
			}, { toneDefinition: Pr, colorGrade: Fr } = Nr, Ir = T ? null : Nr.grade;
			X && Jn(n, Ar), J?.textured && N(14, Bt), J && (Y || X) && (_t.bind(9), N(8, gt)), e.disable(e.SCISSOR_TEST), e.disable(e.DEPTH_TEST), e.disable(e.CULL_FACE), e.disable(e.STENCIL_TEST), e.colorMask(!0, !0, !0, !0), e.depthMask(!0), e.blendEquation(e.FUNC_ADD);
			let Lr = l.programFor({
				water: !!br,
				airPockets: br?.airPockets,
				layered: br?.layered,
				atlas: br?.atlas,
				portal: x !== q || !!w,
				instances: !!Mr,
				contributions: Y && !!J,
				masked: X,
				textured: J?.textured,
				layeredGlass: $t,
				materialStyles: on,
				environment: $?.media,
				emitterFog: !!$?.lit,
				relighting: Sr,
				optical: xr,
				cutaway: !!be
			});
			e.useProgram(Lr.p);
			let Rr = n.grow ?? {};
			Lr.set({
				u_data: 0,
				u_bones: 4,
				u_fine: 7,
				...Mr && { u_instances: 15 },
				u_fineOn: +Tr,
				u_fpal: Er,
				u_view: R.view,
				...on && {
					u_materialStyles: 16,
					u_materialPatterned: an,
					u_materialStylesOn: !z
				},
				u_proj: R.projection,
				u_time: G,
				u_scale: re,
				u_ortho: +R.ortho,
				u_motionCadence: mr,
				u_rainWind: vr,
				u_motionWind: !!gr && (dr?.cadence.foliage !== void 0 || dr?.cadence.cloth !== void 0),
				...mr && {
					u_effectTimes: [
						fr.foliage,
						fr.cloth,
						pr[0],
						fr.emissive
					],
					u_waterAndRainTime: [fr.water, pr[1]]
				},
				...gr && { u_effectWind: [..._r("foliage"), ..._r("cloth")] },
				u_emissiveWind: (hr?.emissive ?? 0) * Math.hypot(..._r("emissive")),
				...J && (Y || X) && {
					u_constraintSlots: 9,
					u_constraintRows: 8,
					u_constraintDefault: J.defaultSlot,
					u_constraintMap: Ct,
					u_constraintMask: wt,
					u_constraintLab: It,
					u_constraintPairs: Lt,
					u_lookSites: 10,
					u_maskTextures: 14,
					u_maskTime: se,
					u_lookProjection: R.projection,
					u_lookRadius: R.radius,
					u_lookOrtho: +R.ortho,
					u_pal: Er,
					u_n: Dr,
					u_grade: +!!Ir,
					u_out: Ir ?? Er,
					u_toneOn: 0,
					u_lookGrid: [i, p]
				},
				u_arrivalPlane: x,
				u_splatPlane: ur,
				...$t && {
					u_glassBoundary: 13,
					u_glassTolerance: He
				},
				u_sampleWithdrawal: a?.amount(r.sampleWithdrawal ?? n.sampleWithdrawal ?? 0) ?? 0,
				u_born: [
					r.bornAt ?? 0,
					Rr.rate ?? 1,
					Rr.fade ?? .5,
					Rr.loop ?? 0
				],
				u_detailTexture: De,
				u_detailGeometry: Oe,
				u_crisp: +!z,
				u_splatCoverage: dn,
				u_dilate: z ? .3 : .15,
				u_near: R.clipNear,
				u_paintMarker: ir?.marker ?? 0,
				u_afterimageStart: xt,
				...xr && { u_optical: 22 },
				...Sr && { u_relight: 21 },
				u_fog: Ot(n.pal[Or.c ?? 0] ?? 0),
				u_fogp: [
					Or.start ?? 1,
					Or.max ?? 0,
					...R.depthRange
				],
				...yr,
				...$?.uniforms,
				...be
			});
			let zr = [...Ot(n.pal[0]), 1], Br = R.tangent, Vr = r.spriteSurfaces === !1 ? null : n.spriteSurfaces, Hr = r.spriteSurfaces !== !1 && r.scalePreviews !== !1 && n.scalePreviews, Ur = t.KIT?.procedural?.lod?.preview;
			if (Hr && !Ur) throw TypeError("Scale previews need the Ink Studio KIT");
			let Wr = Hr ? Ur.surfaces(Hr, {
				view: R.view,
				width: i,
				height: p,
				focal: p / (2 * Br),
				ortho: R.ortho,
				near: R.clipNear,
				far: R.clipFar
			}, T || x !== q ? void 0 : r.scalePreviewFrame) : void 0, Gr = {
				lighting: Cr,
				environment: $,
				view: R.view,
				projection: R.projection,
				range: [
					...R.depthRange,
					Or.start ?? 1,
					Or.max ?? 0
				],
				fog: Ot(n.pal[Or.c ?? 0] ?? 0),
				arrivalPlane: x,
				clip: ur,
				section: be
			};
			if ($t) {
				N(13, null);
				let e = Mt ? Ht.filter((e) => Mt.keep[e]) : Ht;
				$n(Lr, K, i, p, {
					u_idx: 3,
					u_snap: 1,
					u_hard: 0,
					tangent: Br,
					indices: e
				}), N(13, K.textures[0]);
			}
			$n(Lr, en, Fn, In, {
				u_idx: 0,
				u_snap: +(!z && !fn),
				u_hard: 0,
				u_materialGridScale: Pn,
				background: zr,
				tangent: Br,
				lookGrid: Y && [i, p],
				layeredGlass: $t,
				surfaces: Vr,
				scaleSurfaces: Wr,
				surfaceFrame: Gr
			}, yr, br, $), fn && $n(Lr, tn, i, p, {
				u_idx: 0,
				u_snap: 1,
				u_hard: 0,
				background: zr,
				tangent: Br,
				surfaces: Vr,
				scaleSurfaces: Wr,
				surfaceFrame: Gr
			}, yr, br, $), lr && $n(Lr, st, i, p, {
				u_idx: 0,
				u_snap: 1,
				u_hard: 0,
				u_paintPass: !0,
				tangent: Br,
				lookGrid: Y && [i, p]
			}, yr, br, $), rr && $n(Lr, Ut, i, p, {
				u_idx: 1,
				u_snap: 1,
				u_hard: 0,
				tangent: Br,
				surfaces: Vr,
				scaleSurfaces: Wr,
				surfaceFrame: {
					...Gr,
					index: !0,
					graphDepth: !!r[I]?.depth
				}
			}), r[I]?.(n, Ut.textures[0], r[I].depth ? Ut.textures[2] : void 0, R), w && $n(Lr, w.buffer, i, p, {
				u_idx: 2,
				u_snap: +(!z && !fn),
				u_hard: 0,
				u_splatPlane: w.plane,
				tangent: Br,
				surfaces: Vr,
				scaleSurfaces: Wr,
				surfaceFrame: {
					...Gr,
					index: !0,
					clip: w.plane
				}
			}), e.disable(e.BLEND), N(1, en.textures[0]), N(2, en.textures[1]), N(5, lr ? st.textures[0] : tn.textures[0]), N(6, lr ? st.textures[1] : tn.textures[1]), N(9, Ut.textures[0]);
			let Kr = W.outline === !0 ? {} : W.outline, qr = wn?.gpu, Jr = an ? {
				u_idxTex: 9,
				u_pixTex: 10,
				u_dat: 0,
				u_depth: 2,
				u_tanF: Br,
				u_portho: +R.ortho,
				u_asp: R.aspect,
				u_pview: R.view,
				u_peye: R.eye,
				u_fpG: R.footprint,
				u_ptime: G,
				u_shape: +(r.lightShape !== !1),
				u_ol: +!!Kr,
				u_olK: Kr?.k ?? 2,
				u_olEps: Kr ? (Kr.eps ?? .6) / (n.detail || 12) / (2 * R.radius) : 0,
				u_olGap: Kr ? (Kr.gap ?? .3) / (2 * R.radius) : 1,
				u_patK4: qr.kinds,
				u_patP: qr.params,
				u_rmp4: qr.ramps,
				u_rmpN4: qr.lens,
				u_detail: n.detail || 12
			} : {};
			an && (cn ??= f(d.KEY_FS), N(15, null), mt.bind(), Gn(cn, ee.framebuffer, i, p, {
				u_pixOn: 1,
				...Jr
			})), N(15, ee.textures[0]);
			let Yr = an && Tn > 0 && r.edges !== !1, Xr = Yr && er(R, n, i, p, G, Kr, yr, Er, br, ur, w?.plane, $, Sr, be), Zr = te && W.lines, Qr = n.outline?.c ?? 0, $r = z ? null : n.glass, ei = {};
			if ($r) {
				let e = /* @__PURE__ */ new Float32Array(96), t = Math.min(24, $r.gaps?.length ?? 0);
				if (t) for (let n = 0; n < t; n++) e.set($r.gaps[n], n * 4);
				Object.assign(ei, {
					u_gview: R.view,
					u_geye: R.eye,
					u_gd: $r.dir,
					u_gw: [...$r.at, $r.r],
					u_gcam: [
						Br * R.aspect,
						Br,
						...R.depthRange
					],
					u_gortho: +R.ortho,
					u_gtime: se,
					u_gc: kt($r.cols.map((e) => n.pal[e]), 6),
					u_gm: +($r.mode === "gaps"),
					u_gq: $r.steps ?? 0,
					u_gh: e,
					u_ghn: t,
					u_gfl: $r.floor ?? -50
				});
			}
			let ti = En ? Ie.framebuffer : h, ni, ri = an && on, ii = an && Sr;
			if (Y || J || ri || ii || $?.media && an) {
				let e = Y ? Rt : zt, t = (br ? 1 + Number(br.airPockets) + 2 * Number(br.layered) + 4 * Number(br.atlas) : 0) + 16 * Number(X) + 32 * Number($t) + 64 * Number(ri) + 128 * Number(!!J) + 256 * Number(!!$?.media) + 512 * Number(ii) + 1024 * Number(!!$?.lit);
				e.has(t) || e.set(t, f(u({
					water: !!br,
					airPockets: br?.airPockets,
					layered: br?.layered,
					atlas: br?.atlas,
					paletteConstraints: !!J && !Y,
					masked: X,
					contributions: Y,
					layeredGlass: $t,
					materialStyles: ri,
					environment: !!$?.media,
					emitterFog: !!$?.lit,
					relighting: ii
				}).POST_FS)), ni = e.get(t), J && !Y && (_t.bind(), N(8, gt), X && N(7, Ut.textures[1]));
			} else ni = br ? br.post ??= f(br.sources.POST_FS) : Wn(an, $r, n.ao, Pr, Ir);
			if (yr && N(11, (fn ? tn : en).textures[2]), $t) {
				let e = en.textures.length - 2;
				N(4, en.textures[e]), N(7, en.textures[e + 1]), N(8, K.textures[0]);
			}
			if (Gn(ni, hn ? Fe.framebuffer : ti, i, p, {
				...Jr,
				...ei,
				...Kn(Pr),
				...yr,
				...$?.uniforms,
				u_waterMask: 11,
				...$t && {
					u_glassBoundary: 8,
					u_glassBack: 4,
					u_glassThrough: 7,
					u_glassRange: R.depthRange,
					u_glassProjection: R.projection
				},
				...J ? {
					u_constraintSlots: 4,
					u_constraintRows: 8,
					u_constraintDefault: J.defaultSlot,
					u_constraintMap: Ct,
					u_constraintMask: wt,
					u_constraintLab: It,
					u_constraintPairs: Lt,
					u_maskOwner: 7
				} : {},
				u_scene: 1,
				u_depth: 2,
				u_crispScene: 5,
				u_crispDepth: 6,
				u_keyTex: 15,
				u_pixOn: +an,
				u_keyOn: +an,
				u_sprOn: +Yr,
				u_paintOn: lr,
				...ri && { u_materialStyles: 16 },
				...ii && {
					u_relight: 21,
					u_relightFog: Ot(n.pal[Or.c ?? 0] ?? 0),
					u_relightFogRange: [Or.start ?? 1, Or.max ?? 0]
				},
				u_idxTex: 9,
				u_sprLayer: 13,
				u_markA: +hn,
				u_pal: Er,
				u_n: Dr,
				u_luma: 0,
				u_bypass: +(z || !!Dt),
				u_colored: +fn,
				u_dither: U * .3 * (n.dither ?? 1),
				u_line: Ot(n.pal[Qr] ?? 0),
				u_remapLine: Fr && Number.isInteger(Qr) && Qr >= 0 && Qr < Dr ? Qr + 1 : 0,
				u_edge: te ? (n.outline?.edge ?? 0) / (2 * R.radius) : 0,
				u_lines: +!!Zr,
				u_lineGap: Zr ? (Zr.gap ?? .3) / (2 * R.radius) : 1,
				u_lineK: Zr ? Zr.k ?? .55 : 1,
				u_lineLit: Zr ? Zr.lit ?? 1.15 : 1,
				u_refract: n.refract ?? 6,
				u_ao: n.ao ? n.ao.k ?? .5 : 0,
				u_aor: (n.ao?.range ?? .4) / (2 * R.radius),
				u_gk: $r ? $r.k || .14 : 0,
				u_bars: Math.min(.45, n.anim?.bars ?? 0),
				u_grade: +!!Ir,
				...Ir ? {
					u_out: Ir,
					u_outl: Ir
				} : {}
			}), hn && (mn && (tt === pn.flags ? et.bind() : (et.upload(pn.flags), tt = pn.flags)), N(8, Fe.textures[0]), N(6, fn ? tn.textures[1] : en.textures[1]), Gn(m, ti, i, p, {
				u_look: 8,
				u_dep: 6,
				u_keep: W.clean?.keep ?? .3,
				u_scopedOnly: !We,
				u_hasDetailFlags: mn,
				u_detailOwners: mn ? 9 : 8,
				u_detailFlags: mn ? 7 : 8,
				u_detailWater: mn && !!yr,
				u_waterMask: mn && yr ? 11 : 8,
				u_lineClean: +(r.lineClean !== !1 && !!W.pixel)
			})), En) {
				ln ??= f(d.DAMP_FS), un ??= f(d.COPY_FS);
				let e = Fr || Tt;
				Ft(An, e) || (On = !1), An = e;
				let t = 1 - Dn, n = At(R.projection, R.view), r = kn && n.every((e, t) => Math.abs(e - kn[t]) < 1e-6);
				N(8, Ie.textures[0]), N(11, Le[Dn].textures[0]), N(6, en.textures[1]), Gn(ln, Le[t].framebuffer, i, p, {
					u_cur: 8,
					u_hist: 11,
					u_dep: 6,
					u_pal: Fr || Er,
					u_n: Dr,
					u_have: +(On && !!r),
					u_iview: jt(R.view, R.eye),
					u_pvp: kn ?? n,
					u_cam: [
						Br,
						R.aspect,
						+R.ortho,
						0
					],
					u_rng: R.depthRange
				}), N(8, Le[t].textures[0]), Gn(un, h, i, p, { u_src: 8 }), Dn = t, On = !0, kn = n;
			}
			return e.activeTexture(e.TEXTURE0), gn = n, zn = lt, _n = n.data, Sn = !!Dt, vn = n.count, yn = h, bn = pn, Nn = he, ge = Qt, _e = r.time, T || (r[D]?.(R), r[b]?.(n, en.textures[1], R)), Xr;
		}
		function or(t, n, r, i, a) {
			let { portal: o, fade: s = 0 } = n;
			if (!o && !s) return ar(t, n, r, i, a);
			let c = Ee(t, n, r, i), l = o?.opening, u = l && Nt(Mt(l.from), c), d = u && (c.ortho ? u[2] > 1e-7 : u[3] > 1e-6);
			if (!d && !s) return ar(t, n, r, i, a, c);
			if (r > S || i > S || r > sr[0] || i > sr[1]) throw RangeError("Ink Studio frame exceeds the WebGL viewport or texture size limit");
			if (a || (e.canvas.width !== r && (e.canvas.width = r), e.canvas.height !== i && (e.canvas.height = i)), de ??= A(), de.resize(r, i), d) {
				fe ??= A(), pe ??= A(), fe.resize(r, i), pe.resize(r, i);
				let e = Oe(c, l.camera(De(c))), { raw: t, outline: a, dither: s, scale: u, clean: d, lineClean: f, colored: p, tone: m, edges: h, water: g, time: _, skyTime: v, cameraTime: y, stepAnimation: b, artDirection: x, renderStages: S, strictContract: C, environment: w, stableTransparency: T, resetTransparency: E, stableDetail: D, passQuality: O, silhouetteProtection: k, scalePreviews: j } = n, M = ir(o.destination, {
					raw: t,
					outline: a,
					dither: s,
					scale: u,
					clean: d,
					lineClean: f,
					colored: p,
					tone: m,
					edges: h,
					water: g,
					time: _,
					skyTime: v,
					cameraTime: y,
					stepAnimation: b,
					artDirection: x,
					renderStages: S,
					strictContract: C,
					environment: w,
					stableTransparency: T,
					resetTransparency: E,
					stableDetail: D,
					passQuality: O,
					silhouetteProtection: k,
					scalePreviews: j,
					...o.destinationFrame,
					damp: !1
				}, rr);
				ar(M.world, M.frame, r, i, fe.framebuffer, e, Mt(l.to));
			}
			let p = ar(t, d ? {
				...n,
				damp: !1
			} : n, r, i, de.framebuffer, c, q, d ? {
				buffer: pe,
				plane: u
			} : void 0);
			he ??= f(Ue), N(0, de.textures[0]), N(1, d ? fe.textures[0] : de.textures[0]), N(2, d ? pe.textures[0] : de.textures[0]), N(3, p || de.textures[0]), Gn(he, a, r, i, {
				u_source: 0,
				u_destination: 1,
				u_cover: 2,
				u_spriteCover: 3,
				u_hasSpriteCover: +!!p,
				u_opening: d ? l.shape === "ellipse" ? 2 : 1 : 0,
				u_size: [r, i],
				u_fade: s,
				...d ? {
					u_origin: l.from.origin,
					u_right: l.from.right,
					u_up: l.from.up,
					u_normal: l.from.normal,
					u_half: [l.halfWidth, l.halfHeight],
					u_eye: c.eye,
					u_portalView: c.view,
					u_far: c.clipFar,
					u_settings: [
						c.tangent * c.aspect,
						c.tangent,
						+c.ortho
					]
				} : {}
			}), e.activeTexture(e.TEXTURE0);
		}
		let sr = e.getParameter(e.MAX_VIEWPORT_DIMS), cr;
		function lr(n, r, a, o, s) {
			let c = r.composite ?? n.look?.composite;
			if (c === void 0 || c === !1) return or(n, r, a, o, s);
			let l = t.KIT?.frameComposite;
			if (!l) throw Error("Mixed-resolution frames need the Ink Studio KIT");
			let u = l.prepare(c, a, o, n.look?.pixelSize ?? 1);
			if ([u, u.world].some(({ w: e, h: t }) => e > Math.min(S, sr[0]) || t > Math.min(S, sr[1])) || u.layers.some(({ w: e, h: t }) => e > S || t > S)) throw RangeError("Composite frame exceeds the WebGL viewport or texture size limit");
			let d = r.interfaceTime ?? r.time ?? n.lookSnapshot?.time ?? 0, p, m = u.needsCamera ? {
				...r,
				...O(r, (e) => {
					p = e;
				})
			} : r, h = u.needsCamera ? () => l.layers(u, n, d, p, e, r.time) : l.layers(u, n, d, void 0, e, r.time);
			cr ??= j(e, {
				program: f,
				resources: i,
				target: A,
				textureUnit: N,
				fullscreen: Gn
			}), cr(n, m, u, h, s, or);
		}
		let ur;
		function dr(n, r, a, o, s) {
			let c = r.renderGraph ?? n.look?.renderGraph;
			if (c === !1 || c === void 0) return ur?.reset(), lr(n, r, a, o, s);
			let l = t.KIT?.renderGraph;
			if (!l) throw Error("Render graphs need the Ink Studio KIT");
			let u = l.prepare(c);
			if (!u?.passes.length) return ur?.reset(), lr(n, r, a, o, s);
			if (a > Math.min(S, sr[0]) || o > Math.min(S, sr[1])) throw RangeError("Render graph exceeds the WebGL viewport or texture size limit");
			ur ??= R(e, {
				api: l,
				program: f,
				resources: i,
				target: A,
				textureUnit: N,
				fullscreen: Gn,
				maxSize: S
			}), ur(n, r, u, a, o, s, lr);
		}
		let fr;
		function pr(n, r, a, o, s) {
			r = Be?.options(n, r, t.KIT.timeDomains?.frame) ?? {
				...r,
				time: r.time ?? r.t
			};
			let c = r.renderHistoryKey ?? n;
			({world: n, frame: r} = ir(n, r, nr)), c !== n && (r = {
				...r,
				renderHistoryKey: c
			});
			let l = t.KIT?.presentationTimeline?.sample(n, r.interfaceTime ?? r.time ?? n.lookSnapshot?.time ?? 0, r);
			l && (r = {
				...r,
				...l
			});
			let u = r.inspection ?? n.look?.inspection;
			if (u === void 0 || u === !1) return dr(n, r, a, o, s);
			let d = t.KIT?.inspection;
			if (!d) throw Error("Target inspection needs the Ink Studio KIT");
			let p = d.prepare(u);
			if (!p.targets.length) return dr(n, r, a, o, s);
			fr ??= w(e, {
				api: d,
				program: f,
				resources: i,
				target: A,
				textureUnit: N,
				fullscreen: Gn,
				maxSize: S,
				viewportLimit: sr
			}), fr(n, r, p, a, o, s, dr);
		}
		return {
			render: pr,
			dispose() {
				Qt?.dispose();
				for (let e of Zt) e?.dispose();
				$t?.dispose(), l.dispose(), i.dispose();
			}
		};
	} catch (e) {
		throw l?.dispose(), i.dispose(), e;
	}
}
function Lt(e, { toolkit: t, specialize: n = !0, reuseOrder: r = !0, contextAttributes: i, input: a } = {}) {
	if (typeof e?.getContext != "function") throw TypeError("Ink Studio needs a canvas or OffscreenCanvas");
	if (typeof t?.PixelLook?.glsl != "string") throw TypeError("Pass the Ink Studio toolkit, including PixelLook, to createRenderer");
	let o = e.getContext("webgl2", {
		...i,
		alpha: !1,
		antialias: !1,
		depth: !1,
		stencil: !1
	});
	if (!o) throw Error("Ink Studio GPU rendering requires WebGL 2");
	let s = It(o, t, n, r), c;
	if (a !== void 0 && a !== !1) try {
		c = wt(e, {
			...a,
			toolkit: t
		});
	} catch (e) {
		throw s.dispose(), e;
	}
	let l = !1, u, d = /* @__PURE__ */ new WeakMap(), f = at(), p = (e) => {
		e.preventDefault(), s = null;
	};
	e.addEventListener?.("webglcontextlost", p);
	function m(e, t) {
		if (!(e?.data instanceof Float32Array) || !Number.isSafeInteger(e.count) || e.count < 0 || e.count * 16 > e.data.length || !e.pal?.length) throw TypeError("Render expects a world with packed splats, a count, and a palette");
		if (e.fine && e.fine.length < e.count * 12 || e.pix && e.pix.length < e.count * 8) throw RangeError("Ink Studio material data is shorter than the splat count");
		if (e.materialPixelStyles != null && (!(e.materialPixelStyles instanceof Float32Array) || e.materialPixelStyles.length < e.count * 4)) throw RangeError("Ink Studio material pixel styles must cover the splat count");
		if (e.opticalSplats != null && (!(e.opticalSplats instanceof Float32Array) || e.opticalSplats.length !== e.count * 12)) throw RangeError("Ink Studio optical materials must match the splat count");
		let n = t.instances === void 0 ? null : Ke(t.instances);
		n && Xe(e.count, n);
		let r = e.count + (n?.count ?? 0);
		if (t.order !== void 0 && (!(t.order instanceof Int32Array) || t.order.length !== r || t.order.some((e) => e < 0 || e >= r))) throw TypeError("Draw order must contain valid Int32 splat indices");
		for (let [n, r] of [
			["changedRows", 512],
			["changedFineRows", 512],
			["changedPatternRows", 1024]
		]) {
			let i = t[n];
			if (i !== void 0 && (!Array.isArray(i) || i.some((t) => !Number.isInteger(t) || t < 0 || t >= Math.max(1, Math.ceil(e.count / r))))) throw RangeError(n + " must contain valid " + r + "-splat row indices");
		}
		if (![
			t.time ?? t.t ?? 0,
			t.bornAt ?? 0,
			t.scale ?? 1,
			t.dither ?? .35
		].every(Number.isFinite)) throw RangeError("Ink Studio frame parameters must be finite");
	}
	let h = {
		...c && { input: c },
		describeFrame(n, r = {}) {
			let i = t.KIT?.renderContract;
			if (!i) throw Error("Frame descriptions need the Ink Studio KIT");
			return i.describe(n, {
				...r,
				width: r.width ?? r.w ?? r.target?.width ?? e.width,
				height: r.height ?? r.h ?? r.target?.height ?? e.height
			}, t.KIT.timeDomains?.frame);
		},
		cameraPose(t, n = {}) {
			return De(Ee(t, n, n.width ?? n.w ?? n.target?.width ?? e.width, n.height ?? n.h ?? n.target?.height ?? e.height));
		},
		renderStream(t, n, { place: r, portals: i = [], selected: a, assemble: o, ...s } = {}) {
			if (l) throw Error("The Ink Studio renderer has been disposed");
			if (typeof t?.advance != "function" || typeof o != "function") throw TypeError("Stream rendering needs a scene stream and a world assembler");
			let { snapshot: c, camera: u } = Te(n, s, s.width ?? s.w ?? s.target?.width ?? e.width, s.height ?? s.h ?? s.target?.height ?? e.height), f = t.advance({
				place: r,
				camera: u,
				portals: i,
				selected: a,
				portalLimit: 1
			}), p = d.get(t), m = /* @__PURE__ */ new Map();
			function g({ id: e, place: t, entries: n }) {
				let r = p?.assemble === o && p.worlds.get(e), i = r?.place === t && n.length === r.entries.length && n.every((e, t) => {
					let n = r.entries[t];
					return n.key === e.key && n.revision === e.revision && n.value === e.value;
				}) ? r.world : o(t, n);
				if (i?.count > n.reduce((e, t) => e + t.splats, 0)) throw RangeError("Assembled scene exceeds its packed splat budget");
				return m.set(e, {
					place: t,
					entries: n,
					world: i
				}), i;
			}
			let _ = g(f.views[0]), v = f.views[1], y = v?.entries.length ? {
				opening: v.opening,
				destination: g(v)
			} : void 0;
			return h.render(_, {
				...s,
				cameraSnapshot: c,
				portal: y
			}), d.set(t, {
				assemble: o,
				worlds: m
			}), {
				world: _,
				portal: y,
				scene: f
			};
		},
		render(i, a = {}) {
			if (l) throw Error("The Ink Studio renderer has been disposed");
			if (o.isContextLost()) throw Error("The Ink Studio WebGL context is lost");
			if (m(i, a), a.portal) {
				let { source: e, destination: t, opening: n, destinationFrame: r = {} } = a.portal;
				if (e && e !== i || typeof n?.camera != "function" || !n.from || !n.to) throw TypeError("Expected an oriented portal view for the rendered world");
				m(t, r);
			}
			if (a.fade !== void 0 && (!Number.isFinite(a.fade) || a.fade < 0 || a.fade > 1)) throw RangeError("Scene fade opacity must be in [0, 1]");
			let c = Array.isArray(a.target) || ArrayBuffer.isView(a.target) ? void 0 : a.target, d = a.width ?? a.w ?? c?.width ?? e.width, f = a.height ?? a.h ?? c?.height ?? e.height, p = c?.framebuffer ?? null;
			if (c && (d !== c.width || f !== c.height || !p || !o.isFramebuffer(p))) throw TypeError("Draw target must match the frame size and use the renderer WebGL context");
			if (!Number.isSafeInteger(d) || !Number.isSafeInteger(f) || d < 1 || f < 1) throw RangeError("Ink Studio frame width and height must be positive integers");
			s ??= It(o, t, n, r), s.render(i, a, d, f, p), u?.world === i && (a.changedRows?.length !== 0 || i.anim?.bones?.length) && (u = void 0);
		},
		pick(n, r, i = {}) {
			if (l) throw Error("The Ink Studio renderer has been disposed");
			m(n, i);
			let a = t.KIT?.procedural?.contributions?.create;
			if (!a) throw Error("Contribution picking needs the Ink Studio KIT");
			let o = i.instances, s = o && Ke(o).revision, c = i.time ?? i.t ?? n.lookSnapshot?.time ?? 0, d = i.sampleWithdrawal ?? n.sampleWithdrawal ?? 0, p = i.splatCoverage ?? n.look?.splatCoverage, h = n.materialPixelStyles, g = n.dataMarks?.snapshot(), _ = i.reconstruction ?? n.look?.reconstruction, v = _ === void 0 || _ === !1 ? void 0 : JSON.stringify(_);
			if (u?.world !== n || u.data !== n.data || u.count !== n.count || u.opticalSplats !== n.opticalSplats || u.group !== o || u.revision !== s || u.withdrawal !== d || u.splatCoverage !== p || u.materialStyles !== h || u.marks !== g || u.reconstruction !== v || u.time !== c && (v !== void 0 || n.moving?.length || n.grow || n.anim?.bones)) {
				let e = o ? f(n, o, i.changedRows).world : n;
				v !== void 0 && (e = Dt(t, e, i, _));
				let r = a(e, {
					time: c,
					sampleWithdrawal: d,
					splatCoverage: p,
					cutaway: !1
				});
				u = {
					world: n,
					data: n.data,
					count: n.count,
					opticalSplats: n.opticalSplats,
					group: o,
					revision: s,
					time: c,
					withdrawal: d,
					reconstruction: v,
					splatCoverage: p,
					materialStyles: h,
					marks: g,
					picker: r
				};
			}
			let y = t.KIT.cutaway?.prepare(r?.cutaway ?? i.cutaway ?? n.look?.cutaway), b = r?.camera;
			if (y?.range && !b) {
				let t = Ee(n, i, i.width ?? i.target?.width ?? e.width, i.height ?? i.target?.height ?? e.height);
				b = {
					...De(t),
					setback: t.setback
				};
			}
			return u.picker.ray({
				water: i.water !== !1,
				...r,
				cutaway: y,
				camera: b
			});
		},
		dispose() {
			if (!l) {
				l = !0, d = /* @__PURE__ */ new WeakMap();
				try {
					c?.dispose();
				} finally {
					s?.dispose(), e.removeEventListener?.("webglcontextlost", p);
				}
			}
		}
	};
	return h;
}
Object.freeze(Object.keys({
	mix: "return mix(sourceFrom(uv), sourceTo(uv), u_value);",
	stepped: "return mix(sourceFrom(uv), sourceTo(uv), floor(u_value * u_steps) / u_steps);",
	silhouette: "\n    vec4 a = sourceFrom(uv), b = sourceTo(uv);\n    float subject = u_hasMask != 0 ? maskAt(uv) : smoothstep(0.30, 0.64, luma(a.rgb));\n    vec4 shade = vec4(mix(a.rgb * 0.27, u_color.rgb, 0.18), a.a);\n    vec4 held = mix(b, shade, subject);\n    return u_value < 0.58 ? mix(a, held, u_value / 0.58) : mix(held, b, (u_value - 0.58) / 0.42);",
	light: "\n    vec4 a = sourceFrom(uv), b = sourceTo(uv);\n    float local = 1.0 - smoothstep(u_width * 0.35, u_width, length(metric(uv - u_anchor)));\n    float lamp = u_hasMask != 0 ? maskAt(uv) : local;\n    float fade = mix(min(1.0, u_value / 0.55), max(0.0, (u_value - 0.78) / 0.22), lamp);\n    return mix(a, b, fade);",
	slit: "return swapAt(uv, abs(uv.y - u_anchor.y) / max(u_anchor.y, 1.0 - u_anchor.y));",
	eyelid: "\n    float x = (uv.x - u_anchor.x) / max(u_anchor.x, 1.0 - u_anchor.x);\n    float curve = mix(1.0, sqrt(max(0.0, 1.0 - x * x)), u_strength);\n    float y = (uv.y - u_anchor.y) / max(u_anchor.y, 1.0 - u_anchor.y);\n    return swapAt(uv, abs(y + u_direction.y * (1.0 - u_value) * 0.15) / max(0.04, curve));",
	upperLid: "\n    float x = (uv.x - u_anchor.x) * 2.0;\n    return swapAt(uv, uv.y + u_strength * x * x * (1.0 - u_value) * 0.25);",
	squint: "\n    float x = (uv.x - u_anchor.x) * 2.0;\n    float y = abs(uv.y - u_anchor.y) / max(u_anchor.y, 1.0 - u_anchor.y);\n    float open = reveal(y / max(0.12, 1.0 - x * x * u_strength));\n    vec4 image = sourceTo(uv);\n    float glare = clamp(u_width, 0.0, 1.0);\n    return mix(sourceFrom(uv), vec4(mix(image.rgb, vec3(1.0), glare), image.a), open);",
	circle: "return swapAt(uv, aperture(uv, false));",
	diamond: "return swapAt(uv, aperture(uv, true));",
	faint: "\n    vec2 center = u_anchor + u_direction * (1.0 - u_value) * u_strength;\n    vec2 delta = metric(uv - center);\n    delta.y *= 1.75;\n    return swapAt(uv, length(delta) / length(metric(vec2(1.0, 1.75))));",
	split: "return swapAt(uv, abs(uv.x - u_anchor.x) / max(u_anchor.x, 1.0 - u_anchor.x));",
	wipe: "return swapAt(uv, axisRank(uv, u_direction));",
	stairs: "\n    vec2 stepped = vec2(uv.x, (floor(uv.y * u_bands) + 0.5) / u_bands);\n    return swapAt(uv, axisRank(stepped, u_direction));",
	clock: "\n    vec2 delta = metric(uv - u_anchor);\n    float angle = atan(delta.x, delta.y) / 6.28318530718;\n    return swapAt(uv, fract(angle * sign(u_direction.x) + u_width));",
	blinds: "\n    float stripe = uv.y * u_bands;\n    return swapAt(uv, (mod(floor(stripe), 2.0) + fract(stripe)) * 0.5);",
	door: "\n    float x = axisRank(uv, u_direction);\n    float edge = u_value * (1.0 + u_width);\n    if (u_value <= 0.0) return sourceFrom(uv);\n    if (u_value >= 1.0) return sourceTo(uv);\n    if (x < edge - u_width) return sourceTo(uv);\n    if (x < edge) {\n      float jamb = (x - edge + u_width) / max(0.001, u_width);\n      if (u_hasMask != 0) {\n        vec4 panel = texture(u_mask, oriented(vec2(jamb, uv.y), u_maskFlip));\n        return mix(sourceFrom(uv), panel, panel.a);\n      }\n      return vec4(u_color.rgb * (jamb < 0.16 || jamb > 0.84 ? 1.15 : 0.65), 1.0);\n    }\n    return sourceFrom(uv);",
	checker: "\n    vec2 tile = floor(uv * grid());\n    return swapAt(uv, (mod(tile.x + tile.y, 2.0) + hash(tile)) * 0.5);",
	random: "return swapAt(uv, (floor(hash(floor(uv * grid())) * u_steps) + 0.5) / u_steps);",
	flood: "\n    vec2 size = grid(), tile = floor(uv * size), center = floor(u_anchor * size);\n    float radius = length((tile - center) / size);\n    float total = length(max(u_anchor, 1.0 - u_anchor));\n    return swapAt(uv, min(0.995, 0.84 * radius / total + 0.16 * hash(tile)));",
	spiral: "\n    float size = max(3.0, floor(min(u_size.x, u_size.y) / u_cells));\n    size = 2.0 * floor(size * 0.5) + 1.0;\n    vec2 tile = floor(uv * size) - floor(size * 0.5);\n    float ring = max(abs(tile.x), abs(tile.y));\n    float offset = tile.y == ring ? tile.x + ring :\n      tile.x == ring ? 3.0 * ring - tile.y :\n      tile.y == -ring ? 5.0 * ring - tile.x : 7.0 * ring + tile.y;\n    float side = 2.0 * ring + 1.0;\n    float index = side * side - 1.0 - offset;\n    return swapAt(uv, 1.0 - (index + 0.5) / (size * size));",
	scan: "return swapAt(uv, (floor((1.0 - uv.y) * u_size.y) + 0.5) / u_size.y);",
	pixel: "\n    if (u_value <= 0.0) return sourceFrom(uv);\n    if (u_value >= 1.0) return sourceTo(uv);\n    float block = 1.0 + floor(max(0.0, sin(u_value * 3.14159265359)) * (u_cells - 1.0));\n    vec2 coord = (floor(uv * u_size / block) + 0.5) * block / u_size;\n    return u_value < 0.5 ? sourceFrom(coord) : sourceTo(coord);",
	dither: "\n    ivec2 pt = ivec2(floor(uv * u_size / u_cells));\n    const float bayer[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0,\n      3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);\n    float rank = (bayer[(pt.x & 3) + (pt.y & 3) * 4] + 0.5) / 16.0;\n    return swapAt(uv, rank);",
	colors: "\n    vec4 a = sourceFrom(uv);\n    float brightness = u_direction.x < 0.0 ? 1.0 - luma(a.rgb) : luma(a.rgb);\n    vec3 quant = floor(a.rgb * 7.999);\n    float bucket = floor(brightness * (u_steps - 1.0)) + 0.76 * hash(quant.rg + vec2(17.0, 7.0) * quant.b);\n    return mix(a, sourceTo(uv), reveal((bucket + 0.12) / u_steps));",
	strips: "\n    float band = mod(floor(uv.y * u_bands), 2.0);\n    float x = uv.x + (band * 2.0 - 1.0) * u_value;\n    return x < 0.0 || x >= 1.0 ? sourceTo(uv) : sourceFrom(vec2(x, uv.y));",
	rush: "\n    float lane = floor(uv.y * u_bands);\n    float speed = 0.55 + hash(vec2(lane, 27.0)) * 0.65;\n    float x = uv.x + u_value * speed * 1.9;\n    vec4 base = x >= 1.0 ? sourceTo(uv) : sourceFrom(vec2(x, uv.y));\n    float streak = step(0.65, hash(vec2(lane, 12.0))) * step(0.82, fract(x * 3.0));\n    return mix(base, vec4(vec3(0.86, 0.91, 1.0), 1.0), streak * sin(u_value * 3.14159265) * u_strength);",
	exposure: "\n    vec4 a = sourceFrom(uv);\n    vec3 bright = min(vec3(1.0), a.rgb * (1.0 + 3.0 * u_value));\n    return mix(vec4(bright, a.a), sourceTo(uv), u_value * u_value);",
	palette: "\n    vec4 a = sourceFrom(uv);\n    vec3 shadow = vec3(0.10, 0.06, 0.27), light = vec3(0.92, 0.57, 0.76);\n    float level = floor(luma(a.rgb) * u_steps) / u_steps;\n    vec3 shifted = mix(shadow, light, level);\n    shifted = mix(shifted, u_color.rgb, 0.24);\n    return vec4(mix(a.rgb, shifted, u_value * u_strength), a.a);",
	era: "\n    float band = floor(uv.y * u_bands);\n    float rank = (mod(band, 2.0) + uv.y) * 0.5;\n    return swapAt(uv, rank);",
	threat: "\n    vec4 a = sourceFrom(uv), b = sourceTo(uv);\n    float local = 1.0 - smoothstep(u_width * 0.75, u_width, length(metric(uv - u_anchor)));\n    float subject = u_hasMask != 0 ? maskAt(uv) : local;\n    float holdThreat = (1.0 - smoothstep(0.50, 1.0, u_value)) * subject;\n    float visible = 1.0 - reveal(1.0 - aperture(uv, false));\n    return mix(b, a, max(visible, holdThreat));\n  ",
	afterimage: "\n    vec4 ghost = sourceFrom(uv), destination = sourceTo(uv);\n    float mask = u_hasMask != 0 ? maskAt(uv) : 1.0 - smoothstep(u_width * 0.55, u_width, length(metric(uv - u_anchor)));\n    return mix(destination, ghost, mask * (1.0 - u_value) * u_strength);",
	ripple: "\n    if (u_value <= 0.0) return sourceFrom(uv);\n    if (u_value >= 1.0) return sourceTo(uv);\n    float q = axisRank(uv, u_direction), wave = q - u_value;\n    float displaced = sin(wave * u_bands) * exp(-abs(wave) * 16.0) * u_strength * sin(u_value * 3.14159265);\n    vec2 at = uv - vec2(u_direction.y, -u_direction.x) * displaced;\n    return mix(sourceFrom(at), sourceTo(at), reveal(q));",
	ink: "\n    vec2 q = metric(uv), extent = metric(vec2(1.0));\n    float distance = 2.0;\n    for (int i = 0; i < 8; ++i) {\n      vec2 pt = vec2(hash(vec2(i, 1)), hash(vec2(i, 2))) * extent;\n      if (i == 0) pt = metric(u_anchor);\n      distance = min(distance, length((q - pt) / extent) * (0.72 + 0.52 * hash(vec2(i, 3))));\n    }\n    float ragged = hash(floor(uv * u_size / u_cells)) * 0.105;\n    return swapAt(uv, clamp(distance * 1.43 + ragged, 0.002, 0.998));"
})), Object.freeze(Object.keys({
	linear: (e) => e,
	smooth: (e) => e * e * (3 - 2 * e),
	in: (e) => e * e,
	out: (e) => e * (2 - e),
	inOut: (e) => e < .5 ? 2 * e * e : 1 - 2 * (1 - e) ** 2
}));
// node_modules/@shapeshift-labs/ink-studio/src/webgl/transition-presets.mjs
var Rt = [
	0,
	0,
	0,
	1
], zt = [
	1,
	1,
	1,
	1
], Y = (e, t, n = "from", r = "to", i = {}) => ({
	shader: e,
	span: t,
	from: n,
	to: r,
	...i
}), X = (e, t) => Y("mix", t, e, e, {
	start: 0,
	end: 0
}), Bt = (e, t, n) => Y(e, t, "from", "cover", n), Z = (e, t, n) => Y(e, t, "cover", "to", n), Vt = (e, t, n) => Y(e, t, "cover", "from", {
	start: 1,
	end: 0,
	...n
}), Ht = (e) => [Y(e, 1)], Ut = (e, { target: t }) => [
	Vt(e, .43),
	X("cover", .14),
	Z(e, .43, { anchor: t })
], Wt = (e) => [
	Bt(e, .42),
	X("cover", .14),
	Z("mix", .44)
], Q = (e, t, n, r, i = {}, a) => ({
	id: e,
	name: t,
	duration: n,
	passes: r,
	options: i,
	cues: a
}), Gt = {
	"Blackouts and fades": [
		Q("hard-blackout", "Hard blackout", .48, [X("cover", .82), X("to", .18)]),
		Q("fade-out-cut-in", "Fade out, cut in", .75, [
			Bt("mix", .78),
			X("cover", .13),
			X("to", .09)
		]),
		Q("cut-out-fade-in", "Cut out, fade in", .83, [X("cover", .26), Z("mix", .74)]),
		Q("stepped-fade", "Stepped fade", .95, [
			Bt("stepped", .45),
			X("cover", .1),
			Z("stepped", .45)
		], { steps: 5 }),
		Q("fade-through-white", "Fade through white", .84, Wt("mix"), { color: zt }),
		Q("fade-through-color", "Fade through a shared color", 1.05, Wt("mix"), { color: [
			.09,
			.16,
			.33,
			1
		] }),
		Q("silhouette-to-black", "Silhouette to black", 1.05, [
			Bt("silhouette", .81, { mask: "subject" }),
			X("cover", .11),
			X("to", .08)
		]),
		Q("last-light-out", "Last light out", 1.18, [
			Bt("light", .83, { mask: "light" }),
			X("cover", .1),
			X("to", .07)
		], {
			width: .16,
			anchor: [.69, .35]
		})
	],
	"Waking, sleeping, and coming to": [
		Q("first-slit-of-light", "First slit of light", 1.48, [
			X("cover", .18),
			Z("slit", .2, {
				end: .09,
				easing: "out"
			}),
			Z("slit", .62, {
				start: .09,
				easing: "in"
			})
		]),
		Q("eyelid-reveal", "Eyelid reveal", 1.13, [X("cover", .15), Z("eyelid", .85, { easing: "inOut" })], { strength: .68 }),
		Q("sleepy-double-blink", "Sleepy double blink", 1.68, [
			X("cover", .1),
			Z("eyelid", .16, { end: .43 }),
			Z("eyelid", .09, {
				start: .43,
				end: 0
			}),
			X("cover", .11),
			Z("eyelid", .54, { easing: "inOut" })
		], { strength: .64 }),
		Q("squint-into-daylight", "Squint into daylight", 1.65, [
			X("cover", .1),
			Z("squint", .19, {
				end: .36,
				width: 1
			}),
			Z("squint", .14, {
				start: .36,
				end: .13,
				width: 1
			}),
			Z("squint", .57, {
				start: .13,
				width: ({ phase: e }) => 1 - e,
				easing: "inOut"
			})
		], { strength: .55 }),
		Q("come-to-in-fragments", "Come to in fragments", 1.66, [
			X("cover", .14),
			X("fragment1", .09),
			X("cover", .2),
			X("fragment2", .11),
			X("cover", .16),
			Z("mix", .16),
			X("to", .14)
		]),
		Q("drift-off", "Drift off", 1.83, [
			Vt("upperLid", .27, {
				end: .52,
				easing: "in"
			}),
			Vt("upperLid", .12, {
				start: .52,
				end: .79
			}),
			Vt("upperLid", .2, {
				start: .79,
				end: .22
			}),
			Vt("upperLid", .12, {
				start: .22,
				end: .4
			}),
			Vt("upperLid", .17, {
				start: .4,
				easing: "in"
			}),
			X("cover", .12)
		], { strength: .75 }),
		Q("faint", "Faint", .99, [Vt("faint", .73, { easing: "in" }), X("cover", .27)], {
			direction: [-.35, 1],
			strength: .28
		}),
		Q("wake-from-a-dream", "Wake from a dream", 1.43, [
			Vt("eyelid", .25, { easing: "in" }),
			X("cover", .23),
			Z("eyelid", .52, { easing: "out" })
		], { strength: .65 }),
		Q("wake-in-darkness", "Wake in darkness", 2.08, [X("cover", .59), Z("mix", .41, { easing: "in" })], {}, ({ cue: e = "rain", cueAt: t = 0, cueDetail: n }) => [{
			at: t,
			name: e,
			detail: n
		}])
	],
	"Irises, wipes, and room changes": [
		Q("character-centered-iris", "Character-centered iris", .88, [
			Vt("circle", .74, { easing: "in" }),
			X("cover", .16),
			X("to", .1)
		]),
		Q("destination-iris", "Destination iris", .88, ({ target: e }) => [X("cover", .22), Z("circle", .78, {
			anchor: e,
			easing: "out"
		})]),
		Q("diamond-iris", "Diamond iris", .88, (e) => Ut("diamond", e)),
		Q("horizontal-squeeze", "Horizontal squeeze", .66, (e) => Ut("slit", e)),
		Q("vertical-split", "Vertical split", .69, (e) => Ut("split", e)),
		Q("side-wipe", "Side wipe", .59, Ht("wipe")),
		Q("diagonal-wipe", "Diagonal wipe", .65, Ht("wipe"), { direction: [1, .75] }),
		Q("stair-step-wipe", "Stair-step wipe", .71, Ht("stairs"), {
			direction: [1, .85],
			bands: 9
		}),
		Q("clock-wipe", "Clock wipe", .76, Ht("clock"), { width: 0 }),
		Q("blind-wipe", "Blind wipe", .74, Ht("blinds"), { bands: 12 }),
		Q("doorframe-wipe", "Doorframe wipe", .81, [Y("door", 1, "from", "to", { mask: "jamb" })], {
			width: .13,
			color: [
				.13,
				.08,
				.11,
				1
			]
		}),
		Q("stairwell-blackout", "Stairwell blackout", .94, [
			Bt("wipe", .49),
			X("cover", .16),
			Z("wipe", .35, { direction: [0, 1] })
		], { direction: [0, -1] })
	],
	"Tiles, dissolves, and encounter transitions": [
		Q("checkerboard-swap", "Checkerboard swap", .68, Ht("checker"), { cellSize: 13 }),
		Q("random-block-blackout", "Random block blackout", .6, [
			Bt("random", .75),
			X("cover", .13),
			X("to", .12)
		], {
			cellSize: 11,
			steps: 6
		}),
		Q("tile-flood", "Tile flood", .72, [
			Bt("flood", .73),
			X("cover", .13),
			X("to", .14)
		], { cellSize: 10 }),
		Q("spiral-blackout", "Spiral blackout", .82, [
			Bt("spiral", .77),
			X("cover", .12),
			X("to", .11)
		], { cellSize: 14 }),
		Q("scanline-build", "Scanline build", .58, Ht("scan")),
		Q("pixelate-and-rebuild", "Pixelate and rebuild", .87, Ht("pixel"), { cellSize: 35 }),
		Q("dither-dissolve", "Dither dissolve", .72, Ht("dither"), { cellSize: 1 }),
		Q("color-by-color-dissolve", "Color-by-color dissolve", .81, Ht("colors"), { steps: 5 }),
		Q("strip-pull-apart", "Strip pull-apart", .51, Ht("strips"), { bands: 10 }),
		Q("rush-to-black", "Rush to black", .56, [
			Bt("rush", .69, { easing: "in" }),
			X("cover", .17),
			X("to", .14)
		], {
			bands: 45,
			strength: .82
		}),
		Q("freeze-flash-swap", "Freeze, flash, swap", .52, [
			X("from", .49),
			X("cover", .14),
			X("to", .37)
		], { color: zt }, () => [
			{
				at: 0,
				name: "freeze"
			},
			{
				at: .49,
				name: "flash"
			},
			{
				at: .63,
				name: "swap"
			}
		]),
		Q("threat-centered-blackout", "Threat-centered blackout", .76, [
			Bt("threat", .75, { mask: "threat" }),
			X("cover", .12),
			X("to", .13)
		], {
			anchor: [.73, .54],
			width: .21
		})
	],
	"Dreams, memories, and jumps in time": [
		Q("bright-memory-wash", "Bright memory wash", 1.2, [
			Bt("exposure", .43),
			X("cover", .16),
			Z("mix", .41, { easing: "in" })
		], { color: zt }),
		Q("palette-drift", "Palette drift", 1.08, [Y("palette", .73), X("to", .27)], {
			steps: 6,
			strength: .98,
			color: [
				.63,
				.19,
				.72,
				1
			]
		}),
		Q("same-room-time-jump", "Same-room time jump", 1.22, Ht("mix")),
		Q("alternating-era-bands", "Alternating-era bands", .91, Ht("era"), { bands: 16 }),
		Q("lingering-afterimage", "Lingering afterimage", 1.04, [X("from", .12), Y("afterimage", .88, "from", "to", {
			mask: "subject",
			easing: "out"
		})], {
			strength: .76,
			width: .3
		}),
		Q("ripple-into-a-vision", "Ripple into a vision", .92, Ht("ripple"), {
			direction: [1, .32],
			strength: .073,
			bands: 57,
			softness: .035
		}),
		Q("ink-soak", "Ink soak", 1.22, [
			Bt("ink", .43),
			X("cover", .15),
			Y("ink", .42, "to", "cover", {
				start: 1,
				end: 0
			})
		], { cellSize: 2 }),
		Q("black-between-fragments", "Black between fragments", 1.87, [
			X("from", .13),
			X("cover", .14),
			X("fragment1", .13),
			X("cover", .1),
			X("fragment2", .13),
			X("cover", .1),
			X("to", .27)
		])
	]
}, Kt = {
	color: Rt,
	anchor: [.5, .5],
	direction: [1, 0],
	cellSize: 8,
	bands: 12,
	steps: 6,
	strength: .65,
	seed: 27,
	softness: 0,
	width: .19
}, qt = /* @__PURE__ */ new Map();
Object.freeze(Object.entries(Gt).flatMap(([e, t]) => t.map((t) => {
	qt.set(t.id, t);
	let n = { ...t.options };
	for (let e of Object.keys(n)) Array.isArray(n[e]) && (n[e] = Object.freeze([...n[e]]));
	let r = typeof t.passes == "function" ? t.passes({ target: Kt.anchor }) : t.passes;
	return Object.freeze({
		id: t.id,
		name: t.name,
		group: e,
		duration: t.duration,
		defaults: Object.freeze(n),
		spans: Object.freeze(r.map((e) => e.span))
	});
}))), Number.isFinite;
var Jt = (e) => e.flatMap((e) => [e, ...[
	"Shift",
	"Control",
	"Meta"
].map((t) => ({
	input: e,
	modifiers: [t]
}))]);
[...Jt(["key:Enter", "key:Space"])], Jt([
	"mouse:Left",
	"pen:Tip",
	"touch:Contact"
]);
// node_modules/@shapeshift-labs/ink-studio/src/webgl/comparison-view.mjs
var Yt = (e) => e.map((e) => ({
	input: e,
	modifiers: ["Shift"]
})), Xt = ["key:ArrowLeft", "key:ArrowUp"], Zt = ["key:ArrowRight", "key:ArrowDown"];
[...Xt], [...Zt], Yt(Xt), Yt(Zt);
// runtime/ink.js
var Qt = 150, $t = 104;
function en(i) {
	let a = i(e), o = document.getElementById("stage"), s = r(a.params ?? {}), c = Lt(o, { toolkit: e });
	t({ engine: "ink" });
	let l, u, d = () => {
		l = a.build(a.seed, s), l.anim?.update(0, 0), u = JSON.stringify(s);
	}, f = 0, p = 0, m = null;
	o.addEventListener("pointerdown", (e) => {
		m = [
			e.clientX,
			e.clientY,
			f,
			p
		], o.setPointerCapture(e.pointerId), o.classList.add("turning");
	}), o.addEventListener("pointermove", (e) => {
		m && (f = m[2] - (e.clientX - m[0]) * .008, p = Math.max(-.3, Math.min(1.1, m[3] + (e.clientY - m[1]) * .006)));
	});
	for (let e of ["pointerup", "pointercancel"]) o.addEventListener(e, () => {
		m = null, o.classList.remove("turning");
	});
	n(a.loop ?? null, (e, t) => {
		JSON.stringify(s) !== u && d(), l.anim?.update(t, e);
		let n = Math.min(innerWidth / Qt, innerHeight / $t) || 1, r = l.cam ?? {};
		c.render(l, {
			width: Math.max(1, Math.round(innerWidth / n)),
			height: Math.max(1, Math.round(innerHeight / n)),
			time: e,
			colored: !1,
			camera: {
				...r,
				yaw: (r.yaw ?? 0) + f,
				pitch: (r.pitch ?? 0) + p
			}
		});
	});
}
export { en as run };
