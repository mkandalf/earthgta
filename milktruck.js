// milktruck.js
/*
Copyright 2008 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Code for Monster Milktruck demo, using Earth Plugin.

window.truck = null;

host = 'http://localhost:8000/';

model = 'car';

var DS_map;
var DS_directions;

var car = {
  type: 'car',
  url: host + 'sport_car/models/sport_car',
  animated: false,
  accel: 30.0,
  decel: 80.0,
  scale: 1.0,
  steering: true,
  max_rev_speed: 40.0,
  max_speed: 60.0,
  steer_roll: -1.0,
  roll_spring: 0.5,
  roll_damp: -0.16,
  gravity: 3 * 9.8
};

var person = {
  type: 'person',
  url: host + 'person/an',
  animated: true,
  steering: false,
  accel: 1000.0,
  decel: 8.0,
  scale: 0.4,
  max_rev_speed: 0.0,
  max_speed: 5.0,
  turn_speed:40,
  steer_roll: 0.0,
  roll_spring: 0.0,
  roll_damp: -0.16,
  gravity: 50
};

var muzzle_flash = {
  type: 'muzzle_flash',
  animated: false,
  options: {
    urls: [host + 'muzzle_flash/models/muzzle_flash.dae'],
    lat: 0,
    long: 0,
    alt: 0,
    scale: 0.08
  }
};

var PAGE_PATH = document.location.href.replace(/\/[^\/]+$/, '/');
var MODEL_URL = 'http://chrisdiamanti.com/walk/an1.dae';
var INIT_LOC = {
  lat: 37.423501,
  lon: -122.086744,
  heading: 90
}; // googleplex

var PREVENT_START_AIRBORNE = false;
var TICK_MS = 66;

var BALLOON_FG = '#000000';
var BALLOON_BG = '#FFFFFF';

var GRAVITY = 100;
var CAM_HEIGHT = 8; // 8
var TRAILING_DISTANCE = 30; // 30

var ACCEL = 50.0;
var DECEL = 80.0;
var MAX_REVERSE_SPEED = 40.0;

var STEER_ROLL = -1.0;
var ROLL_SPRING = 0.5;
var ROLL_DAMP = -0.16;

var addObject = function(object){
  object.placemark = ge.createPlacemark('');
  object.model = ge.createModel('');
  
  ge.getFeatures().appendChild(object.placemark);

  object.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
  
  object.linker = ge.createLink('');
  object.linker.setHref(object.options.urls[0]);
  object.model.setLink(object.linker);

  object.placemark.setGeometry(object.model);
  object.model.getLocation().setLatLngAlt(object.options.lat,
                                          object.options.long,
                                          object.options.alt);
  scale = ge.createScale('');
  scale.setX(object.options.scale);
  scale.setY(object.options.scale);
  scale.setZ(object.options.scale);
  object.model.setScale(scale);
}

function plotCars(lat1, lng1, lat2, lng2, self, cb) {
  var route = "from: " + lat1 + ", " + lng1 + " to: " + lat2 + ", " + lng2;
  console.log(route);

  get_directions(route, function(data) {
    var steps = data.g.Directions.Routes[0].Steps;
    console.log(steps);

    if (steps.length > 1) {
      var s = steps[1];
      var p = {lng: s.Point.coordinates[0], lat: s.Point.coordinates[1]};
      console.log(steps.map(function(s) { return {lng: s.Point.coordinates[0], lat: s.Point.coordinates[1]} }));
      console.log("first step");
      console.log(lng1, lat1);
      console.log(p);
      console.log("truck");

      var o = 6;
      for (var i = 1; i < o; i++) {
        (function() {
          var p1 = V3.latLonAltToCartesian([lat1, lng1, 0]);
          var p2 = V3.latLonAltToCartesian([p.lat, p.lng, 0]);

          var s = V3.sub(p1, p2)
          var n = V3.add(p1, V3.scale(V3.normalize(s), i))
          var m = V3.cartesianToLatLonAlt(n);

          console.log(m);
          
          // self.cars.push(new Truck({lat: lat1, lng: lng1}));
          var car = new Truck({
            lat: m[0],
            lng: m[1]
          });
          self.cars.push(car);
        })()
      }
    }
      
    if (cb) {
      cb();
    }
  });
}

function Scene() {
  // initialize
  var self = this;
  self.cars = [];
  self.people = [];
  self.flashes = [];

  self.player1 = new Truck();
  self.cars.push(self.player1);

  self.createCars();
  self.createPeople();

  google.earth.addEventListener(ge, "frameend", function() { self.update(); });
}

Scene.prototype.createCars = function() {
  console.log("createCars");
  var self = this;
  while (self.cars.length < 2) {
    var lat = self.player1.location.getLatitude();
    var lng = self.player1.location.getLongitude();

    var player2 = new Truck({
      lng: lng,
      lat: lat+0.0001
    });
    self.cars.push(player2);

    var player3 = new Truck({
      lng: lng+0.0001,
      lat: lat
    });
    self.cars.push(player3);


    plotCars(lat, lng, lat + 0.005, lng, self, function() {});
        // plotCars(lat, lng, lat, lng + 0.005, self, function() {}));

    break;
  }
}

Scene.prototype.createPeople = function() {
  console.log("createPeople");
  var self = this;
  // while (self.people.length < 20) {
  // }
}

Scene.prototype.removeObject = function(object) {
  // removes an object
}

Scene.prototype.update = function() {
  var self = this;
  self.cars.forEach(function(c, i) {
    // if car is to far away move it
    c.update();
  });

  self.people.forEach(function(p, i) {
    // if person is too far away, move him
    p.update();
  });

  var i;
  for (i = self.flashes.length - 1; i>=0; i--){
    self.flashes[i].frames_left -= 1;
    if (self.flashes[i].frames_left <= 0){
      ge.getFeatures().removeChild(self.flashes[i].placemark);
      self.flashes.splice(i, 1);
      //console.log(ge.getElementById(self.flashes[i].id));
      //ge.getFeatures().removeChild(ge.getElementById(self.flashes[i].id));
      //ge.getFeatures().removeChild(ge.getElementById('p' + self.flashes[i].id));
    }
  };

  if (switchButtonDown){
    switchButtonDown = false;
    if (scene.player1.data.type == 'person'){
      closest_dist = 100000000000000000000000000;
      closest_car = null;
      for (i = 0; i < scene.cars.length; i++){
        car = scene.cars[i];
        dist = distance(scene.player1, car);
        console.log(dist);
        if (dist < 5.5){
          if (dist < closest_dist){
            closest_dist = dist;
            closest_car = car;
          }
          //me_loc = me.model.getLocation();
          //me_cart = V3.latLonAltToCartesian([me_loc.getLatitude(), me_loc.getLongitude(), me_loc.getAltitude()]);
          //car_loc = car.model.getLocation();
          //car_cart = V3.latLonAltToCartesian([car_loc.getLatitude(), car_loc.getLongitude(), car_loc.getAltitude()]);
          //me.vel = V3.add(me.vel, V3.scale(vec, 1 * V3.length(me.vel) * dt));
        }
      }
      if (closest_car){
        ge.getFeatures().removeChild(self.player1.placemark);
        self.player1 = closest_car;
      }
    }
    else if (scene.player1.data.type == 'car'){
      var lat = self.player1.location.getLatitude();
      var lng = self.player1.location.getLongitude();
      self.player1 = new Truck({
        lng: lng,
        lat: lat + .00001
      }, person);
      self.people.push(self.player1);
    }
  }

  if (shootButtonDown) {
    shootButtonDown = false;
    muzzle_flash.options.lat = scene.player1.location.getLatitude();
    muzzle_flash.options.long = scene.player1.location.getLongitude();
    muzzle_flash.options.alt = scene.player1.location.getAltitude() + 0.5;
    muzzle_flash.options.heading = scene.player1.model.getOrientation().getHeading();
    muzzle_flash.frames_left = 2;

    self.addObject(muzzle_flash);
    self.flashes.push(muzzle_flash);
  }

};

Scene.prototype.addObject = function(object){
  console.log(object);
  // adds an object to the scene
  object.id = Math.random().toString(36).slice(2);
  object.placemark = ge.createPlacemark(object.id);
  object.model = ge.createModel('m' + object.id);
  
  ge.getFeatures().appendChild(object.placemark);
  object.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
  
  object.linker = ge.createLink('');
  object.linker.setHref(object.options.urls[0]);
  object.model.setLink(object.linker);

  object.placemark.setGeometry(object.model);
  object.model.getLocation().setLatLngAlt(object.options.lat,
                                          object.options.long,
                                          object.options.alt);
  if (object.options.scale) {
    scale = ge.createScale('');
    scale.setX(object.options.scale);
    scale.setY(object.options.scale);
    scale.setZ(object.options.scale);
    object.model.setScale(scale);
  }
  var heading = 0;
  if (object.options.heading){
    heading = object.options.heading + 270;
  }
  object.model.getOrientation().setHeading(heading);
}

function distance(obj1, obj2){
  obj1_loc = obj1.model.getLocation();
  obj1_cart = V3.latLonAltToCartesian([obj1_loc.getLatitude(), obj1_loc.getLongitude(), obj1_loc.getAltitude()]);
  obj2_loc = obj2.model.getLocation();
  obj2_cart = V3.latLonAltToCartesian([obj2_loc.getLatitude(), obj2_loc.getLongitude(), obj2_loc.getAltitude()]);
  return Math.sqrt(
      Math.pow(obj1_cart[0] - obj2_cart[0], 2.0) +
      Math.pow(obj1_cart[1] - obj2_cart[1], 2.0) +
      Math.pow(obj1_cart[2] - obj2_cart[2], 2.0)
  );
}

function Truck(opts, model) {
  var me = this;
  // We do all our motion relative to a local coordinate frame that is
  // anchored not too far from us.  In this frame, the x axis points
  // east, the y axis points north, and the z axis points straight up
  // towards the sky.
  //
  // We periodically change the anchor point of this frame and
  // recompute the local coordinates.
  me.localAnchorLla = [0, 0, 0];
  me.localAnchorCartesian = V3.latLonAltToCartesian(me.localAnchorLla);
  me.localFrame = M33.identity();
  // Position, in local cartesian coords.
  me.pos = [0, 0, 0];
  // Velocity, in local cartesian coords.
  me.vel = [0, 0, 0];
  // Orientation matrix, transforming model-relative coords into local
  // coords.
  me.modelFrame = M33.identity();
  me.roll = 0;
  me.rollSpeed = 0;
  
  me.idleTimer = 0;
  me.fastTimer = 0;
  me.popupTimer = 0;

  ge.getOptions().setMouseNavigationEnabled(false);
  ge.getOptions().setFlyToSpeed(100);  // don't filter camera motion

  if (model){
    me.loadModel(model);
  }
  else {
    me.loadModel(car);
  }

  me.finishInit(opts);
}

function loadAnimationModel(model, frame){
  var me = this;
  me.data = model;
  me.placemark = ge.createPlacemark('');
  me.model = ge.createModel('');
  me.frame = 1;
  ge.getFeatures().appendChild(me.placemark);
  me.location = me.model.getLocation();
  me.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
  me.linker = ge.createLink('');
  me.linker.setHref(model.url + frame + '.dae');
  me.model.setLink(me.linker);
  me.placemark.setGeometry(me.model);
  me.orientation = me.model.getOrientation();
}

Truck.prototype.loadModel = function(model){
  var me = this;
  me.data = model;
  me.checking_road = false;
  me.placemark = ge.createPlacemark('');
  me.model = ge.createModel('');
  me.frame = 1;

  ge.getFeatures().appendChild(me.placemark);
  me.location = me.model.getLocation();
  me.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);

  me.linker = ge.createLink('');
  if (model.animated){
    me.linker.setHref(model.url + '1.dae');
    for (j = 1; j < 16; j++) {
        window['an' + j] = new loadAnimationModel(model, j);
    }
  }
  else {
    me.linker.setHref(model.url + '.dae');
  }
  me.model.setLink(me.linker);

  me.placemark.setGeometry(me.model);
  me.orientation = me.model.getOrientation();
  if (model.scale) {
    scale = ge.createScale('');
    scale.setX(model.scale);
    scale.setY(model.scale);
    scale.setZ(model.scale);
    me.model.setScale(scale);
  }
}

Truck.prototype.nextFrame = function() {
  var me = this;
  if (me.frame >= 16){
    me.frame = 1;
  }
  else {
    me.frame += 1;
  }
  if (window['an' + me.frame] == undefined) {
      window['an' + me.frame] = new loadAnimationModel(me.data, me.frame);
  }
  me.switchModel(me.data.url + me.frame + '.dae');
}

Truck.prototype.switchModel = function(url) {
  var me = this;
  console.log(url);
  me.linker = ge.createLink('');
  me.linker.setHref(url);
  me.model.setLink(me.linker);
}



Truck.prototype.finishInit = function(opts) {
  var me = this;

  if (opts) {
    var heading = INIT_LOC.heading;
    if (opts.heading){
      heading = opts.heading;
    }
    me.teleportTo(opts.lat, opts.lng, heading);
  } else {
    me.teleportTo(INIT_LOC.lat, INIT_LOC.lon, INIT_LOC.heading);
  }

  me.lastMillis = (new Date()).getTime();

  var href = window.location.href;

  me.shadow = ge.createGroundOverlay('');
  me.shadow.setVisibility(false);
  me.shadow.setIcon(ge.createIcon(''));
  me.shadow.setLatLonBox(ge.createLatLonBox(''));
  me.shadow.setAltitudeMode(ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);
  me.shadow.getIcon().setHref(PAGE_PATH + 'shadowrect.png');
  me.shadow.setVisibility(true);


  me.cameraCut();

  // Make sure keyboard focus starts out on the page.
  ge.getWindow().blur();

  // If the user clicks on the Earth window, try to restore keyboard
  // focus back to the page.
  google.earth.addEventListener(ge.getWindow(), "mouseup", function(event) {
    ge.getWindow().blur();
  });
}

leftButtonDown = false;
rightButtonDown = false;
gasButtonDown = false;
reverseButtonDown = false;
switchButtonDown = false;
shootButtonDown = false;

function keyDown(event) {
  if (!event) {
    event = window.event;
  }
  if (event.keyCode == 37) {  // Left.
    leftButtonDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // Right.
    rightButtonDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 38) {  // Up.
    gasButtonDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 40) {  // Down.
    reverseButtonDown = true;
    event.returnValue = false;
  } else if(event.keyCode == 83){
    switchButtonDown = true;
    event.returnValue = false;
  } else if(event.keyCode == 32){
    shootButtonDown = true;
    event.returnValue = false;
  }
   else {
    console.log(event.keyCode);
    return true;
  }
  return false;
}

function keyUp(event) {
  if (!event) {
    event = window.event;
  }
  if (event.keyCode == 37) {  // Left.
    leftButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // Right.
    rightButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 38) {  // Up.
    gasButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 40) {  // Down.
    reverseButtonDown = false;
    event.returnValue = false;
  }
  else if (event.keyCode == 32){
    shootButtonDown = false;
    event.returnValue = false;
  }
  return false;
}

function clamp(val, min, max) {
  if (val < min) {
    return min;
  } else if (val > max) {
    return max;
  }
  return val;
}

Truck.prototype.update = function() {
  var me = this;


  if (scene.player1 === me && gasButtonDown && me.data.animated){
    me.nextFrame();
  }
  var now = (new Date()).getTime();
  // dt is the delta-time since last tick, in seconds
  var dt = (now - me.lastMillis) / 1000.0;
  if (dt > 0.25) {
    dt = 0.25;
  }
  me.lastMillis = now;

  var c0 = 1;
  var c1 = 0;

  var gpos = V3.add(me.localAnchorCartesian,
                    M33.transform(me.localFrame, me.pos));
  var lla = V3.cartesianToLatLonAlt(gpos);

  if (V3.length([me.pos[0], me.pos[1], 0]) > 100) {
    // Re-anchor our local coordinate frame whenever we've strayed a
    // bit away from it.  This is necessary because the earth is not
    // flat!
    me.adjustAnchor();
  }

  var dir = me.modelFrame[1];
  var up = me.modelFrame[2];

  var absSpeed = V3.length(me.vel);

  var groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
  var airborne = (groundAlt + 0.30 < me.pos[2]);
  var steerAngle = 0;
  var right = me.modelFrame[0];
  
  if (me.data.steering){
    // Steering.
    if (scene.player1 === me && (leftButtonDown || rightButtonDown)) {
      var TURN_SPEED_MIN = 60.0;  // radians/sec
      var TURN_SPEED_MAX = 100.0;  // radians/sec
   
      var turnSpeed;

      // Degrade turning at higher speeds.
      //
      //           angular turn speed vs. vehicle speed
      //    |     -------
      //    |    /       \-------
      //    |   /                 \-------
      //    |--/                           \---------------
      //    |
      //    +-----+-------------------------+-------------- speed
      //    0    SPEED_MAX_TURN           SPEED_MIN_TURN
      var SPEED_MAX_TURN = 25.0;
      var SPEED_MIN_TURN = 120.0;
      if (absSpeed < SPEED_MAX_TURN) {
        turnSpeed = TURN_SPEED_MIN + (TURN_SPEED_MAX - TURN_SPEED_MIN)
                     * (SPEED_MAX_TURN - absSpeed) / SPEED_MAX_TURN;
        turnSpeed *= (absSpeed / SPEED_MAX_TURN);  // Less turn as truck slows
      } else if (absSpeed < SPEED_MIN_TURN) {
        turnSpeed = TURN_SPEED_MIN + (TURN_SPEED_MAX - TURN_SPEED_MIN)
                    * (SPEED_MIN_TURN - absSpeed)
                    / (SPEED_MIN_TURN - SPEED_MAX_TURN);
      } else {
        turnSpeed = TURN_SPEED_MIN;
      }
      if (leftButtonDown) {
        steerAngle = turnSpeed * dt * Math.PI / 180.0;
      }
      if (rightButtonDown) {
        steerAngle = -turnSpeed * dt * Math.PI / 180.0;
      }
    }
  }
  else {
    if (scene.player1 === me && (leftButtonDown || rightButtonDown)){
      if (leftButtonDown) {
          n = 1;
      } else if (rightButtonDown) {
          n = -1;
      }
      steerAngle = n * me.data.turn_speed * dt * Math.PI / 180;
      right = V3.rotate(right, up, steerAngle); //head   
    }
  }
  
  // Turn.
  var newdir = airborne ? dir : V3.rotate(dir, up, steerAngle);
  me.modelFrame = M33.makeOrthonormalFrame(newdir, up);
  dir = me.modelFrame[1];
  up = me.modelFrame[2];

  var forwardSpeed = 0;
  
  if (!airborne) {
    // TODO: if we're slipping, transfer some of the slip
    // velocity into forward velocity.

    // Damp sideways slip.  Ad-hoc frictiony hack.
    //
    // I'm using a damped exponential filter here, like:
    // val = val * c0 + val_new * (1 - c0)
    //
    // For a variable time step:
    //  c0 = exp(-dt / TIME_CONSTANT)
    var slip = V3.dot(me.vel, right);
    c0 = Math.exp(-dt / 0.5);
    me.vel = V3.sub(me.vel, V3.scale(right, slip * (1 - c0)));

    // Apply engine/reverse accelerations.
    forwardSpeed = V3.dot(dir, me.vel);
    if (me.data.steering){
      if (scene.player1 === me && gasButtonDown) {
        // Accelerate forwards.
        if (forwardSpeed < me.data.max_speed){
          me.vel = V3.add(me.vel, V3.scale(dir, me.data.accel * dt));
        }
      } else if (scene.player1 === me && reverseButtonDown) {
        if (forwardSpeed > -me.data.max_rev_speed)
          me.vel = V3.add(me.vel, V3.scale(dir, -me.data.decel * dt));
      }
    }
    else {
      if (scene.player1 === me && gasButtonDown) {
          if (!airborne) {
              me.vel = [0, 0, 0];
          }
          me.vel = V3.add(me.vel, V3.scale(dir, ((150 + 35) / (3)) * 1 * dt));
      } else if (!airborne) {
          me.vel = [0, 0, 0];
      }
      else if (scene.player1 === me && reverseButtonDown){
        me.vel = [0, 0, 0];
      }
    }
  }

  for (i = 0; i < scene.cars.length; i++){
    car = scene.cars[i];
    if (car !== me){
      if (distance(me, car) < 3){
        me_loc = me.model.getLocation();
        me_cart = V3.latLonAltToCartesian([me_loc.getLatitude(), me_loc.getLongitude(), me_loc.getAltitude()]);
        car_loc = car.model.getLocation();
        car_cart = V3.latLonAltToCartesian([car_loc.getLatitude(), car_loc.getLongitude(), car_loc.getAltitude()]);
        vec = V3.sub(me_cart, car_cart);

        me.vel = V3.add(me.vel, V3.scale(vec, 1 * V3.length(me.vel) * dt));
      }
    }
  }

  me.modelFrame = M33.makeOrthonormalFrame(dir, up);
  right = me.modelFrame[0];
  dir = me.modelFrame[1];
  up = me.modelFrame[2];

  // Air drag.
  //
  // Fd = 1/2 * rho * v^2 * Cd * A.
  // rho ~= 1.2 (typical conditions)
  // Cd * A = 3 m^2 ("drag area")
  //
  // I'm simplifying to:
  //
  // accel due to drag = 1/Mass * Fd
  // with Milktruck mass ~= 2000 kg
  // so:
  // accel = 0.6 / 2000 * 3 * v^2
  // accel = 0.0009 * v^2
  if (me.data.steering){
    absSpeed = V3.length(me.vel);
    if (absSpeed > 0.01) {
      var veldir = V3.normalize(me.vel);
      var DRAG_FACTOR = 0.00090;
      var drag = absSpeed * absSpeed * DRAG_FACTOR;

      // Some extra constant drag (rolling resistance etc) to make sure
      // we eventually come to a stop.
      var CONSTANT_DRAG = 2.0;
      drag += CONSTANT_DRAG;

      if (drag > absSpeed) {
        drag = absSpeed;
      }

      me.vel = V3.sub(me.vel, V3.scale(veldir, drag * dt));
    }
  }

  // Gravity
  me.vel[2] -= me.data.gravity * dt;

  // Move.
  var deltaPos = V3.scale(me.vel, dt);
  me.pos = V3.add(me.pos, deltaPos);

  gpos = V3.add(me.localAnchorCartesian,
                M33.transform(me.localFrame, me.pos));
  lla = V3.cartesianToLatLonAlt(gpos);
  
  // Don't go underground.
  groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
  if (me.pos[2] < groundAlt) {
    me.pos[2] = groundAlt;
  }

  var normal = estimateGroundNormal(gpos, me.localFrame);
  
  if (!airborne) {
    // Cancel velocity into the ground.
    //
    // TODO: would be fun to add a springy suspension here so
    // the truck bobs & bounces a little.
    var speedOutOfGround = V3.dot(normal, me.vel);
    if (speedOutOfGround < 0) {
      me.vel = V3.add(me.vel, V3.scale(normal, -speedOutOfGround));
    }

    // Make our orientation follow the ground.
    c0 = Math.exp(-dt / 0.25);
    c1 = 1 - c0;
    var blendedUp = V3.normalize(V3.add(V3.scale(up, c0),
                                        V3.scale(normal, c1)));
    me.modelFrame = M33.makeOrthonormalFrame(dir, blendedUp);
  }

  // Propagate our state into Earth.
  gpos = V3.add(me.localAnchorCartesian,
                M33.transform(me.localFrame, me.pos));
  lla = V3.cartesianToLatLonAlt(gpos);
  me.model.getLocation().setLatLngAlt(lla[0], lla[1], lla[2]);

  var newhtr = M33.localOrientationMatrixToHeadingTiltRoll(me.modelFrame);

  var absRoll = newhtr[2];
  if (me.data.steering){
    // Compute roll according to steering.
    // TODO: this would be even more cool in 3d.
    me.rollSpeed += steerAngle * forwardSpeed * me.data.steer_roll;
    // Spring back to center, with damping.
    me.rollSpeed += (me.data.roll_spring * -me.roll + me.data.roll_damp * me.rollSpeed);
    me.roll += me.rollSpeed * dt;
    me.roll = clamp(me.roll, -30, 30);
    absRoll += me.roll;
  }

  me.orientation.set(newhtr[0] + 180, newhtr[1], absRoll);

  var latLonBox = me.shadow.getLatLonBox();
  var radius = .00005;
  latLonBox.setNorth(lla[0] - radius);
  latLonBox.setSouth(lla[0] + radius);
  latLonBox.setEast(lla[1] - radius);
  latLonBox.setWest(lla[1] + radius);
  latLonBox.setRotation(-newhtr[0]);

  if (scene.player1 === me) {
    me.cameraFollow(dt, gpos, me.localFrame);
  }

  if (scene.player1 === me && !me.checking_road) {
    me.checking_road = true;
    check_points(me, lla[1], lla[0]);
  }
};


// TODO: would be nice to have globe.getGroundNormal() in the API.
function estimateGroundNormal(pos, frame) {
  // Take four height samples around the given position, and use it to
  // estimate the ground normal at that position.
  //  (North)
  //     0
  //     *
  //  2* + *3
  //     *
  //     1
  var pos0 = V3.add(pos, frame[0]);
  var pos1 = V3.sub(pos, frame[0]);
  var pos2 = V3.add(pos, frame[1]);
  var pos3 = V3.sub(pos, frame[1]);
  var globe = ge.getGlobe();
  function getAlt(p) {
    var lla = V3.cartesianToLatLonAlt(p);
    return globe.getGroundAltitude(lla[0], lla[1]);
  }
  var dx = getAlt(pos1) - getAlt(pos0);
  var dy = getAlt(pos3) - getAlt(pos2);
  var normal = V3.normalize([dx, dy, 2]);
  return normal;
}

// Cut the camera to look at me.
Truck.prototype.cameraCut = function() {
  var me = this;
  var lo = me.model.getLocation();
  var la = ge.createLookAt('');
  la.set(lo.getLatitude(), lo.getLongitude(),
         10 /* altitude */,
         ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR,
         fixAngle(180 + me.model.getOrientation().getHeading() + 45),
         80, /* tilt */
         50 /* range */         
         );
  ge.getView().setAbstractView(la);
};

