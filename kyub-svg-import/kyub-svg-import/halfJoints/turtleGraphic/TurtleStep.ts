/**
 * ToDo: Verify
 *
 * l - left-ish turn
 * L - 90° left turn
 * r - right-ish turn
 * R - 90° right turn
 */
import Line from "../../dataformat/Line";

export type TurtleStepDirection = "l"|"L"|"r"|"R";

export default class TurtleStep {

  private readonly rightangle: boolean;

  private readonly  line: Line;

  private readonly action: TurtleStepDirection;

  /**
   * @param rightAngle Is this a right angle turn, then the direction will be uppercase, lowercase otherwise
   * @param direction
   *   The direction which needs to be turned on the starting point ('l' for left and 'r' for right)
   * @param line Reference to the line this step describes
   */
  constructor(rightAngle: boolean, direction: TurtleStepDirection, line: Line) {
    this.rightangle = rightAngle;
    this.line = line;
    this.action = (this.rightangle ? direction.toUpperCase() : direction.toLowerCase()) as TurtleStepDirection;
  }

  /**
   * Get the length of the line after the action
   */
  public followingLength() { return this.line.getLength(); }

  /**
   * Get the action made at this point (turn left or right)
   */
  public getAction() { return this.action; }

  /**
   * Does the previous line have a rightangle to this line
   */
  public isRightAngle() { return this.rightangle; }

  /**
   * The coordinates of the starting point of the line
   * @returns the start point of the turtle step
   */
  public getStartCoordinates() { return this.line.getStart(); }

  /**
   * @param length also return the length of the line?
   */
  public toString(length = true) {
    if (length) { return this.getAction() + Math.round(this.followingLength()); } else { return this.getAction(); }
  }
}
