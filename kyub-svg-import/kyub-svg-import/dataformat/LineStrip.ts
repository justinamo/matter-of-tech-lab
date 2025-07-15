import PolygonUtils from "../kyutils/PolygonUtils";
import {Matrix3} from "three";
import Line from "./Line";
import Point, {ISerializedPoint} from "./Point";

export type SerializedLineStrip = ISerializedPoint[];

/**
 * Describes a strip of connected lines. It may be closed or let open.
 * For a closed linestrip the first and last point must equal.
 */
export default class LineStrip {

  public static deserialize(serializedLineStrip: SerializedLineStrip) {
    return new LineStrip(serializedLineStrip.map((point) => Point.deserialize(point)));
  }

  private points: Point[];

  constructor(points: Point[] = []) {
    this.points = points;
  }

  public getPoints() {
    return this.points;
  }

  public setPoints(points: Point[]) {
    this.points = points;
    return this;
  }

  public getLastPoint() {
    return this.points[this.points.length - 1];
  }

  public getFirstPoint() {
    return this.points[0];
  }

  /**
   * Reverses the LineStrip in place
   */
  public reverse() {
    this.points.reverse();
    return this;
  }

  /**
   * Ensures a specific winding
   * @param winding true for a clockwise winding
   */
  public ensureWinding(winding: boolean) {
    if ((this.isClockwise() && !winding) || (this.isCounterClockwise() && winding)) {
      this.reverse();
    }
    return this;
  }

  /**
   * Returns whether the linestrip is clockwise
   * ATTENTION: Works in editor coordinate system with y-axis up!
   * @return isClockwise
   */
  public isClockwise() {
    let sum = 0;
    for (let startIndex = 0; startIndex < this.points.length - 1; startIndex++) {
      const endIndex = startIndex + 1;
      const start = this.points[startIndex];
      const end = this.points[endIndex];
      sum += (end.getX() - start.getX()) * (end.getY() + start.getY());
    }
    return sum > 0;
  }

  /**
   * Returns whether the linestrip is counter clockwise
   * @return isCounterClockwise
   */
  public isCounterClockwise() {
    return !this.isClockwise();
  }

  /**
   * Returns whether the LineStrip is closed,
   * that is if the last point equals the first
   * @return isClosed
   */
  public isClosed() {
    return this.getLastPoint().equals(this.getFirstPoint());
  }

  /**
   * ToDo In a closed LineStrip, first and last point are equal (reference to same object).
   * Should it be that way? It could easily lead to a mistake in cases when you
   * iterate over the entire array because you perform the operation twice on this element.
   */
  public close() {
    const firstPoint = this.getFirstPoint();
    if (!this.isClosed()) {
      this.points.push(firstPoint);
    }
    return this;
  }

  /**
   * Transforms this linestrip in place using the given matrix
   * @param matrix the matrix to transform with
   */
  public transform(matrix: Matrix3) {
    const set = new Set(this.points);
    set.forEach(point => point.transform(matrix));
    return this;
  }

  /**
   * Converts this LineStrip to an array of lines
   * @return array of lines
   */
  public toLineArray(): Line[] {
    if (this.points.length === 0) {
      return [];
    }
    const createLine = (points, i) => new Line(points[i], points[(i + 1) % points.length]);
    const result = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      result.push(createLine(this.points, i));
    }
    return result;
  }

  /**
   * Removes collinear and duplicate points
   */
  public cleanse() {
    // the first and last points are duplicate if the strip is closed.
    // To avoid opening a closed strip, we remember if it was closed, and close afterwards if it was closed before
    const closeStrip = this.isClosed();
    const pointsAsArrays = this.points.map(p => p.toArray());
    if (pointsAsArrays.length > 1) {
      PolygonUtils.removeDuplicatePoints(pointsAsArrays);
    }
    if (pointsAsArrays.length > 2) {
      PolygonUtils.removeCollinearPoints(pointsAsArrays);
    }
    this.setPoints(pointsAsArrays.map(p => Point.fromArray(p)));
    if (closeStrip) {
      this.close();
    }
    return this;
  }

  public serialize(): SerializedLineStrip {
    return this.points.map((point) => point.serialize());
  }

  public toJSON() {
    return this.serialize();
  }

  public clone() {
    return LineStrip.deserialize(this.serialize());
  }

  public equals(other: LineStrip) {
    return (other.points.length === this.points.length) &&
      other.points.every((point, i) => point.equals(this.points[i]));
  }
}
