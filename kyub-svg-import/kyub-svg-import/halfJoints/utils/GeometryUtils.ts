import {Vector3} from "three";
import LineStrip from "../../dataformat/LineStrip";
import Point from "../../dataformat/Point";

/**
 * Geometry utils class
 */
export default class GeometryUtils {

  /**
   * @param [originPoint The point where the ray originates
   * @param directionPoint
   *   The point through which the ray is shot. Hits will only be found AFTER the directionPoint!
   * @param lineStrip
   *   The lineStrip that should be hit by the ray. It should not be closed as this might lead to undefined behavior.
   * @return
   *   The distance between origin and first hit on the lineStrip, -1 if there is no hit
   *   (this won't happen with cross joints since the outline of a segment is always closed)
   */
  public static raycastLineStrip(originPoint: Point, directionPoint: Point, lineStrip: LineStrip): number {

    const origin = new Vector3(originPoint.getX(), originPoint.getY());
    const direction = new Vector3(
      directionPoint.getX() - originPoint.getX(), directionPoint.getY() - originPoint.getY(),
    );

    const points = lineStrip.getPoints();
    let firstHit = -1;
    for (let i = 0, end = points.length - 1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      const thisPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];

      if (this._arePointsOnSameSideOfRay(originPoint, directionPoint, thisPoint, nextPoint) === true) {
        // both points are on the same side of the ray, so there is no intersection
        continue;
      }

      const hit = this.distanceToLineIntersection(
        origin.clone(),
        direction.clone(),
        thisPoint.toVector(),
        nextPoint.toVector(),
      );

      if ((hit > direction.length()) && ((hit < firstHit) || (firstHit === -1))) {
        firstHit = hit;
      }
    }

    return firstHit;
  }

  /**
   * @param origin The origin of the ray
   * @param direction Direction in which the ray is shot
   * @param lineStart Start of the line segment to find an intersection with
   * @param lineEnd End of the line segment to find an intersection with
   * @return
   *   The distance between the origin point and the intersection between the ray and the line segment.
   *   If there is no intersection, return value is null.
   *   See the algorithm found at http://stackoverflow.com/a/32146853,
   */
  public static distanceToLineIntersection(origin: Vector3, direction: Vector3, lineStart: Vector3, lineEnd: Vector3) {
    const v1 = origin.sub(lineStart);
    const v2 = lineEnd.sub(lineStart);
    const v3 = new Vector3(-direction.y, direction.x);

    const dot = v2.dot(v3);
    if (Math.abs(dot) < 0.000001) {
      return null;
    }

    const t1 = ((v2.x * v1.y) - (v2.y * v1.x)) / dot;
    const t2 = (v1.dot(v3)) / dot;

    if ((t1 > 0) && (0.0 <= t2 && t2 <= 1.0)) {
      return t1 * direction.length();
    } else {
      return null;
    }
  }

  public static findCenterPoint(points: Point[]): Point {
    let ySum;
    let xSum = (ySum = 0);
    for (const p of points) {
      xSum += p.getX();
      ySum += p.getY();
    }

    return new Point(xSum / points.length, ySum / points.length);
  }

  public static distanceBetweenPoints(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow((p2.getX() - p1.getX()), 2) + Math.pow((p2.getY() - p1.getY()), 2));
  }

  /**
   * @returns
   *  true if p1 and p2 are on the same side of the ray from originPoint through directionPoint.
   *  If one or both points are ON the ray, return value is false.
   */
  private static _arePointsOnSameSideOfRay(originPoint, directionPoint, p1, p2) {

    const [x0, y0] = originPoint.toArray();
    const [x1, y1] = directionPoint.toArray();
    const [x2, y2] = p1.toArray();
    const [x3, y3] = p2.toArray();

    // formula found at http://stackoverflow.com/a/22668810
    const p1Side = ((x1 - x0) * (y2 - y0)) - ((x2 - x0) * (y1 - y0));
    const p2Side = ((x1 - x0) * (y3 - y0)) - ((x3 - x0) * (y1 - y0));

    return ((p1Side > 0) && (p2Side > 0)) || ((p1Side < 0) && (p2Side < 0));
  }
}
