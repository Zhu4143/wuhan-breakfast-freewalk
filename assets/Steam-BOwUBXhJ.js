import{K as e,Q as t,U as n,ct as r}from"./three-BRA4jAjY.js";var i={welcome:{target:[0,3.05,0],width:11.8,height:8.8,elevation:.2,yaw:.16},keeper:{target:[-.38,3.14,.3],width:2.75,height:2.4,elevation:.04,yaw:.07},bowl:{target:[.51,2.32,1.6],width:2.35,height:1.6,elevation:.18,yaw:.09},jar:{target:[-1.76,2.13,1.1],width:1.5,height:1.28,elevation:.34,yaw:.16},stool:{target:[-2.94,.53,2.08],width:1.8,height:1.55,elevation:.36,yaw:.28}};function a(e,t,n){let r=i[e];return Math.max(r.height,r.width/Math.max(t,.3))/(2*Math.tan(n*Math.PI/360))}function o(i,a,o){let s=[];for(let e=0;e<5;e++){let c=i.ownMaterial(new t({transparent:!0,depthWrite:!1,side:2,uniforms:{time:{value:0},seed:{value:e*2.37},strength:{value:.32}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time; uniform float seed; uniform float strength; varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){float y=vUv.y;float sway=sin(y*8.-time*.65+seed)*(.05+y*.12)+sin(y*17.-time+seed)*.025;
          float width=.045+y*.125;float ribbon=exp(-pow((vUv.x-.5-sway)/width,2.));
          float n=noise(vec2(vUv.x*8.+seed,y*6.-time*.47));n=.45+.55*n;
          float fade=smoothstep(0.,.1,y)*(1.-smoothstep(.5,1.,y));
          float pulse=.66+.34*sin(time*.8+seed+y*9.);
          gl_FragColor=vec4(vec3(.97,.95,.88),ribbon*n*fade*pulse*strength);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`})),l=i.mesh(a,new n(.63,1.18+e%2*.18),c);l.position.copy(o).add(new r((e-2)*.1,.55,.025*e)),l.castShadow=!1,l.receiveShadow=!1,l.renderOrder=2,l.userData.noAO=!0,s.push(l)}let c=new e,l=new e;return{meshes:s,update(e,t,n){t.getWorldQuaternion(c),a.getWorldQuaternion(l).invert(),s.forEach(t=>{t.visible=n,t.material.uniforms.time.value=e,t.quaternion.copy(l).multiply(c)})}}}export{a as n,i as r,o as t};