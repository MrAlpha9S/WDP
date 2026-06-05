export interface Race {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "completed" | "cancelled";
  winner?: string;
}

export interface RaceResult {
  id: string;
  raceName: string;
  date: string;
  winner: string;
  winnerTime: string;
  secondPlace: string;
  thirdPlace: string;
}

export const mockUpcomingRaces: Race[] = [
  {
    id: "1",
    name: "Kentucky Derby Classic",
    date: "2024-06-15",
    time: "14:00 EST",
    location: "Churchill Downs, Kentucky",
    status: "upcoming",
  },
  {
    id: "2",
    name: "Royal Ascot Sprint",
    date: "2024-06-18",
    time: "15:30 GMT",
    location: "Royal Ascot, UK",
    status: "upcoming",
  },
  {
    id: "3",
    name: "Belmont Stakes",
    date: "2024-06-20",
    time: "18:45 EST",
    location: "Belmont Park, New York",
    status: "upcoming",
  },
];

export const mockRaceResults: RaceResult[] = [
  {
    id: "1",
    raceName: "Preakness Stakes",
    date: "2024-05-25",
    winner: "Thunder Strike",
    winnerTime: "1:53.42",
    secondPlace: "Silver Storm",
    thirdPlace: "Golden Arrow",
  },
  {
    id: "2",
    raceName: "Pimlico Special",
    date: "2024-05-20",
    winner: "Midnight Express",
    winnerTime: "2:01.15",
    secondPlace: "Racing Fire",
    thirdPlace: "Storm Runner",
  },
  {
    id: "3",
    raceName: "Woodbine Classic",
    date: "2024-05-15",
    winner: "Desert Wind",
    winnerTime: "2:04.88",
    secondPlace: "White Lightning",
    thirdPlace: "Black Diamond",
  },
];

export const mockAssignedRaces: Race[] = [
  {
    id: "4",
    name: "Premium Jockey Cup",
    date: "2024-06-10",
    time: "16:00 EST",
    location: "Saratoga Race Course, New York",
    status: "upcoming",
  },
  {
    id: "5",
    name: "Champion Challenge",
    date: "2024-06-25",
    time: "17:00 EST",
    location: "Pimlico Race Course, Maryland",
    status: "upcoming",
  },
];
