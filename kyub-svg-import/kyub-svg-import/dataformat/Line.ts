import * as intersection from "intersection";
import {Line3, Vector3} from "three";
import Point, {ISerializedPoint} from "./Point";

export interface ISerializedLine {
  start: ISerializedPoint;
  end: ISerializedPoint;
}

/**
 * This class represents a line from start to end, consisting of two points
 */
export default class Line {

  public static deserialize(serializedLine: ISerializedLine) {
    const {start, end} = serializedLine;
    return new Line(Point.deserialize(start), Point.deserialize(end));
  }

  private readonly start: Point;

  private readonly end: Point;

  constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
  }

  public getStart() {
    return this.start;
  }

  public getEnd() {
    return this.end;
  }

  /**
   * Returns a Point where this line intersects other or null
   * @param other the other line
   * @return point of intersection or null
   */
  public intersect(other: Line): Point | null {
    const result = intersection.intersect(this, other);
    if (result) { return new Point(result.x, result.y); } else { return null; }
  }

  /**
   * Get the length of the line
   */
  public getLength() {
    return Math.sqrt(
      Math.pow((this.start.getX() - this.end.getX()), 2) + Math.pow((this.start.getY() - this.end.getY()), 2),
    );
  }

  /**
   * Get the angle between this and a consecutive line in degrees
   *
   * @param otherLine Other line
   * @param linesAreConsecutive
   *  Are the two lines consecutive? This will basically flip the direction of the second vector
   */
  public angleTo(otherLine: Line, linesAreConsecutive = true): number {
    const angle = Math.round((((this.toVector().angleTo(otherLine.toVector())) * 360) / (2 * Math.PI)));
    if (linesAreConsecutive) { return 180 - angle; } else { return angle; }
  }

  /**
   * Get the direction between two consecutive lines (turn left/right/parallel)
   * ATTENTION: Works in editor coordinate system with y-axis up!
   * @param otherLine
   */
  public angleDirectionTo(otherLine: Line) {
    const vectorA = this.toVector();
    const vectorB = otherLine.toVector();

    const crossProduct = ((vectorA.x * vectorB.y) - (vectorA.y * vectorB.x));

    return Math.sign(-crossProduct);
  }

  public toVector() {
    return new Vector3(this.end.getX() - this.start.getX(), this.end.getY() - this.start.getY());
  }

  public toThreeLine() {
    return new Line3(this.start.toVector(), this.end.toVector());
  }

  public serialize(): ISerializedLine {
    return {
      end: this.end.serialize(),
      start: this.start.serialize(),
    };
  }

  public toJSON() {
    return this.serialize();
  }

  public clone() {
    return new Line(this.start.clone(), this.end.clone());
  }

  public equals(other: Line): boolean {
    return other instanceof Line &&
      other.start.equals(this.start) && other.end.equals(this.end);
  }
}
