// SpinLytics — API Client
// Change this to your server's IP address when testing on a real device
const BASE_URL = 'http://10.0.2.2:5000/api/v1'; // Android emulator -> host localhost
// const BASE_URL = 'http://localhost:5000/api/v1'; // Web
// const BASE_URL = 'http://192.168.x.x:5000/api/v1'; // Real device (use your PC's LAN IP)

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const message = data?.error?.message || data?.message || `Request failed (${response.status})`;
        throw new Error(message);
      }

      return data.data !== undefined ? data.data : data;
    } catch (err) {
      if (err.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Check your network and server status.');
      }
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiClient();
