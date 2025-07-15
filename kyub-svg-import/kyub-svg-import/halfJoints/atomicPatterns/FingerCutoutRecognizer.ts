import Segment from "../../dataformat/Segment";
import TurtleGraphic from "../turtleGraphic/TurtleGraphic";
import TurtleStep from "../turtleGraphic/TurtleStep";
import Cutout from "./Cutout";
import Finger from "./Finger";

/**
 * This class should only be used by {Finger} and {Cutout}.
 * To recognize fingers or cutouts, use {AtomicPatternRecognizer}
 */
export default class FingerCutoutRecognizer {

  /**
   * Takes the last n characters and puts them to the front of a string
   * @param amount The number n of which characters the string should been turned
   * @param inputString The string to turn
   * @return [String] The new string
   */
  public static turnBy(amount: number, inputString: string): string {
    const n = amount;
    let output = inputString.substr(inputString.length - n);
    output += inputString.substr(0, inputString.length - n);
    return output;
  }

  private segment: Segment;

  private precisionError: number;

  private Pattern: any;

  /**
   * outline of the segment
   */
  private outline: TurtleGraphic;

  private regex: RegExp;

  /**
   * the turtle steps that form the outline
   */
  private turtle: TurtleStep[];

  /**
   * The turtle step string consisting only of r, l, R, L
   */
  private steps: string;

  /**
   * totalSteps The number of turtle steps in the outline
   */
  private totalSteps: number;

  private indexOffset: number = 0;

  private matches: Array<Finger|Cutout> = [];


  detect_edge_fingers: Boolean = false;
  detect_finger_pairs: Boolean = false;


  /**
   * @param segment The segment in which to search for the pattern
   * @param precisionError The accepted precision error caused e.g. by drawing freehand
   * @param Pattern The pattern class to be searched for (ONLY Finger or Cutout!)
   * @param regexString The regex of the pattern to be recognized
   */
  constructor(segment: Segment, precisionError: number, Pattern, regexString: string) {
    this.segment = segment;
    this.precisionError = precisionError;
    this.Pattern = Pattern;
    this.outline = new TurtleGraphic(this.segment.getOutline());
    this.regex = new RegExp(regexString);

    this.turtle = this.outline.getGraphic();
    this.steps = this.outline.toString(false);
    this.totalSteps = this.steps.length;
  }

  /**
   * Recognizes all fingers or cutouts in the outline
   * @returns an array of all recognized fingers/cutouts, sorted by their index in the outline
   */
  public recognize(): Array<Finger|Cutout> {
    this.indexOffset = 0;
    this.matches = [];

    let newMatch = this.steps.match(this.regex);

    if (newMatch === null) {
      return [];
    }

    if (newMatch.index !== 0) {
      this._handleMatch(newMatch, true);
      newMatch = this.steps.match(this.regex);
    }

    while (newMatch !== null) {
      this._handleMatch(newMatch, false);
      newMatch = this.steps.match(this.regex);
    }

    this.matches.sort((a, b) => {
      if (a.getIndex() > b.getIndex()) { return 1; } else { return -1; }
    });

    return this.matches;
  }

  private _handleMatch(newMatch, turn) {
    let cutOff;
    let indexInSteps = newMatch.index;
    let indexInOutline = indexInSteps + this.indexOffset;
    indexInOutline %= this.totalSteps;

    const depth1 = this.turtle[indexInOutline].followingLength();
    const depth2 = this.turtle[(indexInOutline + 2) % this.turtle.length].followingLength();
    const depth = Math.abs(depth1 - depth2) < this.precisionError ? (depth1 + depth2) / 2 : -1;

    if (depth > 0) {
      if(this.detect_edge_fingers && this.Pattern == Finger){
        var steps = this.outline.toString(false)
        var around = steps.concat(steps).concat(steps)
        
        //#region edge fingers
        if(around.slice(this.totalSteps + indexInOutline - 4,this.totalSteps + indexInOutline) == 'LLLR') {
          var index = indexInOutline - 4 % this.turtle.length
          if(index < 0) index = this.totalSteps + index
          var depth_before = this.turtle[(index + 2) % this.turtle.length].followingLength()
          if(Math.abs(depth_before-depth) < this.precisionError){
            this.matches.push(
              new Finger(
                index,
                this.turtle[(index + 1) % this.turtle.length].followingLength(),
                depth_before
              )
            )
          }
          
        }
        if(around.slice(this.totalSteps + indexInOutline + 4,this.totalSteps + indexInOutline + 8) == 'RLLL') {
          var depth_after = this.turtle[(indexInOutline + 4) % this.turtle.length].followingLength()
          if(Math.abs(depth_after-depth) < this.precisionError) {
            this.matches.push(
              new Finger(
                indexInOutline + 4 % this.turtle.length,
                this.turtle[(indexInOutline + 4 + 1) % this.turtle.length].followingLength(),
                depth_after
              )
            )
          }
        }
        //#endregion

        //#region edge cutouts
        if(around[this.totalSteps + indexInOutline - 1] == 'L'){
          var index = indexInOutline - 2 % this.turtle.length
          if(index < 0) index = this.totalSteps + index
          var depth_before = this.turtle[(index + 2) % this.turtle.length].followingLength()
          this.matches.push(
            new Cutout(
              index,
              this.turtle[(index + 1) % this.turtle.length].followingLength(),
              depth_before
            )
          )
        }
        if(around[this.totalSteps + indexInOutline + 4] == 'L'){
          var index = (indexInOutline + 2) % this.turtle.length
          if(index < 0) index = this.totalSteps + index
          var depth_before = this.turtle[index].followingLength()
          this.matches.push(
            new Cutout(
              index,
              this.turtle[(index + 1) % this.turtle.length].followingLength(),
              depth_before
            )
          )
        }
        //#endregion
      }
      else if(this.detect_finger_pairs && this.Pattern == Cutout){
        var steps = this.outline.toString(false)
        var around = steps.concat(steps).concat(steps)
        var combination = around.slice(this.totalSteps + indexInOutline -2, this.totalSteps + indexInOutline + 6)

        if(combination == 'LLLRRLLL'){
          var index = indexInOutline -2 > 0 ? indexInOutline-2 : indexInOutline - 2 + this.totalSteps
              
          this.matches.push(
            new Finger(
              index,
              this.turtle[index].followingLength(),
              depth
            )
          )
          this.matches.push(
            new Finger(
              indexInOutline + 2 % this.turtle.length,
              this.turtle[(indexInOutline + 2) % this.turtle.length].followingLength(),
              depth
            )
          )
        }
      }
      this.matches.push(
        new this.Pattern(
          indexInOutline,
          this.turtle[(indexInOutline + 1) % this.turtle.length].followingLength(),
          depth,
        ),
      );
      cutOff = 4;
    } else {
      // cut off the first step so it won't be matched again
      // further steps could still be part of another joint!
      cutOff = 1;
    }

    if (turn === true) {
      this.steps = FingerCutoutRecognizer.turnBy(this.steps.length - indexInSteps, this.steps);
      this.indexOffset += indexInSteps;
      indexInSteps = 0;
    }

    this.steps = this.steps.substr(indexInSteps + cutOff);
    this.indexOffset += indexInSteps + cutOff;
  }
}
