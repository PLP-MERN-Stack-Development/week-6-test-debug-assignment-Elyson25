// client/src/tests/unit/useApi.test.js - Unit tests for useApi custom hook

import { renderHook, act } from '@testing-library/react';
import useApi from '../../hooks/useApi';

describe('useApi Hook', () => {
  const mockApiFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useApi(mockApiFunction));

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Successful API Call', () => {
    it('should handle successful API call', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockApiFunction.mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await act(async () => {
        const response = await result.current.execute('param1', 'param2');
        expect(response).toEqual(mockData);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockApiFunction).toHaveBeenCalledWith('param1', 'param2');
    });

    it('should set loading state during API call', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiFunction.mockReturnValue(promise);

      const { result } = renderHook(() => useApi(mockApiFunction));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await act(async () => {
        resolvePromise({ success: true });
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Failed API Call', () => {
    it('should handle API call with error response', async () => {
      const errorResponse = {
        response: {
          data: { error: 'Server error' }
        }
      };
      mockApiFunction.mockRejectedValue(errorResponse);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Server error');
    });

    it('should handle API call with generic error', async () => {
      const genericError = new Error('Network error');
      mockApiFunction.mockRejectedValue(genericError);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('should handle API call with error without response', async () => {
      const error = { message: 'Custom error' };
      mockApiFunction.mockRejectedValue(error);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Custom error');
    });

    it('should handle API call with error without message', async () => {
      const error = {};
      mockApiFunction.mockRejectedValue(error);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('An error occurred');
    });
  });

  describe('Reset Function', () => {
    it('should reset state to initial values', async () => {
      const mockData = { success: true };
      mockApiFunction.mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // First, make a successful call
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should reset state after error', async () => {
      mockApiFunction.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useApi(mockApiFunction));

      // First, make a failed call
      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Test error');

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple consecutive calls', async () => {
      const firstCall = { id: 1, name: 'First' };
      const secondCall = { id: 2, name: 'Second' };

      mockApiFunction
        .mockResolvedValueOnce(firstCall)
        .mockResolvedValueOnce(secondCall);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // First call
      await act(async () => {
        await result.current.execute('first');
      });

      expect(result.current.data).toEqual(firstCall);
      expect(mockApiFunction).toHaveBeenCalledWith('first');

      // Second call
      await act(async () => {
        await result.current.execute('second');
      });

      expect(result.current.data).toEqual(secondCall);
      expect(mockApiFunction).toHaveBeenCalledWith('second');
      expect(mockApiFunction).toHaveBeenCalledTimes(2);
    });

    it('should clear previous error on new call', async () => {
      const error = new Error('First error');
      const successData = { success: true };

      mockApiFunction
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(successData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // First call fails
      await act(async () => {
        try {
          await result.current.execute();
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call succeeds
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(successData);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Clearing', () => {
    it('should clear error when new call starts', async () => {
      const error = new Error('Test error');
      mockApiFunction.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // First call fails
      await act(async () => {
        try {
          await result.current.execute();
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Test error');

      // Start new call
      mockApiFunction.mockResolvedValueOnce({ success: true });
      
      act(() => {
        result.current.execute();
      });

      // Error should be cleared immediately when new call starts
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Function Stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useApi(mockApiFunction));

      const firstExecute = result.current.execute;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.execute).toBe(firstExecute);
      expect(result.current.reset).toBe(firstReset);
    });
  });
}); 