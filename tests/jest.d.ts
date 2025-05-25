// Type definitions for Jest global variables
import '@testing-library/jest-native/extend-expect';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
      mockReturnValue: (value: T) => Mock<T, Y>;
      mockReturnThis: () => Mock<T, Y>;
      mockResolvedValue: (value: Awaited<T>) => Mock<Promise<Awaited<T>>, Y>;
      mockRejectedValue: (value: any) => Mock<Promise<never>, Y>;
      mockReturnValueOnce: (value: T) => Mock<T, Y>;
      mockResolvedValueOnce: (value: Awaited<T>) => Mock<Promise<Awaited<T>>, Y>;
      mockRejectedValueOnce: (value: any) => Mock<Promise<never>, Y>;
      mockReset: () => void;
      mockClear: () => void;
      mockRestore: () => void;
      mockName: (name: string) => Mock<T, Y>;
      getMockName: () => string;
      mock: {
        calls: Y[];
        instances: T[];
        invocationCallOrder: number[];
        results: { type: string; value: any }[];
      };
    }

    type MockableFunction = (...args: any[]) => any;
    type DoneCallback = (reason?: string | Error) => void;

    // Mock Functions
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function fn<T extends MockableFunction = MockableFunction>(implementation?: T): Mock<ReturnType<T>, Parameters<T>>;
    function spyOn<T extends {}, M extends keyof T>(object: T, method: M): Mock<T[M], T[M] extends (...args: infer A) => any ? A : never[]>;
    function mock<T extends string>(moduleName: T): { [K in T]: any };
  }

  // Jest Global Functions
  const jest: typeof jest;
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: (done?: jest.DoneCallback) => any): void;
  const test: typeof it;
  function expect<T>(actual: T): any;
  function beforeAll(fn: () => any): void;
  function beforeEach(fn: () => any): void;
  function afterAll(fn: () => any): void;
  function afterEach(fn: () => any): void;
}
