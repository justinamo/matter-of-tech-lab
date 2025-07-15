import LineStrip from "../../dataformat/LineStrip";
import TurtleStep from "./TurtleStep";

export default class TurtleGraphic {

  private readonly lineStrip: LineStrip;

  private readonly  turtleSteps: TurtleStep[];

  constructor(lineStrip: LineStrip) {
    this.lineStrip = lineStrip;
    this.turtleSteps = this._generateGraphicFromArray();
  }

  /**
   * Get the turtle graphic object
   * @returns Array of the turtle steps of the line strip
   */
  public getGraphic() {
    return this.turtleSteps;
  }

  /**
   * @param length Also return the lengths of the lines
   */
  public toString(length = true) {
    let string = "";
    for (const step of this.turtleSteps) {
      string += step.toString(length);
    }
    return string;
  }

  /**
   * Create an array of turtle steps based on an array of lines
   */
  private _generateGraphicFromArray() {
    const lineArray = this.lineStrip.toLineArray();
    if (lineArray.length === 0) {
      return [];
    }
    const steps = [];
    let previousLine = lineArray[lineArray.length - 1];
    for (const line of lineArray) {
      const action = (previousLine.angleDirectionTo(line)) === 1 ? "R" : "L";
      const angle = previousLine.angleTo(line);
      const rightangle = (angle >= 89) && (angle <= 91);
      const turtleStep = new TurtleStep(rightangle, action, line);
      steps.push(turtleStep);
      previousLine = line;
    }
    return steps;
  }
}