Truck.prototype.cameraFollow = function(dt, truckPos, localToGlobalFrame) {
  var me = this;

  var c0 = Math.exp(-dt / 0.5);
  var c1 = 1 - c0;

  var la = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR);

  var camHeading = fixAngle(la.getHeading() + 180);
  var truckHeading = me.model.getOrientation().getHeading();

  var deltaHeading = fixAngle(truckHeading - camHeading);
  var heading = camHeading + c1 * deltaHeading;
  heading = fixAngle(heading);

  var headingRadians = heading / 180 * Math.PI;
  
  var headingDir = V3.rotate(localToGlobalFrame[1], localToGlobalFrame[2],
                             -headingRadians);
  var camPos = V3.add(truckPos, V3.scale(localToGlobalFrame[2], CAM_HEIGHT));
  camPos = V3.add(camPos, V3.scale(headingDir, TRAILING_DISTANCE));
  var camLla = V3.cartesianToLatLonAlt(camPos);
  var camLat = camLla[0];
  var camLon = camLla[1];
  var camAlt = camLla[2] - ge.getGlobe().getGroundAltitude(camLat, camLon);

  la.set(camLat, camLon, camAlt, ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR, 
        fixAngle(heading + 180), 80 /*tilt*/, 0 /*range*/);
  ge.getView().setAbstractView(la);
};

