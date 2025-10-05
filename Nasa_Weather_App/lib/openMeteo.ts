// lib/openMeteo.ts
export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
  };
};

export async function fetchOpenMeteo(lat: number, lon: number): Promise<OpenMeteoResponse> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true&hourly=temperature_2m,weathercode&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenMeteo error: ${res.status}`);
  return res.json();
}
