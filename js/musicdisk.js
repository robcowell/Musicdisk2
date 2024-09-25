//import * as THREE from "./three.module.js";

import Stats from "./stats.module.js";
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import frag from "../shaders/default_frag.js";
import vert from "../shaders/default_vert.js";

  const thumbnail = document.querySelector("#thumbnail");
  const songArtist = document.querySelector(".song-artist"); // element where track artist appears
  const songTitle = document.querySelector(".song-title"); // element where track title appears
  
  let pPause = document.querySelector("#play-pause");
  let progBar = document.querySelector('#progress-bar');
  
  var progBarLength = 0;

  var renderer;
  var camera;
  var scene;
  var cube;

  var audioLoader;
  var songs;
  var songIndex = 0;
  var allTracks;
  var sound;
  var listener;
  var analyser;

  var error;

  var xSpeed;
  var ySpeed;
  var zSpeed;
  var xVelocity;
  var yVelocity;
  var zVelocity;
  var upperBound;
  var lowerBound;

  var initialized = false;

  export function playPause()
  {
    console.log("Play/Pause");
    if(!initialized)
    {
      doSound();
    }
    if (sound.isPlaying)
    {
      pPause.src = "./assets/icons/play.png";
      thumbnail.style.transform = "scale(1.15)";
      sound.pause();
      sound.isPlaying = false;
    } else
    {
      pPause.src = "./assets/icons/pause.png";
      thumbnail.style.transform = "scale(1)";
      sound.play();
      sound.onEnded = (function ()
    {
      console.log("Song ended");
      this.isPlaying = false;
      nextSong();
    });
    }
  }

  export function nextSong()
  {
    console.log("Next Song");
    if (sound.isPlaying)
    {
      sound.stop();
    }
    songIndex++;
    if (songIndex > allTracks.length-1)
    {
      songIndex = 0;
    }
    console.log("Song - " + songIndex + " " + allTracks[songIndex].title);
    audioLoader.load(allTracks[songIndex].path, function (buffer)
    {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
      progBarLength = buffer.duration
      console.log('Duration ' + buffer.duration);
    });
    //do we need to reattach this?
    sound.onEnded = (function ()
    {
      console.log("Song ended");
      this.isPlaying = false;
      nextSong();
    });

    thumbnail.src = allTracks[songIndex].thumbnail;
    songArtist.innerHTML = allTracks[songIndex].artist;
    songTitle.innerHTML = allTracks[songIndex].title;
    progBar.max = progBarLength;
    console.log(progBar.max);
  }

  export function previousSong()
  {
    console.log("Previous Song");
    if (sound.isPlaying)
    {
      sound.stop();
    }
    songIndex--;
    if (songIndex < 0)
    {
      songIndex = allTracks.length-1;
    }
    console.log("Song - " + allTracks[songIndex].title);
    audioLoader.load(allTracks[songIndex].path, function (buffer)
    {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
      progBarLength = buffer.duration
      console.log('Duration ' + buffer.duration);
    });
    //reattach callback?
    sound.onEnded = (function ()
    {
      console.log("Song ended");
      this.isPlaying = false;
      nextSong();
    });

    thumbnail.src = allTracks[songIndex].thumbnail;
    songArtist.innerHTML = allTracks[songIndex].artist;
    songTitle.innerHTML = allTracks[songIndex].title;
    progBar.max = progBarLength;
    console.log(progBar.max);
  }

  function getTracks()
  {
    console.log("Get tracks");
    fetch("./assets/data.json")
      .then((response) => {
        if (!response.ok) {
          throw Error("Failed to fetch json");
        } else {
          console.log("return json");
          return response.json();
        }
      })
      .then((jsonResponse) => {
        allTracks = jsonResponse.tracks;
        console.log(allTracks);
      })
      .catch((error) => {
        error = error;
        allTracks = undefined;
        console.log(error);
      });
  }

  export default function boot()
{
  console.log("Booting...");
/*
  var stats = Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
*/
  getTracks();
  render();
}

