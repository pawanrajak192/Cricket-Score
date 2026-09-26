// Event-sourced cricket scoring engine.
// The innings NEVER stores a running score directly — score, batter/bowler
// stats and who's on strike are always *derived* by replaying `events`.
// That's what makes Undo, edit-history and refresh-recovery safe: popping
// the last event and re-deriving is always correct.
//
// Event shape:
// {
//   id, legal, extraType: null|'wd'|'nb'|'bye'|'lb',
//   battingRuns,   // runs off the bat credited to the striker
//   extraRuns,     // extra runs added to the team total (includes the
//                  // mandatory 1 for a wide/no-ball)
//   strikerId, nonStrikerId, bowlerId,
//   wicket: null | { type, outBatterId, fielderId, newBatterId }
// }

export function newBallEvent({ battingRuns = 0, extraType = null, extraRuns = 0, strikerId, nonStrikerId, bowlerId, wicket = null }) {
  const legal = extraType !== 'wd' && extraType !== 'nb';
  return {
    id: cryptoId(),
    legal,
    extraType,
    battingRuns,
    extraRuns,
    strikerId,
    nonStrikerId,
    bowlerId,
    wicket
  };
}

function cryptoId() {
  return 'ev_' + Math.random().toString(36).slice(2, 10);
}

function freshBatter(id) {
  return { id, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: null, dismissedById: null, fielderId: null, order: null };
}
function freshBowler(id) {
  return { id, balls: 0, runsConceded: 0, wickets: 0, maidens: 0, wides: 0, noBalls: 0 };
}

// runs physically run between the wickets on this delivery (drives strike rotation)
function runsRunOnDelivery(ev) {
  if (ev.extraType === 'bye' || ev.extraType === 'lb') return ev.extraRuns;
  if (ev.extraType === 'wd') return Math.max(0, ev.extraRuns - 1);
  return ev.battingRuns; // normal ball or no-ball (runs off the bat)
}

