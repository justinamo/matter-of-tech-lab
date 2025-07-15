import Segment from "../../dataformat/Segment";
import Finger from "./Finger";
import FingerCutoutRecognizer from "./FingerCutoutRecognizer";
import OutlinePattern from "./OutlinePattern";

/**
 * Every instance of this class represents an individual cutout
 * with its index in the outline of the surrounding segment as well as its width and depth.
 */
export default class Cutout extends OutlinePattern {

  /**
   * Uses the [[FingerCutoutRecognizer]]
   */
  public static recognize(segment: Segment, precisionError: number): Array<Finger|Cutout> {
    const recognizer = new FingerCutoutRecognizer(segment, precisionError, this, "[L|l]RR[L|l]");
    return recognizer.recognize();
  }
  public static advanced_recognize(segment: Segment, precisionError: number, detect_finger_pairs: Boolean = false): Array<Finger|Cutout> {
    const recognizer = new FingerCutoutRecognizer(segment, precisionError, this, "[L|l]RR[L|l]");
    recognizer.detect_finger_pairs = detect_finger_pairs
    return recognizer.recognize();
  }

}
