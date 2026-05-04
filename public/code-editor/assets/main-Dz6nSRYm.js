import{R as It,r as f,a as xe,j as k,c as an}from"./client-CtlHi3fj.js";const{createElement:we,createContext:sn,forwardRef:Mt,useCallback:V,useContext:Tt,useEffect:ce,useImperativeHandle:Ct,useLayoutEffect:ln,useMemo:cn,useRef:F,useState:Se}=It,lt=It[`useId${Math.random()}`.slice(0,5)],un=ln,Xe=sn(null);Xe.displayName="PanelGroupContext";const ue=un,dn=typeof lt=="function"?lt:()=>null;let fn=0;function nt(e=null){const t=dn(),n=F(e||t||null);return n.current===null&&(n.current=""+fn++),e??n.current}function Et({children:e,className:t="",collapsedSize:n,collapsible:r,defaultSize:o,forwardedRef:a,id:i,maxSize:s,minSize:l,onCollapse:p,onExpand:y,onResize:u,order:c,style:h,tagName:b="div",...L}){const I=Tt(Xe);if(I===null)throw Error("Panel components must be rendered within a PanelGroup container");const{collapsePanel:v,expandPanel:R,getPanelSize:z,getPanelStyle:B,groupId:S,isPanelCollapsed:x,reevaluatePanelConstraints:g,registerPanel:X,resizePanel:N,unregisterPanel:m}=I,E=nt(i),j=F({callbacks:{onCollapse:p,onExpand:y,onResize:u},constraints:{collapsedSize:n,collapsible:r,defaultSize:o,maxSize:s,minSize:l},id:E,idIsFromProps:i!==void 0,order:c});F({didLogMissingDefaultSizeWarning:!1}),ue(()=>{const{callbacks:$,constraints:M}=j.current,D={...M};j.current.id=E,j.current.idIsFromProps=i!==void 0,j.current.order=c,$.onCollapse=p,$.onExpand=y,$.onResize=u,M.collapsedSize=n,M.collapsible=r,M.defaultSize=o,M.maxSize=s,M.minSize=l,(D.collapsedSize!==M.collapsedSize||D.collapsible!==M.collapsible||D.maxSize!==M.maxSize||D.minSize!==M.minSize)&&g(j.current,D)}),ue(()=>{const $=j.current;return X($),()=>{m($)}},[c,E,X,m]),Ct(a,()=>({collapse:()=>{v(j.current)},expand:$=>{R(j.current,$)},getId(){return E},getSize(){return z(j.current)},isCollapsed(){return x(j.current)},isExpanded(){return!x(j.current)},resize:$=>{N(j.current,$)}}),[v,R,z,x,E,N]);const W=B(j.current,o);return we(b,{...L,children:e,className:t,id:i,style:{...W,...h},"data-panel":"","data-panel-collapsible":r||void 0,"data-panel-group-id":S,"data-panel-id":E,"data-panel-size":parseFloat(""+W.flexGrow).toFixed(1)})}const et=Mt((e,t)=>we(Et,{...e,forwardedRef:t}));Et.displayName="Panel";et.displayName="forwardRef(Panel)";let tt=null,le=null;function pn(e,t){if(t){const n=(t&Bt)!==0,r=(t&At)!==0,o=(t&Dt)!==0,a=(t&Nt)!==0;if(n)return o?"se-resize":a?"ne-resize":"e-resize";if(r)return o?"sw-resize":a?"nw-resize":"w-resize";if(o)return"s-resize";if(a)return"n-resize"}switch(e){case"horizontal":return"ew-resize";case"intersection":return"move";case"vertical":return"ns-resize"}}function gn(){le!==null&&(document.head.removeChild(le),tt=null,le=null)}function Fe(e,t){const n=pn(e,t);tt!==n&&(tt=n,le===null&&(le=document.createElement("style"),document.head.appendChild(le)),le.innerHTML=`*{cursor: ${n}!important;}`)}function Pt(e){return e.type==="keydown"}function Rt(e){return e.type.startsWith("pointer")}function jt(e){return e.type.startsWith("mouse")}function Ye(e){if(Rt(e)){if(e.isPrimary)return{x:e.clientX,y:e.clientY}}else if(jt(e))return{x:e.clientX,y:e.clientY};return{x:1/0,y:1/0}}function hn(){if(typeof matchMedia=="function")return matchMedia("(pointer:coarse)").matches?"coarse":"fine"}function mn(e,t,n){return e.x<t.x+t.width&&e.x+e.width>t.x&&e.y<t.y+t.height&&e.y+e.height>t.y}function bn(e,t){if(e===t)throw new Error("Cannot compare node with itself");const n={a:dt(e),b:dt(t)};let r;for(;n.a.at(-1)===n.b.at(-1);)e=n.a.pop(),t=n.b.pop(),r=e;O(r,"Stacking order can only be calculated for elements with a common ancestor");const o={a:ut(ct(n.a)),b:ut(ct(n.b))};if(o.a===o.b){const a=r.childNodes,i={a:n.a.at(-1),b:n.b.at(-1)};let s=a.length;for(;s--;){const l=a[s];if(l===i.a)return 1;if(l===i.b)return-1}}return Math.sign(o.a-o.b)}const yn=/\b(?:position|zIndex|opacity|transform|webkitTransform|mixBlendMode|filter|webkitFilter|isolation)\b/;function vn(e){var t;const n=getComputedStyle((t=Ot(e))!==null&&t!==void 0?t:e).display;return n==="flex"||n==="inline-flex"}function xn(e){const t=getComputedStyle(e);return!!(t.position==="fixed"||t.zIndex!=="auto"&&(t.position!=="static"||vn(e))||+t.opacity<1||"transform"in t&&t.transform!=="none"||"webkitTransform"in t&&t.webkitTransform!=="none"||"mixBlendMode"in t&&t.mixBlendMode!=="normal"||"filter"in t&&t.filter!=="none"||"webkitFilter"in t&&t.webkitFilter!=="none"||"isolation"in t&&t.isolation==="isolate"||yn.test(t.willChange)||t.webkitOverflowScrolling==="touch")}function ct(e){let t=e.length;for(;t--;){const n=e[t];if(O(n,"Missing node"),xn(n))return n}return null}function ut(e){return e&&Number(getComputedStyle(e).zIndex)||0}function dt(e){const t=[];for(;e;)t.push(e),e=Ot(e);return t}function Ot(e){const{parentNode:t}=e;return t&&t instanceof ShadowRoot?t.host:t}const Bt=1,At=2,Dt=4,Nt=8,Sn=hn()==="coarse";let te=[],Ce=!1,oe=new Map,_e=new Map;const Ee=new Set;function wn(e,t,n,r,o){var a;const{ownerDocument:i}=t,s={direction:n,element:t,hitAreaMargins:r,setResizeHandlerState:o},l=(a=oe.get(i))!==null&&a!==void 0?a:0;return oe.set(i,l+1),Ee.add(s),$e(),function(){var y;_e.delete(e),Ee.delete(s);const u=(y=oe.get(i))!==null&&y!==void 0?y:1;if(oe.set(i,u-1),$e(),u===1&&oe.delete(i),te.includes(s)){const c=te.indexOf(s);c>=0&&te.splice(c,1),ot()}}}function ft(e){const{target:t}=e,{x:n,y:r}=Ye(e);Ce=!0,rt({target:t,x:n,y:r}),$e(),te.length>0&&(He("down",e),e.preventDefault(),e.stopPropagation())}function ze(e){const{x:t,y:n}=Ye(e);if(e.buttons===0&&(Ce=!1,He("up",e)),!Ce){const{target:r}=e;rt({target:r,x:t,y:n})}He("move",e),ot(),te.length>0&&e.preventDefault()}function he(e){const{target:t}=e,{x:n,y:r}=Ye(e);_e.clear(),Ce=!1,te.length>0&&e.preventDefault(),He("up",e),rt({target:t,x:n,y:r}),ot(),$e()}function rt({target:e,x:t,y:n}){te.splice(0);let r=null;e instanceof HTMLElement&&(r=e),Ee.forEach(o=>{const{element:a,hitAreaMargins:i}=o,s=a.getBoundingClientRect(),{bottom:l,left:p,right:y,top:u}=s,c=Sn?i.coarse:i.fine;if(t>=p-c&&t<=y+c&&n>=u-c&&n<=l+c){if(r!==null&&a!==r&&!a.contains(r)&&!r.contains(a)&&bn(r,a)>0){let b=r,L=!1;for(;b&&!b.contains(a);){if(mn(b.getBoundingClientRect(),s)){L=!0;break}b=b.parentElement}if(L)return}te.push(o)}})}function Ue(e,t){_e.set(e,t)}function ot(){let e=!1,t=!1;te.forEach(r=>{const{direction:o}=r;o==="horizontal"?e=!0:t=!0});let n=0;_e.forEach(r=>{n|=r}),e&&t?Fe("intersection",n):e?Fe("horizontal",n):t?Fe("vertical",n):gn()}function $e(){oe.forEach((e,t)=>{const{body:n}=t;n.removeEventListener("contextmenu",he),n.removeEventListener("pointerdown",ft),n.removeEventListener("pointerleave",ze),n.removeEventListener("pointermove",ze)}),window.removeEventListener("pointerup",he),window.removeEventListener("pointercancel",he),Ee.size>0&&(Ce?(te.length>0&&oe.forEach((e,t)=>{const{body:n}=t;e>0&&(n.addEventListener("contextmenu",he),n.addEventListener("pointerleave",ze),n.addEventListener("pointermove",ze))}),window.addEventListener("pointerup",he),window.addEventListener("pointercancel",he)):oe.forEach((e,t)=>{const{body:n}=t;e>0&&(n.addEventListener("pointerdown",ft,{capture:!0}),n.addEventListener("pointermove",ze))}))}function He(e,t){Ee.forEach(n=>{const{setResizeHandlerState:r}=n,o=te.includes(n);r(e,o,t)})}function kn(){const[e,t]=Se(0);return V(()=>t(n=>n+1),[])}function O(e,t){if(!e)throw console.error(t),Error(t)}const at=10;function de(e,t,n=at){return e.toFixed(n)===t.toFixed(n)?0:e>t?1:-1}function ne(e,t,n=at){return de(e,t,n)===0}function q(e,t,n){return de(e,t,n)===0}function zn(e,t,n){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++){const o=e[r],a=t[r];if(!q(o,a,n))return!1}return!0}function ye({panelConstraints:e,panelIndex:t,size:n}){const r=e[t];O(r!=null,`Panel constraints not found for index ${t}`);let{collapsedSize:o=0,collapsible:a,maxSize:i=100,minSize:s=0}=r;if(de(n,s)<0)if(a){const l=(o+s)/2;de(n,l)<0?n=o:n=s}else n=s;return n=Math.min(i,n),n=parseFloat(n.toFixed(at)),n}function Le({delta:e,initialLayout:t,panelConstraints:n,pivotIndices:r,prevLayout:o,trigger:a}){if(q(e,0))return t;const i=[...t],[s,l]=r;O(s!=null,"Invalid first pivot index"),O(l!=null,"Invalid second pivot index");let p=0;if(a==="keyboard"){{const u=e<0?l:s,c=n[u];O(c,`Panel constraints not found for index ${u}`);const{collapsedSize:h=0,collapsible:b,minSize:L=0}=c;if(b){const I=t[u];if(O(I!=null,`Previous layout not found for panel index ${u}`),q(I,h)){const v=L-I;de(v,Math.abs(e))>0&&(e=e<0?0-v:v)}}}{const u=e<0?s:l,c=n[u];O(c,`No panel constraints found for index ${u}`);const{collapsedSize:h=0,collapsible:b,minSize:L=0}=c;if(b){const I=t[u];if(O(I!=null,`Previous layout not found for panel index ${u}`),q(I,L)){const v=I-h;de(v,Math.abs(e))>0&&(e=e<0?0-v:v)}}}}{const u=e<0?1:-1;let c=e<0?l:s,h=0;for(;;){const L=t[c];O(L!=null,`Previous layout not found for panel index ${c}`);const v=ye({panelConstraints:n,panelIndex:c,size:100})-L;if(h+=v,c+=u,c<0||c>=n.length)break}const b=Math.min(Math.abs(e),Math.abs(h));e=e<0?0-b:b}{let c=e<0?s:l;for(;c>=0&&c<n.length;){const h=Math.abs(e)-Math.abs(p),b=t[c];O(b!=null,`Previous layout not found for panel index ${c}`);const L=b-h,I=ye({panelConstraints:n,panelIndex:c,size:L});if(!q(b,I)&&(p+=b-I,i[c]=I,p.toPrecision(3).localeCompare(Math.abs(e).toPrecision(3),void 0,{numeric:!0})>=0))break;e<0?c--:c++}}if(zn(o,i))return o;{const u=e<0?l:s,c=t[u];O(c!=null,`Previous layout not found for panel index ${u}`);const h=c+p,b=ye({panelConstraints:n,panelIndex:u,size:h});if(i[u]=b,!q(b,h)){let L=h-b,v=e<0?l:s;for(;v>=0&&v<n.length;){const R=i[v];O(R!=null,`Previous layout not found for panel index ${v}`);const z=R+L,B=ye({panelConstraints:n,panelIndex:v,size:z});if(q(R,B)||(L-=B-R,i[v]=B),q(L,0))break;e>0?v--:v++}}}const y=i.reduce((u,c)=>c+u,0);return q(y,100)?i:o}function Ln({layout:e,panelsArray:t,pivotIndices:n}){let r=0,o=100,a=0,i=0;const s=n[0];O(s!=null,"No pivot index found"),t.forEach((u,c)=>{const{constraints:h}=u,{maxSize:b=100,minSize:L=0}=h;c===s?(r=L,o=b):(a+=L,i+=b)});const l=Math.min(o,100-a),p=Math.max(r,100-i),y=e[s];return{valueMax:l,valueMin:p,valueNow:y}}function Pe(e,t=document){return Array.from(t.querySelectorAll(`[data-panel-resize-handle-id][data-panel-group-id="${e}"]`))}function $t(e,t,n=document){const o=Pe(e,n).findIndex(a=>a.getAttribute("data-panel-resize-handle-id")===t);return o??null}function Ht(e,t,n){const r=$t(e,t,n);return r!=null?[r,r+1]:[-1,-1]}function Gt(e,t=document){var n;if(t instanceof HTMLElement&&(t==null||(n=t.dataset)===null||n===void 0?void 0:n.panelGroupId)==e)return t;const r=t.querySelector(`[data-panel-group][data-panel-group-id="${e}"]`);return r||null}function We(e,t=document){const n=t.querySelector(`[data-panel-resize-handle-id="${e}"]`);return n||null}function In(e,t,n,r=document){var o,a,i,s;const l=We(t,r),p=Pe(e,r),y=l?p.indexOf(l):-1,u=(o=(a=n[y])===null||a===void 0?void 0:a.id)!==null&&o!==void 0?o:null,c=(i=(s=n[y+1])===null||s===void 0?void 0:s.id)!==null&&i!==void 0?i:null;return[u,c]}function Mn({committedValuesRef:e,eagerValuesRef:t,groupId:n,layout:r,panelDataArray:o,panelGroupElement:a,setLayout:i}){F({didWarnAboutMissingResizeHandle:!1}),ue(()=>{if(!a)return;const s=Pe(n,a);for(let l=0;l<o.length-1;l++){const{valueMax:p,valueMin:y,valueNow:u}=Ln({layout:r,panelsArray:o,pivotIndices:[l,l+1]}),c=s[l];if(c!=null){const h=o[l];O(h,`No panel data found for index "${l}"`),c.setAttribute("aria-controls",h.id),c.setAttribute("aria-valuemax",""+Math.round(p)),c.setAttribute("aria-valuemin",""+Math.round(y)),c.setAttribute("aria-valuenow",u!=null?""+Math.round(u):"")}}return()=>{s.forEach((l,p)=>{l.removeAttribute("aria-controls"),l.removeAttribute("aria-valuemax"),l.removeAttribute("aria-valuemin"),l.removeAttribute("aria-valuenow")})}},[n,r,o,a]),ce(()=>{if(!a)return;const s=t.current;O(s,"Eager values not found");const{panelDataArray:l}=s,p=Gt(n,a);O(p!=null,`No group found for id "${n}"`);const y=Pe(n,a);O(y,`No resize handles found for group id "${n}"`);const u=y.map(c=>{const h=c.getAttribute("data-panel-resize-handle-id");O(h,"Resize handle element has no handle id attribute");const[b,L]=In(n,h,l,a);if(b==null||L==null)return()=>{};const I=v=>{if(!v.defaultPrevented)switch(v.key){case"Enter":{v.preventDefault();const R=l.findIndex(z=>z.id===b);if(R>=0){const z=l[R];O(z,`No panel data found for index ${R}`);const B=r[R],{collapsedSize:S=0,collapsible:x,minSize:g=0}=z.constraints;if(B!=null&&x){const X=Le({delta:q(B,S)?g-S:S-B,initialLayout:r,panelConstraints:l.map(N=>N.constraints),pivotIndices:Ht(n,h,a),prevLayout:r,trigger:"keyboard"});r!==X&&i(X)}}break}}};return c.addEventListener("keydown",I),()=>{c.removeEventListener("keydown",I)}});return()=>{u.forEach(c=>c())}},[a,e,t,n,r,o,i])}function pt(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Xt(e,t){const n=e==="horizontal",{x:r,y:o}=Ye(t);return n?r:o}function Tn(e,t,n,r,o){const a=n==="horizontal",i=We(t,o);O(i,`No resize handle element found for id "${t}"`);const s=i.getAttribute("data-panel-group-id");O(s,"Resize handle element has no group id attribute");let{initialCursorPosition:l}=r;const p=Xt(n,e),y=Gt(s,o);O(y,`No group element found for id "${s}"`);const u=y.getBoundingClientRect(),c=a?u.width:u.height;return(p-l)/c*100}function Cn(e,t,n,r,o,a){if(Pt(e)){const i=n==="horizontal";let s=0;e.shiftKey?s=100:o!=null?s=o:s=10;let l=0;switch(e.key){case"ArrowDown":l=i?0:s;break;case"ArrowLeft":l=i?-s:0;break;case"ArrowRight":l=i?s:0;break;case"ArrowUp":l=i?0:-s;break;case"End":l=100;break;case"Home":l=-100;break}return l}else return r==null?0:Tn(e,t,n,r,a)}function En({panelDataArray:e}){const t=Array(e.length),n=e.map(a=>a.constraints);let r=0,o=100;for(let a=0;a<e.length;a++){const i=n[a];O(i,`Panel constraints not found for index ${a}`);const{defaultSize:s}=i;s!=null&&(r++,t[a]=s,o-=s)}for(let a=0;a<e.length;a++){const i=n[a];O(i,`Panel constraints not found for index ${a}`);const{defaultSize:s}=i;if(s!=null)continue;const l=e.length-r,p=o/l;r++,t[a]=p,o-=p}return t}function me(e,t,n){t.forEach((r,o)=>{const a=e[o];O(a,`Panel data not found for index ${o}`);const{callbacks:i,constraints:s,id:l}=a,{collapsedSize:p=0,collapsible:y}=s,u=n[l];if(u==null||r!==u){n[l]=r;const{onCollapse:c,onExpand:h,onResize:b}=i;b&&b(r,u),y&&(c||h)&&(h&&(u==null||ne(u,p))&&!ne(r,p)&&h(),c&&(u==null||!ne(u,p))&&ne(r,p)&&c())}})}function Ae(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!=t[n])return!1;return!0}function Pn({defaultSize:e,dragState:t,layout:n,panelData:r,panelIndex:o,precision:a=3}){const i=n[o];let s;return i==null?s=e!=null?e.toPrecision(a):"1":r.length===1?s="1":s=i.toPrecision(a),{flexBasis:0,flexGrow:s,flexShrink:1,overflow:"hidden",pointerEvents:t!==null?"none":void 0}}function Rn(e,t=10){let n=null;return(...o)=>{n!==null&&clearTimeout(n),n=setTimeout(()=>{e(...o)},t)}}function gt(e){try{if(typeof localStorage<"u")e.getItem=t=>localStorage.getItem(t),e.setItem=(t,n)=>{localStorage.setItem(t,n)};else throw new Error("localStorage not supported in this environment")}catch(t){console.error(t),e.getItem=()=>null,e.setItem=()=>{}}}function Yt(e){return`react-resizable-panels:${e}`}function _t(e){return e.map(t=>{const{constraints:n,id:r,idIsFromProps:o,order:a}=t;return o?r:a?`${a}:${JSON.stringify(n)}`:JSON.stringify(n)}).sort((t,n)=>t.localeCompare(n)).join(",")}function Wt(e,t){try{const n=Yt(e),r=t.getItem(n);if(r){const o=JSON.parse(r);if(typeof o=="object"&&o!=null)return o}}catch{}return null}function jn(e,t,n){var r,o;const a=(r=Wt(e,n))!==null&&r!==void 0?r:{},i=_t(t);return(o=a[i])!==null&&o!==void 0?o:null}function On(e,t,n,r,o){var a;const i=Yt(e),s=_t(t),l=(a=Wt(e,o))!==null&&a!==void 0?a:{};l[s]={expandToSizes:Object.fromEntries(n.entries()),layout:r};try{o.setItem(i,JSON.stringify(l))}catch(p){console.error(p)}}function ht({layout:e,panelConstraints:t}){const n=[...e],r=n.reduce((a,i)=>a+i,0);if(n.length!==t.length)throw Error(`Invalid ${t.length} panel layout: ${n.map(a=>`${a}%`).join(", ")}`);if(!q(r,100))for(let a=0;a<t.length;a++){const i=n[a];O(i!=null,`No layout data found for index ${a}`);const s=100/r*i;n[a]=s}let o=0;for(let a=0;a<t.length;a++){const i=n[a];O(i!=null,`No layout data found for index ${a}`);const s=ye({panelConstraints:t,panelIndex:a,size:i});i!=s&&(o+=i-s,n[a]=s)}if(!q(o,0))for(let a=0;a<t.length;a++){const i=n[a];O(i!=null,`No layout data found for index ${a}`);const s=i+o,l=ye({panelConstraints:t,panelIndex:a,size:s});if(i!==l&&(o-=l-i,n[a]=l,q(o,0)))break}return n}const Bn=100,Ie={getItem:e=>(gt(Ie),Ie.getItem(e)),setItem:(e,t)=>{gt(Ie),Ie.setItem(e,t)}},mt={};function Vt({autoSaveId:e=null,children:t,className:n="",direction:r,forwardedRef:o,id:a=null,onLayout:i=null,keyboardResizeBy:s=null,storage:l=Ie,style:p,tagName:y="div",...u}){const c=nt(a),h=F(null),[b,L]=Se(null),[I,v]=Se([]),R=kn(),z=F({}),B=F(new Map),S=F(0),x=F({autoSaveId:e,direction:r,dragState:b,id:c,keyboardResizeBy:s,onLayout:i,storage:l}),g=F({layout:I,panelDataArray:[],panelDataArrayChanged:!1});F({didLogIdAndOrderWarning:!1,didLogPanelConstraintsWarning:!1,prevPanelIds:[]}),Ct(o,()=>({getId:()=>x.current.id,getLayout:()=>{const{layout:d}=g.current;return d},setLayout:d=>{const{onLayout:w}=x.current,{layout:P,panelDataArray:T}=g.current,C=ht({layout:d,panelConstraints:T.map(A=>A.constraints)});pt(P,C)||(v(C),g.current.layout=C,w&&w(C),me(T,C,z.current))}}),[]),ue(()=>{x.current.autoSaveId=e,x.current.direction=r,x.current.dragState=b,x.current.id=c,x.current.onLayout=i,x.current.storage=l}),Mn({committedValuesRef:x,eagerValuesRef:g,groupId:c,layout:I,panelDataArray:g.current.panelDataArray,setLayout:v,panelGroupElement:h.current}),ce(()=>{const{panelDataArray:d}=g.current;if(e){if(I.length===0||I.length!==d.length)return;let w=mt[e];w==null&&(w=Rn(On,Bn),mt[e]=w);const P=[...d],T=new Map(B.current);w(e,P,T,I,l)}},[e,I,l]),ce(()=>{});const X=V(d=>{const{onLayout:w}=x.current,{layout:P,panelDataArray:T}=g.current;if(d.constraints.collapsible){const C=T.map(Q=>Q.constraints),{collapsedSize:A=0,panelSize:H,pivotIndices:_}=se(T,d,P);if(O(H!=null,`Panel size not found for panel "${d.id}"`),!ne(H,A)){B.current.set(d.id,H);const Z=be(T,d)===T.length-1?H-A:A-H,G=Le({delta:Z,initialLayout:P,panelConstraints:C,pivotIndices:_,prevLayout:P,trigger:"imperative-api"});Ae(P,G)||(v(G),g.current.layout=G,w&&w(G),me(T,G,z.current))}}},[]),N=V((d,w)=>{const{onLayout:P}=x.current,{layout:T,panelDataArray:C}=g.current;if(d.constraints.collapsible){const A=C.map(ee=>ee.constraints),{collapsedSize:H=0,panelSize:_=0,minSize:Q=0,pivotIndices:Z}=se(C,d,T),G=w??Q;if(ne(_,H)){const ee=B.current.get(d.id),Oe=ee!=null&&ee>=G?ee:G,Be=be(C,d)===C.length-1?_-Oe:Oe-_,ie=Le({delta:Be,initialLayout:T,panelConstraints:A,pivotIndices:Z,prevLayout:T,trigger:"imperative-api"});Ae(T,ie)||(v(ie),g.current.layout=ie,P&&P(ie),me(C,ie,z.current))}}},[]),m=V(d=>{const{layout:w,panelDataArray:P}=g.current,{panelSize:T}=se(P,d,w);return O(T!=null,`Panel size not found for panel "${d.id}"`),T},[]),E=V((d,w)=>{const{panelDataArray:P}=g.current,T=be(P,d);return Pn({defaultSize:w,dragState:b,layout:I,panelData:P,panelIndex:T})},[b,I]),j=V(d=>{const{layout:w,panelDataArray:P}=g.current,{collapsedSize:T=0,collapsible:C,panelSize:A}=se(P,d,w);return O(A!=null,`Panel size not found for panel "${d.id}"`),C===!0&&ne(A,T)},[]),W=V(d=>{const{layout:w,panelDataArray:P}=g.current,{collapsedSize:T=0,collapsible:C,panelSize:A}=se(P,d,w);return O(A!=null,`Panel size not found for panel "${d.id}"`),!C||de(A,T)>0},[]),$=V(d=>{const{panelDataArray:w}=g.current;w.push(d),w.sort((P,T)=>{const C=P.order,A=T.order;return C==null&&A==null?0:C==null?-1:A==null?1:C-A}),g.current.panelDataArrayChanged=!0,R()},[R]);ue(()=>{if(g.current.panelDataArrayChanged){g.current.panelDataArrayChanged=!1;const{autoSaveId:d,onLayout:w,storage:P}=x.current,{layout:T,panelDataArray:C}=g.current;let A=null;if(d){const _=jn(d,C,P);_&&(B.current=new Map(Object.entries(_.expandToSizes)),A=_.layout)}A==null&&(A=En({panelDataArray:C}));const H=ht({layout:A,panelConstraints:C.map(_=>_.constraints)});pt(T,H)||(v(H),g.current.layout=H,w&&w(H),me(C,H,z.current))}}),ue(()=>{const d=g.current;return()=>{d.layout=[]}},[]);const M=V(d=>function(P){P.preventDefault();const T=h.current;if(!T)return()=>null;const{direction:C,dragState:A,id:H,keyboardResizeBy:_,onLayout:Q}=x.current,{layout:Z,panelDataArray:G}=g.current,{initialLayout:ee}=A??{},Oe=Ht(H,d,T);let re=Cn(P,d,C,A,_,T);const Be=C==="horizontal";document.dir==="rtl"&&Be&&(re=-re);const ie=G.map(on=>on.constraints),ke=Le({delta:re,initialLayout:ee??Z,panelConstraints:ie,pivotIndices:Oe,prevLayout:Z,trigger:Pt(P)?"keyboard":"mouse-or-touch"}),st=!Ae(Z,ke);(Rt(P)||jt(P))&&S.current!=re&&(S.current=re,st?Ue(d,0):Be?Ue(d,re<0?Bt:At):Ue(d,re<0?Dt:Nt)),st&&(v(ke),g.current.layout=ke,Q&&Q(ke),me(G,ke,z.current))},[]),D=V((d,w)=>{const{onLayout:P}=x.current,{layout:T,panelDataArray:C}=g.current,A=C.map(ee=>ee.constraints),{panelSize:H,pivotIndices:_}=se(C,d,T);O(H!=null,`Panel size not found for panel "${d.id}"`);const Z=be(C,d)===C.length-1?H-w:w-H,G=Le({delta:Z,initialLayout:T,panelConstraints:A,pivotIndices:_,prevLayout:T,trigger:"imperative-api"});Ae(T,G)||(v(G),g.current.layout=G,P&&P(G),me(C,G,z.current))},[]),fe=V((d,w)=>{const{layout:P,panelDataArray:T}=g.current,{collapsedSize:C=0,collapsible:A}=w,{collapsedSize:H=0,collapsible:_,maxSize:Q=100,minSize:Z=0}=d.constraints,{panelSize:G}=se(T,d,P);G!=null&&(A&&_&&ne(G,C)?ne(C,H)||D(d,H):G<Z?D(d,Z):G>Q&&D(d,Q))},[D]),J=V((d,w)=>{const{direction:P}=x.current,{layout:T}=g.current;if(!h.current)return;const C=We(d,h.current);O(C,`Drag handle element not found for id "${d}"`);const A=Xt(P,w);L({dragHandleId:d,dragHandleRect:C.getBoundingClientRect(),initialCursorPosition:A,initialLayout:T})},[]),pe=V(()=>{L(null)},[]),ge=V(d=>{const{panelDataArray:w}=g.current,P=be(w,d);P>=0&&(w.splice(P,1),delete z.current[d.id],g.current.panelDataArrayChanged=!0,R())},[R]),Y=cn(()=>({collapsePanel:X,direction:r,dragState:b,expandPanel:N,getPanelSize:m,getPanelStyle:E,groupId:c,isPanelCollapsed:j,isPanelExpanded:W,reevaluatePanelConstraints:fe,registerPanel:$,registerResizeHandle:M,resizePanel:D,startDragging:J,stopDragging:pe,unregisterPanel:ge,panelGroupElement:h.current}),[X,b,r,N,m,E,c,j,W,fe,$,M,D,J,pe,ge]),U={display:"flex",flexDirection:r==="horizontal"?"row":"column",height:"100%",overflow:"hidden",width:"100%"};return we(Xe.Provider,{value:Y},we(y,{...u,children:t,className:n,id:a,ref:h,style:{...U,...p},"data-panel-group":"","data-panel-group-direction":r,"data-panel-group-id":c}))}const Ft=Mt((e,t)=>we(Vt,{...e,forwardedRef:t}));Vt.displayName="PanelGroup";Ft.displayName="forwardRef(PanelGroup)";function be(e,t){return e.findIndex(n=>n===t||n.id===t.id)}function se(e,t,n){const r=be(e,t),a=r===e.length-1?[r-1,r]:[r,r+1],i=n[r];return{...t.constraints,panelSize:i,pivotIndices:a}}function An({disabled:e,handleId:t,resizeHandler:n,panelGroupElement:r}){ce(()=>{if(e||n==null||r==null)return;const o=We(t,r);if(o==null)return;const a=i=>{if(!i.defaultPrevented)switch(i.key){case"ArrowDown":case"ArrowLeft":case"ArrowRight":case"ArrowUp":case"End":case"Home":{i.preventDefault(),n(i);break}case"F6":{i.preventDefault();const s=o.getAttribute("data-panel-group-id");O(s,`No group element found for id "${s}"`);const l=Pe(s,r),p=$t(s,t,r);O(p!==null,`No resize element found for id "${t}"`);const y=i.shiftKey?p>0?p-1:l.length-1:p+1<l.length?p+1:0;l[y].focus();break}}};return o.addEventListener("keydown",a),()=>{o.removeEventListener("keydown",a)}},[r,e,t,n])}function Ut({children:e=null,className:t="",disabled:n=!1,hitAreaMargins:r,id:o,onBlur:a,onDragging:i,onFocus:s,style:l={},tabIndex:p=0,tagName:y="div",...u}){var c,h;const b=F(null),L=F({onDragging:i});ce(()=>{L.current.onDragging=i});const I=Tt(Xe);if(I===null)throw Error("PanelResizeHandle components must be rendered within a PanelGroup container");const{direction:v,groupId:R,registerResizeHandle:z,startDragging:B,stopDragging:S,panelGroupElement:x}=I,g=nt(o),[X,N]=Se("inactive"),[m,E]=Se(!1),[j,W]=Se(null),$=F({state:X});ue(()=>{$.current.state=X}),ce(()=>{if(n)W(null);else{const J=z(g);W(()=>J)}},[n,g,z]);const M=(c=r?.coarse)!==null&&c!==void 0?c:15,D=(h=r?.fine)!==null&&h!==void 0?h:5;return ce(()=>{if(n||j==null)return;const J=b.current;return O(J,"Element ref not attached"),wn(g,J,v,{coarse:M,fine:D},(ge,Y,U)=>{if(Y)switch(ge){case"down":{N("drag"),B(g,U);const{onDragging:d}=L.current;d&&d(!0);break}case"move":{const{state:d}=$.current;d!=="drag"&&N("hover"),j(U);break}case"up":{N("hover"),S();const{onDragging:d}=L.current;d&&d(!1);break}}else N("inactive")})},[M,v,n,D,z,g,j,B,S]),An({disabled:n,handleId:g,resizeHandler:j,panelGroupElement:x}),we(y,{...u,children:e,className:t,id:o,onBlur:()=>{E(!1),a?.()},onFocus:()=>{E(!0),s?.()},ref:b,role:"separator",style:{...{touchAction:"none",userSelect:"none"},...l},tabIndex:p,"data-panel-group-direction":v,"data-panel-group-id":R,"data-resize-handle":"","data-resize-handle-active":X==="drag"?"pointer":m?"keyboard":void 0,"data-resize-handle-state":X,"data-panel-resize-handle-enabled":!n,"data-panel-resize-handle-id":g})}Ut.displayName="PanelResizeHandle";function bt(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}function Dn(e){if(Array.isArray(e))return e}function Nn(e,t,n){return(t=Wn(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function $n(e,t){var n=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(n!=null){var r,o,a,i,s=[],l=!0,p=!1;try{if(a=(n=n.call(e)).next,t!==0)for(;!(l=(r=a.call(n)).done)&&(s.push(r.value),s.length!==t);l=!0);}catch(y){p=!0,o=y}finally{try{if(!l&&n.return!=null&&(i=n.return(),Object(i)!==i))return}finally{if(p)throw o}}return s}}function Hn(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function yt(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(o){return Object.getOwnPropertyDescriptor(e,o).enumerable})),n.push.apply(n,r)}return n}function vt(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?yt(Object(n),!0).forEach(function(r){Nn(e,r,n[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):yt(Object(n)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))})}return e}function Gn(e,t){if(e==null)return{};var n,r,o=Xn(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)===-1&&{}.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}function Xn(e,t){if(e==null)return{};var n={};for(var r in e)if({}.hasOwnProperty.call(e,r)){if(t.indexOf(r)!==-1)continue;n[r]=e[r]}return n}function Yn(e,t){return Dn(e)||$n(e,t)||Vn(e,t)||Hn()}function _n(e,t){if(typeof e!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(typeof r!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Wn(e){var t=_n(e,"string");return typeof t=="symbol"?t:t+""}function Vn(e,t){if(e){if(typeof e=="string")return bt(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?bt(e,t):void 0}}function Fn(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function xt(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(o){return Object.getOwnPropertyDescriptor(e,o).enumerable})),n.push.apply(n,r)}return n}function St(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?xt(Object(n),!0).forEach(function(r){Fn(e,r,n[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):xt(Object(n)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))})}return e}function Un(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return function(r){return t.reduceRight(function(o,a){return a(o)},r)}}function Me(e){return function t(){for(var n=this,r=arguments.length,o=new Array(r),a=0;a<r;a++)o[a]=arguments[a];return o.length>=e.length?e.apply(this,o):function(){for(var i=arguments.length,s=new Array(i),l=0;l<i;l++)s[l]=arguments[l];return t.apply(n,[].concat(o,s))}}}function Ge(e){return{}.toString.call(e).includes("Object")}function qn(e){return!Object.keys(e).length}function Re(e){return typeof e=="function"}function Kn(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Zn(e,t){return Ge(t)||ae("changeType"),Object.keys(t).some(function(n){return!Kn(e,n)})&&ae("changeField"),t}function Jn(e){Re(e)||ae("selectorType")}function Qn(e){Re(e)||Ge(e)||ae("handlerType"),Ge(e)&&Object.values(e).some(function(t){return!Re(t)})&&ae("handlersType")}function er(e){e||ae("initialIsRequired"),Ge(e)||ae("initialType"),qn(e)&&ae("initialContent")}function tr(e,t){throw new Error(e[t]||e.default)}var nr={initialIsRequired:"initial state is required",initialType:"initial state should be an object",initialContent:"initial state shouldn't be an empty object",handlerType:"handler should be an object or a function",handlersType:"all handlers should be a functions",selectorType:"selector should be a function",changeType:"provided value of changes should be an object",changeField:'it seams you want to change a field in the state which is not specified in the "initial" state',default:"an unknown error accured in `state-local` package"},ae=Me(tr)(nr),De={changes:Zn,selector:Jn,handler:Qn,initial:er};function rr(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};De.initial(e),De.handler(t);var n={current:e},r=Me(ir)(n,t),o=Me(ar)(n),a=Me(De.changes)(e),i=Me(or)(n);function s(){var p=arguments.length>0&&arguments[0]!==void 0?arguments[0]:function(y){return y};return De.selector(p),p(n.current)}function l(p){Un(r,o,a,i)(p)}return[s,l]}function or(e,t){return Re(t)?t(e.current):t}function ar(e,t){return e.current=St(St({},e.current),t),t}function ir(e,t,n){return Re(t)?t(e.current):Object.keys(n).forEach(function(r){var o;return(o=t[r])===null||o===void 0?void 0:o.call(t,e.current[r])}),n}var sr={create:rr},lr={paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"}};function cr(e){return function t(){for(var n=this,r=arguments.length,o=new Array(r),a=0;a<r;a++)o[a]=arguments[a];return o.length>=e.length?e.apply(this,o):function(){for(var i=arguments.length,s=new Array(i),l=0;l<i;l++)s[l]=arguments[l];return t.apply(n,[].concat(o,s))}}}function ur(e){return{}.toString.call(e).includes("Object")}function dr(e){return e||wt("configIsRequired"),ur(e)||wt("configType"),e.urls?(fr(),{paths:{vs:e.urls.monacoBase}}):e}function fr(){console.warn(qt.deprecation)}function pr(e,t){throw new Error(e[t]||e.default)}var qt={configIsRequired:"the configuration object is required",configType:"the configuration object should be an object",default:"an unknown error accured in `@monaco-editor/loader` package",deprecation:`Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `},wt=cr(pr)(qt),gr={config:dr},hr=function(){for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return function(o){return n.reduceRight(function(a,i){return i(a)},o)}};function Kt(e,t){return Object.keys(t).forEach(function(n){t[n]instanceof Object&&e[n]&&Object.assign(t[n],Kt(e[n],t[n]))}),vt(vt({},e),t)}var mr={type:"cancelation",msg:"operation is manually canceled"};function qe(e){var t=!1,n=new Promise(function(r,o){e.then(function(a){return t?o(mr):r(a)}),e.catch(o)});return n.cancel=function(){return t=!0},n}var br=["monaco"],yr=sr.create({config:lr,isInitialized:!1,resolve:null,reject:null,monaco:null}),Zt=Yn(yr,2),je=Zt[0],Ve=Zt[1];function vr(e){var t=gr.config(e),n=t.monaco,r=Gn(t,br);Ve(function(o){return{config:Kt(o.config,r),monaco:n}})}function xr(){var e=je(function(t){var n=t.monaco,r=t.isInitialized,o=t.resolve;return{monaco:n,isInitialized:r,resolve:o}});if(!e.isInitialized){if(Ve({isInitialized:!0}),e.monaco)return e.resolve(e.monaco),qe(Ke);if(window.monaco&&window.monaco.editor)return Jt(window.monaco),e.resolve(window.monaco),qe(Ke);hr(Sr,kr)(zr)}return qe(Ke)}function Sr(e){return document.body.appendChild(e)}function wr(e){var t=document.createElement("script");return e&&(t.src=e),t}function kr(e){var t=je(function(r){var o=r.config,a=r.reject;return{config:o,reject:a}}),n=wr("".concat(t.config.paths.vs,"/loader.js"));return n.onload=function(){return e()},n.onerror=t.reject,n}function zr(){var e=je(function(n){var r=n.config,o=n.resolve,a=n.reject;return{config:r,resolve:o,reject:a}}),t=window.require;t.config(e.config),t(["vs/editor/editor.main"],function(n){var r=n.m||n;Jt(r),e.resolve(r)},function(n){e.reject(n)})}function Jt(e){je().monaco||Ve({monaco:e})}function Lr(){return je(function(e){var t=e.monaco;return t})}var Ke=new Promise(function(e,t){return Ve({resolve:e,reject:t})}),Qt={config:vr,init:xr,__getMonacoInstance:Lr},Ir={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},Ze=Ir,Mr={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},Tr=Mr;function Cr({children:e}){return xe.createElement("div",{style:Tr.container},e)}var Er=Cr,Pr=Er;function Rr({width:e,height:t,isEditorReady:n,loading:r,_ref:o,className:a,wrapperProps:i}){return xe.createElement("section",{style:{...Ze.wrapper,width:e,height:t},...i},!n&&xe.createElement(Pr,null,r),xe.createElement("div",{ref:o,style:{...Ze.fullWidth,...!n&&Ze.hide},className:a}))}var jr=Rr,en=f.memo(jr);function Or(e){f.useEffect(e,[])}var tn=Or;function Br(e,t,n=!0){let r=f.useRef(!0);f.useEffect(r.current||!n?()=>{r.current=!1}:e,t)}var K=Br;function Te(){}function ve(e,t,n,r){return Ar(e,r)||Dr(e,t,n,r)}function Ar(e,t){return e.editor.getModel(nn(e,t))}function Dr(e,t,n,r){return e.editor.createModel(t,n,r?nn(e,r):void 0)}function nn(e,t){return e.Uri.parse(t)}function Nr({original:e,modified:t,language:n,originalLanguage:r,modifiedLanguage:o,originalModelPath:a,modifiedModelPath:i,keepCurrentOriginalModel:s=!1,keepCurrentModifiedModel:l=!1,theme:p="light",loading:y="Loading...",options:u={},height:c="100%",width:h="100%",className:b,wrapperProps:L={},beforeMount:I=Te,onMount:v=Te}){let[R,z]=f.useState(!1),[B,S]=f.useState(!0),x=f.useRef(null),g=f.useRef(null),X=f.useRef(null),N=f.useRef(v),m=f.useRef(I),E=f.useRef(!1);tn(()=>{let M=Qt.init();return M.then(D=>(g.current=D)&&S(!1)).catch(D=>D?.type!=="cancelation"&&console.error("Monaco initialization: error:",D)),()=>x.current?$():M.cancel()}),K(()=>{if(x.current&&g.current){let M=x.current.getOriginalEditor(),D=ve(g.current,e||"",r||n||"text",a||"");D!==M.getModel()&&M.setModel(D)}},[a],R),K(()=>{if(x.current&&g.current){let M=x.current.getModifiedEditor(),D=ve(g.current,t||"",o||n||"text",i||"");D!==M.getModel()&&M.setModel(D)}},[i],R),K(()=>{let M=x.current.getModifiedEditor();M.getOption(g.current.editor.EditorOption.readOnly)?M.setValue(t||""):t!==M.getValue()&&(M.executeEdits("",[{range:M.getModel().getFullModelRange(),text:t||"",forceMoveMarkers:!0}]),M.pushUndoStop())},[t],R),K(()=>{x.current?.getModel()?.original.setValue(e||"")},[e],R),K(()=>{let{original:M,modified:D}=x.current.getModel();g.current.editor.setModelLanguage(M,r||n||"text"),g.current.editor.setModelLanguage(D,o||n||"text")},[n,r,o],R),K(()=>{g.current?.editor.setTheme(p)},[p],R),K(()=>{x.current?.updateOptions(u)},[u],R);let j=f.useCallback(()=>{if(!g.current)return;m.current(g.current);let M=ve(g.current,e||"",r||n||"text",a||""),D=ve(g.current,t||"",o||n||"text",i||"");x.current?.setModel({original:M,modified:D})},[n,t,o,e,r,a,i]),W=f.useCallback(()=>{!E.current&&X.current&&(x.current=g.current.editor.createDiffEditor(X.current,{automaticLayout:!0,...u}),j(),g.current?.editor.setTheme(p),z(!0),E.current=!0)},[u,p,j]);f.useEffect(()=>{R&&N.current(x.current,g.current)},[R]),f.useEffect(()=>{!B&&!R&&W()},[B,R,W]);function $(){let M=x.current?.getModel();s||M?.original?.dispose(),l||M?.modified?.dispose(),x.current?.dispose()}return xe.createElement(en,{width:h,height:c,isEditorReady:R,loading:y,_ref:X,className:b,wrapperProps:L})}var $r=Nr;f.memo($r);function Hr(e){let t=f.useRef();return f.useEffect(()=>{t.current=e},[e]),t.current}var Gr=Hr,Ne=new Map;function Xr({defaultValue:e,defaultLanguage:t,defaultPath:n,value:r,language:o,path:a,theme:i="light",line:s,loading:l="Loading...",options:p={},overrideServices:y={},saveViewState:u=!0,keepCurrentModel:c=!1,width:h="100%",height:b="100%",className:L,wrapperProps:I={},beforeMount:v=Te,onMount:R=Te,onChange:z,onValidate:B=Te}){let[S,x]=f.useState(!1),[g,X]=f.useState(!0),N=f.useRef(null),m=f.useRef(null),E=f.useRef(null),j=f.useRef(R),W=f.useRef(v),$=f.useRef(),M=f.useRef(r),D=Gr(a),fe=f.useRef(!1),J=f.useRef(!1);tn(()=>{let Y=Qt.init();return Y.then(U=>(N.current=U)&&X(!1)).catch(U=>U?.type!=="cancelation"&&console.error("Monaco initialization: error:",U)),()=>m.current?ge():Y.cancel()}),K(()=>{let Y=ve(N.current,e||r||"",t||o||"",a||n||"");Y!==m.current?.getModel()&&(u&&Ne.set(D,m.current?.saveViewState()),m.current?.setModel(Y),u&&m.current?.restoreViewState(Ne.get(a)))},[a],S),K(()=>{m.current?.updateOptions(p)},[p],S),K(()=>{!m.current||r===void 0||(m.current.getOption(N.current.editor.EditorOption.readOnly)?m.current.setValue(r):r!==m.current.getValue()&&(J.current=!0,m.current.executeEdits("",[{range:m.current.getModel().getFullModelRange(),text:r,forceMoveMarkers:!0}]),m.current.pushUndoStop(),J.current=!1))},[r],S),K(()=>{let Y=m.current?.getModel();Y&&o&&N.current?.editor.setModelLanguage(Y,o)},[o],S),K(()=>{s!==void 0&&m.current?.revealLine(s)},[s],S),K(()=>{N.current?.editor.setTheme(i)},[i],S);let pe=f.useCallback(()=>{if(!(!E.current||!N.current)&&!fe.current){W.current(N.current);let Y=a||n,U=ve(N.current,r||e||"",t||o||"",Y||"");m.current=N.current?.editor.create(E.current,{model:U,automaticLayout:!0,...p},y),u&&m.current.restoreViewState(Ne.get(Y)),N.current.editor.setTheme(i),s!==void 0&&m.current.revealLine(s),x(!0),fe.current=!0}},[e,t,n,r,o,a,p,y,u,i,s]);f.useEffect(()=>{S&&j.current(m.current,N.current)},[S]),f.useEffect(()=>{!g&&!S&&pe()},[g,S,pe]),M.current=r,f.useEffect(()=>{S&&z&&($.current?.dispose(),$.current=m.current?.onDidChangeModelContent(Y=>{J.current||z(m.current.getValue(),Y)}))},[S,z]),f.useEffect(()=>{if(S){let Y=N.current.editor.onDidChangeMarkers(U=>{let d=m.current.getModel()?.uri;if(d&&U.find(w=>w.path===d.path)){let w=N.current.editor.getModelMarkers({resource:d});B?.(w)}});return()=>{Y?.dispose()}}return()=>{}},[S,B]);function ge(){$.current?.dispose(),c?u&&Ne.set(a,m.current.saveViewState()):m.current.getModel()?.dispose(),m.current.dispose()}return xe.createElement(en,{width:h,height:b,isEditorReady:S,loading:l,_ref:E,className:L,wrapperProps:I})}var Yr=Xr,_r=f.memo(Yr),Wr=_r;const Vr=`
interface VecLike {
  x: number
  y: number
  z?: number
}

interface TLCamera {
  id: string
  x: number
  y: number
  z: number
}

interface TLCameraMoveOptions {
  animation?: {
    duration?: number
    easing?: (t: number) => number
  }
  force?: boolean
  immediate?: boolean
}

interface TLShapeId extends String {
  __brand: 'TLShapeId'
}

interface TLBindingId extends String {
  __brand: 'TLBindingId'
}

interface TLShape {
  id: TLShapeId
  type: string
  x: number
  y: number
  rotation: number
  props: Record<string, unknown>
  meta: Record<string, unknown>
}

interface TLBinding {
  id: TLBindingId
  type: string
  fromId: TLShapeId
  toId: TLShapeId
  props: Record<string, unknown>
  meta: Record<string, unknown>
}

interface TLBindingCreate<T = TLBinding> {
  id?: TLBindingId
  type: string
  fromId: TLShapeId
  toId: TLShapeId
  props?: Record<string, unknown>
  meta?: Record<string, unknown>
}

interface TLBindingUpdate<T = TLBinding> {
  id: TLBindingId
  type: string
  props?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/** Valid colors: 'black' | 'blue' | 'green' | 'grey' | 'light-blue' | 'light-green' | 'light-red' | 'light-violet' | 'orange' | 'red' | 'violet' | 'white' | 'yellow' */
type GeoColor = string
/** Valid fills: 'none' | 'semi' | 'solid' | 'pattern' */
type GeoFill = string
/** Valid sizes: 's' | 'm' | 'l' | 'xl' */
type GeoSize = string
/** Valid fonts: 'draw' | 'sans' | 'serif' | 'mono' */
type GeoFont = string
/** Valid geo types: 'cloud' | 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'rhombus' | 'oval' | 'trapezoid' | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'x-box' | 'check-box' | 'heart' */
type GeoType = string

interface ShapeOptions {
  /** Shape color: 'black' | 'blue' | 'green' | 'grey' | 'light-blue' | 'light-green' | 'light-red' | 'light-violet' | 'orange' | 'red' | 'violet' | 'white' | 'yellow' */
  color?: GeoColor
  /** Fill style: 'none' | 'semi' | 'solid' | 'pattern' */
  fill?: GeoFill
  /** Size: 's' | 'm' | 'l' | 'xl' */
  size?: GeoSize
  /** Font family: 'draw' | 'sans' | 'serif' | 'mono' */
  font?: GeoFont
  /** Geo type: 'cloud' | 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'rhombus' | 'oval' | 'trapezoid' | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'x-box' | 'check-box' | 'heart' */
  geo?: GeoType
}

/**
 * The curated API for creating and managing shapes.
 * All shapes created via this API are automatically marked as generated.
 */
interface EditorAPI {
  /**
   * Create a rectangle shape.
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param w - Width
   * @param h - Height
   * @param options - Additional shape properties
   * @returns The created shape ID
   * @example
   * canvas.createRect(100, 100, 200, 150, { color: 'blue', fill: 'solid' })
   */
  createRect(x: number, y: number, w: number, h: number, options?: ShapeOptions): TLShapeId

  /**
   * Create a circle (ellipse) shape.
   * @param x - X coordinate of center
   * @param y - Y coordinate of center
   * @param radius - Radius of the circle
   * @param options - Additional shape properties
   * @returns The created shape ID
   * @example
   * canvas.createCircle(300, 200, 50, { color: 'red', fill: 'semi' })
   */
  createCircle(x: number, y: number, radius: number, options?: ShapeOptions): TLShapeId

  /**
   * Create a text shape.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param text - Text content
   * @param options - Additional shape properties
   * @returns The created shape ID
   * @example
   * canvas.createText(100, 100, 'Hello World!', { color: 'violet', size: 'xl' })
   */
  createText(x: number, y: number, text: string, options?: ShapeOptions): TLShapeId

  /**
   * Create an arrow shape between two points.
   * @param fromX - Starting X coordinate
   * @param fromY - Starting Y coordinate
   * @param toX - Ending X coordinate
   * @param toY - Ending Y coordinate
   * @param options - Additional shape properties
   * @returns The created shape ID
   * @example
   * canvas.createArrow(100, 100, 300, 200, { color: 'blue' })
   */
  createArrow(fromX: number, fromY: number, toX: number, toY: number, options?: ShapeOptions): TLShapeId

  /**
   * Create a cubic bezier curve shape with interactive handles.
   * @param x - X coordinate of the shape origin
   * @param y - Y coordinate of the shape origin
   * @param options - Control points for the curve (start, cp1, cp2, end relative to origin)
   * @returns The created shape ID
   * @example
   * canvas.createBezier(100, 100, {
   *   start: { x: 0, y: 0 },
   *   cp1: { x: 100, y: 0 },
   *   cp2: { x: 0, y: 200 },
   *   end: { x: 100, y: 200 }
   * })
   */
  createBezier(x: number, y: number, options?: { start?: VecLike; cp1?: VecLike; cp2?: VecLike; end?: VecLike }): TLShapeId

  /** Create a freehand dot shape */
  createDot(x: number, y: number, options?: ShapeOptions): TLShapeId

  /** Create a generic geo shape with any geo type */
  createGeo(x: number, y: number, w: number, h: number, options?: ShapeOptions): TLShapeId

  /** Create a watercolor stroke from an array of points */
  createWatercolor(points: VecLike[], options?: { color?: string; size?: string; style?: string }): TLShapeId

  /** Delete a shape by ID */
  deleteShape(id: TLShapeId): void

  /** Delete multiple shapes by ID */
  deleteShapes(ids: TLShapeId[]): void

  /** Update multiple shapes at once */
  updateShapes(shapes: Array<{
    id: TLShapeId
    type: string
    x?: number
    y?: number
    opacity?: number
    props?: Record<string, unknown>
  }>): void

  /** Lock canvas interaction */
  lockInteraction(): void

  /**
   * Clear all generated shapes from the canvas.
   * Hand-drawn shapes are preserved.
   */
  clear(): void

  /**
   * Get all shapes on the current page.
   * @returns Array of all shapes
   */
  getAllShapes(): TLShape[]

  /**
   * Get only the generated shapes (created via the API).
   * @returns Array of generated shapes
   */
  getGeneratedShapes(): TLShape[]

  /**
   * Get the current camera position and zoom level.
   * @returns The current camera state
   */
  getCamera(): TLCamera

  /**
   * Set the camera position and zoom level.
   * @param point - The new camera position (x, y) and optional zoom (z)
   * @param options - Optional camera move options
   * @example
   * canvas.setCamera({ x: 0, y: 0, z: 1 })
   * canvas.setCamera({ x: 100, y: 200 }, { animation: { duration: 500 } })
   */
  setCamera(point: VecLike, options?: TLCameraMoveOptions): void

  /**
   * Center the camera on a point in page space.
   * @param point - The point to center on
   * @param options - Optional camera move options
   * @example
   * canvas.centerOnPoint({ x: 100, y: 100 })
   */
  centerOnPoint(point: VecLike, options?: TLCameraMoveOptions): void

  /**
   * Zoom the camera in.
   * @param point - Optional screen point to zoom on
   * @param options - Optional camera move options
   */
  zoomIn(point?: VecLike, options?: TLCameraMoveOptions): void

  /**
   * Zoom the camera out.
   * @param point - Optional screen point to zoom on
   * @param options - Optional camera move options
   */
  zoomOut(point?: VecLike, options?: TLCameraMoveOptions): void

  /**
   * Zoom to fit all content on the current page.
   * @param options - Optional camera move options
   */
  zoomToFit(options?: TLCameraMoveOptions): void

  /**
   * Zoom to fit the current selection.
   * @param options - Optional camera move options
   */
  zoomToSelection(options?: TLCameraMoveOptions): void

  /**
   * Reset the zoom level to 100%.
   * @param point - Optional screen point to zoom on
   * @param options - Optional camera move options
   */
  resetZoom(point?: VecLike, options?: TLCameraMoveOptions): void

  /**
   * Get all bindings on the current page.
   * @returns Array of all bindings
   */
  getAllBindings(): TLBinding[]

  /**
   * Get bindings from a specific shape (where the shape is the source).
   * @param shape - The shape or shape ID
   * @param type - Optional binding type to filter by
   */
  getBindingsFromShape<T extends TLBinding = TLBinding>(shape: TLShape | TLShapeId, type?: string): T[]

  /**
   * Get bindings to a specific shape (where the shape is the target).
   * @param shape - The shape or shape ID
   * @param type - Optional binding type to filter by
   */
  getBindingsToShape<T extends TLBinding = TLBinding>(shape: TLShape | TLShapeId, type?: string): T[]

  /**
   * Get all bindings involving a specific shape.
   * @param shape - The shape or shape ID
   * @param type - Optional binding type to filter by
   */
  getBindingsInvolvingShape<T extends TLBinding = TLBinding>(shape: TLShape | TLShapeId, type?: string): T[]

  /**
   * Create a binding between two shapes.
   * @param partial - Binding data
   * @returns The created binding
   */
  createBinding<T extends TLBinding = TLBinding>(partial: TLBindingCreate<T>): T | undefined

  /**
   * Create multiple bindings at once.
   * @param partials - Array of binding data
   */
  createBindings<T extends TLBinding = TLBinding>(partials: TLBindingCreate<T>[]): void

  /**
   * Update a binding.
   * @param partial - Binding update data
   */
  updateBinding<T extends TLBinding = TLBinding>(partial: TLBindingUpdate<T>): void

  /**
   * Update multiple bindings at once.
   * @param partials - Array of binding updates
   */
  updateBindings<T extends TLBinding = TLBinding>(partials: TLBindingUpdate<T>[]): void

  /**
   * Delete a binding.
   * @param binding - The binding or binding ID to delete
   * @param options - Optional deletion options
   */
  deleteBinding(binding: TLBinding | TLBindingId, options?: { isolateShapes?: boolean }): void

  /**
   * Delete multiple bindings at once.
   * @param bindings - Array of bindings or binding IDs
   * @param options - Optional deletion options
   */
  deleteBindings(bindings: (TLBinding | TLBindingId)[], options?: { isolateShapes?: boolean }): void
}

/**
 * The tldraw Editor instance.
 * Provides full access to the canvas state and operations.
 */
interface Editor {
  /** Run a function within a single transaction */
  run<T>(fn: () => T): T

  /** Create shapes on the canvas */
  createShapes(shapes: Array<{
    id?: TLShapeId
    type: string
    x: number
    y: number
    rotation?: number
    props?: Record<string, unknown>
    meta?: Record<string, unknown>
  }>): void

  /** Update existing shapes */
  updateShapes(shapes: Array<{
    id: TLShapeId
    type: string
    x?: number
    y?: number
    rotation?: number
    props?: Record<string, unknown>
    meta?: Record<string, unknown>
  }>): void

  /** Delete shapes by ID */
  deleteShapes(ids: TLShapeId[]): void

  /** Get all shapes on the current page */
  getCurrentPageShapes(): TLShape[]

  /** Get a shape by ID */
  getShape(id: TLShapeId): TLShape | undefined

  /** Get the current camera */
  getCamera(): TLCamera

  /** Set the camera position */
  setCamera(point: VecLike, options?: TLCameraMoveOptions): void

  /** Center the camera on a point */
  centerOnPoint(point: VecLike, options?: TLCameraMoveOptions): void

  /** Zoom in */
  zoomIn(point?: VecLike, options?: TLCameraMoveOptions): void

  /** Zoom out */
  zoomOut(point?: VecLike, options?: TLCameraMoveOptions): void

  /** Zoom to fit all content */
  zoomToFit(options?: TLCameraMoveOptions): void

  /** Zoom to fit selection */
  zoomToSelection(options?: TLCameraMoveOptions): void

  /** Reset zoom to 100% */
  resetZoom(point?: VecLike, options?: TLCameraMoveOptions): void

  /** Select shapes by ID */
  select(...ids: TLShapeId[]): void

  /** Select all shapes */
  selectAll(): void

  /** Deselect all shapes */
  selectNone(): void

  /** Get selected shape IDs */
  getSelectedShapeIds(): TLShapeId[]

  /** Get selected shapes */
  getSelectedShapes(): TLShape[]

  /** Set a shape as the editing shape (shows handles for bezier curves) */
  setEditingShape(id: TLShapeId | null): void

  /** Get the currently editing shape ID */
  getEditingShapeId(): TLShapeId | null

  /** Create a binding */
  createBinding(partial: TLBindingCreate): void

  /** Create multiple bindings */
  createBindings(partials: TLBindingCreate[]): void

  /** Update a binding */
  updateBinding(partial: TLBindingUpdate): void

  /** Update multiple bindings */
  updateBindings(partials: TLBindingUpdate[]): void

  /** Delete a binding */
  deleteBinding(binding: TLBinding | TLBindingId, options?: { isolateShapes?: boolean }): void

  /** Delete multiple bindings */
  deleteBindings(bindings: (TLBinding | TLBindingId)[], options?: { isolateShapes?: boolean }): void

  /** Get bindings involving a shape */
  getBindingsInvolvingShape(shape: TLShape | TLShapeId, type?: string): TLBinding[]

  /** Get bindings from a shape */
  getBindingsFromShape(shape: TLShape | TLShapeId, type?: string): TLBinding[]

  /** Get bindings to a shape */
  getBindingsToShape(shape: TLShape | TLShapeId, type?: string): TLBinding[]
}

/** The curated API for creating shapes and controlling the canvas */
declare const canvas: EditorAPI

/** The full tldraw Editor instance */
declare const editor: Editor

/**
 * Schedule a function to run repeatedly at a fixed interval.
 * Intervals are automatically cleared when switching examples or clearing.
 * @param callback - Function to call at each interval
 * @param delay - Interval in milliseconds
 * @returns Timer ID that can be passed to clearInterval
 */
declare function setInterval(callback: () => void, delay?: number): number

/**
 * Schedule a function to run once after a delay.
 * Timeouts are automatically cleared when switching examples or clearing.
 * @param callback - Function to call after the delay
 * @param delay - Delay in milliseconds
 * @returns Timer ID that can be passed to clearTimeout
 */
declare function setTimeout(callback: () => void, delay?: number): number

/**
 * Cancel a repeating interval previously created with setInterval.
 * @param id - Timer ID returned by setInterval
 */
declare function clearInterval(id: number): void

/**
 * Cancel a timeout previously created with setTimeout.
 * @param id - Timer ID returned by setTimeout
 */
declare function clearTimeout(id: number): void
`,Fr="Flower",Ur=`const colors = ['blue', 'violet', 'red', 'orange', 'green', 'light-blue']
const centerX = 400
const centerY = 300
const petalCount = 7
const petalIds = []

function createPetals(rotationOffset, jStart, jEnd) {
  petalIds.forEach(id => canvas.deleteShape(id))
  petalIds.length = 0

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 + rotationOffset
    const points = []

    for (let j = jStart; j <= jEnd; j++) {
      const t = j / 30
      const r = Math.sin(t * Math.PI) * 80
      const x = centerX + Math.cos(angle) * t * 100 + Math.cos(angle + Math.PI/2) * r * 0.3
      const y = centerY + Math.sin(angle) * t * 100 + Math.sin(angle + Math.PI/2) * r * 0.3
      points.push({ x, y })
    }

    const id = canvas.createWatercolor(points, {
      color: colors[i % colors.length],
      style: 'soft',
      size: 'm'
    })
    petalIds.push(id)
  }
}

createPetals(0, 0, 30)
canvas.zoomToFit()

let rotation = 0
let time = 0
const interval = setInterval(() => {
  rotation += 0.03
  time += 0.08

  const jStart = Math.floor(Math.sin(time) * 10 + 10)
  const jEnd = Math.floor(30 - Math.sin(time * 0.7) * 8)

  createPetals(rotation, jStart, jEnd)
}, 50)`,qr="Clock",Kr=`const cx = 400, cy = 300, radius = 150
const padding = 100

canvas.createCircle(cx, cy, radius, {
  color: 'black',
  fill: 'none',
  size: 'xl',
  dash: 'solid'
})
canvas.createCircle(cx, cy, radius - 5, {
  color: 'light-blue',
  fill: 'solid',
  dash: 'solid'
})

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
  const inner = radius - 30
  const outer = radius - 15
  canvas.createArrow(
    cx + Math.cos(angle) * inner,
    cy + Math.sin(angle) * inner,
    cx + Math.cos(angle) * outer,
    cy + Math.sin(angle) * outer,
    { color: 'black', arrowheadStart: 'none', arrowheadEnd: 'none', size: 'l' }
  )
}

const hourHand = canvas.createArrow(cx, cy, cx, cy - 60, {
  color: 'black', size: 'xl',
  arrowheadStart: 'none', arrowheadEnd: 'none'
})
const minuteHand = canvas.createArrow(cx, cy, cx, cy - 100, {
  color: 'black', size: 'l',
  arrowheadStart: 'none', arrowheadEnd: 'none'
})
const secondHand = canvas.createArrow(cx, cy, cx, cy - 110, {
  color: 'red', size: 'm',
  arrowheadStart: 'none', arrowheadEnd: 'none'
})

canvas.createCircle(cx, cy, 8, { color: 'black', fill: 'solid' })

const updateClock = () => {
  const now = new Date()
  const seconds = now.getSeconds()
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2
  const minAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2
  const hourAngle = (hours / 12) * Math.PI * 2 - Math.PI / 2

  canvas.updateShapes([
    { id: secondHand, type: 'arrow', props: {
      end: { x: Math.cos(secAngle) * 110, y: Math.sin(secAngle) * 110 }
    }},
    { id: minuteHand, type: 'arrow', props: {
      end: { x: Math.cos(minAngle) * 100, y: Math.sin(minAngle) * 100 }
    }},
    { id: hourHand, type: 'arrow', props: {
      end: { x: Math.cos(hourAngle) * 60, y: Math.sin(hourAngle) * 60 }
    }}
  ])
}

updateClock()
setInterval(updateClock, 1000)

// Invisible bounding box to control zoom level
canvas.createRect(cx - radius - padding, cy - radius - padding, (radius + padding) * 2, (radius + padding) * 2, { opacity: 0 })

canvas.zoomToFit({ animation: { duration: 400 } })`,Zr="Pool",Jr=`const tableX = 50, tableY = 80
const tableW = 700, tableH = 350
const ballRadius = 10
const pocketRadius = 20
const friction = 0.988
const collisionBoost = 1.1
const cueStartX = tableX + tableW * 0.25
const cueStartY = tableY + tableH / 2
const trailLen = 5

canvas.createRect(tableX - 15, tableY - 15, tableW + 30, tableH + 30, { color: 'black', fill: 'solid' })
canvas.createRect(tableX, tableY, tableW, tableH, { color: 'green', fill: 'solid' })

const pockets = [
  { x: tableX + 15, y: tableY + 15 },
  { x: tableX + tableW/2, y: tableY + 10 },
  { x: tableX + tableW - 15, y: tableY + 15 },
  { x: tableX + 15, y: tableY + tableH - 15 },
  { x: tableX + tableW/2, y: tableY + tableH - 10 },
  { x: tableX + tableW - 15, y: tableY + tableH - 15 },
]

pockets.forEach(p => {
  canvas.createGeo(p.x - pocketRadius, p.y - pocketRadius, pocketRadius * 2, pocketRadius * 2, {
    geo: 'ellipse', color: 'black', fill: 'solid'
  })
})

const ballColors = [
  'white',
  'yellow', 'blue', 'red', 'violet', 'orange', 'green', 'light-red',
  'black',
  'yellow', 'blue', 'red', 'violet', 'orange', 'green', 'light-red'
]

const rackX = tableX + tableW * 0.72
const rackY = tableY + tableH / 2
const balls = []

balls.push({ x: cueStartX, y: cueStartY, vx: 0, vy: 0, sunk: false, trail: [] })

const spacing = ballRadius * 2.2
for (let row = 0; row < 5; row++) {
  for (let col = 0; col <= row; col++) {
    const x = rackX + row * spacing * 0.866
    const y = rackY + (col - row/2) * spacing
    balls.push({ x, y, vx: 0, vy: 0, sunk: false, trail: [] })
  }
}

const ballIds = balls.map((b, i) =>
  canvas.createGeo(b.x - ballRadius, b.y - ballRadius, ballRadius * 2, ballRadius * 2, {
    geo: 'ellipse', color: ballColors[i], fill: 'solid'
  })
)

const trailIds = []
for (let i = 1; i < balls.length; i++) {
  const ballTrailIds = []
  for (let j = 0; j < trailLen; j++) {
    ballTrailIds.push(canvas.createGeo(0, 0, 8, 8, { geo: 'ellipse', color: ballColors[i], fill: 'solid' }))
  }
  trailIds.push(ballTrailIds)
}

const aimLineId = canvas.createArrow(0, 0, 100, 0, { color: 'grey', arrowheadStart: 'none', arrowheadEnd: 'triangle' })
canvas.updateShapes([{ id: aimLineId, type: 'arrow', opacity: 0 }])

const particles = []
const particleIds = []
for (let i = 0; i < 20; i++) {
  particleIds.push(canvas.createGeo(0, 0, 6, 6, { geo: 'star', color: 'yellow', fill: 'solid' }))
  particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0 })
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const p = particles[i]
    p.x = x
    p.y = y
    p.vx = (Math.random() - 0.5) * 8
    p.vy = (Math.random() - 0.5) * 8
    p.life = 30
    p.color = color
  }
}

