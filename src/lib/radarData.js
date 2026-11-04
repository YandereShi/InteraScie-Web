export function FilterRadarLevels(levels, sections) {
  return levels.map((level) => {
    let correct = 0;
    let questions = 0;
    for (const section of sections) {
      const total = level.sectionTotals?.[section.sectionID];
      correct += total?.correct ?? 0;
      questions += total?.questions ?? 0;
    }
    return { ...level, accuracy: questions > 0 ? Math.round(correct / questions * 100) : null };
  });
}
