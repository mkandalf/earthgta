google.load("earth", "1");
//DOMAINER='localhost/walk/'; 
DOMAINER = 'chrisdiamanti.com/walk/';
startLat = 46.756351;
startLon = 7.629882;
fps = 0;
reLoading = false;
ge = null;
walker = null;
window.Walker = null;
heading = 0;
modScaler = 2;
PREVENT_START_AIRBORNE = true;
GRAVITY = 255;
ACCEL = 15;
newhtr = [0, 80, 0];
modHeading = 0;
leftTurn = false;
rightTurn = false;
walkForward = false;
groundAlt = 0;
airborne = false;
camStop = false;
lla = [0, 0, 0];
newhtr = [0, 0, 0];
absSpeed = 0;
camRoll = 0;
camTilt = 70;
camHeight = 6;
camInc = 20;
camDist = 10;
ticker = 0;
k = 1;
frontView = true;
curLat = 0;
curLon = 0;
tele = false;
camLat = 0;
camLon = 0;
cAlt = modScaler * 8;
changeScaler = false;
scaleUp = false;
trailUp = false;
trailDown = false;
camUp = false;
camDown = false;
fr = 0;
frN = -1;
wshad = null;
kj = 0;
vr = 1;
focuser = true;

function failureCallback(errorCode) {}

function init() {
    google.earth.createInstance("map3d", initCallback, initCallback);
}

function initCallback(instance) {
    ge = instance;
    ge.getWindow().setVisibility(true);
    google.earth.addEventListener(ge.getGlobe(), 'click', curLatLon);
    Walker = new Walk();
}

function modd(modName, mscale) {
    f = this;
    f.plac = ge.createPlacemark('');
    f.model = ge.createModel('');
    ge.getFeatures().appendChild(f.plac);
    f.loca = f.model.getLocation();
    f.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
    f.linker = ge.createLink('');
    f.linker.setHref('http://' + DOMAINER + modName + '.dae');
    f.model.setLink(f.linker);
    f.plac.setGeometry(f.model);
    f.ori = f.model.getOrientation();
    scale = ge.createScale('');
    scale.setX(mscale);
    scale.setY(mscale);
    scale.setZ(mscale);
    f.model.setScale(scale);
}

function modset(f, head, tilt, roll, lat, lon, alt) {
    window[f].ori.set(head, tilt, roll);
    window[f].loca.setLatLngAlt(lat, lon, alt);
}

function shadd() {
    wshad = ge.createGroundOverlay('');
    wshad.setIcon(ge.createIcon(''));
    wshad.setLatLonBox(ge.createLatLonBox(''));
    wshad.setAltitudeMode(ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);
    wshad.getIcon().setHref('http://' + DOMAINER + 'walkShad6.png');
    ge.getFeatures().appendChild(wshad);
}

function moveShadow(wshad, lat, lon, r0, head) {
    boxShad = wshad.getLatLonBox();
    boxShad.setNorth(lat - r0);
    boxShad.setSouth(lat + r0);
    boxShad.setEast(lon - r0);
    boxShad.setWest(lon + r0);
    boxShad.setRotation(head);
}

function switchModel(modName) {
    l = ge.createLink('');
    l.setHref('http://' + DOMAINER + modName + '.dae');
    walker.model.setLink(l);
}

function changeScale(modScaler) {
    scale = ge.createScale('');
    scale.setX(modScaler);
    scale.setY(modScaler);
    scale.setZ(modScaler);
    walker.model.setScale(scale);
}

function getAlt(p) {
    galla = V3.cartesianToLatLonAlt(p);
    return ge.getGlobe().getGroundAltitude(galla[0], galla[1]);
}

function estimateGroundNormal(pos, frame) {
    pos0 = V3.add(pos, frame[0]);
    pos1 = V3.sub(pos, frame[0]);
    pos2 = V3.add(pos, frame[1]);
    pos3 = V3.sub(pos, frame[1]);
    dx = getAlt(pos1) - getAlt(pos0);
    dy = getAlt(pos3) - getAlt(pos2);
    normal = V3.normalize([dx, dy, 2]);
    return normal;
}