let aiming = false
let mouseX = 0, mouseY = 0

const canvasEl = document.querySelector('.tl-canvas')

canvasEl?.addEventListener('mousedown', (e) => {
  e.stopPropagation()
  e.preventDefault()
  const rect = canvasEl.getBoundingClientRect()
  const camera = canvas.getCamera()
  mouseX = (e.clientX - rect.left) / camera.z - camera.x
  mouseY = (e.clientY - rect.top) / camera.z - camera.y

  const cue = balls[0]
  const allStopped = balls.every(b => b.sunk || (Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.1))
  if (!cue.sunk && allStopped) aiming = true
})

canvasEl?.addEventListener('mousemove', (e) => {
  const rect = canvasEl.getBoundingClientRect()
  const camera = canvas.getCamera()
  mouseX = (e.clientX - rect.left) / camera.z - camera.x
  mouseY = (e.clientY - rect.top) / camera.z - camera.y
})

canvasEl?.addEventListener('mouseup', (e) => {
  if (aiming) {
    const cue = balls[0]
    const dx = cue.x - mouseX
    const dy = cue.y - mouseY
    const dist = Math.sqrt(dx*dx + dy*dy)
    const power = Math.min(dist * 0.12, 15)

    if (power > 0.5) {
      cue.vx = (dx / dist) * power
      cue.vy = (dy / dist) * power
    }
    aiming = false
    canvas.updateShapes([{ id: aimLineId, type: 'arrow', opacity: 0 }])
  }
})

