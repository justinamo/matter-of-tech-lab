import Segment from "../../dataformat/Segment";
import FingerCutoutRecognizer from "./FingerCutoutRecognizer";
import OutlinePattern from "./OutlinePattern";

/**
 * Every instance of this class represents an individual finger
 * with its index in the outline of the surrounding segment as well as its width and depth
 * (=length, naming for consistency with {cutout}).
 */
export default class Finger extends OutlinePattern {

  /**
   * Uses the [[FingerCutoutRecognizer]]
   */
  public static recognize(segment: Segment, precisionError: number) {
    const recognizer = new FingerCutoutRecognizer(segment, precisionError, this, "[R|r]LL[R|r]");
    return recognizer.recognize();
  }

  public static advanced_recognize(segment: Segment, precisionError: number, detect_edge_fingers: Boolean = false) {
    const recognizer = new FingerCutoutRecognizer(segment, precisionError, this, "[R|r]LL[R|r]");
    recognizer.detect_edge_fingers = detect_edge_fingers;
    return recognizer.recognize();
  }
}