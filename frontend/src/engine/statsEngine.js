import { deriveInningsState, battingSR, bowlingEcon, oversFromBalls } from './scoringEngine';

// Walks every completed innings of every completed match and rolls up
// per-player batting / bowling / keeping career totals.
export function computePlayerCareer(matches, playerId) {
  const bat = { matches: new Set(), innings: 0, runs: 0, highScore: 0, notOuts: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, ballsFaced: 0 };
  const bowl = { matches: new Set(), balls: 0, runs: 0, wickets: 0, maidens: 0, best: { wickets: 0, runs: 0 } };
  const field = { catches: 0, stumpings: 0 };

  matches.forEach((m) => {
    if (m.status !== 'completed') return;
    let played = false;
    (m.innings || []).forEach((inn) => {
      const s = deriveInningsState(inn);
      if (s.batters[playerId]) {
        played = true;
        const b = s.batters[playerId];
        bat.innings += 1;
        bat.runs += b.runs;
        bat.ballsFaced += b.balls;
        bat.fours += b.fours;
        bat.sixes += b.sixes;
        if (!b.out) bat.notOuts += 1;
        if (b.runs > bat.highScore) bat.highScore = b.runs;
        if (b.runs >= 100) bat.hundreds += 1;
        else if (b.runs >= 50) bat.fifties += 1;
        if (b.fielderId === playerId) field.catches += b.howOut === 'CAUGHT' ? 0 : 0; // fielder credit handled below
      }
      Object.values(s.batters).forEach((b) => {
        if (b.fielderId === playerId && b.howOut === 'CAUGHT') field.catches += 1;
        if (b.fielderId === playerId && b.howOut === 'STUMPED') field.stumpings += 1;
      });
      if (s.bowlers[playerId]) {
        played = true;
        const bw = s.bowlers[playerId];
        bowl.balls += bw.balls;
        bowl.runs += bw.runsConceded;
        bowl.wickets += bw.wickets;
        bowl.maidens += bw.maidens;
        if (bw.wickets > bowl.best.wickets || (bw.wickets === bowl.best.wickets && bw.runsConceded < bowl.best.runs)) {
          bowl.best = { wickets: bw.wickets, runs: bw.runsConceded };
        }
      }
    });
    if (played) { bat.matches.add(m.id); bowl.matches.add(m.id); }
  });

  return {
    batting: {
      matches: bat.matches.size, innings: bat.innings, runs: bat.runs, highScore: bat.highScore,
      average: bat.innings - bat.notOuts > 0 ? +(bat.runs / (bat.innings - bat.notOuts)).toFixed(2) : bat.runs,
      strikeRate: battingSR(bat.runs, bat.ballsFaced), fours: bat.fours, sixes: bat.sixes,
      fifties: bat.fifties, hundreds: bat.hundreds
    },
    bowling: {
      matches: bowl.matches.size, overs: oversFromBalls(bowl.balls), runs: bowl.runs, wickets: bowl.wickets,
      best: bowl.wickets ? `${bowl.best.wickets}/${bowl.best.runs}` : '—',
      economy: bowlingEcon(bowl.runs, bowl.balls),
      average: bowl.wickets ? +(bowl.runs / bowl.wickets).toFixed(2) : 0,
      maidens: bowl.maidens
    },
    fielding: field
  };
}

export function matchInningsOf(match, playerId) {
  return (match.innings || [])
    .map((inn) => deriveInningsState(inn))
    .filter((s) => s.batters[playerId])
    .map((s) => s.batters[playerId]);
}
