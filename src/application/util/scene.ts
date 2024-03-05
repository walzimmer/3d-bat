// import * as THREE from "three"
// // import OrbitControls from "three-orbitcontrols"
// import * as TWEEN from "@tweenjs/tween.js"
// import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
//
// class Sphere {
//     constructor() {
//
//     }
//
//     sphere1(r: number) {
//         let _geo = new THREE.SphereGeometry(r, 32, 32)
//         let _mat = new THREE.MeshNormalMaterial()
//         let _s = new THREE.Mesh(_geo, _mat)
//         return _s
//     }
//
//     sphere2(r: number) {
//         let _geo = new THREE.BoxGeometry(5, 5, 5)
//         let _mat = new THREE.MeshNormalMaterial()
//         let _s = new THREE.Mesh(_geo, _mat)
//         return _s
//     }
// }
//
// class Threescene {
//     scene: THREE.Scene
//     camera: THREE.PerspectiveCamera
//     renderer: THREE.WebGLRenderer
//     controls: any
//     clock: THREE.Clock = new THREE.Clock()
//
//     constructor() {
//         this.scene = new THREE.Scene()
//         this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000)
//         this.renderer = new THREE.WebGLRenderer()
//         this.controls = new OrbitControls(this.camera, this.renderer.domElement)
//         this.init()
//         window.addEventListener('resize', this.onWindowResize, false)
//     }
//
//     public addObject() {
//         let sp1 = new Sphere()
//         let s1 = sp1.sphere1(8)
//         this.scene.add(s1)
//
//         let s2 = sp1.sphere2(4)
//         s2.position.set(8, 0, 0)
//         this.scene.add(s2)
//     }
//
//     public testTween() {
//         let _geo = new THREE.SphereGeometry(1, 32, 32)
//         let _mat = new THREE.MeshNormalMaterial()
//         let _s = new THREE.Mesh(_geo, _mat)
//         this.scene.add(_s)
//         let p = {x: 0, y: 0};
//         let p1 = 30
//         let tween = new TWEEN.Tween(p).to({x: 80, y: p1}, 1000)
//             .easing(TWEEN.Easing.Exponential.Out)
//             .onUpdate(function () {
//                 _s.position.set(-5, p.y, 0)
//             })
//             .onComplete(function () {
//
//             })
//             .start();
//         let tweenBack = new TWEEN.Tween(p).to({x: 0, y: 0}, 1000)
//             .easing(TWEEN.Easing.Exponential.In)
//             .onUpdate(function () {
//                 _s.position.set(-5, p.y, 0)
//             })
//         tween.chain(tweenBack)
//         tweenBack.chain(tween)
//
//     }
//
//     private init() {
//         this.camera.position.set(-40, 40, 40)
//         this.camera.lookAt(this.scene.position)
//         this.renderer.setClearColor(0x222222)
//         this.renderer.setSize(window.innerWidth, window.innerHeight)
//         document.body.appendChild(this.renderer.domElement);
//         this.scene.add(new THREE.AxesHelper(10))
//         this.linght()
//         this.animate()
//     }
//
//     private linght() {
//         let light = new THREE.AmbientLight(0xFFFFFF, 1)
//         this.scene.add(light)
//     }
//
//     private onWindowResize = () => {
//         this.camera.aspect = window.innerWidth / window.innerHeight;
//         this.camera.updateProjectionMatrix();
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//     }
//
//     private render() {
//         let delta = this.clock.getDelta()
//         this.renderer.render(this.scene, this.camera)
//         this.controls.update(delta);
//         TWEEN.update();
//         // console.log(delta)
//     }
//
//     private animate = () => {
//         requestAnimationFrame(this.animate)
//         this.render()
//     }
// }
//
// export {Threescene}