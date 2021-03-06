// util.js - Utility functions

import { crimes, factors, factorGroups, courts } from './spec';

export function parseCaseID(id) {
  let m = id.match((/^(?<court>[A-Z]+),(?<year>\d+),(?<case>[^,]+),(?<no>\d+)$/));
  if (m != null) {
    // Leave out the court name if it’s Supreme Court
    const court_id = m.groups.court;
    let court_name = court_id === 'TPS' ? '' : (courts.find((e) => e.value == court_id)?.text || court_id);
    return {
      database_id: id,
      court: court_id,
      year: m.groups.year,
      case: m.groups.case,
      no: m.groups.no,
      formatted_text: `${court_name} ${m.groups.year} 年度${m.groups.case}字第 ${m.groups.no} 號刑事判決`
    };
  }
};

export function formatSentence(sentence) {
  if (sentence > 0) {
    let year = Math.floor(sentence / 12);
    if (year > 0) {
      let month = sentence % 12;
      return month > 0 ? `${year} 年 ${month} 個月` : `${year} 年`; }
    else
      return `${sentence} 個月`; }
  else
    return sentence === -1 ? '無期徒刑' :
           sentence === -2 ? '死刑' :
           '無罪'; // 無罪推定！(*ﾟ∀ﾟ)
};

export function formatCaseURL(cid) {
  return `https://law.judicial.gov.tw/FJUD/qryresult.aspx?jud_court=${cid.court}&jud_sys=M&jud_year=${cid.year}&jud_case=${cid.case}&jud_no=${cid.no}&judtype=JUDBOOK`;
}

export function round(num, digits) {
  const one = Math.pow(10, digits);
  const d = Math.round(num * one);
  return `${Math.floor(d / one)}.${d % one}`;
}

function filterSpec(list) {
  const date = new Date(); // TODO: Allow selecting pre-amendment items?
  return list.filter((item) => (
    (item.valid_before === undefined || date < item.valid_before) &&
    (item.valid_after === undefined || date >= item.valid_after)
  ));
}

export function useCrimes() {
  return filterSpec(crimes);
}

export function useFactors() {
  return filterSpec(factors);
}

export function useFactorGroups() {
  const factors = useFactors();
  return factorGroups.map((group) => ({
    ...group,
    factors: group.factors.map((name) => factors.find((factor) => factor.name === name)),
  }));
}

export function useCrimeCategories() {
  const crimes = useCrimes();
  const categories = new Map();

  crimes.forEach((crime) => {
    if (!categories.has(crime.category))
      categories.set(crime.category, {
        title: crime.category,
        kinds: new Map(),
      });

    let kinds = categories.get(crime.category).kinds;
    if (!kinds.has(crime.kind))
      kinds.set(crime.kind, {
        text: crime.kind,
        stages: new Set(),
        variants: new Set(),
        disabled: true,
        disabledStages: new Set(),
      });

    let kind = kinds.get(crime.kind);
    if (crime.stage) kind.stages.add(crime.stage);
    if (crime.variant) kind.variants.add(crime.variant);
    kind.disabled = kind.disabled && crime.disabled;
    if (crime.disabled) kind.disabledStages.add(crime.stage);
  });

  for (let category of categories.values())
    for (let kind of category.kinds.values()) {
      // Expand as array, or null out if there are no alternatives
      kind.stages = kind.stages.size > 1 ? [...kind.stages] : null;
      kind.variants = kind.variants.size > 0 ? [...kind.variants] : null;
    }

  return categories;
}

// Polyfill for pre-Material UI 5.0
import { fade } from '@material-ui/core/styles/colorManipulator';
export function alpha(color, value) {
  return fade(color, 1 - value);
}