// heading is optional.
Truck.prototype.teleportTo = function(lat, lon, heading) {
  var me = this;
  me.model.getLocation().setLatitude(lat);
  me.model.getLocation().setLongitude(lon);
  me.model.getLocation().setAltitude(ge.getGlobe().getGroundAltitude(lat, lon));
  if (heading == null) {
    heading = 0;
  }
  me.vel = [0, 0, 0];

  me.localAnchorLla = [lat, lon, 0];
  me.localAnchorCartesian = V3.latLonAltToCartesian(me.localAnchorLla);
  me.localFrame = M33.makeLocalToGlobalFrame(me.localAnchorLla);
  me.modelFrame = M33.identity();
  me.modelFrame[0] = V3.rotate(me.modelFrame[0], me.modelFrame[2], -heading);
  me.modelFrame[1] = V3.rotate(me.modelFrame[1], me.modelFrame[2], -heading);
  me.pos = [0, 0, ge.getGlobe().getGroundAltitude(lat, lon)];

  me.cameraCut();

  // make sure to not start airborne
  if (PREVENT_START_AIRBORNE) {
    window.setTimeout(function() {
      var groundAlt = ge.getGlobe().getGroundAltitude(lat, lon);
      var airborne = (groundAlt + 0.30 < me.pos[2]);
      if (airborne)
        me.teleportTo(lat, lon, heading);
    }, 500);
  }
};

