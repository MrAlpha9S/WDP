export type ViolationCategory = 'riding' | 'horse-safety' | 'medication' | 'betting' | 'administrative';
export type ViolationRacePhase = 'pre-race' | 'during-race' | 'after-race';
export type StewardAction = 'no-action' | 'warning' | 'fine' | 'suspended' | 'disqualified' | 'demoted' | 'investigation' | 'permanent-ban';
export type ViolationStatus = 'pending' | 'confirmed' | 'dismissed';

export interface ViolationTypeEntity {
    _id: string;
    violationName: string;
    violationDescription: string;
    defaultPenalty: string;
    type: ViolationRacePhase;
    category: ViolationCategory;
    severity: 1 | 2 | 3 | 4 | 5;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ViolationEntity {
    _id: string;
    raceRoundId: { _id: string; roundName: string; raceDate: string } | string | null;
    registrationId: { _id: string; horseId: string; registrationStatus: string } | string | null;
    raceRefereeId: { _id: string; refereeId: string } | string | null;
    violationTypeId: ViolationTypeEntity | null;
    description: string;
    severity: number;
    actualPenalty: string;
    stewardAction: StewardAction;
    violationStatus: ViolationStatus;
    createdAt: string;
}
