export function getPath(waypoint) {
  if (!waypoint.previous) return [];

  const paths = [];

  const grid = game.canvas.grid;
  let point = waypoint;

  while (point.previous) {
    const start = grid.getOffset({ x: point.previous.x, y: point.previous.y, elevation: point.previous.elevation });
    const end = grid.getOffset({ x: point.x, y: point.y, elevation: point.elevation });
    const coordinates = grid.getDirectPath([start, end]);

    for (const coord of coordinates.reverse()) {
      const p = grid.getCenterPoint(coord);
      paths.push({ x: p.x, y: p.y, elevation: waypoint.elevation });
    }
    point = point.previous;
  }
  return paths.reverse();
}

export function calculateZoneCost(paths, scene) {
  let cost = 0;
  let previousZone = null;
  let currentZone = null;
  let first = true;
  for (const path of paths) {
    currentZone = null;
    for (const region of scene.regions) {

      if (!region.behaviors.filter(it => it.type == "modifyMovementCost").length)
        continue;

      const coordinateInRegion = region.testPoint(path);

      if (!coordinateInRegion)
        continue;

      if (first)
        previousZone = region.id;
      currentZone = region.id;
      break;
    }
    first = false;

    if (currentZone == previousZone)
      continue;

    cost += 1;
    previousZone = currentZone;
  }
  return cost;
}

export function prepareZoneLabel(cost, scene, paths) {
  let unit = "zone";
  if (cost != 1)
    unit += "s";

  const showProximity = game.settings.get("zone-movement", "showLabels");
  if (!showProximity)
    return { total: cost, units: unit };

  const isEngaged = (cost == 0 && paths.length == 2 && (Math.abs(paths[0].x - paths[1].x) <= scene.grid.sizeX) && (Math.abs(paths[0].y - paths[1].y) <= scene.grid.sizeY));
  let delta = game.i18n.localize("ZONE-MOVEMENT.DistanceLabel.Short");

  if (isEngaged)
    delta = game.i18n.localize("ZONE-MOVEMENT.DistanceLabel.Engaged");
  else if (cost > 4)
    delta = game.i18n.localize("ZONE-MOVEMENT.DistanceLabel.Extreme");
  else if (cost > 1)
    delta = game.i18n.localize("ZONE-MOVEMENT.DistanceLabel.Long");
  else if (cost == 1)
    delta = game.i18n.localize("ZONE-MOVEMENT.DistanceLabel.Medium");

  return { total: cost, units: unit, delta };
}