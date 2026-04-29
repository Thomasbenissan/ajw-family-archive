export interface PersonData {
  "first name": string;
  "last name": string;
  birthday: string;
  death: string;
  gender: "M" | "F";
  generation: number;
  details: string[];
  "photo url": string;
}

export interface PersonRels {
  spouses: string[];
  children: string[];
  parents: string[];
}

export interface FamilyChartDatum {
  id: string;
  data: PersonData;
  rels: PersonRels;
}

export interface PersonDetail {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  born: string;
  died: string;
  gender: "M" | "F";
  generation: number;
  details: string;
  photoUrl: string;
}
