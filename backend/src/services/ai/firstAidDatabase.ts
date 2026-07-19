import { EmergencyType, FirstAidStep } from '../../types';
import { PROTOCOLS, getProtocol, toFirstAidSteps } from '../triage/emergencyProtocols';

/** First-aid steps for a specific emergency type. */
export const getFirstAidForType = (type: EmergencyType): FirstAidStep[] => {
  return toFirstAidSteps(getProtocol(type).firstAid);
};

export interface FirstAidGuide {
  type: EmergencyType;
  label: string;
  steps: string[];
  redFlags: string[];
}

/** All first-aid guides, for the browsable First Aid reference screen. */
export const getAllFirstAidGuides = (): FirstAidGuide[] => {
  return PROTOCOLS.map((p) => ({
    type: p.type,
    label: p.label,
    steps: p.firstAid,
    redFlags: p.redFlags,
  }));
};

export default { getFirstAidForType, getAllFirstAidGuides };