export function deriveInningsState(innings) {
  const { openingStrikerId, openingNonStrikerId, openingBowlerId, events, oversLimit } = innings;

  const batters = {};
  const bowlers = {};
  const ensureBatter = (id) => (batters[id] = batters[id] || freshBatter(id));
  const ensureBowler = (id) => (bowlers[id] = bowlers[id] || freshBowler(id));

  let striker = openingStrikerId;
  let nonStriker = openingNonStrikerId;
  let bowler = openingBowlerId;
  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let ballsThisOver = 0;
  let currentOverEvents = [];
  const overHistory = []; // { overNumber, bowlerId, events:[...], runs }
  let overRunsAcc = 0;
  let batOrder = 0;

  for (const ev of events) {
    const bt = ensureBatter(ev.strikerId);
    if (bt.order === null) bt.order = ++batOrder;
    ensureBatter(ev.nonStrikerId);
    const bw = ensureBowler(ev.bowlerId);
    bowler = ev.bowlerId; // track the bowler of the most recent ball

    totalRuns += ev.battingRuns + ev.extraRuns;
    overRunsAcc += ev.battingRuns + ev.extraRuns;

    // batter credit
    if (ev.extraType !== 'wd' && ev.extraType !== 'bye' && ev.extraType !== 'lb') {
      bt.runs += ev.battingRuns;
      if (ev.battingRuns === 4) bt.fours += 1;
      if (ev.battingRuns === 6) bt.sixes += 1;
    }
    if (ev.legal) bt.balls += 1; // legal deliveries (incl. byes/leg-byes) count as balls faced

    // bowler credit
    if (ev.extraType === 'wd') { bw.wides += ev.extraRuns; bw.runsConceded += ev.extraRuns; }
    else if (ev.extraType === 'nb') { bw.noBalls += 1; bw.runsConceded += ev.extraRuns + ev.battingRuns; }
    else if (ev.extraType === 'bye' || ev.extraType === 'lb') { /* not charged to bowler */ }
    else { bw.runsConceded += ev.battingRuns; }
    if (ev.legal) bw.balls += 1;

    currentOverEvents.push(ev);

    // strike rotation for runs actually run
    if (runsRunOnDelivery(ev) % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }

    // wicket
    if (ev.wicket) {
      wickets += 1;
      const outId = ev.wicket.outBatterId;
      const outBt = ensureBatter(outId);
      outBt.out = true;
      outBt.howOut = ev.wicket.type;
      outBt.dismissedById = ev.bowlerId;
      outBt.fielderId = ev.wicket.fielderId || null;
      bw.wickets += 1;
      if (ev.wicket.newBatterId) {
        if (outId === striker) striker = ev.wicket.newBatterId;
        else if (outId === nonStriker) nonStriker = ev.wicket.newBatterId;
        const nb = ensureBatter(ev.wicket.newBatterId);
        if (nb.order === null) nb.order = ++batOrder;
      }
    }

    // over completion (legal balls only)
    if (ev.legal) {
      ballsThisOver += 1;
      if (ballsThisOver === 6) {
        overHistory.push({ overNumber: overHistory.length + 1, bowlerId: ev.bowlerId, events: currentOverEvents, runs: overRunsAcc });
        if (overRunsAcc === 0) bw.maidens += 1;
        ballsThisOver = 0;
        overRunsAcc = 0;
        currentOverEvents = [];
        [striker, nonStriker] = [nonStriker, striker]; // swap ends for new over
      }
    }
  }

  const totalLegalBalls = overHistory.length * 6 + ballsThisOver;
  const oversDisplay = `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`;
  const needsNewBowler = ballsThisOver === 0 && overHistory.length > 0 && currentOverEvents.length === 0 && events.length > 0;
  const isInningsOver =
    wickets >= (innings.totalPlayers ? innings.totalPlayers - 1 : 9) + 1 - 1 || // all out safeguard (overridden by caller with real squad size)
    (oversLimit ? totalLegalBalls >= oversLimit * 6 : false);

  return {
    striker, nonStriker, bowler,
    totalRuns, wickets, totalLegalBalls, oversDisplay,
    batters, bowlers,
    overHistory, currentOverEvents, currentOverRuns: overRunsAcc,
    needsNewBowler,
    isInningsOver
  };
}

export function recordBall(innings, ballInput) {
  const state = deriveInningsState(innings);
  const ev = newBallEvent({
    ...ballInput,
    strikerId: state.striker,
    nonStrikerId: state.nonStriker,
    bowlerId: innings.pendingBowlerId || state.bowler
  });
  return { ...innings, events: [...innings.events, ev], pendingBowlerId: null };
}

export function recordWicket(innings, wicketInput) {
  const state = deriveInningsState(innings);
  const ev = newBallEvent({
    battingRuns: wicketInput.runsBeforeDismissal || 0,
    extraType: wicketInput.extraType || null,
    extraRuns: wicketInput.extraRuns || 0,
    strikerId: state.striker,
    nonStrikerId: state.nonStriker,
    bowlerId: innings.pendingBowlerId || state.bowler,
    wicket: {
      type: wicketInput.type,
      outBatterId: wicketInput.outBatterId || state.striker,
      fielderId: wicketInput.fielderId || null,
      newBatterId: wicketInput.newBatterId || null
    }
  });
  return { ...innings, events: [...innings.events, ev], pendingBowlerId: null };
}

export function undoLast(innings) {
  if (!innings.events.length) return innings;
  return { ...innings, events: innings.events.slice(0, -1) };
}

export function setNewOverBowler(innings, bowlerId) {
  return { ...innings, pendingBowlerId: bowlerId };
}

export function battingSR(runs, balls) { return balls ? +((runs / balls) * 100).toFixed(2) : 0; }
export function bowlingEcon(runs, balls) { return balls ? +((runs / (balls / 6))).toFixed(2) : 0; }
export function oversFromBalls(balls) { return `${Math.floor(balls / 6)}.${balls % 6}`; }
