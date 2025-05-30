export const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const cubicEase = (t) =>
  // t: 0 to 1, output value will be in the range of 0 to 1
  (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
