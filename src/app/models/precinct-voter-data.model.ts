export const characterAttributesMapping = {
  precinct: "Precinct",
  bernieLizPercent: "bernieLizPercent",
  giarrussoPercent: "Joe % Votes",
  giarrussoTotal: "Giarrusso",
  totalVotes2015: "Total Votes",
  turnout2015: "Turnout",
  registeredVoters2015: "registeredVoters2015",
  registeredVoters2020: "registeredVoters2020"
};

export interface PrecinctVoterData {
  precinct: string;
  bernieLizPercent: string;
  giarrussoPercent: number;
  giarrussoTotal: number;
  totalVotes2015: number;
  turnout2015: number;
  registeredVoters2015: number;
  registeredVoters2020: number;
}