//camera 
Walk.prototype.cameraFollow = function (dt, gPos, localFrame) {
    la = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR);

    modHeading = walker.ori.getHeading();

    c1 = 1 - Math.exp(-dt / .25);

    if (frontView) {
        fr = 0;
        frN = -1;
    } else {
        fr = 180;
        frN = 1;
    }
    camHeading = fixAngle(la.getHeading() + fr);
    deltaHeading = fixAngle(modHeading - camHeading);

    camHeading = fixAngle(camHeading + c1 * deltaHeading);
    headingRadians = camHeading / 180 * Math.PI;
    headingDir = V3.rotate(localFrame[1], localFrame[2], -headingRadians);

    if (trailUp) {
        camDist = Math.pow(camDist, 1.01);
    } else if (trailDown) {
        camDist -= Math.pow(camDist, 1.01) - camDist
    }
    cd = camDist * modScaler;

    if (camUp) {
        camHeight = Math.pow(camHeight, 1.03);
    } else if (camDown) {
        camHeight -= Math.pow(camHeight, 1.03) - camHeight
    }

    cAlter = la.getAltitude() + ge.getGlobe().getGroundAltitude(camLat, camLon);
    cmDif = cAlter - lla[2];
    hyp = Math.sqrt((cmDif * cmDif) + (cd * cd));
    na = Math.acos(cmDif / hyp);
    na = (na / Math.PI) * 180;
    camTilt = fixAngle(70 - (56 - na));

    camPos = V3.add(gPos, V3.scale(localFrame[2], camHeight));
    camPos = V3.add(camPos, V3.scale(headingDir, cd * frN));
    camLla = V3.cartesianToLatLonAlt(camPos);
    camLat = camLla[0];
    camLon = camLla[1];
    camAlt = camLla[2] - ge.getGlobe().getGroundAltitude(camLat, camLon);
    cAlt = modScaler * 5 + (camAlt / 5);
    la.set(camLat, camLon, cAlt, ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR, fixAngle(camHeading + fr), camTilt, camRoll);
    ge.getView().setAbstractView(la);
};

Walk.prototype.teleportTo = function (lat, lon, heading) {
    walker.loca.setLatitude(lat);
    walker.loca.setLongitude(lon);
    m.vel = [0, 0, 0];
    m.localAnchorLla = [lat, lon, 0];
    m.localAnchorCartesian = V3.latLonAltToCartesian(m.localAnchorLla);
    m.localFrame = M33.makeLocalToGlobalFrame(m.localAnchorLla);
    m.modelFrame = M33.identity();
};

Walk.prototype.adjustAnchor = function () {
    oldLocalFrame = m.localFrame;
    globalPos = V3.add(m.localAnchorCartesian, M33.transform(oldLocalFrame, m.pos));
    newAnchorLla = V3.cartesianToLatLonAlt(globalPos);
    newAnchorLla[2] = 0;
    newAnchorCartesian = V3.latLonAltToCartesian(newAnchorLla);
    newLocalFrame = M33.makeLocalToGlobalFrame(newAnchorLla);
    oldFrameToNewFrame = M33.transpose(newLocalFrame);
    oldFrameToNewFrame = M33.multiply(oldFrameToNewFrame, oldLocalFrame);
    newVelocity = M33.transform(oldFrameToNewFrame, m.vel);
    newModelFrame = M33.multiply(oldFrameToNewFrame, m.modelFrame);
    newPosition = M33.transformByTranspose(newLocalFrame, V3.sub(globalPos, newAnchorCartesian));
    m.localAnchorLla = newAnchorLla;
    m.localAnchorCartesian = newAnchorCartesian;
    m.localFrame = newLocalFrame;
    m.modelFrame = newModelFrame;
    m.pos = newPosition;
    m.vel = newVelocity;
}

function clamp(val, min, max) {
    if (val < min) {
        return min;
    } else if (val > max) {
        return max;
    }
    return val;
}

function fixAngle(a) {
    while (a < -180) {
        a += 360;
    }
    while (a > 180) {
        a -= 360;
    }
    return a;
}

