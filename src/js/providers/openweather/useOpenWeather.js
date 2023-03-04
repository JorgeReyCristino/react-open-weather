import { useEffect, useReducer, useState } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import { getIcon } from './iconsMap';

export const formatDate = (dte, lang) => {
  if (lang && lang !== 'en') {
    dayjs.locale(lang.replace('_', '-'));
  }
  if (dte && dayjs().isValid(dte)) {
    return dayjs.unix(dte).format('ddd D MMMM');
  }
  return '';
};

export const mapCurrent = (day, lang) => {
  return {
    date: formatDate(day.dt, lang),
    description: day.weather[0] ? day.weather[0].description : null,
    icon: day.weather[0] && getIcon(day.weather[0].icon),
    temperature: {
      current: day.main.temp.toFixed(0),
      min: day.main.temp_min.toFixed(0),
      max: day.main.temp_max.toFixed(0),
    },
    wind: day.wind.speed.toFixed(0),
    humidity: day.main.humidity,
  };
};

export const mapForecast = (forecast, lang) => {
  const mappedForecast = [];
  for (let i = 0; i < 40; i += 8) {
    mappedForecast.push({
      date: formatDate(forecast[i].dt, lang),
      description: forecast[i].weather[0]
        ? forecast[i].weather[0].description
        : null,
      icon: forecast[i].weather[0] && getIcon(forecast[i].weather[0].icon),
      temperature: {
        min: forecast[i].main.temp_min.toFixed(0),
        max: forecast[i].main.temp_max.toFixed(0),
      },
      wind: forecast[i].wind.speed.toFixed(0),
      humidity: forecast[i].main.humidity,
    });
  }
  return mappedForecast;
};

export const mapData = (forecastData, todayData, lang) => {
  const mapped = {};
  if (forecastData && todayData) {
    const daysData = forecastData;
    mapped.current = mapCurrent(todayData, lang);
    mapped.forecast = mapForecast(daysData);
  }
  return mapped;
};

export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';

const initialState = {
  data: null,
  errorMessage: null,
};

export const fetchReducer = (state, { type, payload }) => {
  switch (type) {
    case SUCCESS:
      return {
        data: payload,
        errorMessage: null,
      };
    case FAILURE:
      return { data: null, errorMessage: payload };
    default:
      return state;
  }
};

const useOpenWeather = (options) => {
  const endpoint = '//api.openweathermap.org/data/2.5/forecast';
  const [state, dispatch] = useReducer(fetchReducer, initialState);
  const { data, errorMessage } = state;
  const [isLoading, setIsLoading] = useState(false);
  const { unit, lang, key, lon, lat } = options;
  const params = {
    appid: key,
    lang,
    units: unit,
    lat,
    lon,
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const forecastResponse = await axios.get(endpoint, { params });
      const currentDate = forecastResponse.data.list[0];
      const otherDates = forecastResponse.data.list;
      const payload = mapData(otherDates, currentDate, lang);

      dispatch({
        type: SUCCESS,
        payload,
      });
    } catch (error) {
      console.error(error.message);
      dispatch({ type: FAILURE, payload: error.message || error });
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [lon, lat]);
  return { data, isLoading, errorMessage, fetchData };
};

export default useOpenWeather;
