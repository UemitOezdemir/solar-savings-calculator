"use strict";

function bearingDeg(from, to) {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return ((θ + 360) % 360) - 90;
}

function setCheckCoords(start, end, angle) {
  const dist = 0.25;

  const firstCheck = L.latLng((end.lat + start.lat) / 2, (end.lng + start.lng) / 2);

  const secondCheck = L.latLng((end.lat + firstCheck.lat) / 2, (end.lng + firstCheck.lng) / 2);

  const thirdCheck = L.latLng((firstCheck.lat + start.lat) / 2, (firstCheck.lng + start.lng) / 2);

  const firstCheckCoord = computeOffset(firstCheck, dist, angle);
  const secondCheckCoord = computeOffset(secondCheck, dist, angle);
  const thirdCheckCoord = computeOffset(thirdCheck, dist, angle);

  return [firstCheckCoord, secondCheckCoord, thirdCheckCoord];
}

function toLatLng(p) {
  return p instanceof L.LatLng ? p : L.latLng(p.lat, p.lng);
}

function computeHeading(from, to) {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = (Math.atan2(y, x) * 180) / Math.PI;

  if (θ > 180) θ -= 360;
  if (θ <= -180) θ += 360;
  return θ;
}

function computeOffset(latlng, distanceMeters, bearingDeg) {
  const R = 6378137;
  const δ = distanceMeters / R;
  const θ = (bearingDeg * Math.PI) / 180;

  const φ1 = (latlng.lat * Math.PI) / 180;
  const λ1 = (latlng.lng * Math.PI) / 180;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return L.latLng((φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI);
}

function pointInPolygon(point, polygon) {
  const vs = polygon.getLatLngs().flat();
  const x = point.lng,
    y = point.lat;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng,
      yi = vs[i].lat;
    const xj = vs[j].lng,
      yj = vs[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function getRotatedPolygonCoords(bottom, top, path) {
  const angleClicked = computeHeading(bottom, top);
  const rotatedPath = [];

  path.forEach((coord) => {
    const angleCoord = computeHeading(bottom, coord);
    const distance = bottom.distanceTo(coord);
    const newBearing = angleCoord - angleClicked;

    rotatedPath.push(computeOffset(bottom, distance, newBearing));
  });

  return rotatedPath;
}

function getBounding(start, end, path) {
  const rotatedPath = getRotatedPolygonCoords(start, end, path);

  let n = start,
    e = start,
    s = start,
    w = start;

  for (let i = 0; i < rotatedPath.length; i++) {
    const p = rotatedPath[i];

    if (p.lat > n.lat && p.lat > start.lat) n = p;
    if (p.lat < s.lat && p.lat < start.lat) s = p;
    if (p.lng > e.lng && p.lng > start.lng) e = p;
    if (p.lng < w.lng && p.lng < start.lng) w = p;
  }

  n = L.latLng(n.lat, start.lng);
  e = L.latLng(start.lat, e.lng);
  s = L.latLng(s.lat, start.lng);
  w = L.latLng(start.lat, w.lng);

  const distanceNorth = +start.distanceTo(n).toFixed(2);
  const distanceEast = +start.distanceTo(e).toFixed(2);
  const distanceSouth = +start.distanceTo(s).toFixed(2);
  const distanceWest = +start.distanceTo(w).toFixed(2);

  return { distanceNorth, distanceEast, distanceSouth, distanceWest };
}

function getOffsetY(
  distanceEast,
  distanceWest,
  moduleHeight,
  offsetX,
  tiltedPerpendicularAngle,
  polygon,
) {
  const roofHeight = Math.max(distanceEast, distanceWest);
  let offsetY = +((roofHeight - Math.floor(roofHeight / moduleHeight) * moduleHeight) / 2).toFixed(
    2,
  );

  const offsetCoordY = computeOffset(offsetX, offsetY, tiltedPerpendicularAngle);

  if (!pointInPolygon(offsetCoordY, polygon)) {
    offsetY = -offsetY;
  }

  return offsetY;
}

function getOffsetCoordsX(distance, moduleWidth, start, heading) {
  const offset = +((distance - Math.floor(distance / moduleWidth) * moduleWidth) / 2).toFixed(2);
  const offsetCoord = computeOffset(start, offset, heading);

  return offsetCoord;
}

function generateValidModules(polygon, start, end, heading, roofAngle, tiltAngle, moduleWidth, moduleHeight) {
  const perpendicularAngle = heading + 90;
  const tiltedPerpendicularAngle = perpendicularAngle + tiltAngle;
  const projectedModuleHeight = calculateProjectedHeight(roofAngle, moduleHeight);
  const tiltedHeight = compensateDistortionLength(tiltAngle, projectedModuleHeight);
  const roofEdgeLength = start.distanceTo(end);
  const modules = [];

  let polygonPaths = polygon.getLatLngs().flat();

  const { distanceNorth, distanceEast, distanceSouth, distanceWest } = getBounding(
    start,
    end,
    polygonPaths,
  );

  const negativeCols = Math.floor(distanceSouth / moduleWidth);
  const positiveCols = Math.floor(distanceNorth / moduleWidth);
  const negativeRows = Math.floor(distanceWest / projectedModuleHeight);
  const positiveRows = Math.floor(distanceEast / projectedModuleHeight);

  const offsetXLatLng = getOffsetCoordsX(roofEdgeLength, moduleWidth, start, heading);
  const offsetY = getOffsetY(
    distanceEast,
    distanceWest,
    projectedModuleHeight,
    offsetXLatLng,
    tiltedPerpendicularAngle,
    polygon,
  );

  for (let i = -negativeRows; i < positiveRows; i++) {
    for (let j = -negativeCols; j < positiveCols; j++) {
      const offsetYLatLng = computeOffset(
        offsetXLatLng,
        i * tiltedHeight + offsetY,
        tiltedPerpendicularAngle,
      );

      const moduleSW = computeOffset(offsetYLatLng, j * moduleWidth, heading);
      const moduleSE = computeOffset(moduleSW, moduleWidth, heading);
      const moduleNE = computeOffset(moduleSE, tiltedHeight, tiltedPerpendicularAngle);
      const moduleNW = computeOffset(moduleSW, tiltedHeight, tiltedPerpendicularAngle);

      const moduleCorners = [moduleSW, moduleSE, moduleNE, moduleNW];

      const insideCount = moduleCorners.reduce(
        (acc, p) => acc + (pointInPolygon(p, polygon) ? 1 : 0),
        0,
      );

      if (insideCount !== 4) continue;

      modules.push(moduleCorners);
    }
  }

  return modules;
}

function calculateProjectedHeight(angleDeg, moduleLength) {
  const rad = angleDeg * (Math.PI / 180);
  const cosValue = Math.cos(rad);
  const projectedLength = cosValue * moduleLength;

  return projectedLength;
}

function determineRoofEdgeHeading(
  polylineManager,
  polygonManager,
  azimuth,
  selectedRoofEdge,
  polygon,
) {
  const { from, to } = polylineManager.getPolylineCoords(selectedRoofEdge);
  const { start, end } = polylineManager.identifyTopAndBottom(from, to);

  const headingToNorth = bearingDeg(start, end);
  const checkCoords = setCheckCoords(start, end, headingToNorth);

  const isInsidePolygon = checkCoords.some((point) => pointInPolygon(point, polygon));

  const heading = isInsidePolygon ? azimuth - 90 : azimuth + 90;

  return { heading, start, end };
}

function compensateDistortionLength(distortionAngleDeg, baseLength) {
  const rad = distortionAngleDeg * (Math.PI / 180);
  const cosValue = Math.cos(rad);
  const compensatedLength = baseLength / cosValue;

  return compensatedLength;
}

export {
  bearingDeg,
  setCheckCoords,
  pointInPolygon,
  generateValidModules,
  determineRoofEdgeHeading,
};
