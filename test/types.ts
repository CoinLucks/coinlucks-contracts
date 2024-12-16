export type TestCaseType = {
  description: string;
  fn: any;
  beforeFn?: any;
  afterFn?: any;
  revert?: string;
};