const interval = setInterval(() => {
  const cue = balls[0]

  if (aiming && !cue.sunk) {
    const dx = cue.x - mouseX
    const dy = cue.y - mouseY
    const dist = Math.sqrt(dx*dx + dy*dy)
    const lineLen = Math.min(dist * 0.8, 150)

    if (dist > 5) {
      canvas.updateShapes([{
        id: aimLineId, type: 'arrow',
        x: cue.x, y: cue.y, opacity: 0.8,
        props: { start: { x: 0, y: 0 }, end: { x: (dx/dist) * lineLen, y: (dy/dist) * lineLen } }
      }])
    }
  }

  const allStopped = balls.every(b => b.sunk || (Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.1))

  if (cue.sunk && allStopped) {
    cue.sunk = false
    cue.x = cueStartX
    cue.y = cueStartY
    cue.vx = 0
    cue.vy = 0
  }

  balls.forEach((b, idx) => {
    if (b.sunk) return

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
    if (idx > 0 && speed > 3) {
      b.trail.unshift({ x: b.x, y: b.y })
      if (b.trail.length > trailLen) b.trail.pop()
    } else if (idx > 0) {
      b.trail = []
    }

    b.x += b.vx
    b.y += b.vy
    b.vx *= friction
    b.vy *= friction

    if (Math.abs(b.vx) < 0.05) b.vx = 0
    if (Math.abs(b.vy) < 0.05) b.vy = 0

    for (const p of pockets) {
      const dx = b.x - p.x
      const dy = b.y - p.y
      if (Math.sqrt(dx*dx + dy*dy) < pocketRadius + ballRadius * 0.5) {
        b.sunk = true
        b.vx = 0
        b.vy = 0
        b.trail = []
        if (idx > 0) {
          spawnParticles(p.x, p.y, ballColors[idx])
        }
        return
      }
    }

    const minX = tableX + ballRadius + 5
    const maxX = tableX + tableW - ballRadius - 5
    const minY = tableY + ballRadius + 5
    const maxY = tableY + tableH - ballRadius - 5

    if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * 0.85 }
    if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * 0.85 }
    if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy) * 0.85 }
    if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy) * 0.85 }
  })

  for (let i = 0; i < balls.length; i++) {
    if (balls[i].sunk) continue
    for (let j = i + 1; j < balls.length; j++) {
      if (balls[j].sunk) continue
      const a = balls[i], b = balls[j]
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      const minDist = ballRadius * 2

      if (dist < minDist && dist > 0.1) {
        const nx = dx/dist, ny = dy/dist
        const dvx = a.vx - b.vx, dvy = a.vy - b.vy
        const dvn = dvx*nx + dvy*ny

        if (dvn > 0) {
          a.vx -= dvn * nx * collisionBoost
          a.vy -= dvn * ny * collisionBoost
          b.vx += dvn * nx * collisionBoost
          b.vy += dvn * ny * collisionBoost
        }

        const overlap = (minDist - dist) / 2 + 0.5
        a.x -= overlap * nx
        a.y -= overlap * ny
        b.x += overlap * nx
        b.y += overlap * ny
      }
    }
  }

  particles.forEach((p, i) => {
    if (p.life > 0) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.3
      p.life--
    }
  })

  const updates = balls.map((b, i) => ({
    id: ballIds[i], type: 'geo',
    x: b.sunk ? -100 : b.x - ballRadius,
    y: b.sunk ? -100 : b.y - ballRadius,
    opacity: b.sunk ? 0 : 1
  }))

  for (let i = 1; i < balls.length; i++) {
    const b = balls[i]
    for (let j = 0; j < trailLen; j++) {
      const t = b.trail[j]
      const size = 4 - j * 0.5
      updates.push({
        id: trailIds[i-1][j], type: 'geo',
        x: t ? t.x - size : -100,
        y: t ? t.y - size : -100,
        props: { w: size * 2, h: size * 2 },
        opacity: t ? 0.3 - j * 0.05 : 0
      })
    }
  }

  particles.forEach((p, i) => {
    updates.push({
      id: particleIds[i], type: 'geo',
      x: p.x - 3, y: p.y - 3,
      props: { color: p.color || 'yellow' },
      opacity: p.life > 0 ? p.life / 30 : 0
    })
  })

  canvas.updateShapes(updates)
}, 16)

