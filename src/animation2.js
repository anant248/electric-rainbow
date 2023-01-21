import * as THREE from "C:Users/rassa/Documents/igen430/electric-rainbow/node_modules/three/src/Three.js";



const innerHeight = window.innerHeight;
const innerWidth = window.innerWidth;
var currentArray = new Uint8Array([0,50,255,60,0,150,200,0]);

THREE.ColorManagement.legacyMode = false;

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

const renderer = new THREE.WebGLRenderer( { antialias: true } );

// console.log(scene)
// console.log(camera)
// console.log(renderer)

renderer.setSize( innerWidth, innerHeight );
renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

// animation


function animation( time ) {

	mesh.rotation.x = (time/(array[0]+array[1]+array[2]+array[3])/4*100);
	mesh.rotation.y = (time/(array[4] + array[5] + array[6] + array[7]) / 4*100);
  //mesh.material.color.setHex()

	renderer.render( scene, camera );

}
