import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
};

export default function () {
  http.get('http://localhost:8000/api/v1/health');
  sleep(1);
}