canvas.zoomToFit({ animation: { duration: 400 } })
canvas.lockInteraction()`,Qr="Life",eo=`const cols = 20, rows = 15
const cellSize = 18
const startX = 150, startY = 100

let grid = []
for (let y = 0; y < rows; y++) {
  grid[y] = []
  for (let x = 0; x < cols; x++) {
    grid[y][x] = Math.random() > 0.65 ? 1 : 0
  }
}

const cellIds = []
for (let y = 0; y < rows; y++) {
  cellIds[y] = []
  for (let x = 0; x < cols; x++) {
    const id = canvas.createDot(
      startX + x * cellSize,
      startY + y * cellSize,
      { color: 'blue', size: 'l' }
    )
    cellIds[y][x] = id
  }
}

function countNeighbors(g, x, y) {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const ny = (y + dy + rows) % rows
      const nx = (x + dx + cols) % cols
      count += g[ny][nx]
    }
  }
  return count
}

function nextGen() {
  const next = []
  for (let y = 0; y < rows; y++) {
    next[y] = []
    for (let x = 0; x < cols; x++) {
      const neighbors = countNeighbors(grid, x, y)
      const alive = grid[y][x]

      if (alive && (neighbors === 2 || neighbors === 3)) {
        next[y][x] = 1
      } else if (!alive && neighbors === 3) {
        next[y][x] = 1
      } else {
        next[y][x] = 0
      }
    }
  }
  return next
}

