// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';



// Global fetch mock for API calls in tests
global.fetch = jest.fn((url) => {
    // Mock responses for common API endpoints
                         if (url.includes('/api/items')) {
                               return Promise.resolve({
                                       ok: true,
                                       status: 200,
                                       json: () => Promise.resolve({
                                                 success: true,
                                                 data: [],
                                                 message: 'Mock API response'
                                       })
                               });
                         }

                         // Default mock response
                         return Promise.resolve({
                               ok: true,
                               status: 200,
                               json: () => Promise.resolve({ success: true })
                         });
});
