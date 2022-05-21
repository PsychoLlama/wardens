import Resource from '../resource';

describe('Resource', () => {
  class Test extends Resource<Record<string, never>> {
    exports = () => ({});
  }

  it('implements default enter/leave methods', async () => {
    const test = new Test();

    await expect(test.enter()).resolves.not.toThrow();
    await expect(test.leave()).resolves.not.toThrow();
  });
});