const colors = ['light-blue', 'blue', 'violet', 'green']
let generation = 0

const interval = setInterval(() => {
  generation++
  grid = nextGen()

  const updates = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const alive = grid[y][x]
      updates.push({
        id: cellIds[y][x],
        type: 'draw',
        props: {
          color: colors[generation % colors.length]
        },
        opacity: alive ? 1 : 0.05
      })
    }
  }
  canvas.updateShapes(updates)
}, 150)

canvas.zoomToFit({ animation: { duration: 400 } })`,to="Sphere",no=`const cx = 400, cy = 300
const scale3d = 200
const cameraZ = 2
const padding = 150

function project({ x, y, z }) {
  return { x: x / z, y: y / z }
}

function rotateX({ x, y, z }, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return { x, y: y*c - z*s, z: y*s + z*c }
}

function rotateY({ x, y, z }, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: x*c + z*s, y, z: -x*s + z*c }
}

const minFactor = 1.62, maxFactor = 2.0

const numPoints = 160
const goldenRatio = (1 + Math.sqrt(5)) / 2

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet']
const sizes = ['s', 'm', 'l', 'xl']
const shapeIds = []
for (let i = 0; i < numPoints; i++) {
  shapeIds.push(canvas.createDot(cx, cy, {
    color: colors[i % 6],
    size: sizes[i % 4]
  }))
}

