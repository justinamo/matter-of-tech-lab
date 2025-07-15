import Segment from "../dataformat/Segment";
import AtomicPattern from "./atomicPatterns/AtomicPattern";

/**
 * Superclass for all joints
 */
export default abstract class Joint<PatternClass extends AtomicPattern = AtomicPattern> {

  /**
   * Searches for all joints of this type in the specified segment
   * @param segment The segment to search
   * @param materialThickness Known/guessed material thickness, in SVG USER UNITS (!)
   * @param precisionError The assumed precision error caused e.g. by drawing freehand
   * @param probabilityThreshold
   *    The minimum probability that a match needs to have in order to be recognized as a joint
   * @returns All recognized joints in the segment, sorted by their index
   */
  public static recognize(
    segment: Segment, materialThickness: number, precisionError: number, probabilityThreshold: number,
  ): Joint[] {
    throw new Error("Joint can't be searched for as it is abstract, use subclasses instead");
  }

  private atomicPatterns: PatternClass[];

  private matchingJoints: Array<Joint<AtomicPattern>> = [];

  /**
   * @param atomicPatterns
   *   An array containing all atomic patterns that make up this joint.
   */
  protected constructor(atomicPatterns: PatternClass[]) {
    this.atomicPatterns = atomicPatterns;
  }

  /**
   * Add a joint which matches this joint
   * @param joint The joint to be added as an identified match
   */
  public addMatch(joint: Joint<AtomicPattern>) {
    if ((this.matchingJoints.indexOf(joint)) < 0) {
      this.matchingJoints.push(joint);
    }
  }

  /**
   * @return Array of other possible matching Joints
   */
  public getMatches() {
    return this.matchingJoints;
  }

  /**
   * @param joint The finger joint to be checked if it is already a known match
   * @returns True if it is a match
   */
  public hasMatch(joint: Joint<AtomicPattern>) {
    return (this.matchingJoints.indexOf(joint)) >= 0;
  }

  /**
   * Calculate the probability of this being a joint of this type.
   * @returns Probability within [0, 1]
   */
  public abstract getRecognitionProbability(materialThickness: number, precisionError: number): number;

  /**
   * Calculate the probability of this joint matching another joint
   * @param joint The other joint to match against
   * @param precisionError The accepted precision error caused e.g. by drawing freehand
   * @return [Float] Probability within [0, 1]
   */
  public abstract getMatchingProbability(joint: Joint<AtomicPattern>, precisionError: number);

  public getAtomicPatterns() {
    return this.atomicPatterns.concat([]);
  }

  public setAtomicPatterns(patterns: PatternClass[]) {
    this.atomicPatterns = patterns;
  }
}
