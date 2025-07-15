import Cutout from "./atomicPatterns/Cutout";
import Finger from "./atomicPatterns/Finger";
import FingerJoint from "./FingerJoint";
import JointRecognizer from "./JointRecognizer";

/**
 * This class should only be used by [[FingerJoint]].
 * To recognize finger joints, use [[FingerJoint.recognize]]
 */
export default class FingerJointRecognizer extends JointRecognizer {

  /**
   * @see Joint.recognize
   */
  public recognize(): FingerJoint[] {
    const patterns = Finger.advanced_recognize(this.segment, this.precisionError, true)
      .concat(Cutout.advanced_recognize(this.segment, this.precisionError, true));

    patterns.sort((a, b) => { if (a.getIndex() > b.getIndex()) { return 1; } else { return -1; } });

    if (patterns.length === 0) { return []; }

    const matches: FingerJoint[] = [];
    const currentMatch = {start: 0, end: 0, endIndex: patterns[0].getIndex()};
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      if (p.getIndex() === (currentMatch.endIndex + 2) && (i==0 || p.constructor.name != patterns[i-1].constructor.name)) {
        currentMatch.end++;
      } else if (i !== 0) {
        matches.push(new FingerJoint(
          patterns.slice(currentMatch.start, currentMatch.end + 1),
          this.segment,
        ));

        currentMatch.start = i;
        currentMatch.end = i;
      }

      currentMatch.endIndex = p.getIndex();
    }

    matches.push(new FingerJoint(
      patterns.slice(currentMatch.start, currentMatch.end + 1),
      this.segment,
    ));

    const segmentLength = this.segment.getOutline().getPoints().length - 1;
    if (((patterns[0].getIndex() + segmentLength) - patterns[patterns.length - 1].getIndex()) === 2) {
      const lastMatch = matches[matches.length - 1];
      lastMatch.setAtomicPatterns(lastMatch.getAtomicPatterns().concat(matches[0].getAtomicPatterns()));
      matches.splice(0, 1);
    }

    return matches;
  }
}