let time = 0
let angleX = 0, angleY = 0

const interval = setInterval(() => {
  time += 0.009
  angleX += 0.012
  angleY += 0.015

  const t = (1 - Math.cos(time * 0.5)) / 2
  const spiralFactor = minFactor + t * (maxFactor - minFactor)

  const points = []
  for (let i = 0; i < numPoints; i++) {
    const theta = spiralFactor * Math.PI * i / goldenRatio
    const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints)
    points.push({
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
      idx: i
    })
  }

  const breathe = 1 + 0.1 * Math.sin(time * 1.5)

  const updates = shapeIds.map((id, i) => {
    const pt = points[i]

    const wobbleX = Math.sin(time * 2 + pt.idx * 0.5) * 0.03
    const wobbleY = Math.cos(time * 1.7 + pt.idx * 0.3) * 0.03

    let p = {
      x: (pt.x + wobbleX) * breathe,
      y: (pt.y + wobbleY) * breathe,
      z: pt.z * breathe
    }

    p = rotateX(p, angleX)
    p = rotateY(p, angleY)

    const z = p.z + cameraZ
    const proj = project({ x: p.x, y: p.y, z })
    const screenX = cx + proj.x * scale3d
    const screenY = cy - proj.y * scale3d

    const depth = 1 - (p.z / breathe + 1) / 2

    const dotScale = 0.5 + depth * 1.5

    const colorIdx = Math.floor(time * 0.5 + pt.idx * 0.1) % 6

    return {
      id,
      type: 'draw',
      x: screenX,
      y: screenY,
      props: { color: colors[colorIdx], scale: dotScale },
      opacity: Math.min(1, Math.max(0, 0.3 + depth * 0.7))
    }
  })

  canvas.updateShapes(updates)
}, 50)

