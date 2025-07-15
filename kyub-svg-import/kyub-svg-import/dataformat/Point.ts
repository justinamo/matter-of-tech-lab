import * as roundTo from "round-to";
import {Matrix3, Vector2, Vector3} from "three";

const PROXIMITY_DECIMAL_PLACES = 5;

export interface ISerializedPoint {
  x: number;
  y: number;
}

/**
 * Represents a point in the svg coordinate system
 */
export default class Point {

  /*
   * Creates a new point from a vector
   */
  public static fromVector(vector: Vector3 | Vector2): Point {
    return new Point(vector.x, vector.y);
  }

  /**
   * Creates a new point from a float array
   */
  public static fromArray(array: [number, number]): Point {
    return new Point(array[0], array[1]);
  }

  public static deserialize(serializedPoint: ISerializedPoint): Point {
    return new Point(serializedPoint.x, serializedPoint.y);
  }

  private x: number;

  private y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * @returns a new Vector3 with it's third component equal to 1
   */
  public toVectorForTransformation() {
    return new Vector3(this.x, this.y, 1);
  }

  /**
   * @returns a new Vector3 with z = 0
   */
  public toVector() {
    return new Vector3(this.x, this.y, 0);
  }

  /**
   * @eturns the point as an float array
   */
  public toArray(): [number, number] {
    return [this.x, this.y];
  }

  public set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public setX(x: number) {
    this.x = x;
    return this;
  }

  public setY(y: number) {
    this.y = y;
    return this;
  }

  /**
   * Sets the position from the given vector
   */
  public setFromVector(vector: Vector3) {
    this.x = vector.x;
    this.y = vector.y;
    return this;
  }

  /**
   * Returns a bucket for this point, nearby elements land in the same bucket
   * @return the bucket for this point
   */
  public getBucket(): string {
    return (Array.from(this.toArray()).map((n) => roundTo(n, PROXIMITY_DECIMAL_PLACES))).join(",");
  }

  /**
   * Transforms this point in place with the given matrix
   * @param matrix a Matrix3
   */
  public transform(matrix: Matrix3) {
    const transformed = this.toVectorForTransformation().applyMatrix3(matrix);
    this.setFromVector(transformed);
    return this;
  }

  public serialize(): ISerializedPoint {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public toJSON() {
    return this.serialize();
  }

  public translate(dx: number, dy: number) {
    this.x = this.x + dx;
    this.y = this.y + dy;
    return this.x;
  }

  public clone() {
    return new Point(this.x, this.y);
  }

  public equals(other: Point) {
    return (this.x === other.x) && (this.y === other.y);
  }
}
