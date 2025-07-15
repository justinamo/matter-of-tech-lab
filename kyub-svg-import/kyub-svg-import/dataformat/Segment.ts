import * as randomstring from "randomstring";
import LineStrip, {SerializedLineStrip} from "./LineStrip";

export interface ISerializedSegment {
  outline: SerializedLineStrip;
  cutouts: SerializedLineStrip[];
  id?: string;
  associatedCutoutSegments?: Array<{cutoutIndex: number, segmentId: string}>;
}
/**
 * A Segment represents a connected piece of material after cutting.
 * It may be used for constructing a model ("part") or garbage
 */
export default class Segment {

  /**
   * While for [[Segment.deserialize]] you need to provide all associated
   * segments already de-serialized per segment, this method automatically
   * de-serializes all segments in the correct order so you don't need to do the sorting.
   *
   * @param serializedSegments segments to be deserialized
   */
  public static deserializeMultiple(serializedSegments: ISerializedSegment[]): Segment[] {
    // sorted serialized segments: if a segment depends on another segment to be deserialized,
    // the other segment will have a lower index, thus deserialized first
    const sortedDeserializationQueue = [];

    for (const serializedSegment of serializedSegments) {
      // First entry can be added without checks
      if (sortedDeserializationQueue.length === 0) {
        sortedDeserializationQueue.push(serializedSegment);
        continue;
      }

      // No dependencies? Add to front of queue
      if (!serializedSegment.associatedCutoutSegments || serializedSegment.associatedCutoutSegments.length === 0) {
        sortedDeserializationQueue.unshift(serializedSegment);
        continue;
      }

      // What segments does this segment depend on
      // (Go down to the last cutout to find all segments this one depends on)
      const dependsOnIds = [];
      const dependsOnQueue = serializedSegment.associatedCutoutSegments.map(c => c.segmentId);
      while (dependsOnQueue.length > 0) {
        const id = dependsOnQueue.pop();
        dependsOnIds.push(id);
        const dependant = serializedSegments.find(s => s.id === id);
        if (dependant && dependant.associatedCutoutSegments) {
          dependsOnQueue.push(...dependant.associatedCutoutSegments.map(c => c.segmentId));
        }
      }

      // The new index must be at least one after the last element this segment depends on
      const lastDependingElementIndex = dependsOnIds
        .map(id => sortedDeserializationQueue.findIndex(e => e.id === id))
        .filter(index => index >= 0)
        .reduce((last, currentIndex) => Math.max(last, currentIndex), -1);
      const dependsOnElements = lastDependingElementIndex !== -1;

      // ... but must not be after elements that depend on this segment
      const firstDependantElementIndex = dependsOnIds
        .map(id => sortedDeserializationQueue.findIndex(e => e.id === id))
        .filter(index => index >= 0)
        .reduce((last, currentIndex) => Math.min(last, currentIndex), sortedDeserializationQueue.length);
      const hasDependants = firstDependantElementIndex !== sortedDeserializationQueue.length;

      if (dependsOnElements && !hasDependants) {
        sortedDeserializationQueue.push(serializedSegment);
        break;
      } else if (!dependsOnElements && hasDependants) {
        sortedDeserializationQueue.unshift(serializedSegment);
      } else {
        if (lastDependingElementIndex >= firstDependantElementIndex) {
          throw new Error("Cannot deserialize: probably a cyclic dependency");
        }
        const insertionIndex = lastDependingElementIndex + 1;
        sortedDeserializationQueue.splice(insertionIndex, 0, serializedSegment);
      }
    }

    const deserializedSegments = [];

    for (const serializedSegment of sortedDeserializationQueue) {
      deserializedSegments.push(Segment.deserialize(serializedSegment, deserializedSegments.concat([])));
    }

    return deserializedSegments;
  }

  /**
   *
   * @param serializedSegment segment to be deserialized
   * @param cutoutSegments
   *  already deserialized segment instances that will be used linked
   *  as associated segments when referenced by the serializedSegments
   *  (linking is done via the segment's IDs)
   */
  public static deserialize(serializedSegment: ISerializedSegment, cutoutSegments: Segment[] = []): Segment {
    const outline = LineStrip.deserialize(serializedSegment.outline);
    const cutouts = (Array.from(serializedSegment.cutouts).map((cutout) => LineStrip.deserialize(cutout)));
    const id = serializedSegment.id;

    const segment = new Segment(outline, cutouts, id);

    if (serializedSegment.associatedCutoutSegments) {
      for (const cutoutAssociation of serializedSegment.associatedCutoutSegments) {
        const lineStrip = segment.getCutouts()[cutoutAssociation.cutoutIndex];
        const cutoutSegment = cutoutSegments.find(s => s.getId() === cutoutAssociation.segmentId);

        if (!lineStrip || !cutoutSegment) {
          throw new Error(`Cannot reconstruct cutout segment association (Segment '${cutoutAssociation.segmentId}')`);
        }

        segment.associateCutoutSegment(lineStrip, cutoutSegment);
      }
    }

    return segment;
  }

  private id = randomstring.generate(10);

  private outline: LineStrip;

  private cutouts: LineStrip[];

  private associatedCutoutSegments = new Map<LineStrip, Segment>();

