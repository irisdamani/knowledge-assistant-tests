export enum Role {
  Employee = 'Employee',
  Engineering = 'Engineering',
  Finance = 'Finance',
  Manager = 'Manager',
}

export interface QueryRequestDto {
  question: string;
}

export interface QueryResponseDto {
  answer: string;
  citations: string[];
  user?: {
    region: string;
    role: string;
  };
}
