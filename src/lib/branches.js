const branchOrder = {
  Chemistry: 0,
  Biology: 1,
  Physics: 2,
  Earth: 3,
};

export function GetBranches(levels) {
  return [...new Set(levels.map((level) => level.branchName).filter(Boolean))]
    .sort((first, second) =>
      (branchOrder[first] ?? 4) - (branchOrder[second] ?? 4) || first.localeCompare(second)
    );
}