  constructor(outline: LineStrip, cutouts: LineStrip[] = [], id?: string) {
    this.setOutline(outline);
    this.setCutouts(cutouts);
    if (id) {
      this.setId(id);
    }
  }

  /**
   * A (randomly generated) unique ID. This can/should be used to
   * ease serialization/deserialization and referencing this segment
   */
  public getId() {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }

  public getOutline() {
    return this.outline;
  }

  public setOutline(outline) {
    this.outline = outline;

    if (!this.outline.isClosed()) {
      throw new Error("Segments need to have a closed outline");
    }

    this.outline.ensureWinding(false);

    return this;
  }

  public getCutouts() {
    return this.cutouts;
  }

  /**
   * Defines the cutouts of this segment. Cutouts are line strips, which may or may not be closed.
   * If they are closed, they will be wound CW
   */
  public setCutouts(cutouts: LineStrip[]) {
    this.cutouts = [];

    for (const cutout of cutouts) {
      this.addCutout(cutout);
    }

    return this;
  }

  public addCutout(cutout: LineStrip) {
    cutout.ensureWinding(true);
    this.cutouts.push(cutout);
    return this;
  }

  /**
   * Defines that this segment's cutout also exists as a segment on its own, effectively
   * defining a parent-child relationship.
   * We duplicate cutouts (line strips) and child-segments (their outline has the same points
   * as the cutout line strip, although in different winding order), since a cutout can, but
   * not necessarily has to be a (different, distinct) physical part of its own (fancy
   * laser cutting nesting where cutouts are actual parts to be used).
   *
   * @param cutout this segment's cutout
   * @param segment the segment to associate it to
   */
  public associateCutoutSegment(cutout: LineStrip, segment: Segment) {
    if (this.cutouts.indexOf(cutout) < 0) {
      throw new Error("Cutout not part of this.cutouts");
    }

    this.associatedCutoutSegments.set(cutout, segment);
  }

  public getAssociatedCutoutSegment(cutout: LineStrip): Segment {
    return this.associatedCutoutSegments.get(cutout);
  }

  public getAssociatedCutoutSegments(): Segment[] {
    return Array.from(this.associatedCutoutSegments.values());
  }

  /**
   * @returns all (also cutout's cutouts etc) cutout segments
   */
  public collectAssociatedCutoutSegments(): Segment[] {
    const collectedSegments: Segment[] = [];

    for (const childSegment of this.getAssociatedCutoutSegments()) {
      collectedSegments.push(childSegment);
      collectedSegments.push(...childSegment.collectAssociatedCutoutSegments());
    }

    return collectedSegments;
  }

  public toString() {
    return JSON.stringify(this, null, 1);
  }

  public serialize(): ISerializedSegment {
    const associatedCutoutSegments = [];

    for (const lineStrip of Array.from(this.associatedCutoutSegments.keys())) {
      associatedCutoutSegments.push({
        cutoutIndex: this.cutouts.indexOf(lineStrip),
        segmentId: this.associatedCutoutSegments.get(lineStrip).getId(),
      });
    }

    return {
      associatedCutoutSegments,
      cutouts: (Array.from(this.cutouts).map((cutout) => cutout.serialize())),
      id: this.getId(),
      outline: this.outline.serialize(),
    };
  }

  public toJSON() {
    return this.serialize();
  }

  /**
   * Converts the segment to an SVG string
   * @param decimalResolution how many digits after the dot should be exported
   */
  public toSVG(decimalResolution: number): string {
    if (decimalResolution == null) {
      decimalResolution = 1;
    }
    let result = '<svg xmlns="http://www.w3.org/2000/svg">\n';

    result += this._convertLineStripToPolyline(this.outline, decimalResolution) + "\n";
    for (const cutout of Array.from(this.cutouts)) {
      result += this._convertLineStripToPolyline(cutout, decimalResolution) + "\n";
    }

    result += "</svg>";
    return result;
  }

  public _convertLineStripToPolyline(strip: LineStrip, digits: number) {
    let result = '<polyline points="';
    for (const point of strip.getPoints()) {
      result += point.getX().toFixed(digits) + "," + point.getY().toFixed(digits) + " ";
    }
    result += '" />';
    return result;
  }

  /**
   * Clones this segment and all associated cutout segments
   *
   * @param instancesToBeUsed
   *  for more complex cloning orchestrations, you can specify a segmentId->Segment map of instances that should be
   *  considered as "already cloned" which will be used and returned instead of creating new ones
   *  (matching is done via ID)
   */
  public clone(instancesToBeUsed: Map<string, Segment> = new Map<string, Segment>()): Segment {
    const thisAlreadyCloned = instancesToBeUsed.get(this.getId());
    if (thisAlreadyCloned) { return thisAlreadyCloned; }

    const clonedAssociatedSegments = Array.from(this.associatedCutoutSegments.values())
      .map(segment => {
        const alreadyClonedInstance = instancesToBeUsed.get(segment.getId());
        if (alreadyClonedInstance) {
          return alreadyClonedInstance;
        } else {
          return segment.clone(instancesToBeUsed);
        }
      });

    return Segment.deserialize(this.serialize(), clonedAssociatedSegments);
  }

  public equals(other) {
    return other.outline.equals(this.outline) &&
      other.cutouts.every((cutout, i) => cutout.equals(this.cutouts[i]));
  }
}
