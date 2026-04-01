import{n as o}from"./index-DrYKbzve.js";import{n as h,i as y}from"./en-US-UTXHGMRy.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=o("CalendarX",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"m14 14-4 4",key:"rymu2i"}],["path",{d:"m10 14 4 4",key:"3sz06r"}]]);function u(n,e){const[t,a]=h(n,e.start,e.end);return{start:t,end:a}}function k(n,e){const{start:t,end:a}=u(e==null?void 0:e.in,n);let s=+t>+a;const d=s?+t:+a,r=s?a:t;r.setHours(0,0,0,0);let m=1;const c=[];for(;+r<=d;)c.push(y(t,r)),r.setDate(r.getDate()+m),r.setHours(0,0,0,0);return s?c.reverse():c}export{p as C,k as e,u as n};