function Walk() {
    m = this;
    m.localAnchorLla = [0, 0, 0];
    m.localAnchorCartesian = V3.latLonAltToCartesian(m.localAnchorLla);
    m.localFrame = M33.identity();
    m.pos = [0, 0, 0];
    m.vel = [0, 0, 0];
    m.modelFrame = M33.identity();
    ge.getOptions().setFlyToSpeed(100);
    //ge.getOptions().setAutoGroundLevelViewEnabled(false);
    walker = new modd('an1', modScaler);
    for (j = 1; j < 16; j++) {
        window['an' + j] = new modd('an' + j, modScaler);
    }
    m.teleportTo(startLat, startLon, heading);
    m.then = (new Date()).getTime();
    m.thenner = m.then;
    google.earth.addEventListener(ge, "frameend", function () {
        m.tick();
    });
    addEve();
}

function addEve() {
    google.earth.addEventListener(ge.getWindow(), 'mousedown', eH);
    google.earth.addEventListener(ge.getWindow(), 'mouseup', eH);
    google.earth.addEventListener(ge.getWindow(), 'click', eH);
}
eH = function (event) {
    el('focuser').focus();
};

function curLatLon(event) {
    curLat = Math.round(event.getLatitude() * 1000000) / 1000000;
    curLon = Math.round(event.getLongitude() * 1000000) / 1000000;
}

function reloader() {
    reLoading = true;
    tqo = setTimeout("window.location.reload()", 5000);
}

function keyDown(event) {
    if (!event) {
        event = window.event;
        return true;
    } else {
        event.returnValue = false;
    }
    switch (event.keyCode) {
    case 38:
        walkForward = true; //up arrow
        break;
    case 40:
        walkForward = false; //down arrow
        break;
    case 37:
        leftTurn = true; //left arrow
        break;
    case 39:
        rightTurn = true; //right arrow
        break;
    case 75:
        camStop = !camStop; //k
        break;
    case 84:
        if (curLat != 0) {
            m.vel = [0, 0, 0];
            m.teleportTo(curLat, curLon, newhtr[0]);
        } //t 
        break;
    case 70:
        frontView = !frontView; //f 
        break;
    case 86:
        changeScaler = true;
        scaleUp = true; //v
        break;
    case 66:
        changeScaler = true;
        scaleUp = false; //b
        break;
    case 68:
        trailUp = true; //d 
        break;
    case 83:
        trailDown = true; //s
        break;
    case 85:
        camUp = true; //u
        break;
    case 73:
        camDown = true; //i
        break;
    }
    return false;
}

//for keyUp events 

function keyUp(event) {
    if (!event) {
        event = window.event;
        return true;
    } else {
        event.returnValue = false;
    }
    switch (event.keyCode) {
    case 37:
        leftTurn = false;
        break;
    case 39:
        rightTurn = false;
        break;
    case 38: //walkForward=false;
        break;
    case 40:
        walkForward = false;
        break;
    case 86:
        changeScaler = false;
        break;
    case 66:
        changeScaler = false;
        break;
    case 68:
        trailUp = false;
        break;
    case 83:
        trailDown = false;
        break;
    case 85:
        camUp = false; //u
        break;
    case 73:
        camDown = false; //i
        break;
    }
    return false;
}

function el(e) {
    return document.getElementById(e);
}

function da(a, b) {
    el(a).innerHTML = b;
}

