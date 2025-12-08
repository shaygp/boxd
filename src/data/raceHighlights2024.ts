// 2024 F1 Season Race Highlights
// Each race includes key moments

export interface RaceHighlight {
  year: number;
  round: number;
  raceName: string;
  highlights: string[];
}

// Team colors for driver name styling
export const teamColors: Record<string, string> = {
  // 2024 Teams
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF', // AlphaTauri/RB
  'Kick Sauber': '#52E252',
  'Haas': '#B6BABD',
};

export const raceHighlights2024: RaceHighlight[] = [
  {
    year: 2024,
    round: 1,
    raceName: 'Bahrain Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> dominated from pole position, showcasing Red Bull\'s precision with a commanding victory that set the tone for their season',
      '<span style="color: #3671C6">Sergio Pérez</span> secured second place, completing a Red Bull 1-2 finish and demonstrating the team\'s overwhelming pace advantage',
      '<span style="color: #E8002D">Charles Leclerc</span> claimed the final podium spot in third, showing Ferrari\'s competitive pace but unable to match Red Bull\'s dominance',
      '<span style="color: #229971">Fernando Alonso</span> was notably the most overtaken driver of the race (8 times), highlighting the intense midfield battles throughout the 57 laps',
      'The race featured 36 total overtakes with multiple position changes in the midfield, particularly involving <span style="color: #27F4D2">Lewis Hamilton</span> and the midfield runners',
      'Red Bull\'s pace advantage at the front proved insurmountable, with Verstappen controlling the race from lights to flag'
    ]
  },
  {
    year: 2024,
    round: 2,
    raceName: 'Saudi Arabian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> secured his ninth consecutive victory, converting pole position into another dominant win at the high-speed Jeddah circuit',
      'Historic debut of 18-year-old <span style="color: #E8002D">Oliver Bearman</span>, stepping in as Ferrari reserve driver for the injured <span style="color: #E8002D">Carlos Sainz</span> (recovering from appendicitis surgery)',
      '<span style="color: #E8002D">Bearman</span> impressed by scoring points on his debut, finishing seventh in a remarkably mature performance under immense pressure',
      '<span style="color: #3671C6">Sergio Pérez</span> finished second for Red Bull, maintaining the team\'s perfect start to the season with another 1-2 finish',
      '<span style="color: #E8002D">Charles Leclerc</span> claimed third for Ferrari, completing the podium while managing the unexpected team situation',
      'Verstappen\'s performance was clinical and controlled, leading the majority of the race and managing his pace expertly on the demanding street circuit'
    ]
  },
  {
    year: 2024,
    round: 3,
    raceName: 'Australian Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Carlos Sainz</span> won just nine days after appendicitis surgery in a stunning upset, starting from second with minimal preparation',
      '<span style="color: #3671C6">Max Verstappen</span> suffered a mechanical failure (brake issues) on lap 4, forcing his retirement and ending Red Bull\'s winning streak',
      'Ferrari achieved their first one-two finish since the 2022 Bahrain Grand Prix, with <span style="color: #E8002D">Charles Leclerc</span> finishing second behind Sainz',
      'Sainz\'s triumph was particularly emotional given his physical condition and the uncertainty surrounding his future at Ferrari',
      'The victory demonstrated Ferrari\'s competitive pace and ability to capitalize on opportunities when Red Bull\'s dominance wavered',
      '<span style="color: #FF8000">Lando Norris</span> completed the podium in third, showing McLaren\'s improving form early in the season'
    ]
  },
  {
    year: 2024,
    round: 4,
    raceName: 'Japanese Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> bounced back with his third win of the season at Suzuka in a rain-affected event, reasserting Red Bull\'s dominance',
      'Early red flag following a dramatic crash between <span style="color: #6692FF">Daniel Ricciardo</span> and <span style="color: #64C4FF">Alex Albon</span> at Turn 2 disrupted the race rhythm',
      'After the restart, Verstappen\'s superior tire management in changing conditions proved decisive, building a comfortable advantage',
      '<span style="color: #E8002D">Carlos Sainz</span> made an impressive late-race charge, climbing from seventh to claim third place with aggressive overtaking',
      '<span style="color: #3671C6">Sergio Pérez</span> finished second for Red Bull, securing another 1-2 finish and maintaining the team\'s championship momentum',
      'The race was dominated by strategic pit stop execution, with teams navigating the tricky wet-dry conditions throughout'
    ]
  },
  {
    year: 2024,
    round: 5,
    raceName: 'Chinese Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> claimed his fourth win of the season at Shanghai\'s return after five years, demonstrating consistent excellence',
      'The race featured two safety cars and one virtual safety car, creating multiple overtaking opportunities and strategic complexity throughout',
      '<span style="color: #FF8000">Lando Norris</span> made an impressive one-stop strategy work to finish second, showcasing McLaren\'s improving race management',
      '<span style="color: #3671C6">Sergio Pérez</span> took third, maintaining Red Bull\'s strong form with another podium finish',
      'Chaotic moments included <span style="color: #6692FF">Yuki Tsunoda</span> being tipped into a spin by <span style="color: #B6BABD">Kevin Magnussen</span>, creating additional drama',
      'Verstappen\'s consistency throughout the chaos allowed him to manage the race expertly and secure victory despite multiple interruptions'
    ]
  },
  {
    year: 2024,
    round: 6,
    raceName: 'Miami Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Lando Norris</span> claimed his maiden Formula 1 victory in a pivotal race that marked McLaren\'s true resurgence after years of struggle',
      'Starting from sixth, Norris benefited from perfect timing during a safety car (triggered by <span style="color: #B6BABD">Kevin Magnussen</span>\'s collision with <span style="color: #64C4FF">Logan Sargeant</span>)',
      'Norris emerged in the lead after pit stops and never looked back, beating <span style="color: #3671C6">Max Verstappen</span> by over 7 seconds in a commanding performance',
      '<span style="color: #E8002D">Charles Leclerc</span> finished third, while the victory marked the turning point where McLaren\'s competitiveness truly emerged',
      'Red Bull\'s dominance began to wane as McLaren\'s upgrades and development showed their full potential',
      'The emotional weight of Norris\'s first win after years of near-misses created one of the season\'s most memorable moments'
    ]
  },
  {
    year: 2024,
    round: 7,
    raceName: 'Emilia-Romagna Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> won a closely-fought battle at Imola, holding off a determined late charge from <span style="color: #FF8000">Lando Norris</span>',
      'Despite struggling with tire wear in the final stages, Verstappen defended expertly to claim his fifth victory in seven races',
      '<span style="color: #FF8000">Norris</span> mounted an increasingly aggressive challenge in the closing laps, demonstrating McLaren\'s newfound competitive edge',
      '<span style="color: #E8002D">Charles Leclerc</span> secured third place for Ferrari, maintaining their consistency in the early season',
      'The race demonstrated that Norris and McLaren were now genuine challengers to Red Bull\'s supremacy, not just opportunistic winners',
      'Tire management became the decisive factor, with Verstappen\'s experience proving crucial in maintaining his advantage'
    ]
  },
  {
    year: 2024,
    round: 8,
    raceName: 'Monaco Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Charles Leclerc</span> finally claimed victory at his home Grand Prix on his sixth attempt, ending years of Monaco heartbreak',
      'Dramatic first-lap crash involving <span style="color: #3671C6">Sergio Pérez</span> and both Haas cars (<span style="color: #B6BABD">Kevin Magnussen</span> and <span style="color: #B6BABD">Nico Hülkenberg</span>) resulted in an early red flag',
      'After the restart, Leclerc controlled the race from the front, managing tire degradation expertly on Monaco\'s demanding street circuit',
      '<span style="color: #FF8000">Oscar Piastri</span> finished second for McLaren, delivering another strong result as the team\'s form continued to improve',
      '<span style="color: #E8002D">Carlos Sainz</span> claimed third for Ferrari, completing a strong weekend for the Italian team',
      'The emotional significance of Leclerc\'s victory resonated deeply with the Tifosi and represented a long-awaited breakthrough at the iconic circuit'
    ]
  },
  {
    year: 2024,
    round: 9,
    raceName: 'Canadian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> triumphed in a thrilling wet-dry encounter at Montreal, his sixth win of the season',
      'Multiple safety cars and rain interventions created a dramatic five-car battle for the lead in the closing laps',
      '<span style="color: #FF8000">Lando Norris</span> fought valiantly and briefly took the lead, but Verstappen\'s superior tire management in treacherous conditions proved decisive',
      '<span style="color: #27F4D2">George Russell</span> finished third for Mercedes, claiming his first podium of the season in challenging conditions',
      '<span style="color: #FF8000">Oscar Piastri</span> and <span style="color: #27F4D2">Lewis Hamilton</span> battled intensely for positions behind the leaders',
      'Unpredictable weather created constantly shifting strategy calls, with teams gambling on tire choices and timing'
    ]
  },
  {
    year: 2024,
    round: 10,
    raceName: 'Spanish Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> secured his seventh win of the season, holding off pole-sitter <span style="color: #FF8000">Lando Norris</span> in an intense battle',
      '<span style="color: #27F4D2">George Russell</span> made an excellent start from fourth to lead early, but Verstappen overtook him on lap 3',
      '<span style="color: #27F4D2">Lewis Hamilton</span> claimed his first podium of 2024 in third, delivering dramatic on-track battles against <span style="color: #E8002D">Carlos Sainz</span>',
      'Norris applied relentless pressure throughout the race but couldn\'t find a way past Verstappen\'s carefully managed defense',
      'The race demonstrated Verstappen\'s defensive mastery, controlling the pace while under constant threat from the McLaren behind',
      'Hamilton\'s podium provided a rare bright spot in a difficult season for the seven-time world champion'
    ]
  },
  {
    year: 2024,
    round: 11,
    raceName: 'Austrian Grand Prix',
    highlights: [
      '<span style="color: #27F4D2">George Russell</span> claimed an unexpected victory after <span style="color: #3671C6">Max Verstappen</span> and <span style="color: #FF8000">Lando Norris</span> collided spectacularly with 8 laps remaining',
      'Verstappen appeared to have the race under control, but Norris mounted an increasingly desperate challenge for the lead',
      'The collision on lap 64 saw Norris receive a puncture forcing his retirement, while Verstappen limped to the pits with rear damage',
      'Verstappen received a 10-second penalty for the incident and recovered to finish fifth after repairs',
      '<span style="color: #FF8000">Oscar Piastri</span> finished second with <span style="color: #E8002D">Carlos Sainz</span> third, both benefiting from the chaos',
      'Russell capitalized perfectly on the drama to secure Mercedes\' first victory of 2024 in a race that had massive championship implications'
    ]
  },
  {
    year: 2024,
    round: 12,
    raceName: 'British Grand Prix',
    highlights: [
      '<span style="color: #27F4D2">Lewis Hamilton</span> claimed a record-breaking ninth victory at Silverstone, his first win since Saudi Arabia 2021',
      'Constantly changing conditions with rain falling at various points created strategic complexity and drama throughout',
      'Hamilton took the lead in wet conditions and held on as the track dried, beating <span style="color: #3671C6">Max Verstappen</span> in second',
      '<span style="color: #FF8000">Lando Norris</span> finished third in front of his passionate home crowd at Silverstone',
      'The emotional victory was particularly significant as Hamilton\'s last British Grand Prix with Mercedes before his 2025 Ferrari switch',
      'Hamilton\'s skill in mixed conditions and strategic gambles proved decisive in a race where timing was everything'
    ]
  },
  {
    year: 2024,
    round: 13,
    raceName: 'Hungarian Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Oscar Piastri</span> claimed his maiden Formula 1 victory, leading from Turn 1 and controlling the race from the front',
      'Significant team orders drama when <span style="color: #FF8000">Lando Norris</span> was instructed to let Piastri through, creating tense radio exchanges',
      'Norris eventually obliged on lap 68 after initially hesitating, allowing Piastri to secure his breakthrough win',
      '<span style="color: #27F4D2">Lewis Hamilton</span> finished third after an early collision with an aggressive <span style="color: #3671C6">Max Verstappen</span>',
      'The team orders situation sparked debate about McLaren\'s handling of their drivers and championship priorities',
      'Piastri\'s composure in his first win, despite the team dynamics, showed his maturity under pressure'
    ]
  },
  {
    year: 2024,
    round: 14,
    raceName: 'Belgian Grand Prix',
    highlights: [
      '<span style="color: #27F4D2">Lewis Hamilton</span> won after <span style="color: #27F4D2">George Russell</span>\'s stunning on-track victory was overturned by a post-race disqualification',
      'Russell had originally crossed the line first with a sensational one-stop strategy, holding off Hamilton\'s two-stop approach',
      'Mercedes acknowledged a "genuine error" that led to Russell\'s car being 1.5kg underweight, resulting in disqualification',
      'Hamilton inherited the win after chasing hard across the final laps, demonstrating his raw pace in his final Mercedes season',
      '<span style="color: #FF8000">Oscar Piastri</span> claimed third after Russell\'s exclusion, moving up from his finishing position',
      'The disqualification controversy overshadowed what had been a tactical masterclass by Russell and Mercedes'
    ]
  },
  {
    year: 2024,
    round: 15,
    raceName: 'Dutch Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Lando Norris</span> broke <span style="color: #3671C6">Max Verstappen</span>\'s Zandvoort dominance with a crushing 22.8-second victory margin',
      'Verstappen\'s first defeat at his beloved home circuit in four years marked a significant shift in the championship dynamics',
      'McLaren\'s aerodynamic upgrades had made a major step forward, allowing Norris to dominate from pole position',
      'Norris set the fastest lap on aging hard tires in the final lap, becoming the 48th driver to achieve pole, victory, and fastest lap in one race',
      '<span style="color: #E8002D">Charles Leclerc</span> finished third with <span style="color: #FF8000">Oscar Piastri</span> fourth, as McLaren cemented their challenge',
      'The commanding nature of McLaren\'s victory signaled a genuine power shift in Formula 1'
    ]
  },
  {
    year: 2024,
    round: 16,
    raceName: 'Italian Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Charles Leclerc</span> claimed a dramatic victory at Ferrari\'s home circuit Monza with a bold one-stop strategy',
      '<span style="color: #FF8000">Oscar Piastri</span> led much of the race after overtaking pole-sitter <span style="color: #FF8000">Lando Norris</span> into the second chicane on lap 2',
      'Ferrari\'s strategic gamble to run a single pit stop paid off brilliantly as Leclerc moved to the front in the closing stages',
      'Piastri finished second with Norris third, who also set the fastest lap despite the two-stop strategy disadvantage',
      '<span style="color: #E8002D">Carlos Sainz</span>\'s tires degraded severely after his two-stop, highlighting the perfect execution Ferrari needed',
      'The emotional victory thrilled the Tifosi and showcased Ferrari\'s strategic expertise and undercut mastery'
    ]
  },
  {
    year: 2024,
    round: 17,
    raceName: 'Azerbaijan Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Oscar Piastri</span> claimed his second victory, defeating <span style="color: #E8002D">Charles Leclerc</span> after an intense race-long battle',
      'Leclerc took pole and led initially, but Piastri executed a brilliant DRS-assisted move into Turn 1 after the pit stop window',
      'Leclerc mounted several determined attempts to reclaim position but Piastri\'s calculated defense in clean air kept him ahead',
      'Spectacular drama when <span style="color: #3671C6">Sergio Pérez</span> and <span style="color: #E8002D">Carlos Sainz</span> collided on the penultimate lap battling for third',
      'Both Pérez and Sainz hit the wall in dramatic fashion, creating a shocking conclusion to an already tense race',
      '<span style="color: #FF8000">Norris</span> recovered from 15th to finish fourth, showcasing McLaren\'s strong race pace'
    ]
  },
  {
    year: 2024,
    round: 18,
    raceName: 'Singapore Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Lando Norris</span> dominated the Singapore street race, his third victory of the season, controlling from pole position',
      'Despite brushing the barriers twice during the demanding night race, Norris maintained his lead throughout all 62 laps',
      '<span style="color: #3671C6">Max Verstappen</span> finished second, 20.945 seconds behind, unable to challenge Norris\'s supreme pace',
      '<span style="color: #FF8000">Oscar Piastri</span> claimed third, completing another strong McLaren weekend',
      'The victory further cut into Verstappen\'s championship lead, with momentum clearly shifting toward Norris',
      'Norris\'s performance was particularly impressive given Singapore\'s demanding conditions and precision required on the Marina Bay circuit'
    ]
  },
  {
    year: 2024,
    round: 19,
    raceName: 'United States Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Charles Leclerc</span> won decisively at COTA, making a brilliant start from second row past pole-sitter <span style="color: #FF8000">Lando Norris</span> and <span style="color: #3671C6">Max Verstappen</span>',
      'Ferrari executed a strategic masterclass with a two-stop strategy, building a commanding 10-second lead',
      '<span style="color: #E8002D">Carlos Sainz</span> finished second for Ferrari, completing a dominant one-two finish',
      'Verstappen secured third despite <span style="color: #FF8000">Norris</span>\'s best efforts to overtake for crucial championship points',
      'Norris received a five-second penalty for exceeding track limits during an overtake attempt, dropping him further down',
      'Ferrari\'s double podium put them back in the constructors\' championship fight with strong momentum'
    ]
  },
  {
    year: 2024,
    round: 20,
    raceName: 'Mexico City Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Carlos Sainz</span> won in dominant fashion from pole, his final victory for Ferrari before switching to Williams',
      'Initially lost the lead to <span style="color: #3671C6">Verstappen</span> at the first corner during a chaotic start, but regained it on lap 9',
      'Verstappen received two 10-second penalties for forcing <span style="color: #FF8000">Norris</span> off track multiple times, eventually finishing out of points',
      '<span style="color: #FF8000">Lando Norris</span> recovered to second place despite the early chaos, crucial for his championship challenge',
      '<span style="color: #E8002D">Charles Leclerc</span> finished third, completing another strong Ferrari weekend',
      'Sainz\'s victory was emotional as his final Ferrari win, demonstrating his consistent excellence throughout his time with the team'
    ]
  },
  {
    year: 2024,
    round: 21,
    raceName: 'Brazil Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> delivered a masterful wet-weather performance, starting 17th (engine penalty) to win by 19 seconds over <span style="color: #FF87BC">Esteban Ocon</span>',
      'Despite poor qualifying and difficult Saturday, Verstappen\'s exceptional skill in treacherous Interlagos rain proved decisive',
      'Brilliantly navigated two red flag periods and multiple pit stop strategies to work through the field systematically',
      '<span style="color: #FF8000">Lando Norris</span> had a frustrating day, struggling with conditions and strategy, dropping crucial championship points',
      'The victory on a track where conditions were highly unpredictable demonstrated Verstappen\'s exceptional wet-weather credentials',
      'This performance swung championship momentum back toward Verstappen, showing his champion\'s mentality under pressure'
    ]
  },
  {
    year: 2024,
    round: 22,
    raceName: 'Las Vegas Grand Prix',
    highlights: [
      '<span style="color: #27F4D2">George Russell</span> claimed victory in the Las Vegas street race, leading home a Mercedes one-two with <span style="color: #27F4D2">Lewis Hamilton</span> in second',
      'Russell executed a precision drive from pole position, managing the unique challenges of the street circuit flawlessly',
      '<span style="color: #3671C6">Max Verstappen</span> mathematically secured his fourth consecutive Drivers\' Championship with this result',
      '<span style="color: #E8002D">Carlos Sainz</span> finished third with <span style="color: #E8002D">Charles Leclerc</span> fourth, as Ferrari maintained their constructors\' challenge',
      '<span style="color: #FF8000">Norris</span> and <span style="color: #FF8000">Piastri</span> saw their McLaren advantage diminished in a difficult weekend',
      'Hamilton\'s second place marked a bright spot, while Russell\'s dominant performance showed Mercedes remained competitive'
    ]
  },
  {
    year: 2024,
    round: 23,
    raceName: 'Qatar Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> won a chaotic race featuring three safety car periods and numerous incidents',
      '<span style="color: #FF8000">Lando Norris</span> led initially but received a controversial 10-second stop-and-go penalty, eliminating him from the lead fight',
      'Norris fought back brilliantly to finish tenth, claiming the crucial fastest lap bonus point',
      'Verstappen handled the chaos expertly, taking his ninth victory of the season with clinical precision',
      '<span style="color: #E8002D">Charles Leclerc</span> finished second with <span style="color: #FF8000">Oscar Piastri</span> third, as Piastri maintained his consistency',
      'The incident-laden 57-lap race proved Verstappen\'s championship caliber, managing chaos while others struggled'
    ]
  },
  {
    year: 2024,
    round: 24,
    raceName: 'Abu Dhabi Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Lando Norris</span> won in dominant fashion from pole, clinching McLaren\'s first Constructors\' Championship since 1998',
      'Race started with drama when <span style="color: #3671C6">Max Verstappen</span> and <span style="color: #FF8000">Oscar Piastri</span> collided at Turn 1, eliminating McLaren\'s second car',
      'Despite the first-corner chaos, Norris controlled the race from start to finish with supreme confidence',
      '<span style="color: #E8002D">Carlos Sainz</span> finished second in an emotional final Ferrari drive, while <span style="color: #E8002D">Charles Leclerc</span> surged from 19th to third',
      '<span style="color: #27F4D2">Lewis Hamilton</span> delivered a stirring drive from 16th to fourth in his final Mercedes race, overtaking <span style="color: #27F4D2">George Russell</span> on the last lap',
      'Norris\'s victory secured McLaren the Constructors\' Championship by 14 points over Ferrari, completing a remarkable comeback season'
    ]
  }
];

