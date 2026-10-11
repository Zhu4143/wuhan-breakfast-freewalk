/** Independent paper layers in a shop. Every channel is 0 (past) to 1 (present). */
export type ShopEraFrame = {
  turn: number;
  panels: readonly number[];
  wall: number;
  furniture: number;
  keeper: number;
  food: number;
};

export type EraSequence = {
  duration: number;
  frame(progress: number): ShopEraFrame;
};