Walk.prototype.tick = function () {
    if (reLoading) {
        window.clearTimeout(tqo);
        reLoading = false;
    }
    if (focuser) {
        el('focuser').focus();
        focuser = false;
    }
    tli = window.setTimeout("el('loadIn').style.display='none';", 10000);
    now = (new Date()).getTime();
    dt = (now - m.then) / 1000;
    if (dt > 0.25) {
        dt = 0.25;
    }
    m.then = now;
    ticker++;
    if (now - m.thenner > 1000) {
        fps = ticker;
        m.thenner = now;
        ticker = 0;
    }
    da('frames', 'fps: ' + fps);

    if (walkForward && kj == vr) {
        if (k < 16) {
            k++;
        } else {
            k = 1;
        }
        if (window['an' + k] == undefined) {
            window['an' + k] = new modd('an' + k, modScaler);
        }
        switchModel('an' + k);
    }
    kj++;
    if (kj > vr) {
        kj = 0;
    }

    if (wshad == null) {
        shadd();
    }

    if (frontView) {
        el('fr').value = 'Rear View';
    } else {
        el('fr').value = 'Front View';
    }
    if (camStop) {
        el('sc').value = 'Start Camera';
    } else {
        el('sc').value = 'Stop Camera';
    }
    if (walkForward) {
        el('walk').value = 'Stop Walking';
    } else {
        el('walk').value = 'Start Walking';
    }

    if (changeScaler) {
        if (scaleUp) {
            modScaler = Math.pow(modScaler, 1.01);
        } else if (modScaler > 1.1) {
            modScaler -= Math.pow(modScaler, 1.01) - modScaler;
        }
        changeScale(modScaler);
    }

    c0 = 1;
    c1 = 0;
    gpos = V3.add(m.localAnchorCartesian, M33.transform(m.localFrame, m.pos));
    lla = V3.cartesianToLatLonAlt(gpos);
    groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
    m.pos[2] = groundAlt;
    airborne = (groundAlt + .3 < m.pos[2]);
    if (V3.length([m.pos[0], m.pos[1], 0]) > 100) {
        m.adjustAnchor();
    }

    right = m.modelFrame[0];
    dir = m.modelFrame[1];
    up = m.modelFrame[2];

    //turning 
    if (leftTurn || rightTurn) {
        if (leftTurn) {
            n = 1;
        } else if (rightTurn) {
            n = -1;
        }
        steerAngle = n * 25 * dt * Math.PI / 180;
        right = V3.rotate(right, up, steerAngle); //head   
        dir = V3.rotate(dir, up, steerAngle);
    }

    // prevent lateral velocity 
    slip = V3.dot(m.vel, right);
    c0 = Math.exp(-dt / 0.000001);
    m.vel = V3.sub(m.vel, V3.scale(right, slip * (1 - c0)));
    forwardSpeed = V3.dot(right, m.vel);

    //walking
    if (walkForward) {
        if (!airborne) {
            m.vel = [0, 0, 0];
        }
        m.vel = V3.add(m.vel, V3.scale(dir, -((150 + (fps * 2)) / (vr + 1)) * modScaler * dt));
    } else if (!airborne) {
        m.vel = [0, 0, 0];
    }
    newhtr = M33.localOrientationMatrixToHeadingTiltRoll(m.modelFrame);

    m.modelFrame = M33.makeOrthonormalFrame(dir, up);
    right = m.modelFrame[0];
    dir = m.modelFrame[1];
    up = m.modelFrame[2];

    m.vel[2] -= GRAVITY * dt;
    deltaPos = V3.scale(m.vel, dt);
    m.pos = V3.add(m.pos, deltaPos);
    if (m.pos[2] < groundAlt + 1) {
        m.pos[2] = groundAlt;
    }

    gpos = V3.add(m.localAnchorCartesian, M33.transform(m.localFrame, m.pos));
    lla = V3.cartesianToLatLonAlt(gpos);
    groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);

    if (!airborne) {
        normal = estimateGroundNormal(gpos, m.localFrame);
        speedOutOfGround = V3.dot(normal, m.vel);
        if (speedOutOfGround < 0) {
            m.vel = V3.add(m.vel, V3.scale(normal, -speedOutOfGround));
        }
        absSpeed = V3.length(m.vel);
        c0 = Math.exp(-dt / .25);
        c1 = 1 - c0;
        blendedUp = V3.normalize(V3.add(V3.scale(up, c0), V3.scale(normal, c1)));
        m.modelFrame = M33.makeOrthonormalFrame(dir, blendedUp);
    }
    if (m.pos[2] < groundAlt + 1) {
        m.pos[2] = groundAlt;
    }
    newhtr = M33.localOrientationMatrixToHeadingTiltRoll(m.modelFrame);

    modset('walker', newhtr[0], 0, 0, lla[0], lla[1], lla[2]);
    moveShadow(wshad, lla[0], lla[1], .00004 * modScaler, -newhtr[0]);

    if (!camStop) {
        m.cameraFollow(dt, gpos, m.localFrame);
    }
};