export const raceHighlights2023: RaceHighlight[] = [
  {
    year: 2023,
    round: 1,
    raceName: 'Bahrain Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> launched the title defence with a straightforward lights to flag win from pole, immediately dropping <span style="color: #E8002D">Leclerc</span> and <span style="color: #3671C6">Pérez</span> and never really being challenged',
      '<span style="color: #3671C6">Pérez</span> cleared <span style="color: #E8002D">Leclerc</span> after the first stops to lock in a Red Bull 1-2, while Leclerc\'s engine failed late, gifting third to <span style="color: #E8002D">Sainz</span>',
      '<span style="color: #229971">Fernando Alonso</span> provided the action: he was passed by both Mercedes at the start but picked them off again with bold moves on <span style="color: #27F4D2">Hamilton</span> at Turn 10 and <span style="color: #27F4D2">Russell</span> at Turn 4 to take P3 on the road before Leclerc\'s DNF'
    ]
  },
  {
    year: 2023,
    round: 2,
    raceName: 'Saudi Arabian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Sergio Pérez</span> started from pole and controlled the race once <span style="color: #3671C6">Verstappen</span>\'s driveshaft failure in Q2 left him P15 on the grid',
      '<span style="color: #3671C6">Verstappen</span> carved through the field with DRS passes on midfield cars and then both Ferraris, but a Safety Car for <span style="color: #229971">Stroll</span>\'s stoppage neutralised strategy and left him stuck behind Pérez, who managed the gap to win',
      '<span style="color: #229971">Fernando Alonso</span> briefly led at the start after a better launch than Pérez, but a start position penalty plus a pit lane release issue left him ultimately classified P3 behind the two Red Bulls'
    ]
  },
  {
    year: 2023,
    round: 3,
    raceName: 'Australian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> lost the lead to both Mercedes off the line but re-took P1 with a DRS pass on <span style="color: #27F4D2">Hamilton</span> into Turn 9, then controlled pace from there',
      'The race turned chaotic with three red flags: a big <span style="color: #52E252">Zhou</span> / <span style="color: #64C4FF">Albon</span> accident, <span style="color: #B6BABD">Magnussen</span>\'s shredded tyre and a multi car pile up on a late restart',
      'On the penultimate restart <span style="color: #E8002D">Sainz</span> tagged <span style="color: #229971">Alonso</span> into a spin at Turn 1; the result was rolled back to the previous order, giving a Verstappen, Hamilton, Alonso podium and a time penalty dropping Sainz out of the points'
    ]
  },
  {
    year: 2023,
    round: 4,
    raceName: 'Azerbaijan Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Sergio Pérez</span> won both the sprint and the Grand Prix, underlining his "street king" reputation',
      '<span style="color: #3671C6">Verstappen</span> initially led the race but pitted just before a Safety Car for <span style="color: #6692FF">de Vries</span>\' stranded AlphaTauri; Pérez gained track position by stopping under the Safety Car and then controlled the restart',
      '<span style="color: #E8002D">Charles Leclerc</span>, who had taken pole, was quickly passed on track by both Red Bulls on the main straight, ending up a lonely third as DRS trains behind him limited further action at the front'
    ]
  },
  {
    year: 2023,
    round: 5,
    raceName: 'Miami Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> started only ninth after a compromised Q3 but executed a long first stint on hards, slicing through the field with DRS passes on <span style="color: #E8002D">Leclerc</span>, <span style="color: #B6BABD">Magnussen</span> and others',
      '<span style="color: #3671C6">Pérez</span>, on pole, lost the lead on strategy when Verstappen overcut him: Max stayed out to lap long in clean air, then rejoined on fresh mediums and passed Pérez around the outside into Turn 1 for the win',
      '<span style="color: #229971">Fernando Alonso</span> again took a relatively quiet P3 after an early move on <span style="color: #E8002D">Sainz</span>, while the midfield produced heavy DRS trains but few decisive overtakes'
    ]
  },
  {
    year: 2023,
    round: 6,
    raceName: 'Monaco Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> won from pole in a race transformed by late rain',
      'Verstappen built an early cushion over <span style="color: #229971">Alonso</span>, but as rain fell he stayed out on heavily worn slicks, kissing the barriers repeatedly yet keeping enough pace to avoid being undercut before switching to intermediates',
      'Aston Martin blinked and put Alonso on slicks as the rain intensified, then had to stop again for inters, killing any chance to fight Verstappen; <span style="color: #FF87BC">Esteban Ocon</span> held off <span style="color: #27F4D2">Hamilton</span> after a strong qualifying to secure a podium for Alpine'
    ]
  },
  {
    year: 2023,
    round: 7,
    raceName: 'Spanish Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> took a dominant pole and grand chelem style win, leading every lap and taking fastest lap',
      '<span style="color: #27F4D2">Lewis Hamilton</span> and <span style="color: #27F4D2">George Russell</span> made Mercedes\' first proper upgrade work: Russell charged through from midfield with bold outside moves at Turn 1 to finish third behind Hamilton in P2',
      'The Ferraris faded on race pace; <span style="color: #E8002D">Sainz</span>, starting on the front row at home, was picked off by both Mercedes and <span style="color: #3671C6">Pérez</span> and ended up outside the podium after tyre degradation hit hard'
    ]
  },
  {
    year: 2023,
    round: 8,
    raceName: 'Canadian Grand Prix',
    highlights: [
      'On a cool, semi green Montreal track <span style="color: #3671C6">Max Verstappen</span> controlled from pole to take Red Bull\'s 100th F1 victory',
      '<span style="color: #229971">Fernando Alonso</span> jumped <span style="color: #27F4D2">Hamilton</span> with an aggressive strategy and straight line speed, then spent much of the race managing an intermittent brake issue while Hamilton stayed within DRS but couldn\'t complete a move for P2',
      'Behind, <span style="color: #64C4FF">Alex Albon</span> executed a long stint on hards and stoutly defended against a DRS train of faster cars to bank big points for Williams'
    ]
  },
  {
    year: 2023,
    round: 9,
    raceName: 'Austrian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> dominated on pure pace, winning both the sprint and the race, but the Grand Prix was defined by massive track limits policing that handed multiple drivers post race penalties',
      'Early on <span style="color: #E8002D">Charles Leclerc</span> tried to stick with Verstappen and briefly undercut into the lead during stops, but Verstappen re-took P1 with a straightforward DRS pass into Turn 4',
      'Late in the race Verstappen pitted for softs purely to grab fastest lap, re-passing Leclerc again to win with margin while a raft of penalties reshuffled the lower points'
    ]
  },
  {
    year: 2023,
    round: 10,
    raceName: 'British Grand Prix',
    highlights: [
      '<span style="color: #FF8000">Lando Norris</span> rocketed past <span style="color: #3671C6">Max Verstappen</span> off the line to lead the early laps in front of the home crowd',
      'Once DRS was enabled Verstappen repassed him around the outside of Brooklands and slowly edged away, but a Safety Car for <span style="color: #B6BABD">Magnussen</span>\'s smoking Haas allowed <span style="color: #27F4D2">Hamilton</span> to pit cheaply and jump <span style="color: #FF8000">Piastri</span> for P3',
      'The final stint saw Norris defending used hards against Hamilton\'s fresh softs, making decisive defensive moves into Brooklands and Stowe to keep P2, giving McLaren a huge morale boost result'
    ]
  },
  {
    year: 2023,
    round: 11,
    raceName: 'Hungarian Grand Prix',
    highlights: [
      '<span style="color: #27F4D2">Lewis Hamilton</span> took a morale boosting pole but had a poor launch, immediately losing out to <span style="color: #3671C6">Max Verstappen</span> into Turn 1',
      'Verstappen then disappeared up the road, winning by over half a minute, while the two McLarens slotted into P2/P3 early before <span style="color: #FF8000">Norris</span> was released to chase, finishing second ahead of <span style="color: #3671C6">Pérez</span>',
      'Pérez recovered from a lowly grid slot with a string of DRS passes including on <span style="color: #FF8000">Piastri</span>, using an offset tyre strategy to salvage a podium'
    ]
  },
  {
    year: 2023,
    round: 12,
    raceName: 'Belgian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> had a grid penalty and started P6, but the Red Bull pace advantage was so big that he was leading comfortably after a series of straightforward DRS overtakes on <span style="color: #27F4D2">Hamilton</span>, <span style="color: #E8002D">Leclerc</span> and <span style="color: #3671C6">Pérez</span>',
      'Rain affected the sprint on Saturday more than Sunday; in the Grand Prix itself Verstappen and Pérez cruised to a 1-2 with <span style="color: #E8002D">Leclerc</span> third',
      'The main intrigue was mid field: <span style="color: #64C4FF">Albon</span> defending in a Williams rocket on the straights and <span style="color: #FF8000">Norris</span> struggling badly with McLaren\'s drag in Spa\'s high speed sections'
    ]
  },
  {
    year: 2023,
    round: 13,
    raceName: 'Dutch Grand Prix',
    highlights: [
      'Changeable weather made this one of the year\'s most chaotic races, but <span style="color: #3671C6">Max Verstappen</span> still came out on top from pole to equal Vettel\'s nine in a row record',
      'Early rain sent several drivers diving into the pits immediately; those who stayed out, like <span style="color: #3671C6">Pérez</span>, briefly vaulted up the order, but Verstappen\'s better timed stops and pace restored him to the lead',
      'A late red flag for <span style="color: #52E252">Zhou</span>\'s crash and a final safety car restart on a damp track gave <span style="color: #229971">Alonso</span> a shot at Max, but Verstappen managed the restart cleanly, with <span style="color: #FF87BC">Pierre Gasly</span> inheriting P3 via penalties to secure an Alpine podium'
    ]
  },
  {
    year: 2023,
    round: 14,
    raceName: 'Italian Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> won his 10th consecutive victory, breaking the all time record',
      '<span style="color: #E8002D">Carlos Sainz</span> started from pole and defended ferociously in the opening laps, locking up repeatedly into Turn 1 and Turn 4 to keep Verstappen behind',
      'Eventually Max forced Sainz into a small error out of the Rettifilo, got better traction and completed the move into Roggia, after which <span style="color: #3671C6">Pérez</span> and Verstappen both cleared the Ferraris; Sainz held off <span style="color: #E8002D">Leclerc</span> in a very hard but fair intra team fight for the final podium spot'
    ]
  },
  {
    year: 2023,
    round: 15,
    raceName: 'Singapore Grand Prix',
    highlights: [
      '<span style="color: #E8002D">Carlos Sainz</span> took an exquisitely executed victory from pole, the one Grand Prix Red Bull did not win in 2023',
      'He controlled the pace early to maintain a DRS train behind him, then in the closing laps deliberately gave <span style="color: #FF8000">Norris</span> DRS to help the McLaren keep the faster Mercedes of <span style="color: #27F4D2">Russell</span> and <span style="color: #27F4D2">Hamilton</span> behind',
      'On the final laps Russell chased hard on fresher tyres but clipped the wall at Turn 10 and crashed out, leaving Sainz, Norris, Hamilton as the podium and ending Red Bull\'s huge win streak'
    ]
  },
  {
    year: 2023,
    round: 16,
    raceName: 'Japanese Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> bounced back from the Singapore blip with a crushing performance at Suzuka, taking pole and leading almost every lap',
      'McLaren\'s big upgrade shone: <span style="color: #FF8000">Oscar Piastri</span> started on the front row and briefly battled Verstappen into Turn 1, but <span style="color: #FF8000">Norris</span> eventually emerged as the quicker McLaren and was waved through to chase, ultimately finishing second',
      '<span style="color: #3671C6">Sergio Pérez</span> had a scruffy day with multiple collisions and penalties before retiring; Red Bull still clinched the Constructors\' Championship here thanks to Verstappen\'s dominant win'
    ]
  },
  {
    year: 2023,
    round: 17,
    raceName: 'Qatar Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> had already secured the Drivers\' title in the Saturday sprint, then converted pole into a comfortable Sunday win in brutal heat',
      'A mandated maximum stint length (because of tyre integrity concerns) effectively turned the race into a series of short sprints, forcing everyone onto three stop strategies and generating constant wheel to wheel fights',
      'McLaren shone again: <span style="color: #FF8000">Oscar Piastri</span> and <span style="color: #FF8000">Lando Norris</span> both surged forward from lower grid positions, with Piastri finishing P2 and Norris P3 after multiple DRS passes, while several drivers (notably <span style="color: #64C4FF">Sargeant</span>) suffered physically and radioed about nearly blacking out'
    ]
  },
  {
    year: 2023,
    round: 18,
    raceName: 'United States Grand Prix',
    highlights: [
      'On track <span style="color: #3671C6">Max Verstappen</span> won from sixth on the grid, nursing brake issues yet still pulling strategic moves on <span style="color: #27F4D2">Hamilton</span> and <span style="color: #FF8000">Norris</span>',
      'Post race, <span style="color: #27F4D2">Hamilton</span> and <span style="color: #E8002D">Leclerc</span> were disqualified for excessive plank wear, promoting Norris to P2 and <span style="color: #E8002D">Sainz</span> to P3',
      'In the race itself Verstappen\'s key moves were DRS passes on Leclerc and then Norris, while Hamilton used an offset tyre strategy to attack late, coming within DRS range of Verstappen before the braking issue prevented a real lunge'
    ]
  },
  {
    year: 2023,
    round: 19,
    raceName: 'Mexico City Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> took his 16th win of the season, starting third, while home hero <span style="color: #3671C6">Pérez</span> retired in a lap 1 clash',
      'Into Turn 1 Pérez tried an optimistic move around the outside of <span style="color: #E8002D">Leclerc</span> while Verstappen went inside; contact between Pérez and Leclerc launched the Red Bull into the air and caused terminal damage',
      'A red flag for <span style="color: #B6BABD">Magnussen</span>\'s heavy crash reset strategies; Verstappen simply re built his lead after the restart, while <span style="color: #27F4D2">Hamilton</span> used a medium tyre offset to pass Leclerc for P2 with a DRS move into Turn 1'
    ]
  },
  {
    year: 2023,
    round: 20,
    raceName: 'São Paulo Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> dominated from pole, controlling both the start and the restarts to win relatively untroubled',
      'The big story was <span style="color: #229971">Fernando Alonso</span> vs <span style="color: #3671C6">Sergio Pérez</span> for the final podium place: Alonso had earlier undercut <span style="color: #27F4D2">Hamilton</span> and then spent the last laps just managing to keep Pérez out of DRS down the main straight',
      'On the penultimate lap Pérez finally got ahead at Turn 1, but Alonso set up a switchback run and re-passed into Turn 4; on the final lap Pérez took one last shot but lost the drag race to the line by just 0.053s'
    ]
  },
  {
    year: 2023,
    round: 21,
    raceName: 'Las Vegas Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> started second but forced <span style="color: #E8002D">Leclerc</span> wide at Turn 1 to take the lead, earning a time penalty yet still managing to win',
      'The race had multiple Safety Cars, including one for a <span style="color: #27F4D2">Russell</span> / Verstappen clash that damaged the Mercedes and reset strategy; <span style="color: #3671C6">Pérez</span> cycled into the lead at one stage on an offset stop sequence',
      'In the closing laps Verstappen hunted down and passed Pérez, Leclerc then dived past Pérez for P2 at the final heavy braking zone to deny a Red Bull 1-2, giving a Verstappen, Leclerc, Pérez podium'
    ]
  },
  {
    year: 2023,
    round: 22,
    raceName: 'Abu Dhabi Grand Prix',
    highlights: [
      '<span style="color: #3671C6">Max Verstappen</span> ended the year as he\'d spent most of it: winning from pole in a controlled, tyre managed drive',
      '<span style="color: #E8002D">Charles Leclerc</span> tried an aggressive early strategy and even briefly gave DRS to <span style="color: #3671C6">Pérez</span> at one point to help him clear rivals in Ferrari\'s attempt to beat Mercedes in the Constructors\' standings',
      'Verstappen\'s main job was managing rear tyre life while keeping enough pace to stay out of undercut range; <span style="color: #27F4D2">Russell</span>\'s P3 and <span style="color: #27F4D2">Hamilton</span>\'s points were just enough for Mercedes to stay ahead of Ferrari in the final constructors\' table'
    ]
  }
];
