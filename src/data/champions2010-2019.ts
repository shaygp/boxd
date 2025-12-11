// F1 World Champions by year (2010-2025)
// Format: [year] = { driver: "Name", constructor: "Team" }

export interface ChampionData {
  driver: string;
  constructor: string;
}

export const champions: { [year: number]: ChampionData } = {
  2010: {
    driver: "Sebastian Vettel",
    constructor: "Red Bull Racing"
  },
  2011: {
    driver: "Sebastian Vettel",
    constructor: "Red Bull Racing"
  },
  2012: {
    driver: "Sebastian Vettel",
    constructor: "Red Bull Racing"
  },
  2013: {
    driver: "Sebastian Vettel",
    constructor: "Red Bull Racing"
  },
  2014: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2015: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2016: {
    driver: "Nico Rosberg",
    constructor: "Mercedes"
  },
  2017: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2018: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2019: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2020: {
    driver: "Lewis Hamilton",
    constructor: "Mercedes"
  },
  2021: {
    driver: "Max Verstappen",
    constructor: "Mercedes"
  },
  2022: {
    driver: "Max Verstappen",
    constructor: "Red Bull Racing"
  },
  2023: {
    driver: "Max Verstappen",
    constructor: "Red Bull Racing"
  },
  2024: {
    driver: "Max Verstappen",
    constructor: "McLaren"
  },
  2025: {
    driver: "Lando Norris",
    constructor: "McLaren"
  },
};

// Helper function to get champion by year
export const getChampions = (year: number): ChampionData | null => {
  return champions[year] || null;
};
