import Cutout from "./atomicPatterns/Cutout";
import CrossJoint from "./CrossJoint";
import JointRecognizer from "./JointRecognizer";

/**
 * This class should only be used by {CrossJoint}.
 * To recognize cross joints, use {CrossJoint.recognize}
 */
export default class CrossJointRecognizer extends JointRecognizer {

  /**
   * See [[Joint.recognize]]
   */
  public recognize() {
    const cutouts = Cutout.recognize(this.segment, this.precisionError);
    if (cutouts.length === 0) { return []; }

    const matches = [];
    for (const cutout of cutouts) {
      if (Math.abs(cutout.getWidth() - this.materialThickness) < this.precisionError) {
        matches.push(new CrossJoint([cutout], this.segment));
      }
    }

    const joints = [];
    for (const match of matches) {
      if (match.getRecognitionProbability(this.materialThickness, this.precisionError) >= this.probabilityThreshold) {
        joints.push(match);
      }
    }

    return joints;
  }
}