Truck.prototype.dropAt = function(lat, lon, heading) {
  var me = this;
  me.model.getLocation().setLatitude(lat);
  me.model.getLocation().setLongitude(lon);
  me.model.getLocation().setAltitude(ge.getGlobe().getGroundAltitude(lat, lon) + 8.0);
  if (heading == null) {
    heading = 0;
  }
  me.vel = [0, 0, 0];

  me.localAnchorLla = [lat, lon, 0];
  me.localAnchorCartesian = V3.latLonAltToCartesian(me.localAnchorLla);
  me.localFrame = M33.makeLocalToGlobalFrame(me.localAnchorLla);
  me.modelFrame = M33.identity();
  me.modelFrame[0] = V3.rotate(me.modelFrame[0], me.modelFrame[2], -heading);
  me.modelFrame[1] = V3.rotate(me.modelFrame[1], me.modelFrame[2], -heading);
  me.pos = [0, 0, ge.getGlobe().getGroundAltitude(lat, lon) + 8.0];

  me.cameraCut();
};

// Move our anchor closer to our current position.  Retain our global
// motion state (position, orientation, velocity).
Truck.prototype.adjustAnchor = function() {
  var me = this;
  var oldLocalFrame = me.localFrame;

  var globalPos = V3.add(me.localAnchorCartesian,
                         M33.transform(oldLocalFrame, me.pos));
  var newAnchorLla = V3.cartesianToLatLonAlt(globalPos);
  newAnchorLla[2] = 0;  // For convenience, anchor always has 0 altitude.

  var newAnchorCartesian = V3.latLonAltToCartesian(newAnchorLla);
  var newLocalFrame = M33.makeLocalToGlobalFrame(newAnchorLla);

  var oldFrameToNewFrame = M33.transpose(newLocalFrame);
  oldFrameToNewFrame = M33.multiply(oldFrameToNewFrame, oldLocalFrame);

  var newVelocity = M33.transform(oldFrameToNewFrame, me.vel);
  var newModelFrame = M33.multiply(oldFrameToNewFrame, me.modelFrame);
  var newPosition = M33.transformByTranspose(
      newLocalFrame,
      V3.sub(globalPos, newAnchorCartesian));

  me.localAnchorLla = newAnchorLla;
  me.localAnchorCartesian = newAnchorCartesian;
  me.localFrame = newLocalFrame;
  me.modelFrame = newModelFrame;
  me.pos = newPosition;
  me.vel = newVelocity;
}

