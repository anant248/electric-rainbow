import * as THREE from '/node_modules/three/src/Three.js';
//const THREE = require('three');

// const innerHeight = innerHeight;
// const innerWidth = innerWidth;

// if (typeof window !== 'undefined') {
//   // 👉️ can use document here
//   console.log('You are on the browser')

//   console.log(document.title)
//   console.log(document.getElementsByClassName('my-class'));
// } else {
//   // 👉️ can't use document here
//   console.log('You are on the server')
// }


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, innerWidth / innerHeight, 0.01, 10 );
camera.position.z = 1;


const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

const renderer = new THREE.WebGLRenderer( );//{ antialias: true } );

console.log(scene)
console.log(camera)
console.log(renderer)

renderer.setSize( innerWidth, innerHeight );
renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

// animation

function animation( time ) {

	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	renderer.render( scene, camera );

}
