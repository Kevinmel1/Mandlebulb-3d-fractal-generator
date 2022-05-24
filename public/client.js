import * as THREE from '/build/three.module.js';
import Stats from './jsm/libs/stats.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';

console.log(THREE);
console.log(OrbitControls);


class World {
    constructor() {
      this._Initialize();
    }

    _Initialize() 
    {
        const canvas = document.querySelector('.web-gl');

        // Fps
        this._stats = new Stats();
        document.body.appendChild(this._stats.domElement);
        
        // Scene
        this._scene = new THREE.Scene();
        
        // Render
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: canvas,
        });

        //Directional Lights
        const directionalLights = [];

        directionalLights[ 0 ] = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLights[ 0 ].position.set( -1, 2, 4);
        directionalLights[ 0 ].castShadow = true;
        this._scene.add( directionalLights[ 0 ] );

        directionalLights[ 1 ] = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLights[ 1 ].position.set( 2, -3, -5);
        directionalLights[ 1 ].castShadow = true;
        this._scene.add( directionalLights[ 1 ] );

        //Ambient Lights
        const light2 = new THREE.AmbientLight( 0x404040, 0.9 ); // soft white light
        this._scene.add( light2 );

        // Camera
        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 2500;
        
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(100, 100, 200);
        //this._camera.position.set(300, 100, 300);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._scene.add(this._camera);
        
        console.log(this._camera);

        // Controls
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);

        // Changes in screen size.
        window.addEventListener('resize', () => 
        {
            this._OnWindowResize();
        }, false);

        this._AddMaterials();
        this._Animate();
        this._Render();   
    }

    // Resizing window
    _OnWindowResize()
    {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _Render() 
    {
        requestAnimationFrame(() => 
        {  
            this._renderer.render(this._scene, this._camera);
            this._Animate();
            this._Render();
        });
    }

    map(x, x0, x1, y0, y1)
    {
        return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
    }

    _AddMaterials() 
    {
        const geometries = [];
        const material = new THREE.MeshPhongMaterial( {color: new THREE.Color(`hsl(${23.343},${44}%,${44}%,0.1)`)} );
        let mandelbulb = [];
        const maxiterations = 20;
        const DIM = 128;

          
        for (let i = 0; i < DIM; i++) {
          for (let j = 0; j < DIM; j++) {
      
            let edge = false;
            let lastIteration = 0;

            for (let k = 0; k < DIM; k++) {

              let x = this.map(i, 0, DIM, -1, 1);
              let y = this.map(j, 0, DIM, -1, 1);
              let z = this.map(k, 0, DIM, -1, 1);
      
              let zeta = new THREE.Vector3(0, 0, 0);

              let n = 8;
              let iteration = 0;

              while (true) {

                let c = new Spherical(zeta.x, zeta.y, zeta.z);

                let newx = Math.pow(c.r, n) * Math.sin(c.theta*n) * Math.cos(c.phi*n);
                let newy = Math.pow(c.r, n) * Math.sin(c.theta*n) * Math.sin(c.phi*n);
                let newz = Math.pow(c.r, n) * Math.cos(c.theta*n);

                zeta.x = newx + x;
                zeta.y = newy + y;
                zeta.z = newz + z;

                iteration++;
      
                if (c.r > 2) {

                  lastIteration = iteration;

                  if (edge) {
                    edge = false;
                  }

                  break;
                }
                if (iteration > maxiterations) {

                  if (!edge) {
                    edge = true;
                
                    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);

                    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(x*150, y*150, z*150));
                    
                    geometries.push(geometry);
                  }

                  break;
                }
              }
            }
          }
        }

        const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
            geometries, false);
        const mesh = new THREE.Mesh(mergedGeometry, material);

        this._scene.add(mesh);
    }

    _Animate() 
    {
        this._stats.update();
    }
}
class MandelPoint {
    constructor(v, i) {
      this.v = v;
      this.i = i;
    }
}

class Spherical {
    constructor(x, y, z) {
        this.r = Math.sqrt(x*x + y*y + z*z);
        this.theta = Math.atan2( Math.sqrt(x*x+y*y), z);
        this.phi = Math.atan2(y, x);
    }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
});