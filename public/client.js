import * as THREE from '/build/three.module.js';
import Stats from './jsm/libs/stats.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';
import { GUI } from './node_modules/dat.gui/build/dat.gui.module.js';

class World {
    constructor() {
      this.DIM = 128;
      this.maxIterations = 14;
      this.spacing = 65;

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
          powerPreference: "high-performance",
        });

        //Directional Lights
        // const directionalLights = [];

        // directionalLights[ 0 ] = new THREE.DirectionalLight( 0xffffff, 1 );
        // directionalLights[ 0 ].position.set( -1, 2, 4);
        // directionalLights[ 0 ].castShadow = true;
        // this._scene.add( directionalLights[ 0 ] );

        // directionalLights[ 1 ] = new THREE.DirectionalLight( 0xffffff, 1 );
        // directionalLights[ 1 ].position.set( 2, -3, -5);
        // directionalLights[ 1 ].castShadow = true;
        // this._scene.add( directionalLights[ 1 ] );

        // //Ambient Lights
        // const light2 = new THREE.AmbientLight( 0x404040, 0.9 );
        // this._scene.add( light2 );

        // Camera
        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 1;
        const far = 1500;


        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(100, 100, 200);

        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._scene.add(this._camera);
        
        console.log(this._camera);

        // Controls
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);

        let parameters = 
        {
          DIM: this.DIM,
          maxIterations: this.maxIterations,
          spacing: this.spacing,
        };

        //GUI
        const gui = new GUI()
        const fractalFolder = gui.addFolder('Fractal')
        let fractalDIM = fractalFolder.add(parameters, 'DIM', 16, 512).listen();
        let fractalIterations = fractalFolder.add(parameters, 'maxIterations', 0, 45).listen();
        let fractalSpacing = fractalFolder.add(parameters, 'spacing', 0, 400).listen();
        fractalFolder.open()

        fractalDIM.onChange(function(value) 
        {   
          this._Render();  
        });
        // fractalDIM.onChange(function(value) 
        // {   
        //   this._Render(); 
        // });
        // fractalDIM.onChange(function(value) 
        // {   
        //   this._Render(); 
        // });

      //   gui = new dat.GUI();

      // var folder1 = gui.addFolder('Position');
      // var cubeX = folder1.add( parameters, 'x' ).min(-200).max(200).step(1).listen();
      // var cubeY = folder1.add( parameters, 'y' ).min(0).max(100).step(1).listen();
      // var cubeZ = folder1.add( parameters, 'z' ).min(-200).max(200).step(1).listen();
      // folder1.open();
      
      // cubeX.onChange(function(value) 
      // {   cube.position.x = value;   });
      // cubeY.onChange(function(value) 
      // {   cube.position.y = value;   });
      // cubeZ.onChange(function(value) 
      // {   cube.position.z = value;   });
      // // const cameraFolder = gui.addFolder('Camera')
      // // cameraFolder.add(camera.position, 'z', 0, 10)
      // // cameraFolder.open()

      console.log("Scene Info:", this._renderer.info)

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
        const {maxIterations} = this;
        const {DIM} = this;
        const {spacing} = this;

        const geometries = [];
        const color = new THREE.Color();

        var worker = new Worker('voxel-worker.js', { type : 'module' });

        for (let i = 0; i < DIM; i++) {
          for (let j = 0; j < DIM; j++) {
      
            let edge = false;
            let lastIteration = 0;

            for (let k = 0; k < DIM; k++) { 

              let x = this.map(i, 0, DIM, -1, 1);
              let y = this.map(j, 0, DIM, -1, 1);
              let z = this.map(k, 0, DIM, -1, 1);
      
              let zeta = new THREE.Vector3(0, 0, 0);

              let n = 10;
              let iteration = 0;

              while (true) {

                let c = new Spherical(zeta.x, zeta.y, zeta.z);

                let newx = Math.pow(c.r, n) * Math.sin(c.theta*n) * Math.cos(c.phi*n);
                let newy = Math.pow(c.r, n) * Math.sin(c.theta*n) * Math.sin(c.phi*n)
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
                if (iteration > maxIterations) {

                    if (!edge) {
                      edge = true;
                    
                    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
                    const amount = (x + y + z) / DIM;
                    const saturation = 1;

                    const hue = THREE.Math.lerp(0.6, 0.32, amount + 2*z);
                    const lightness = THREE.Math.lerp(0.4, 1, amount + y*x*z);

                    color.setHSL(hue, saturation, lightness);
                    
                    const rgb = color.toArray().map(v => v * 255);

                    // make an array to store colors for each vertex
                    const numVerts = geometry.getAttribute('position').count;
                    const itemSize = 3; // r, g, b
                    const colors = new Uint8Array(itemSize * numVerts);

                    // copy the color into the colors array for each vertex
                    colors.forEach((v, ndx) => {
                      colors[ndx] = rgb[ndx % 3];
                    });

                    const normalized = true;
                    const colorAttrib = new THREE.BufferAttribute(colors, itemSize, normalized);
                    geometry.setAttribute('color', colorAttrib);

                    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(x*spacing, y*spacing, z*spacing));             
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

        const material = new THREE.MeshBasicMaterial({
          vertexColors: THREE.VertexColors,
          side: THREE.SingleSide,
        });
        const mesh = new THREE.Mesh(mergedGeometry, material);

        this._scene.add(mesh);
    }

    _Animate() 
    {
        this._stats.update();
    }
}

class Spherical {
  constructor(x,y,z) {
    this.r = Math.sqrt(x*x + y*y + z*z);
    this.theta = Math.atan2( Math.sqrt(x*x+y*y), z);
    this.phi = Math.atan2(y, x);
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
});