function doSound()
{
  // create an AudioListener and add it to the camera
  listener = new THREE.AudioListener();
  camera.add(listener);

  // create a global audio source
  sound = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  if (allTracks) {
    audioLoader = new THREE.AudioLoader();
    console.log(allTracks);
    audioLoader.load(allTracks[0].path, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(allTracks[0].volume);
      if(sound.isPlaying)
      {
        sound.stop();
      }
      sound.play();
      sound.isPlaying = true;
      thumbnail.src = allTracks[songIndex].thumbnail;
      songArtist.innerHTML = allTracks[songIndex].artist;
      songTitle.innerHTML = allTracks[songIndex].title;
      
      progBarLength = buffer.duration
      progBar.max = progBarLength;
            
    
    });
    initialized = true;
    
    
      // create an AudioAnalyser, passing in the sound and desired fftSize
    analyser = new THREE.AudioAnalyser(sound, 32);

    // get the average frequency of the sound
    var audiodata = analyser.getAverageFrequency();
    animate();
  }
  }

function render()
{
  var start = Date.now();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    95,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //scene.add(new THREE.AmbientLight(0x111111));

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  //scene.add(directionalLight);

  // create the particle variables
  xSpeed = 5;
  ySpeed = 5;
  zSpeed = 5;
  xVelocity = 2;
  yVelocity = 2;
  zVelocity = 2;
  upperBound = 150;
  lowerBound = -150;

  var particleCount = 8000,
    particles = new THREE.BufferGeometry(),
    pMaterial = new THREE.PointsMaterial({
      color: 0x6666ff,
      size: 2,
      map: new THREE.TextureLoader().load("assets/images/particle.png"),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: false,
    });

  var points = [];

  // now create the individual particles
  for (var p = 0; p < particleCount; p++) {
    // create a particle with random

    var pX = Math.random() * 500 - upperBound * 2,
      pY = Math.random() * 500 - upperBound * 2,
      pZ = Math.random() * 500 - upperBound * 2;

    points.push(new THREE.Vector3(pX, pY, pZ));
  }

  // add points to the geometry
  particles.setFromPoints(points);

  // create the particle system
  var particleSystem = new THREE.Points(particles, pMaterial);

  particleSystem.sortParticles = false;
  particleSystem.rotation.x = Math.random() / 10;
  particleSystem.rotation.y = Math.random() / 10;
  particleSystem.rotation.z = Math.random() / 10;

  // add it to the scene
  scene.add(particleSystem);

  var geometry = new THREE.SphereGeometry(1.5, 64, 64);

  var material = new THREE.ShaderMaterial({
    uniforms: {
      tExplosion: {
        type: "t",
        value: new THREE.TextureLoader().load("assets/images/explosion.png"),
      },
      time: {
        // float initialized to 0
        type: "f",
        value: 0.0,
      },
      fft: {
        type: "f",
        value: 0.0,
      },
    },
    vertexShader: vert,
    fragmentShader: frag,
  });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  renderer.sortObjects = true;

  camera.position.z = 5;
}

function animate()
{
  //    stats.begin();
    var time = Date.now() * 0.00003;

    camera.position.x += (3 - camera.position.x) * 0.05;
    camera.position.y += (-3 - camera.position.y) * 0.05;

    camera.lookAt(scene.position);

    for (var i = 0; i < scene.children.length; i++) {
      var object = scene.children[i];

      if (object instanceof THREE.Points) {
        object.rotation.x = time * (i < 40 ? i + xSpeed : -(i + xSpeed));
        object.rotation.y = time * (i < 100 ? i + ySpeed : -(i + ySpeed));
        object.rotation.z = time * (i < 30 ? i + zSpeed : -(i + zSpeed));

        if (object.position.y > upperBound || object.position.y < lowerBound) {
          yVelocity = -yVelocity;
        }
        object.position.y += yVelocity;

        if (object.position.x > upperBound || object.position.x < lowerBound) {
          xVelocity = -xVelocity;
        }
        object.position.x -= xVelocity;

        if (object.position.z > upperBound || object.position.z < lowerBound) {
          zVelocity = -zVelocity;
        }
        object.position.z += zVelocity;
      }
    }

    analyser.getFrequencyData();

    var fft = analyser.getAverageFrequency();

    cube.material.uniforms["time"].value = time;
    cube.material.uniforms["fft"].value = fft / 300;
    cube.rotation.x += analyser.getAverageFrequency() / 5000;
    cube.rotation.y += analyser.getAverageFrequency() / 3000;

    cube.scale.x = analyser.getAverageFrequency() / 100;
    cube.scale.y = analyser.getAverageFrequency() / 100;
    cube.scale.z = analyser.getAverageFrequency() / 100;

    renderer.sortObjects = false;
    renderer.render(scene, camera);

//    stats.end();

    requestAnimationFrame(animate);
  }

export function changeProgressBar()
{
  
}