// Invisible bounding box to control zoom level
canvas.createRect(cx - scale3d - padding, cy - scale3d - padding, (scale3d + padding) * 2, (scale3d + padding) * 2, { opacity: 0 })


canvas.zoomToFit({ animation: { duration: 400 } })`,it=[{name:Fr,code:Ur},{name:qr,code:Kr},{name:Zr,code:Jr},{name:Qr,code:eo},{name:to,code:no}],ro=Object.fromEntries(it.map(e=>[e.name,e.code])),oo=it[0]?.code??"",ao=["Flower","Clock","Pool","Life","Sphere"];function io({onLoadExample:e,selectedExample:t}){const n=ao.map(r=>it.find(o=>o.name===r)).filter(Boolean);return k.jsx("div",{className:"examples-sidebar",children:k.jsx("div",{className:"examples-sidebar-content",children:n.map(r=>k.jsx("button",{className:`examples-item ${r.name===t?"selected":""}`,onClick:()=>e(r.name,r.code),children:r.name},r.name))})})}const so={base:"vs",inherit:!1,rules:[{token:"",foreground:"5c6166",background:"fafafa"},{token:"comment",foreground:"787b80",fontStyle:"italic"},{token:"comment.js",foreground:"787b80",fontStyle:"italic"},{token:"comment.line",foreground:"787b80",fontStyle:"italic"},{token:"comment.block",foreground:"787b80",fontStyle:"italic"},{token:"string",foreground:"86b300"},{token:"string.js",foreground:"86b300"},{token:"string.quoted",foreground:"86b300"},{token:"string.template",foreground:"86b300"},{token:"number",foreground:"a37acc"},{token:"number.js",foreground:"a37acc"},{token:"constant.numeric",foreground:"a37acc"},{token:"keyword",foreground:"fa8d3e"},{token:"keyword.js",foreground:"fa8d3e"},{token:"keyword.control",foreground:"fa8d3e"},{token:"keyword.operator",foreground:"ed9366"},{token:"keyword.other",foreground:"fa8d3e"},{token:"storage",foreground:"fa8d3e"},{token:"storage.type",foreground:"fa8d3e"},{token:"operator",foreground:"ed9366"},{token:"delimiter",foreground:"5c616680"},{token:"delimiter.bracket",foreground:"5c616680"},{token:"delimiter.parenthesis",foreground:"5c616680"},{token:"entity.name.function",foreground:"f2ae49"},{token:"support.function",foreground:"f2ae49"},{token:"function",foreground:"f2ae49"},{token:"identifier.js",foreground:"5c6166"},{token:"variable",foreground:"5c6166"},{token:"variable.parameter",foreground:"a37acc"},{token:"variable.other",foreground:"5c6166"},{token:"identifier",foreground:"5c6166"},{token:"constant",foreground:"a37acc"},{token:"constant.language",foreground:"a37acc"},{token:"constant.language.boolean",foreground:"a37acc"},{token:"constant.language.null",foreground:"a37acc"},{token:"constant.language.undefined",foreground:"a37acc"},{token:"type",foreground:"399ee6"},{token:"type.identifier",foreground:"399ee6"},{token:"entity.name.type",foreground:"399ee6"},{token:"entity.name.class",foreground:"399ee6"},{token:"class",foreground:"399ee6"},{token:"interface",foreground:"399ee6"},{token:"support.class",foreground:"399ee6"},{token:"support.type",foreground:"399ee6"},{token:"tag",foreground:"55b4d4"},{token:"tag.js",foreground:"55b4d4"},{token:"metatag",foreground:"55b4d4"},{token:"attribute.name",foreground:"f2ae49"},{token:"attribute.value",foreground:"86b300"},{token:"regexp",foreground:"4cbf99"},{token:"string.regexp",foreground:"4cbf99"},{token:"meta.brace",foreground:"5c616680"},{token:"punctuation",foreground:"5c616680"}],colors:{"editor.background":"#fafafa","editor.foreground":"#5c6166","editor.lineHighlightBackground":"#f0f0f0","editor.lineHighlightBorder":"#f0f0f0","editor.selectionBackground":"#d1e4f4","editor.inactiveSelectionBackground":"#e8e8e8","editorLineNumber.foreground":"#9199a1","editorLineNumber.activeForeground":"#5c6166","editorCursor.foreground":"#ff9940","editorWhitespace.foreground":"#d9d9d9","editorIndentGuide.background":"#e8e8e8","editorIndentGuide.activeBackground":"#d0d0d0","editorGutter.background":"#f3f3f3","editorWidget.background":"#fafafa","editorWidget.border":"#e0e0e0","editorSuggestWidget.background":"#fafafa","editorSuggestWidget.border":"#e0e0e0","editorSuggestWidget.selectedBackground":"#d1e4f4","editorHoverWidget.background":"#fafafa","editorHoverWidget.border":"#e0e0e0","input.background":"#ffffff","input.border":"#e0e0e0",focusBorder:"#ff994033","list.activeSelectionBackground":"#d1e4f4","list.hoverBackground":"#e8e8e8","scrollbarSlider.background":"#9199a133","scrollbarSlider.hoverBackground":"#9199a155","scrollbarSlider.activeBackground":"#9199a177"}},lo={base:"vs-dark",inherit:!1,rules:[{token:"",foreground:"cbccc6",background:"1f2430"},{token:"comment",foreground:"5c6773",fontStyle:"italic"},{token:"comment.js",foreground:"5c6773",fontStyle:"italic"},{token:"comment.line",foreground:"5c6773",fontStyle:"italic"},{token:"comment.block",foreground:"5c6773",fontStyle:"italic"},{token:"string",foreground:"bae67e"},{token:"string.js",foreground:"bae67e"},{token:"string.quoted",foreground:"bae67e"},{token:"string.template",foreground:"bae67e"},{token:"number",foreground:"ffcc66"},{token:"number.js",foreground:"ffcc66"},{token:"constant.numeric",foreground:"ffcc66"},{token:"keyword",foreground:"ffa759"},{token:"keyword.js",foreground:"ffa759"},{token:"keyword.control",foreground:"ffa759"},{token:"keyword.operator",foreground:"f29e74"},{token:"keyword.other",foreground:"ffa759"},{token:"storage",foreground:"ffa759"},{token:"storage.type",foreground:"ffa759"},{token:"operator",foreground:"f29e74"},{token:"delimiter",foreground:"cbccc6b3"},{token:"delimiter.bracket",foreground:"cbccc6b3"},{token:"delimiter.parenthesis",foreground:"cbccc6b3"},{token:"entity.name.function",foreground:"ffd580"},{token:"support.function",foreground:"ffd580"},{token:"function",foreground:"ffd580"},{token:"identifier.js",foreground:"cbccc6"},{token:"variable",foreground:"cbccc6"},{token:"variable.parameter",foreground:"d4bfff"},{token:"variable.other",foreground:"cbccc6"},{token:"identifier",foreground:"cbccc6"},{token:"constant",foreground:"ffcc66"},{token:"constant.language",foreground:"ffcc66"},{token:"constant.language.boolean",foreground:"ffcc66"},{token:"constant.language.null",foreground:"ffcc66"},{token:"constant.language.undefined",foreground:"ffcc66"},{token:"type",foreground:"73d0ff"},{token:"type.identifier",foreground:"73d0ff"},{token:"entity.name.type",foreground:"73d0ff"},{token:"entity.name.class",foreground:"73d0ff"},{token:"class",foreground:"73d0ff"},{token:"interface",foreground:"73d0ff"},{token:"support.class",foreground:"73d0ff"},{token:"support.type",foreground:"73d0ff"},{token:"tag",foreground:"5ccfe6"},{token:"tag.js",foreground:"5ccfe6"},{token:"metatag",foreground:"5ccfe6"},{token:"attribute.name",foreground:"ffd580"},{token:"attribute.value",foreground:"bae67e"},{token:"regexp",foreground:"95e6cb"},{token:"string.regexp",foreground:"95e6cb"},{token:"meta.brace",foreground:"cbccc6b3"},{token:"punctuation",foreground:"cbccc6b3"}],colors:{"editor.background":"#1f2430","editor.foreground":"#cbccc6","editor.lineHighlightBackground":"#191e2a","editor.lineHighlightBorder":"#191e2a","editor.selectionBackground":"#34455a","editor.inactiveSelectionBackground":"#2d3b4d","editorLineNumber.foreground":"#707a8c","editorLineNumber.activeForeground":"#cbccc6","editorCursor.foreground":"#ffcc66","editorWhitespace.foreground":"#3e4b59","editorIndentGuide.background":"#3e4b59","editorIndentGuide.activeBackground":"#5c6773","editorGutter.background":"#1a1f29","editorWidget.background":"#1f2430","editorWidget.border":"#101521","editorSuggestWidget.background":"#1f2430","editorSuggestWidget.border":"#101521","editorSuggestWidget.selectedBackground":"#34455a","editorHoverWidget.background":"#1f2430","editorHoverWidget.border":"#101521","input.background":"#1a1f29","input.border":"#101521",focusBorder:"#ffcc6633","list.activeSelectionBackground":"#34455a","list.hoverBackground":"#2d3b4d","scrollbarSlider.background":"#707a8c33","scrollbarSlider.hoverBackground":"#707a8c55","scrollbarSlider.activeBackground":"#707a8c77"}};function co({onRun:e,isExecuting:t,isLiveMode:n,children:r}){return k.jsxs("div",{className:"code-toolbar",children:[k.jsx("button",{className:"toolbar-button toolbar-button-primary",onClick:e,disabled:t&&!n,title:"Run code",children:t&&!n?"...":"▶"}),k.jsx("div",{className:"toolbar-buttons",children:r})]})}const uo=500;function fo({code:e,onCodeChange:t,isLiveMode:n,onToggleLiveMode:r,onRun:o,onClear:a,isExecuting:i,generatedShapeCount:s,error:l,onDismissError:p,isDarkTheme:y,onThemeToggle:u}){const c=f.useMemo(()=>{for(const[m,E]of Object.entries(ro))if(e===E)return m;return null},[e]),h=f.useRef(null),b=f.useRef(null),L=f.useRef(null),I=f.useRef(o);I.current=o;const v=f.useRef(n);v.current=n;const R=f.useRef(i);R.current=i;const z=f.useRef(null),B=f.useRef(null);f.useEffect(()=>{if(n)return z.current&&clearTimeout(z.current),z.current=setTimeout(()=>{if(!v.current||!h.current||!b.current||R.current)return;const m=h.current.getModel();if(!m)return;const E=h.current.getValue();if(E===B.current)return;b.current.editor.getModelMarkers({resource:m.uri}).some($=>$.severity===b.current.MarkerSeverity.Error)?B.current=null:(B.current=E,I.current(E))},uo),()=>{z.current&&clearTimeout(z.current)}},[e,n]),f.useEffect(()=>{if(!h.current||!b.current)return;const m=b.current,E=h.current,j=E.getModel();j&&(L.current&&L.current.clear(),m.editor.setModelMarkers(j,"code-executor",[]),l?.line&&(m.editor.setModelMarkers(j,"code-executor",[{startLineNumber:l.line,startColumn:l.column||1,endLineNumber:l.line,endColumn:j.getLineMaxColumn(l.line),message:l.message,severity:m.MarkerSeverity.Error}]),L.current=E.createDecorationsCollection([{range:new m.Range(l.line,1,l.line,1),options:{isWholeLine:!0,className:"error-line-highlight",glyphMarginClassName:"error-glyph-margin"}}]),E.revealLineInCenter(l.line)))},[l]);const S=f.useCallback(m=>{m.editor.defineTheme("dark",lo),m.editor.defineTheme("light",so)},[]),x=f.useCallback(()=>{u(),b.current&&b.current.editor.setTheme(y?"light":"dark")},[y,u]),g=f.useCallback((m,E)=>{h.current=m,b.current=E,E.languages.typescript.typescriptDefaults.setDiagnosticsOptions({noSemanticValidation:!1,noSyntaxValidation:!1}),E.languages.typescript.typescriptDefaults.setCompilerOptions({target:E.languages.typescript.ScriptTarget.ESNext,allowNonTsExtensions:!0,noEmit:!0,strict:!1,noImplicitAny:!1,strictNullChecks:!1}),E.languages.typescript.typescriptDefaults.addExtraLib(Vr,"ts:editor-api.d.ts"),m.onKeyDown(j=>{(j.metaKey||j.ctrlKey)&&j.keyCode===E.KeyCode.Enter&&(j.preventDefault(),j.stopPropagation(),I.current(m.getValue()))}),m.focus()},[]),X=f.useCallback(m=>{t(m||""),p()},[t,p]),N=f.useCallback((m,E)=>{t(E),h.current&&(h.current.setValue(E),h.current.focus()),o(E)},[t,o]);return k.jsxs("div",{className:`code-panel ${y?"theme-dark":"theme-light"}`,onKeyDown:m=>m.stopPropagation(),onKeyUp:m=>m.stopPropagation(),children:[k.jsxs(co,{onRun:()=>o(e),isExecuting:i,isLiveMode:n,children:[k.jsx("button",{className:`toolbar-button live-toggle ${n?"active":""}`,onClick:r,"aria-label":n?"Disable live mode":"Enable live mode",title:n?"Live mode on (auto-runs on valid changes)":"Live mode off",children:k.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:k.jsx("path",{d:"M13 2L3 14h9l-1 8 10-12h-9l1-8z"})})}),k.jsx("button",{className:"toolbar-button clear-button",onClick:a,disabled:s===0,title:`Clear generated shapes (${s} shapes)`,children:k.jsx("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:k.jsx("path",{d:"M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"})})}),k.jsx("button",{className:"toolbar-button theme-toggle",onClick:x,"aria-label":y?"Switch to light theme":"Switch to dark theme",children:y?k.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[k.jsx("circle",{cx:"12",cy:"12",r:"5"}),k.jsx("path",{d:"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"})]}):k.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:k.jsx("path",{d:"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"})})})]}),k.jsxs("div",{className:"code-panel-main",children:[k.jsx(io,{onLoadExample:N,selectedExample:c}),k.jsx("div",{className:"code-editor-wrapper",children:k.jsx(Wr,{height:"100%",defaultLanguage:"typescript",value:e,onChange:X,beforeMount:S,onMount:g,theme:y?"dark":"light",options:{fontSize:14,fontFamily:"'JetBrains Mono', 'Fira Code', monospace",lineHeight:1.5,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,tabSize:2,wordWrap:"on",padding:{top:4},glyphMargin:!1,folding:!1,lineNumbers:"on",lineNumbersMinChars:1,lineDecorationsWidth:12,renderLineHighlight:"line",suggestOnTriggerCharacters:!0,quickSuggestions:!0,parameterHints:{enabled:!0},formatOnPaste:!0,formatOnType:!0,fixedOverflowWidgets:!0}})})]}),l&&k.jsxs("div",{className:"error-panel",children:[k.jsxs("div",{className:"error-panel-header",children:[k.jsx("span",{className:"error-panel-title",children:"Error"}),k.jsx("button",{className:"error-dismiss",onClick:p,"aria-label":"Dismiss error",children:"×"})]}),k.jsxs("div",{className:"error-panel-content",children:[k.jsxs("div",{className:"error-message",children:[l.line&&k.jsxs("span",{className:"error-location",children:["Line ",l.line,": "]}),l.message]}),l.stack&&k.jsxs("details",{className:"error-stack-details",children:[k.jsx("summary",{children:"Stack trace"}),k.jsx("pre",{className:"error-stack",children:l.stack})]})]})]})]})}const kt="code-editor-theme",zt="code-editor-code",Lt="code-editor-live-mode";function Je(e){try{return localStorage.getItem(e)}catch{return null}}function Qe(e,t){try{localStorage.setItem(e,t)}catch{}}function po(){const e=f.useRef(null),[t,n]=f.useState(!1),[r,o]=f.useState(!1),[a,i]=f.useState(null),[s,l]=f.useState(0),[p,y]=f.useState(()=>Je(zt)??oo),[u,c]=f.useState(()=>Je(Lt)==="true"),[h,b]=f.useState(()=>Je(kt)!=="light"),L=f.useRef(null),I=f.useRef(0);f.useEffect(()=>{Qe(zt,p)},[p]),f.useEffect(()=>{Qe(Lt,String(u))},[u]),f.useEffect(()=>{Qe(kt,h?"dark":"light")},[h]),f.useEffect(()=>{const z=B=>{if(B.source!==e.current?.contentWindow)return;const S=B.data;if(!(!S||typeof S!="object"))switch(S.type){case"ready":n(!0);break;case"result":{const x=L.current;x&&x.id===S.id&&(!S.success&&S.error&&i(S.error),x.resolve(),L.current=null,o(!1));break}case"runtime-error":i(S.error);break;case"shape-count":l(S.count);break}};return window.addEventListener("message",z),()=>window.removeEventListener("message",z)},[]),f.useEffect(()=>{t&&e.current?.contentWindow?.postMessage({type:"color-scheme",scheme:h?"dark":"light"},"*")},[t,h]);const v=f.useCallback(async z=>{if(!t||r)return;o(!0),i(null);const B=String(++I.current);return new Promise(S=>{L.current={id:B,resolve:S},e.current?.contentWindow?.postMessage({type:"run",id:B,code:z},"*")})},[t,r]),R=f.useCallback(()=>{i(null),!(s>10&&!confirm(`Clear ${s} generated shapes?`))&&e.current?.contentWindow?.postMessage({type:"clear"},"*")},[s]);return k.jsx("div",{className:`editor-container ${h?"theme-dark":"theme-light"}`,children:k.jsxs(Ft,{direction:"horizontal",children:[k.jsx(et,{defaultSize:40,minSize:30,maxSize:80,children:k.jsx(fo,{code:p,onCodeChange:y,isLiveMode:u,onToggleLiveMode:()=>c(z=>!z),onRun:v,onClear:R,isExecuting:r,generatedShapeCount:s,error:a,onDismissError:()=>i(null),isDarkTheme:h,onThemeToggle:()=>b(z=>!z)})}),k.jsx(Ut,{className:"resize-handle"}),k.jsx(et,{minSize:20,children:k.jsx("iframe",{ref:e,src:"sandbox.html",sandbox:"allow-scripts",allow:"clipboard-read; clipboard-write",title:"Canvas sandbox",style:{width:"100%",height:"100%",border:"none",display:"block",background:"#1a1a1a"}})})]})})}const rn=document.getElementById("root");if(!rn)throw new Error("Root element not found");an.createRoot(rn).render(k.jsx(f.StrictMode,{children:k.jsx(po,{})}));
