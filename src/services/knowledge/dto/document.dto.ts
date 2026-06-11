export enum Region {
  Americas = 'Americas',
  EMEA = 'EMEA',
  APAC = 'APAC',
}

export enum LifecycleState {
  Approved = 'Approved',
  InReview = 'In Review',
  Draft = 'Draft',
  Retired = 'Retired',
}

export enum Audience {
  AllStaff = 'All Staff',
  Engineering = 'Engineering',
  Finance = 'Finance',
  Managers = 'Managers',
}

export interface DocumentDto {
  doc_id: string;
  title: string;
  region: Region | string;
  audience: Audience | string;
  state: LifecycleState | string;
}