// Keep an angle in [-180,180]
function fixAngle(a) {
  while (a < -180) {
    a += 360;
  }
  while (a > 180) {
    a -= 360;
  }
  return a;
}

var dir_queue = []
var calling = false;
setInterval(function(){
  if (dir_queue.length > 0 && !calling){
    calling = true;
    call = dir_queue.shift();
    google.maps.Event.clearListeners(DS_directions, 'load');
    google.maps.Event.addListener(DS_directions, 'load', function(res){calling = false; call.cb(res)});
    if (call.err){
      google.maps.Event.addListener(DS_directions, 'error', function(){calling = false; call.err()});
    }
    DS_directions.load(call.call, {getSteps: true, getPolyline: true});
  }
  },50);
function get_directions(call, cb, err){
  dir_queue.push({call: call, cb: cb, err: err});
}
function float_cmp(a, b){
  return Math.abs(a - b) < 0.00012;
}
function check_points(model, x, y){
  get_directions('from: ' + y + ', ' + x + ' to: ' + y + ', ' + x, DS_directionsLoaded(model, x, y), function() {model.checking_road = false;});
}
function DS_directionsLoaded(model, x, y){
  return function(){
    var new_x = DS_directions.getRoute(0).getStep(0).getLatLng().x ;
    var new_y = DS_directions.getRoute(0).getStep(0).getLatLng().y;
    if (float_cmp(x, new_x)
     && float_cmp(y, new_y)){
     }
    else {
      model.dropAt(new_y, new_x, 90);
      model.vel = [0,0,0];
    }
    model.checking_road = false;
  }
}
